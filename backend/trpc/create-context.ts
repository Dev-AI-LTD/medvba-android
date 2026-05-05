import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createRemoteJWKSet, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// JWT verification helpers
// ---------------------------------------------------------------------------

/**
 * Decode the `iss` claim from a JWT without full verification (to route to
 * the correct verifier). The token is already untrusted at this point.
 */
function peekIssuer(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    return typeof payload.iss === "string" ? payload.iss : null;
  } catch {
    return null;
  }
}

// Lazy-initialised JWKS sets (cached per process lifecycle)
let cognitoJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getCognitoJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  const region = process.env.COGNITO_REGION;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!region || !userPoolId) return null;

  if (!cognitoJwks) {
    const jwksUrl = new URL(
      `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
    );
    cognitoJwks = createRemoteJWKSet(jwksUrl);
  }
  return cognitoJwks;
}

/**
 * Verify a Cognito ID or Access token.
 * Returns the `sub` claim (Cognito user ID) on success.
 */
async function verifyCognitoToken(token: string): Promise<string | null> {
  const jwks = getCognitoJwks();
  if (!jwks) return null;

  try {
    const { payload } = await jwtVerify(token, jwks);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Verify a Supabase JWT and return the user's UUID.
 * Falls back to calling the Supabase getUser API so both old-style and
 * new-style Supabase JWTs work, including when the JWT secret is not set.
 */
async function verifySupabaseToken(token: string): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? null;

  return {
    req: opts.req,
    token,
    // userId is resolved lazily inside protectedProcedure so we only pay the
    // verification cost on protected routes.
    userId: null as string | null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — resolves the caller's user ID from the Bearer token.
 *
 * Supports two JWT issuers (dual-auth transition):
 *   1. AWS Cognito  — verified via JWKS; `sub` used as user ID
 *   2. Supabase Auth — verified via Supabase Admin API; UUID used as user ID
 *
 * Set COGNITO_REGION + COGNITO_USER_POOL_ID to enable Cognito verification.
 * Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable Supabase verification.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  let userId: string | null = null;

  const issuer = peekIssuer(ctx.token);

  if (issuer && issuer.includes("cognito-idp")) {
    // Cognito JWT
    userId = await verifyCognitoToken(ctx.token);
  } else {
    // Supabase JWT (or unknown issuer — try Supabase as fallback)
    userId = await verifySupabaseToken(ctx.token);
  }

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId,
    },
  });
});
