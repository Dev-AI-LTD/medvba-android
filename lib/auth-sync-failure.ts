import { getMedvbaAccessToken } from '@/lib/medvba-access-token';
import { shouldRefreshMedvbaAccessToken } from '@/lib/medvba-jwt-ttl';

/** Clear local session only when sync failed and the stored JWT is missing or already expired. */
export function shouldClearMedvbaSessionAfterSyncFailure(
  token: string | null = getMedvbaAccessToken(),
  nowMs: number = Date.now(),
): boolean {
  if (!token) return true;
  return shouldRefreshMedvbaAccessToken(0, token, nowMs);
}
