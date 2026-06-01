import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getFreeAiStatus, incrementFreeAiUsage } from "../lib/free-ai-usage";
import { userHasActivePremiumAccess } from "../lib/premium-access";
import {
  fetchRevenueCatSubscriber,
  getRevenueCatSecretApiKey,
  syncSubscriberPayloadToSupabase,
} from "../lib/revenuecat-subscriber-sync";
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

      const applyProfileFlags = async () => {
        const isPremium = await userHasActivePremiumAccess(supabaseAdmin, userId);
        const { error: profileErr } = await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: isPremium,
            subscription_status: isPremium ? "premium" : "free",
          })
          .eq("id", userId);
        if (profileErr) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: profileErr.message,
          });
        }
        return isPremium;
      };

      if (input.status === "free") {
        const nowIso = new Date().toISOString();
        const row: Record<string, unknown> = {
          user_id: userId,
          status: "free",
          type: null,
          updated_at: nowIso,
        };
        if (input.expiresAt === undefined) {
          row.expires_at = null;
        } else {
          row.expires_at = input.expiresAt;
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

        await applyProfileFlags();
        return { ok: true };
      }

      // Premium/trial: never trust client payload — verify with RevenueCat REST API.
      if (!getRevenueCatSecretApiKey()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Subscription sync is not configured on the server (REVENUECAT_SECRET_API_KEY). Premium status was not updated.",
        });
      }

      const rcBody = await fetchRevenueCatSubscriber(userId);
      const sync = await syncSubscriberPayloadToSupabase(supabaseAdmin, userId, rcBody);
      if (!sync.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: sync.error ?? "Could not verify subscription with the store.",
        });
      }

      const isPremium = await applyProfileFlags();
      return { ok: true, isPremium };
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
