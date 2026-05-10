import { SignJWT } from "jose";

/**
 * JWT accepted by Supabase PostgREST after JWT signing keys use the same HS256 secret
 * (Kinde client secret per https://docs.kinde.com/integrate/third-party-tools/kinde-supabase).
 */
export async function mintSupabaseAccessJwt(input: {
  kindeSub: string;
  profileId: string;
  email?: string | null;
}): Promise<string> {
  const secret =
    process.env.SUPABASE_JWT_SIGNING_SECRET?.trim() ||
    process.env.KINDE_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing SUPABASE_JWT_SIGNING_SECRET (or KINDE_CLIENT_SECRET) for JWT minting.",
    );
  }

  const key = new TextEncoder().encode(secret);
  const claims: Record<string, unknown> = {
    role: "authenticated",
    profile_id: input.profileId,
  };
  if (input.email) {
    claims.email = input.email;
  }

  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.kindeSub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("authenticated")
    .sign(key);
}
