function trimmed(name: string): string {
  return (process.env[name] || "").trim();
}

/**
 * Production must use a dedicated JWT signing secret.
 * Dev/test may fall back to KINDE_CLIENT_SECRET for easier local setup.
 */
export function getJwtSigningSecretOrThrow(): string {
  const supabaseJwtSecret = trimmed("SUPABASE_JWT_SIGNING_SECRET");
  if (supabaseJwtSecret) return supabaseJwtSecret;

  const kindeClientSecret = trimmed("KINDE_CLIENT_SECRET");
  const isProd = (process.env.NODE_ENV || "").trim().toLowerCase() === "production";

  if (!isProd && kindeClientSecret) {
    return kindeClientSecret;
  }

  if (isProd) {
    throw new Error("Missing SUPABASE_JWT_SIGNING_SECRET in production.");
  }

  throw new Error(
    "Missing SUPABASE_JWT_SIGNING_SECRET (or KINDE_CLIENT_SECRET in non-production) for JWT operations.",
  );
}
