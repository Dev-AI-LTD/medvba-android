import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "./create-context";

const FREE_AI_LIMIT = 1;
const AI_LIMIT_WINDOW_HOURS = 24;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Server configuration error",
    });
  }

  return { url, serviceRoleKey };
}

export const subscriptionRouter = createTRPCRouter({
  validateAiQuestion: protectedProcedure
    .input(
      z.object({
        increment: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { url, serviceRoleKey } = getSupabaseAdmin();
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(url, serviceRoleKey);

      const userId = ctx.userId;

      // Verify user exists and get subscription status
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, is_premium, subscription_status")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify subscription status",
        });
      }

      // Premium users bypass limit check
      if (profile?.is_premium || profile?.subscription_status === "premium") {
        return {
          allowed: true,
          remaining: -1,
          isPremium: true,
          limit: -1,
        };
      }

      // Get or create usage record for today
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - AI_LIMIT_WINDOW_HOURS);

      const { data: usageRecord, error: usageError } = await supabaseAdmin
        .from("ai_question_usage")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", windowStart.toISOString())
        .single();

      if (usageError && usageError.code !== "PGRST116") {
        // Log but don't fail - allow request if we can't check
        console.error("[Subscription] Error checking AI usage:", usageError);
      }

      const currentCount = usageRecord?.question_count || 0;
      const remaining = Math.max(0, FREE_AI_LIMIT - currentCount);

      if (!input.increment) {
        return {
          allowed: remaining > 0,
          remaining,
          isPremium: false,
          limit: FREE_AI_LIMIT,
        };
      }

      // If not allowed and increment requested, reject
      if (remaining <= 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `AI question limit reached. Free tier allows ${FREE_AI_LIMIT} question per day. Upgrade to premium for unlimited access.`,
        });
      }

      // Increment the counter
      if (usageRecord) {
        const { error: updateError } = await supabaseAdmin
          .from("ai_question_usage")
          .update({ question_count: currentCount + 1 })
          .eq("id", usageRecord.id);

        if (updateError) {
          console.error("[Subscription] Error incrementing AI usage:", updateError);
          // Don't fail the request if update fails
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("ai_question_usage")
          .insert({
            user_id: userId,
            question_count: 1,
          });

        if (insertError) {
          console.error("[Subscription] Error creating AI usage record:", insertError);
          // Don't fail the request if insert fails
        }
      }

      return {
        allowed: true,
        remaining: remaining - 1,
        isPremium: false,
        limit: FREE_AI_LIMIT,
      };
    }),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { url, serviceRoleKey } = getSupabaseAdmin();
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(url, serviceRoleKey);

    const userId = ctx.userId;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, is_premium, subscription_status")
      .eq("id", userId)
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subscription status",
      });
    }

    return {
      isPremium: profile?.is_premium || profile?.subscription_status === "premium",
      hasActiveSubscription: !!profile?.is_premium,
    };
  }),
});
