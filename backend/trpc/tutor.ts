import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "./create-context";
import { generateText, getTutorAssistantPreamble, getTutorSystemPrompt, type TutorLocale } from "../../lib/ai-provider";
import { tutorRateLimiter } from "./rate-limiter";
import { decrementFreeAiUsage, incrementFreeAiUsage } from "../lib/free-ai-usage";
import { userHasActivePremiumAccess } from "../lib/premium-access";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

function isAiMissingConfigError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("api key not configured") ||
    m.includes("openai api key") ||
    m.includes("base url not configured")
  );
}

function getSupabaseAdminOrThrow() {
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

export const tutorRouter = createTRPCRouter({
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(messageSchema).min(1).max(40),
        locale: z.enum(["en", "ro"]).default("en"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await tutorRateLimiter(ctx.userId);

      const { url, serviceRoleKey } = getSupabaseAdminOrThrow();
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(url, serviceRoleKey);

      const locale = input.locale as TutorLocale;
      const isPremium = await userHasActivePremiumAccess(supabaseAdmin, ctx.userId);
      let reservedFreeSlot = false;

      try {
        if (!isPremium) {
          await incrementFreeAiUsage(supabaseAdmin, ctx.userId);
          reservedFreeSlot = true;
        }

        const fullMessages = [
          { role: "system" as const, content: getTutorSystemPrompt(locale) },
          {
            role: "assistant" as const,
            content: getTutorAssistantPreamble(locale),
          },
          ...input.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const response = await generateText({
          messages: fullMessages,
          maxTokens: 1200,
          temperature: 0.65,
        });
        return { response };
      } catch (err) {
        if (reservedFreeSlot) {
          await decrementFreeAiUsage(supabaseAdmin, ctx.userId);
        }

        if (err instanceof TRPCError) {
          throw err;
        }

        const message = err instanceof Error ? err.message : String(err);

        if (isAiMissingConfigError(message)) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "AI tutor is not configured. Please contact support.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
