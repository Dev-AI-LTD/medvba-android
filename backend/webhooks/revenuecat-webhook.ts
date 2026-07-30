import type { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import {
  PRO_AI_ENTITLEMENT_ID,
  getProAiEntitlementIds,
  inferSubscriptionPlan,
} from "../../constants/clinical-copilot";
import {
  fetchRevenueCatSubscriber,
  getRevenueCatSecretApiKey,
  syncSubscriberPayloadToSupabase,
  type ServiceSupabase,
} from "../lib/revenuecat-subscriber-sync";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RcEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[];
  expiration_at_ms?: number;
  environment?: string;
  transaction_id?: string;
  original_transaction_id?: string;
}

interface RcWebhookBody {
  api_version?: string;
  event?: RcEvent;
}

function webhookAuthorizationSecret(): string | undefined {
  return (
    process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim() ||
    process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN?.trim() ||
    undefined
  );
}

function verifyAuthorization(header: string | undefined): boolean {
  const secret = webhookAuthorizationSecret();
  if (!secret) {
    console.error(
      "[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTHORIZATION (or REVENUECAT_WEBHOOK_AUTH_TOKEN) is not set",
    );
    return false;
  }
  if (!header) return false;
  const h = header.trim();
  return h === `Bearer ${secret}` || h === secret;
}

function eventTransactionId(event: RcEvent): string | null {
  return (
    event.transaction_id?.trim() ||
    event.original_transaction_id?.trim() ||
    event.id?.trim() ||
    null
  );
}

function eventMentionsProEntitlement(event: RcEvent): boolean {
  const ids = event.entitlement_ids ?? [];
  if (ids.length === 0) {
    // Some events omit entitlement_ids; treat known subscription products as Pro.
    const pid = String(event.product_id ?? "").toLowerCase();
    return (
      pid.includes("pro") ||
      pid.includes("premium") ||
      pid.includes("medvba_pro") ||
      pid === "monthly" ||
      pid === "yearly" ||
      pid === "annual" ||
      pid === "$rc_monthly" ||
      pid === "$rc_annual"
    );
  }
  const allowed = new Set(getProAiEntitlementIds());
  return ids.some((id) => allowed.has(id));
}

function hasActiveEntitlement(event: RcEvent): boolean {
  if (!eventMentionsProEntitlement(event)) return false;
  const exp = event.expiration_at_ms;
  if (exp == null) return true;
  return exp > Date.now();
}

/**
 * Record event for idempotency. Returns false if already processed.
 */
async function claimEvent(
  supabase: ServiceSupabase,
  event: RcEvent,
  rawPayload: unknown,
): Promise<{ claimed: boolean; eventId: string }> {
  const eventId = event.id?.trim() || `synthetic:${event.type}:${eventTransactionId(event) ?? Date.now()}`;
  const { error } = await supabase.from("revenuecat_events").insert({
    event_id: eventId,
    event_type: event.type ?? "UNKNOWN",
    app_user_id: event.app_user_id ?? null,
    transaction_id: eventTransactionId(event),
    raw_payload: rawPayload ?? {},
    processed_at: new Date().toISOString(),
  });

  if (error) {
    // Unique violation → already processed
    if (error.code === "23505" || /duplicate|unique/i.test(error.message ?? "")) {
      return { claimed: false, eventId };
    }
    console.error("[RevenueCat Webhook] revenuecat_events insert failed:", error);
    // Fail closed on unexpected DB errors so RC retries
    throw new Error(error.message);
  }
  return { claimed: true, eventId };
}

async function upsertPremiumSubscription(
  supabase: ServiceSupabase,
  userId: string,
  event: RcEvent,
): Promise<{ ok: boolean; error?: string }> {
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("started_at")
    .eq("user_id", userId)
    .maybeSingle();

  const expiresIso =
    event.expiration_at_ms != null ? new Date(event.expiration_at_ms).toISOString() : null;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      status: "premium",
      type: inferSubscriptionPlan(event.product_id),
      expires_at: expiresIso,
      started_at: existing?.started_at ?? nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[RevenueCat Webhook] Premium upsert failed:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function upsertFreeSubscription(
  supabase: ServiceSupabase,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      status: "free",
      type: null,
      expires_at: null,
      updated_at: nowIso,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[RevenueCat Webhook] Free upsert failed:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function processWebhookEvent(
  supabase: ServiceSupabase,
  event: RcEvent,
): Promise<{ ok: boolean; state?: string; error?: string; noop?: string }> {
  const userId = event.app_user_id!;
  const eventType = event.type ?? "";
  const renewsAt =
    event.expiration_at_ms != null ? new Date(event.expiration_at_ms).toISOString() : null;
  const txnId = eventTransactionId(event);

  const {
    grantMonthlyCreditsIfNeeded,
    grantTopupCredits,
    syncEntitlementProFlag,
  } = await import("../lib/ai-credits");

  // ---- Cancellation: keep access until expiry; do not strip credits ----
  if (eventType === "CANCELLATION") {
    if (hasActiveEntitlement(event) || renewsAt) {
      await upsertPremiumSubscription(supabase, userId, event);
      await syncEntitlementProFlag({
        supabase,
        userId,
        isPro: true,
        entitlementKey: PRO_AI_ENTITLEMENT_ID,
        renewsAt,
      });
    }
    return { ok: true, state: "cancelled_pending_expiry" };
  }

  // ---- Expiration / Refund: revoke Premium + Pro AI flag (credits kept historically) ----
  if (eventType === "EXPIRATION" || eventType === "REFUND") {
    const free = await upsertFreeSubscription(supabase, userId);
    if (!free.ok) return free;
    await syncEntitlementProFlag({
      supabase,
      userId,
      isPro: false,
      entitlementKey: null,
      renewsAt: null,
    });
    return { ok: true, state: "free" };
  }

  // ---- Consumable top-ups (no permanent entitlement) ----
  if (eventType === "NON_RENEWING_PURCHASE") {
    const topup = await grantTopupCredits({
      supabase,
      userId,
      productId: String(event.product_id ?? ""),
      eventId: event.id,
      revenuecatTransactionId: txnId ?? undefined,
    });
    return {
      ok: true,
      state: topup.granted ? "topup_granted" : "topup_noop",
    };
  }

  // ---- Initial purchase / renewal / uncancellation / product change (subs) ----
  if (
    eventType === "INITIAL_PURCHASE" ||
    eventType === "RENEWAL" ||
    eventType === "UNCANCELLATION" ||
    eventType === "PRODUCT_CHANGE"
  ) {
    if (!hasActiveEntitlement(event) && !eventMentionsProEntitlement(event)) {
      // Might be a mis-typed consumable; try top-up once
      const topup = await grantTopupCredits({
        supabase,
        userId,
        productId: String(event.product_id ?? ""),
        eventId: event.id,
        revenuecatTransactionId: txnId ?? undefined,
      });
      if (topup.amount > 0) {
        return { ok: true, state: topup.granted ? "topup_granted" : "topup_noop" };
      }
      return { ok: true, noop: eventType };
    }

    const premium = await upsertPremiumSubscription(supabase, userId, event);
    if (!premium.ok) return premium;

    await syncEntitlementProFlag({
      supabase,
      userId,
      isPro: true,
      entitlementKey: PRO_AI_ENTITLEMENT_ID,
      renewsAt,
    });

    // Grant monthly credits only on purchase/renewal with txn dedupe — not every webhook type
    if (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL") {
      await grantMonthlyCreditsIfNeeded({
        supabase,
        userId,
        plan: inferSubscriptionPlan(event.product_id),
        productId: event.product_id,
        revenuecatTransactionId: txnId,
        renewsAt,
      });
    }

    return { ok: true, state: "premium" };
  }

  // ---- Fallback: sync from REST when available ----
  if (getRevenueCatSecretApiKey()) {
    const rcBody = await fetchRevenueCatSubscriber(userId);
    if (rcBody) {
      const sync = await syncSubscriberPayloadToSupabase(supabase, userId, rcBody, {
        // Do not grant on unknown event types — only refresh status
        grantMonthlyCredits: false,
      });
      if (!sync.ok) return { ok: false, error: sync.error };
      return { ok: true, state: sync.isPro ? "premium" : "free" };
    }
  }

  // Last resort: event entitlement snapshot
  if (hasActiveEntitlement(event)) {
    const premium = await upsertPremiumSubscription(supabase, userId, event);
    if (!premium.ok) return premium;
    await syncEntitlementProFlag({
      supabase,
      userId,
      isPro: true,
      entitlementKey: PRO_AI_ENTITLEMENT_ID,
      renewsAt,
    });
    return { ok: true, state: "premium" };
  }

  return { ok: true, noop: eventType };
}

export function registerRevenueCatWebhookRoutes(app: Hono) {
  app.post("/api/webhooks/revenuecat", async (c) => {
    if (!verifyAuthorization(c.req.header("Authorization"))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let body: RcWebhookBody;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const event = body.event;
    if (!event?.type) {
      return c.json({ ok: true, skipped: "no_event" });
    }

    const eventType = event.type;
    if (eventType === "TEST") {
      return c.json({ ok: true, test: true });
    }

    const userId = event.app_user_id;
    if (!userId || !UUID_RE.test(userId)) {
      console.warn("[RevenueCat Webhook] Skip: app_user_id missing or not a UUID", {
        type: eventType,
        app_user_id: userId,
      });
      return c.json({ ok: true, skipped: "app_user_id" });
    }

    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      console.error("[RevenueCat Webhook] Supabase URL or service role key missing");
      return c.json({ error: "Server misconfigured" }, 500);
    }

    const supabase = createClient(url, serviceRoleKey);

    let claim: { claimed: boolean; eventId: string };
    try {
      claim = await claimEvent(supabase, event, body);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return c.json({ error: message }, 500);
    }

    if (!claim.claimed) {
      return c.json({
        ok: true,
        deduped: true,
        event_id: claim.eventId,
      });
    }

    try {
      const result = await processWebhookEvent(supabase, event);
      if (!result.ok) {
        // Release claim so RevenueCat can retry
        await supabase.from("revenuecat_events").delete().eq("event_id", claim.eventId);
        return c.json({ error: result.error ?? "Database error" }, 500);
      }

      if (result.noop) {
        console.log(
          "[RevenueCat Webhook] No subscription row change for event:",
          result.noop,
          claim.eventId,
        );
        return c.json({
          ok: true,
          event_id: claim.eventId,
          noop: result.noop,
          source: "webhook_event",
        });
      }

      return c.json({
        ok: true,
        source: "webhook_event",
        event_id: claim.eventId,
        user_id: userId,
        state: result.state,
        environment: event.environment,
      });
    } catch (e) {
      console.error("[RevenueCat Webhook] Processing failed:", e);
      await supabase.from("revenuecat_events").delete().eq("event_id", claim.eventId);
      const message = e instanceof Error ? e.message : String(e);
      return c.json({ error: message }, 500);
    }
  });
}
