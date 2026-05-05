import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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

const getCognitoConfig = () => ({
  region: process.env.COGNITO_REGION ?? null,
  userPoolId: process.env.COGNITO_USER_POOL_ID ?? null,
});

export const accountRouter = createTRPCRouter({
  deleteSelf: protectedProcedure.output(deleteSelfResultSchema).mutation(async ({ ctx }) => {
    const supabaseAdmin = getSupabaseAdmin();

    // ctx.userId is already verified by protectedProcedure (Cognito sub or Supabase UUID)
    const userId = ctx.userId;

    // Attempt to delete the user from Supabase Auth (works for Supabase-auth users).
    // For Cognito-only users this will return a 404 — that's acceptable; we still
    // clean up the profile row below.
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError && !deleteAuthError.message.includes("not found")) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete user account.",
        cause: deleteAuthError,
      });
    }

    // If this is a Cognito-managed user, also call Cognito AdminDeleteUser.
    const { region, userPoolId } = getCognitoConfig();
    if (region && userPoolId) {
      try {
        const { AdminDeleteUserCommand, CognitoIdentityProviderClient } = await import(
          "@aws-sdk/client-cognito-identity-provider"
        );
        const client = new CognitoIdentityProviderClient({ region });
        await client.send(
          new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: userId })
        );
      } catch (err: any) {
        // UserNotFoundException is fine — user may have been deleted already or not exist in Cognito.
        if (!err?.name?.includes("UserNotFoundException")) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete Cognito user.",
            cause: err,
          });
        }
      }
    }

    // Always remove the profile row (using user_id or cognito_sub match).
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    return { success: true };
  }),
});
