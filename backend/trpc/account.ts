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
        if (kdel.code === "missing_m2m") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Account deletion is not fully configured: the server needs KINDE_M2M_CLIENT_ID and KINDE_M2M_CLIENT_SECRET so your identity can be removed from Kinde. Without that, your email stays registered there even after app data is removed.",
            cause: kdel.detail,
          });
        }
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            "Could not remove your account from the identity provider (Kinde). In Kinde: Machine to machine app → APIs → Kinde Management API → ensure permission to delete users, then try again.",
          cause: kdel.detail,
        });
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
