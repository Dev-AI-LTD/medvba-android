import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type SubscriptionRow = {
  status: string | null;
  expires_at: string | null;
};

function subscriptionRowIsPremium(row: SubscriptionRow | null | undefined): boolean {
  if (!row?.status) return false;
  const st = String(row.status).toLowerCase();
  if (st !== "premium" && st !== "trial") return false;
  if (row.expires_at) {
    return new Date(row.expires_at).getTime() > Date.now();
  }
  return true;
}

const GENERIC_SUBSCRIPTION_VERIFY =
  "Failed to verify subscription status";

/** Richer TRPC message off-production (or when MEDVBA_VERBOSE_ERRORS=true) so mobile LogBox matches Supabase/PostgREST hints. */
function subscriptionVerifyTrpcMessage(
  scope: "subscriptions" | "profiles",
  err: { code?: string; message: string },
): string {
  const prodSilent =
    process.env.NODE_ENV === "production" && process.env.MEDVBA_VERBOSE_ERRORS !== "true";
  if (prodSilent) {
    return GENERIC_SUBSCRIPTION_VERIFY;
  }
  const code = err.code ?? "unknown";
  return `${GENERIC_SUBSCRIPTION_VERIFY} (${scope}: ${code} — ${err.message})`;
}

/**
 * Premium for server-side limits: `subscriptions` (webhook + service role) then `profiles` fallback.
 */
export async function userHasActivePremiumAccess(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: sub, error: subErr } = await supabaseAdmin
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (subErr) {
    console.error("[Premium] Error reading subscriptions:", subErr);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: subscriptionVerifyTrpcMessage("subscriptions", subErr),
      cause: subErr,
    });
  }

  if (subscriptionRowIsPremium(sub)) {
    return true;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_premium, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[Premium] Error reading profiles:", profileError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: subscriptionVerifyTrpcMessage("profiles", profileError),
      cause: profileError,
    });
  }

  if (profile?.is_premium) return true;

  const pss = String(profile?.subscription_status ?? "").toLowerCase();
  return pss === "premium" || pss === "trial";
}
