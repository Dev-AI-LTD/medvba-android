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
      message:
        "Failed to verify subscription status (subscriptions). Check SUPABASE_* on the server, that table public.subscriptions exists, and PostgREST logs.",
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
      message:
        "Failed to verify subscription status (profiles). Ensure columns is_premium and subscription_status exist on public.profiles (see supabase/migrations/003_ai_question_usage.sql).",
      cause: profileError,
    });
  }

  if (profile?.is_premium) return true;

  const pss = String(profile?.subscription_status ?? "").toLowerCase();
  return pss === "premium" || pss === "trial";
}
