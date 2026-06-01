import { shouldRefreshMedvbaAccessToken } from '@/lib/medvba-jwt-ttl';
import { getMedvbaAccessToken, setMedvbaAccessToken } from '@/lib/medvba-access-token';
import { loadMedvbaAccessToken } from '@/lib/medvba-session-storage';

type PostgrestLikeError = {
  message?: string;
  code?: string;
} | null;

let refreshMedvbaSession: (() => Promise<void>) | null = null;
let refreshInFlight: Promise<void> | null = null;

/** Registered from AuthProvider — refreshes MEDVBA JWT via Kinde / refresh_token. */
export function registerMedvbaSessionRefresher(fn: () => Promise<void>): void {
  refreshMedvbaSession = fn;
}

export function unregisterMedvbaSessionRefresher(): void {
  refreshMedvbaSession = null;
  refreshInFlight = null;
}

async function triggerMedvbaSessionRefresh(): Promise<void> {
  if (!refreshMedvbaSession) return;
  if (!refreshInFlight) {
    refreshInFlight = refreshMedvbaSession().finally(() => {
      refreshInFlight = null;
    });
  }
  await refreshInFlight;
}

export function isMedvbaJwtExpiredPostgrestError(error: PostgrestLikeError): boolean {
  if (!error) return false;
  const code = String(error.code ?? '');
  const message = String(error.message ?? '');
  return (
    code === 'PGRST303' ||
    code === '303' ||
    /jwt expired/i.test(message) ||
    /invalid.*jwt/i.test(message)
  );
}

/** Hydrate in-memory JWT from SecureStore when hooks run before Auth bootstrap finishes. */
async function hydrateMedvbaAccessTokenFromStorage(): Promise<void> {
  if (getMedvbaAccessToken()) return;
  try {
    const stored = await loadMedvbaAccessToken();
    if (stored) setMedvbaAccessToken(stored);
  } catch {
    /* ignore */
  }
}

/** Refresh session if token is missing, invalid, or past exp (incl. already expired). */
export async function ensureMedvbaSessionBeforeQuery(): Promise<void> {
  await hydrateMedvbaAccessTokenFromStorage();
  const expiredOrMissing = shouldRefreshMedvbaAccessToken(0) || !getMedvbaAccessToken();
  if (!expiredOrMissing) {
    return;
  }
  await triggerMedvbaSessionRefresh();
}

/** Thrown from Supabase queryFns so `runWithMedvbaSession` can refresh and retry once. */
export class MedvbaJwtExpiredError extends Error {
  override readonly name = 'MedvbaJwtExpiredError';
}

/**
 * Ensures JWT freshness, runs `fn`, and on {@link MedvbaJwtExpiredError} refreshes session and retries once.
 */
export async function runWithMedvbaSession<T>(fn: () => Promise<T>): Promise<T> {
  await ensureMedvbaSessionBeforeQuery();
  try {
    return await fn();
  } catch (e) {
    if (!(e instanceof MedvbaJwtExpiredError)) {
      throw e;
    }
    await triggerMedvbaSessionRefresh();
    if (!getMedvbaAccessToken() || shouldRefreshMedvbaAccessToken(0)) {
      throw e;
    }
    return await fn();
  }
}
