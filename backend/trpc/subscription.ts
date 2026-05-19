import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getFreeAiStatus, incrementFreeAiUsage } from "../lib/free-ai-usage";
import { userHasActivePremiumAccess } from "../lib/premium-access";
import { createTRPCRouter, protectedProcedure } from "./create-context";

function getSupabaseAdmin() {
  const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

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

  syncFromClient: protectedProcedure
    .input(
      z.object({
        status: z.enum(["premium", "free", "trial"]),
        type: z.enum(["yearly", "monthly"]).nullable().optional(),
        expiresAt: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { url, serviceRoleKey } = getSupabaseAdmin();
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(url, serviceRoleKey);
      const userId = ctx.userId;

      const row: Record<string, unknown> = {
        user_id: userId,
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.type !== undefined) row.type = input.type;
      if (input.expiresAt !== undefined) row.expires_at = input.expiresAt;
      if (input.status === "premium" || input.status === "trial") {
        row.started_at = new Date().toISOString();
      }
      if (input.status === "free") {
        row.type = null;
        if (input.expiresAt === undefined) row.expires_at = null;
      }

      const { error } = await supabaseAdmin.from("subscriptions").upsert(row, {
        onConflict: "user_id",
      });
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      await supabaseAdmin
        .from("profiles")
        .update({
          is_premium: input.status === "premium" || input.status === "trial",
          subscription_status: input.status,
        })
        .eq("id", userId);

      return { ok: true };
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
