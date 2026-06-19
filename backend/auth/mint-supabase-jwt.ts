import { SignJWT } from "jose";
import { getJwtSigningSecretOrThrow } from "./jwt-signing-secret";

/**
 * JWT accepted by Supabase PostgREST after JWT signing keys use the same HS256 secret
 * See provider docs for aligning HS256 secrets with Supabase.
 */
export async function mintSupabaseAccessJwt(input: {
  kindeSub: string;
  profileId: string;
  email?: string | null;
}): Promise<string> {
  const secret = getJwtSigningSecretOrThrow();

  const key = new TextEncoder().encode(secret);
  const claims: Record<string, unknown> = {
    role: "authenticated",
    profile_id: input.profileId,
    kinde_sub: input.kindeSub,
  };
  if (input.email) {
    claims.email = input.email;
  }

  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.profileId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("authenticated")
    .sign(key);
}
