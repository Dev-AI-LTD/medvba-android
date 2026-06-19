import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { deleteMedvbaKindeIdentityUser } from "../auth/session-routes";
import { createTRPCRouter, protectedProcedure } from "./create-context";

const deleteSelfResultSchema = z.object({
  success: z.literal(true),
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
      const kdel = await deleteMedvbaKindeIdentityUser(kindeSub);
      if (!kdel.ok) {
        // Do not block in-app account deletion on external IdP failures.
        // We still remove app data/profile so users can complete deletion.
        console.warn(
          "[account.deleteSelf] Kinde identity delete failed, continuing with app data deletion:",
          kdel.code,
          kdel.detail ?? "",
        );
      }
    }

    await supabaseAdmin.auth.admin.deleteUser(profileId).catch(() => {
      /* user may not exist in Supabase Auth (external IdP only) */
    });

    const { error: deleteError } = await supabaseAdmin.from("profiles").delete().eq("id", profileId);

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
