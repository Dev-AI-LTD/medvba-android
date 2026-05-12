import type { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import {
  fetchRevenueCatSubscriber,
  getRevenueCatSecretApiKey,
  syncSubscriberPayloadToSupabase,
  type ServiceSupabase,
} from "../lib/revenuecat-subscriber-sync";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function entitlementId(): string {
  return process.env.REVENUECAT_ENTITLEMENT_ID?.trim() || "pro";
}

interface RcEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[];
  expiration_at_ms?: number;
  environment?: string;
}

interface RcWebhookBody {
  api_version?: string;
  event?: RcEvent;
}

function verifyAuthorization(header: string | undefined): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim();
  if (!secret) {
    console.error("[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTHORIZATION is not set");
    return false;
  }
  if (!header) return false;
  const h = header.trim();
  return h === `Bearer ${secret}` || h === secret;
}

function inferSubscriptionType(productId: string | undefined): "yearly" | "monthly" {
  const p = String(productId ?? "").toLowerCase();
  if (p.includes("annual") || p.includes("year") || p.includes("yearly") || p === "$rc_annual") {
    return "yearly";
  }
  return "monthly";
}

function hasActiveEntitlement(event: RcEvent): boolean {
  const eid = entitlementId();
  const ids = event.entitlement_ids ?? [];
  if (!ids.includes(eid)) return false;
  const exp = event.expiration_at_ms;
  if (exp == null) return true;
  return exp > Date.now();
}

async function syncFromWebhookEvent(
  supabase: ServiceSupabase,
  event: RcEvent,
  userId: string,
): Promise<{ ok: boolean; state?: string; error?: string; noop?: string }> {
  const nowIso = new Date().toISOString();
  const entActive = hasActiveEntitlement(event);

  if (entActive) {
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
        type: inferSubscriptionType(event.product_id),
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
    return { ok: true, state: "premium" };
  }

  const eventType = event.type ?? "";
  const expMs = event.expiration_at_ms;
  const periodEnded = expMs != null && expMs <= Date.now();
  const forceFree = eventType === "EXPIRATION" || eventType === "REFUND" || periodEnded;

  if (forceFree) {
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
    return { ok: true, state: "free" };
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

    if (getRevenueCatSecretApiKey()) {
      const rcBody = await fetchRevenueCatSubscriber(userId);
      if (rcBody) {
        const sync = await syncSubscriberPayloadToSupabase(supabase, userId, rcBody);
        if (!sync.ok) {
          return c.json({ error: sync.error ?? "sync_failed" }, 500);
        }
        return c.json({
          ok: true,
          source: "revenuecat_rest",
          event_id: event.id,
          user_id: userId,
          environment: event.environment,
        });
      }
      console.warn("[RevenueCat Webhook] REST subscriber fetch failed; using event payload fallback");
    }

    const fallback = await syncFromWebhookEvent(supabase, event, userId);
    if (!fallback.ok) {
      return c.json({ error: fallback.error ?? "Database error" }, 500);
    }

    if (fallback.noop) {
      console.log("[RevenueCat Webhook] No subscription row change for event:", fallback.noop, event.id);
      return c.json({ ok: true, event_id: event.id, noop: fallback.noop, source: "webhook_event" });
    }

    return c.json({
      ok: true,
      source: "webhook_event",
      event_id: event.id,
      user_id: userId,
      state: fallback.state,
      environment: event.environment,
    });
  });
}
