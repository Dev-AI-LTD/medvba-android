import { isLikelyAuthConnectivityFailure } from '@/lib/auth-connectivity-errors';

export type SessionExchangeFailureKind = 'connectivity' | 'auth' | 'server';

/** Classify backend / fetch session exchange failures for offline session retention. */
export function classifySessionExchangeFailure(
  error: string,
  status?: number,
): SessionExchangeFailureKind {
  const text = error.toLowerCase().trim();

  if (status === 401 || status === 403) return 'auth';
  if (status === 400 && /invalid|expired|revoked|unauthorized|credential|token/i.test(text)) {
    return 'auth';
  }

  if (isLikelyAuthConnectivityFailure(error)) return 'connectivity';
  if (status === 502 || status === 503 || status === 504) return 'connectivity';

  if (
    /invalid.*token|token.*invalid|expired|unauthorized|forbidden|revoked|invalid_grant|invalid refresh/i.test(
      text,
    )
  ) {
    return 'auth';
  }

  if (status != null && status >= 500) return 'server';
  return 'server';
}

export function isConnectivityExchangeFailure(
  error: string,
  status?: number,
  kind?: SessionExchangeFailureKind,
): boolean {
  if (kind === 'connectivity') return true;
  if (kind === 'auth') return false;
  return classifySessionExchangeFailure(error, status) === 'connectivity';
}
