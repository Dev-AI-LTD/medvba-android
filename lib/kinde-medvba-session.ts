import { exchangeKindeAccessToken } from '@/lib/exchange-medvba-session';

type KindeUserProfileLite = { email?: string } | null;

/**
 * Single path: Kinde access_token + user profile API → MEDVBA JWT + email for UI.
 * Used after hosted OAuth and when reconciling `useKindeAuth` with stored MEDVBA session.
 */
export async function resolveMedvbaSessionFromKindeAccessToken(
  kindeAccessToken: string,
  getUserProfile: () => Promise<KindeUserProfileLite>,
): Promise<
  | { ok: true; access_token: string; profile_id: string; email?: string }
  | { ok: false; error: string }
> {
  const [ex, up] = await Promise.all([
    exchangeKindeAccessToken(kindeAccessToken),
    getUserProfile(),
  ]);
  if (!ex.ok) {
    return { ok: false, error: ex.error };
  }
  const email = typeof up?.email === 'string' && up.email.length > 0 ? up.email : undefined;
  return {
    ok: true,
    access_token: ex.access_token,
    profile_id: ex.profile_id,
    ...(email ? { email } : {}),
  };
}
