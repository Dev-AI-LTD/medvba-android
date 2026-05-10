import { jwtVerify } from "jose";

export type VerifiedMedvbaJwt = {
  userId: string;
  kindeSub: string;
};

export async function verifyMedvbaRequestJwt(token: string): Promise<VerifiedMedvbaJwt> {
  const secret =
    process.env.SUPABASE_JWT_SIGNING_SECRET?.trim() ||
    process.env.KINDE_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error("SUPABASE_JWT_SIGNING_SECRET or KINDE_CLIENT_SECRET is not set.");
  }
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
  const userId = typeof payload.profile_id === "string" ? payload.profile_id : "";
  const kindeSub = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId || !kindeSub) {
    throw new Error("JWT missing profile_id or sub.");
  }
  return { userId, kindeSub };
}
