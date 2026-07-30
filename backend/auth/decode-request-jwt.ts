import { jwtVerify } from "jose";
import { getJwtSigningSecretOrThrow } from "./jwt-signing-secret";

export type VerifiedMedvbaJwt = {
  userId: string;
  kindeSub: string;
};

export async function verifyMedvbaRequestJwt(token: string): Promise<VerifiedMedvbaJwt> {
  const secret = getJwtSigningSecretOrThrow();
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
    audience: "authenticated",
  });
  const role = typeof payload.role === "string" ? payload.role : "";
  if (role !== "authenticated") {
    throw new Error("JWT role must be authenticated.");
  }
  const userId = typeof payload.profile_id === "string" ? payload.profile_id : "";
  /** Minted MEDVBA JWTs set `sub` to profile UUID and put the identity provider id in `kinde_sub`. */
  const fromClaim =
    typeof payload.kinde_sub === "string" ? payload.kinde_sub.trim() : "";
  const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
  const subLooksProfileUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub);
  const kindeSub = fromClaim || (!subLooksProfileUuid && sub ? sub : "");
  if (!userId || !kindeSub) {
    throw new Error("JWT missing profile_id or kinde_sub (identity id).");
  }
  return { userId, kindeSub };
}
