import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseServiceProbeResult =
  | { ok: true }
  | {
      ok: false;
      error: {
        code?: string;
        message: string;
        hint?: string;
      };
    };

/**
 * Single lightweight read — same path as premium checks (`subscriptions` first).
 */
export async function probeSupabaseServiceRole(): Promise<SupabaseServiceProbeResult> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return {
      ok: false,
      error: {
        message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing on the server",
      },
    };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase: SupabaseClient = createClient(url, key);
    const { error } = await supabase.from("subscriptions").select("user_id").limit(1);
    if (error) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          hint: error.hint ?? undefined,
        },
      };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { message } };
  }
}
