import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_AI_LIMIT } from "../../constants/subscription";

/** All reads/writes here must use a Supabase client with the service role (RLS: no user JWT INSERT/UPDATE on `ai_question_usage`; see migration 010). */
const AI_LIMIT_WINDOW_HOURS = 24;
export const AI_LIMIT_WINDOW_MS = AI_LIMIT_WINDOW_HOURS * 60 * 60 * 1000;

type UsageRow = {
  id: string;
  question_count: number | null;
  period_start: string;
};

function computeEffectiveCount(row: UsageRow | null): { effectiveCount: number; windowExpired: boolean } {
  if (!row) return { effectiveCount: 0, windowExpired: false };
  const windowExpired =
    Date.now() - new Date(row.period_start as string).getTime() >= AI_LIMIT_WINDOW_MS;
  if (windowExpired) return { effectiveCount: 0, windowExpired: true };
  return { effectiveCount: Math.max(0, row.question_count ?? 0), windowExpired: false };
}

export async function getFreeAiStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ remaining: number; limit: number }> {
  const { data: usageRow, error: usageError } = await supabase
    .from("ai_question_usage")
    .select("id, question_count, period_start")
    .eq("user_id", userId)
    .maybeSingle();

  if (usageError) {
    console.error("[AI usage] Error loading AI usage:", usageError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify AI usage limit",
    });
  }

  const { effectiveCount } = computeEffectiveCount(usageRow as UsageRow | null);
  const remaining = Math.max(0, FREE_AI_LIMIT - effectiveCount);
  return { remaining, limit: FREE_AI_LIMIT };
}

/** Throws FORBIDDEN if free user has no remaining AI questions (no DB write). */
export async function assertFreeAiRemaining(supabase: SupabaseClient, userId: string): Promise<void> {
  const { remaining } = await getFreeAiStatus(supabase, userId);
  if (remaining <= 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `AI question limit reached. Free tier allows ${FREE_AI_LIMIT} questions per rolling 24 hours. Upgrade to premium for unlimited access.`,
    });
  }
}

/** Increments free-tier usage (call after successful AI). */
export async function incrementFreeAiUsage(supabase: SupabaseClient, userId: string): Promise<void> {
  const nowIso = new Date().toISOString();

  const { data: usageRow, error: usageError } = await supabase
    .from("ai_question_usage")
    .select("id, question_count, period_start")
    .eq("user_id", userId)
    .maybeSingle();

  if (usageError) {
    console.error("[AI usage] Error loading AI usage:", usageError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify AI usage limit",
    });
  }

  const { effectiveCount, windowExpired } = computeEffectiveCount(usageRow as UsageRow | null);
  const remaining = Math.max(0, FREE_AI_LIMIT - effectiveCount);

  if (remaining <= 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `AI question limit reached. Free tier allows ${FREE_AI_LIMIT} questions per rolling 24 hours. Upgrade to premium for unlimited access.`,
    });
  }

  const newCount = effectiveCount + 1;

  if (!usageRow) {
    const { error: insertError } = await supabase.from("ai_question_usage").insert({
      user_id: userId,
      question_count: newCount,
      period_start: nowIso,
    });

    if (insertError) {
      console.error("[AI usage] Error creating AI usage row:", insertError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to record AI usage",
      });
    }
    return;
  }

  const { error: updateError } = await supabase
    .from("ai_question_usage")
    .update({
      question_count: newCount,
      period_start: windowExpired ? nowIso : (usageRow as UsageRow).period_start,
      updated_at: nowIso,
    })
    .eq("id", (usageRow as UsageRow).id);

  if (updateError) {
    console.error("[AI usage] Error updating AI usage:", updateError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to record AI usage",
    });
  }
}

/**
 * Reverses one increment when AI failed after usage was already reserved.
 * Safe to call even if row is missing or count is 0.
 */
export async function decrementFreeAiUsage(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: usageRow, error: usageError } = await supabase
    .from("ai_question_usage")
    .select("id, question_count, period_start")
    .eq("user_id", userId)
    .maybeSingle();

  if (usageError || !usageRow) {
    return;
  }

  const row = usageRow as UsageRow;
  const { effectiveCount, windowExpired } = computeEffectiveCount(row);
  if (windowExpired || effectiveCount <= 0) {
    return;
  }

  const newCount = effectiveCount - 1;
  const nowIso = new Date().toISOString();

  if (newCount <= 0) {
    const { error: delErr } = await supabase.from("ai_question_usage").delete().eq("id", row.id);
    if (delErr) {
      console.error("[AI usage] Error deleting AI usage row on rollback:", delErr);
    }
    return;
  }

  const { error: updateError } = await supabase
    .from("ai_question_usage")
    .update({
      question_count: newCount,
      updated_at: nowIso,
    })
    .eq("id", row.id);

  if (updateError) {
    console.error("[AI usage] Error rolling back AI usage:", updateError);
  }
}
