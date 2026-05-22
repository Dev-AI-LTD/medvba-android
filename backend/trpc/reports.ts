import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "./create-context";

const reportReasonSchema = z.enum(["harassment", "inappropriate", "spam", "other"]);

const submitReportResultSchema = z.object({
  success: z.literal(true),
  id: z.string().uuid().optional(),
});

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Supabase admin config missing (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
    });
  }

  return createClient(url, serviceRoleKey);
};

export const reportsRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        reportedUserId: z.string().uuid(),
        reportedUserName: z.string().trim().min(1).max(200),
        reason: reportReasonSchema,
        chatId: z.string().trim().max(128).optional(),
      }),
    )
    .output(submitReportResultSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.reportedUserId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot report yourself.",
        });
      }

      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from("user_reports")
        .insert({
          reporter_id: ctx.userId,
          reported_user_id: input.reportedUserId,
          reported_user_name: input.reportedUserName,
          reason: input.reason,
          chat_id: input.chatId ?? null,
        })
        .select("id")
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit report. Please try again or contact support.",
          cause: error,
        });
      }

      return { success: true as const, id: data?.id };
    }),
});
