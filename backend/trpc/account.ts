import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { deleteMedvbaKindeIdentityUser } from "../auth/session-routes";
import { createTRPCRouter, protectedProcedure } from "./create-context";

const deleteSelfResultSchema = z.object({
  success: z.literal(true),
});

const KINDE_DELETE_TIMEOUT_MS = 8_000;
const SUPABASE_AUTH_DELETE_TIMEOUT_MS = 10_000;
const SUPABASE_PROFILE_DELETE_TIMEOUT_MS = 10_000;

function isErrorWithMessage(value: unknown): value is { message: string } {
  return !!value && typeof value === "object" && "message" in value;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      promise.then(resolve).catch(reject);
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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

export const accountRouter = createTRPCRouter({
  deleteSelf: protectedProcedure.output(deleteSelfResultSchema).mutation(async ({ ctx }) => {
    const supabaseAdmin = getSupabaseAdmin();
    const profileId = ctx.userId;

    const { data: profileRow, error: profileFetchErr } = await supabaseAdmin
      .from("profiles")
      .select("kinde_sub")
      .eq("id", profileId)
      .maybeSingle();

    if (profileFetchErr) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load account for deletion.",
        cause: profileFetchErr,
      });
    }

    const kindeSub =
      typeof profileRow?.kinde_sub === "string" ? profileRow.kinde_sub.trim() : "";
    if (kindeSub) {
      try {
        const kdel = await withTimeout(
          deleteMedvbaKindeIdentityUser(kindeSub),
          KINDE_DELETE_TIMEOUT_MS,
          "Kinde identity delete timed out.",
        );
        if (!kdel.ok) {
          // Do not block in-app account deletion on external IdP failures.
          // We still remove app data/profile so users can complete deletion.
          console.warn(
            "[account.deleteSelf] Kinde identity delete failed, continuing with app data deletion:",
            kdel.code,
            kdel.detail ?? "",
          );
        }
      } catch (error: unknown) {
        console.warn(
          "[account.deleteSelf] Kinde identity delete timed out/failed, continuing with app data deletion:",
          isErrorWithMessage(error) ? error.message : String(error),
        );
      }
    }

    await withTimeout(
      supabaseAdmin.auth.admin.deleteUser(profileId),
      SUPABASE_AUTH_DELETE_TIMEOUT_MS,
      "Supabase auth user deletion timed out.",
    ).catch((error: unknown) => {
      // Non-blocking: auth row may not exist or external provider can still own identity.
      console.warn(
        "[account.deleteSelf] Supabase auth delete failed/timed out, continuing profile cleanup:",
        isErrorWithMessage(error) ? error.message : String(error),
      );
    });

    let deleteError: unknown = null;
    try {
      const deleteResult = await withTimeout(
        (async () => supabaseAdmin.from("profiles").delete().eq("id", profileId))(),
        SUPABASE_PROFILE_DELETE_TIMEOUT_MS,
        "Supabase profile deletion timed out.",
      );
      deleteError = deleteResult.error;
    } catch (error: unknown) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Account deletion timed out. Please try again.",
        cause: error,
      });
    }

    if (deleteError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete account data.",
        cause: deleteError,
      });
    }

    return { success: true };
  }),
});
