import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createTRPCRouter, publicProcedure } from "./create-context";
import {
  STUDY_MODULE_IDS,
  STUDY_PILOT_MODULE_ID,
  canAccessChapterSummary,
  isStudyFreePreviewChapter,
} from "../../constants/study";
import { userHasActivePremiumAccess } from "../lib/premium-access";

const localeSchema = z.enum(["ro", "en"]).default("ro");

function getSupabaseAdminOrThrow() {
  const url = (
    process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL
  )?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Server configuration error",
    });
  }

  return { url, serviceRoleKey };
}

async function getIsPremium(
  supabaseAdmin: SupabaseClient,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  try {
    return await userHasActivePremiumAccess(supabaseAdmin, userId);
  } catch {
    return false;
  }
}

type StudyRow = {
  chapter_id: string;
  module_id: string;
  locale: string;
  title: string | null;
  summary_markdown: string;
  summary_version: number;
  audio_url: string | null;
  audio_duration_sec: number | null;
  status: string;
  published_at: string | null;
};

export const studyRouter = createTRPCRouter({
  listModules: publicProcedure
    .input(z.object({ locale: localeSchema.optional() }).optional())
    .query(async ({ input }) => {
      const locale = input?.locale ?? "ro";
      const { url, serviceRoleKey } = getSupabaseAdminOrThrow();
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, serviceRoleKey);

      const { data, error } = await supabase
        .from("chapter_study_content")
        .select("module_id, chapter_id")
        .eq("locale", locale)
        .eq("status", "published");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const publishedByModule = new Map<string, number>();
      for (const row of data ?? []) {
        const mid = row.module_id as string;
        publishedByModule.set(mid, (publishedByModule.get(mid) ?? 0) + 1);
      }

      return STUDY_MODULE_IDS.map((moduleId) => ({
        moduleId,
        publishedChapterCount: publishedByModule.get(moduleId) ?? 0,
        isPilotActive: moduleId === STUDY_PILOT_MODULE_ID,
      }));
    }),

  listChapters: publicProcedure
    .input(
      z.object({
        moduleId: z.string(),
        locale: localeSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? "ro";
      const { url, serviceRoleKey } = getSupabaseAdminOrThrow();
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, serviceRoleKey);

      const isPremium = await getIsPremium(supabase, ctx.userId);

      const { data, error } = await supabase
        .from("chapter_study_content")
        .select("chapter_id, title, audio_url, audio_duration_sec, published_at")
        .eq("module_id", input.moduleId)
        .eq("locale", locale)
        .eq("status", "published");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return (data ?? []).map((row) => {
        const chapterId = row.chapter_id as string;
        const isFreePreview = isStudyFreePreviewChapter(
          chapterId,
          input.moduleId,
        );
        const canAccess = canAccessChapterSummary(
          chapterId,
          isPremium,
          input.moduleId,
        );
        return {
          chapterId,
          title: (row.title as string | null) ?? null,
          hasSummary: true,
          hasAudio: Boolean(row.audio_url),
          audioDurationSec: row.audio_duration_sec as number | null,
          isFreePreview,
          isLocked: !canAccess,
          publishedAt: row.published_at as string | null,
        };
      });
    }),

  getChapter: publicProcedure
    .input(
      z.object({
        moduleId: z.string(),
        chapterId: z.string(),
        locale: localeSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? "ro";
      const { url, serviceRoleKey } = getSupabaseAdminOrThrow();
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, serviceRoleKey);

      const isPremium = await getIsPremium(supabase, ctx.userId);

      const { data, error } = await supabase
        .from("chapter_study_content")
        .select("*")
        .eq("module_id", input.moduleId)
        .eq("chapter_id", input.chapterId)
        .eq("locale", locale)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      if (!data) {
        return {
          found: false as const,
          locked: false,
          chapterId: input.chapterId,
          moduleId: input.moduleId,
        };
      }

      const row = data as StudyRow;
      const isFreePreview = isStudyFreePreviewChapter(
        input.chapterId,
        input.moduleId,
      );
      const canAccess = canAccessChapterSummary(
        input.chapterId,
        isPremium,
        input.moduleId,
      );

      if (!canAccess) {
        return {
          found: true as const,
          locked: true,
          chapterId: input.chapterId,
          moduleId: input.moduleId,
          isFreePreview,
          title: row.title,
          summaryVersion: row.summary_version,
          hasAudio: Boolean(row.audio_url),
        };
      }

      return {
        found: true as const,
        locked: false as const,
        chapterId: input.chapterId,
        moduleId: input.moduleId,
        isFreePreview,
        title: row.title,
        summaryMarkdown: row.summary_markdown,
        summaryVersion: row.summary_version,
        audioUrl: row.audio_url,
        audioDurationSec: row.audio_duration_sec,
        publishedAt: row.published_at,
      };
    }),
});
