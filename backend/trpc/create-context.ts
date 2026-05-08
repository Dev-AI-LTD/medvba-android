import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createRemoteJWKSet, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------

if (!process.env.COGNITO_REGION || !process.env.COGNITO_USER_POOL_ID) {
  console.warn(
    "[Auth] WARNING: COGNITO_REGION or COGNITO_USER_POOL_ID is not set. " +
    "Protected procedures will reject all requests."
  );
}

// ---------------------------------------------------------------------------
// JWT verification — Cognito only
// ---------------------------------------------------------------------------

// Lazy-initialised JWKS set (cached per process lifecycle)
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
 * Protected procedure — resolves the caller's user ID from the Cognito Bearer token.
 * Requires COGNITO_REGION and COGNITO_USER_POOL_ID environment variables.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const userId = await verifyCognitoToken(ctx.token);

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
