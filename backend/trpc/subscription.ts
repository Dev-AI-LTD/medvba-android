import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getFreeAiStatus, incrementFreeAiUsage } from "../lib/free-ai-usage";
import { userHasActivePremiumAccess } from "../lib/premium-access";
import { createTRPCRouter, protectedProcedure } from "./create-context";

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

      const isPremium = await userHasActivePremiumAccess(supabaseAdmin, userId);
      if (isPremium) {
        return {
          allowed: true,
          remaining: -1,
          isPremium: true,
          limit: -1,
        };
      }

      if (!input.increment) {
        const { remaining, limit } = await getFreeAiStatus(supabaseAdmin, userId);
        return {
          allowed: remaining > 0,
          remaining,
          isPremium: false,
          limit,
        };
      }

      await incrementFreeAiUsage(supabaseAdmin, userId);
      const { remaining, limit } = await getFreeAiStatus(supabaseAdmin, userId);

      return {
        allowed: true,
        remaining,
        isPremium: false,
        limit,
      };
    }),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { url, serviceRoleKey } = getSupabaseAdmin();
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(url, serviceRoleKey);

    const userId = ctx.userId;
    const isPremium = await userHasActivePremiumAccess(supabaseAdmin, userId);

    return {
      isPremium,
      hasActiveSubscription: isPremium,
    };
  }),
});
