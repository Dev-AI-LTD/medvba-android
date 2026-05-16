import { persistMedvbaKindeRefreshToken } from '@/lib/medvba-session-storage';
import { log } from '@/lib/log';
import type { useKindeAuth } from '@kinde/expo';
import { getMergedExpoExtra } from '@/lib/expo-public-extra';

/** Matches `useKindeAuth().refreshToken` (optional — absent on some builds). */
export type KindeAuthWithRefresh = Partial<Pick<ReturnType<typeof useKindeAuth>, 'refreshToken'>>;
/**
 * After hosted OAuth, persist Kinde refresh_token when the SDK exposes it
 * (fallback when `kinde.isAuthenticated` is lost but MEDVBA JWT is still valid).
 */
export async function persistKindeRefreshTokenFromSdk(kinde: KindeAuthWithRefresh): Promise<void> {
  if (typeof kinde.refreshToken !== 'function') {
    return;
  }
  const extra = getMergedExpoExtra();
  const domain = String(extra.EXPO_PUBLIC_KINDE_ISSUER_URL ?? '')
    .trim()
    .replace(/\/$/, '');
  const clientId = String(extra.EXPO_PUBLIC_KINDE_CLIENT_ID ?? '').trim();
  if (!domain || !clientId) {
    log.debug(
      '[Auth] Could not call Kinde refreshToken: missing EXPO_PUBLIC_KINDE_ISSUER_URL or EXPO_PUBLIC_KINDE_CLIENT_ID',
    );
    return;
  }
  try {
    const result = await kinde.refreshToken({ domain, clientId });
    if (!result || typeof result !== 'object') {
      return;
    }
    if (result.success === false) {
      return;
    }
    const token = result.refreshToken?.trim();
    if (token) {
      await persistMedvbaKindeRefreshToken(token);
    }
  } catch (error) {
    log.debug('[Auth] Could not persist Kinde refresh token from SDK:', error);
  }
}
