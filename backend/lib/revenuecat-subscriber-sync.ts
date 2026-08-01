import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PRO_AI_ENTITLEMENT_ID,
  getProAiEntitlementIds,
  hasProAiEntitlement,
  inferSubscriptionPlan,
  resolveProAiEntitlementKey,
} from "../../constants/clinical-copilot";

/** Untyped client from service-role bootstrap (no generated Database types in backend). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceSupabase = SupabaseClient<any, "public", any>;

const RC_API_BASE = "https://api.revenuecat.com/v1";

export function getRevenueCatSecretApiKey(): string | undefined {
  const k =
    process.env.REVENUECAT_SECRET_API_KEY?.trim() ||
    process.env.REVENUECAT_API_SECRET_KEY?.trim();
  return k || undefined;
}

export interface RcEntitlementRest {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string;
  purchase_date?: string;
}

export interface RcSubscriberRest {
  entitlements?: Record<string, RcEntitlementRest>;
}

export interface RGetSubscriberResponse {
  subscriber?: RcSubscriberRest;
}

function entitlementIsActive(ent: RcEntitlementRest | undefined): boolean {
  if (!ent) return false;
  if (ent.expires_date == null && ent.grace_period_expires_date == null) {
    return true;
  }
  const now = Date.now();
  if (ent.grace_period_expires_date) {
    const g = new Date(ent.grace_period_expires_date).getTime();
    if (!Number.isNaN(g) && g > now) return true;
  }
  if (ent.expires_date) {
    const e = new Date(ent.expires_date).getTime();
    if (!Number.isNaN(e) && e > now) return true;
  }
  return false;
}

/** Pick first active Pro / Pro AI entitlement (`medvba_pro_ai` or legacy `pro`). */
export function pickActiveProEntitlement(
  entitlements: Record<string, RcEntitlementRest> | undefined,
): { key: string; ent: RcEntitlementRest } | null {
  if (!entitlements) return null;
  for (const id of getProAiEntitlementIds()) {
    const ent = entitlements[id];
    if (entitlementIsActive(ent)) {
      return { key: id, ent: ent! };
    }
  }
  const activeMap: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entitlements)) {
    if (entitlementIsActive(v)) activeMap[k] = v;
  }
  if (!hasProAiEntitlement(activeMap)) return null;
  const key = resolveProAiEntitlementKey(activeMap);
  const ent = entitlements[key];
  if (ent && entitlementIsActive(ent)) return { key, ent };
  return null;
}

function isoExpiresAt(ent: RcEntitlementRest | undefined): string | null {
  if (!ent || !entitlementIsActive(ent)) return null;
  if (ent.expires_date) {
    const e = new Date(ent.expires_date);
    if (!Number.isNaN(e.getTime())) return e.toISOString();
  }
  return null;
}

function coerceTimestamp(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return fallback;
  return new Date(t).toISOString();
}

/**
 * GET /v1/subscribers/{app_user_id} — requires secret API key.
 */
export async function fetchRevenueCatSubscriber(
  appUserId: string,
): Promise<RGetSubscriberResponse | null> {
  const key = getRevenueCatSecretApiKey();
  if (!key) return null;

  const url = `${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[RevenueCat REST] GET subscriber failed:",
      res.status,
      text.slice(0, 300),
    );
    return null;
  }

  return (await res.json()) as RGetSubscriberResponse;
}

export type SyncSubscriberOptions = {
  /** When true (default), grant monthly credits if Pro active (period-deduped). */
  grantMonthlyCredits?: boolean;
  revenuecatTransactionId?: string | null;
  /** Force revoke even if REST still shows active (e.g. REFUND webhook). */
  forceRevoke?: boolean;
};

/**
 * Applies RevenueCat subscriber payload to `public.subscriptions` + `ai_entitlements`.
 * Classic Premium path stays intact; Clinical credits are additive.
 */
export async function syncSubscriberPayloadToSupabase(
  supabase: ServiceSupabase,
  userId: string,
  body: RGetSubscriberResponse | null,
  options?: SyncSubscriberOptions,
): Promise<{
  ok: boolean;
  error?: string;
  source: "rest" | "noop";
  isPro: boolean;
  grantedMonthly?: boolean;
}> {
  // Never treat a failed/missing REST payload as "free" — that can wipe Pro
  // and leave Clinical stuck (PAYWALL/TOPUP loop) right after purchase.
  if (!options?.forceRevoke && body == null) {
    return {
      ok: false,
      error: "RevenueCat subscriber unavailable",
      source: "noop",
      isPro: false,
    };
  }

  const picked = pickActiveProEntitlement(body?.subscriber?.entitlements);
  const active = !options?.forceRevoke && picked != null;
  const nowIso = new Date().toISOString();
  const grantMonthly = options?.grantMonthlyCredits !== false;

  if (active && picked) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("started_at")
      .eq("user_id", userId)
      .maybeSingle();

    const expiresAt = isoExpiresAt(picked.ent);
    const plan = inferSubscriptionPlan(picked.ent.product_identifier);

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        status: "premium",
        type: plan,
        expires_at: expiresAt,
        started_at: existing?.started_at ?? coerceTimestamp(picked.ent.purchase_date, nowIso),
        updated_at: nowIso,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("[RevenueCat sync] Premium upsert failed:", error);
      return { ok: false, error: error.message, source: "rest", isPro: false };
    }

    // Do not swallow grant failures: Pro + 0 credits is the stuck Clinical loop.
    const { grantMonthlyCreditsIfNeeded, syncEntitlementProFlag } = await import(
      "./ai-credits"
    );
    await syncEntitlementProFlag({
      supabase,
      userId,
      isPro: true,
      entitlementKey: picked.key || PRO_AI_ENTITLEMENT_ID,
      renewsAt: expiresAt,
    });
    let grantedMonthly = false;
    if (grantMonthly) {
      const grant = await grantMonthlyCreditsIfNeeded({
        supabase,
        userId,
        plan,
        productId: picked.ent.product_identifier,
        revenuecatTransactionId: options?.revenuecatTransactionId,
        renewsAt: expiresAt,
      });
      grantedMonthly = grant.granted;
    }

    return { ok: true, source: "rest", isPro: true, grantedMonthly };
  }

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
    console.error("[RevenueCat sync] Free upsert failed:", error);
    return { ok: false, error: error.message, source: "rest", isPro: false };
  }

  try {
    const { syncEntitlementProFlag } = await import("./ai-credits");
    await syncEntitlementProFlag({
      supabase,
      userId,
      isPro: false,
      entitlementKey: null,
      renewsAt: null,
    });
  } catch (e) {
    console.warn("[RevenueCat sync] Clinical entitlement sync skipped:", e);
  }

  return { ok: true, source: "rest", isPro: false };
}
