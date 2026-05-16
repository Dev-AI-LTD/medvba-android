/**
 * Rough match for RN / fetch failures so we surface a localized "need internet" message instead of a raw error blob.
 */
export function isLikelyAuthConnectivityFailure(messageOrError: unknown): boolean {
  const parts: string[] = [];

  const pushSafe = (v: unknown): void => {
    if (typeof v === 'string') parts.push(v);
  };

  if (typeof messageOrError === 'string') {
    pushSafe(messageOrError);
  } else if (messageOrError instanceof Error) {
    pushSafe(messageOrError.message);
    pushSafe(messageOrError.name);
    const withCause = messageOrError as Error & { cause?: unknown };
    if (withCause.cause instanceof Error) pushSafe(withCause.cause.message);
    else pushSafe(typeof withCause.cause === 'string' ? withCause.cause : undefined);
  }

  const text = parts.join(' ').toLowerCase().trim();
  if (!text) return false;

  const needles = [
    'network request failed',
    'failed to fetch',
    'fetch failed',
    'network error',
    'connection',
    'internet',
    'offline',
    'timed out',
    'timeout',
    'unreachable',
    'ENOTFOUND',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENETUNREACH',
    'econnfailed',
    'name not resolved',
    'unable to resolve',
    'no address associated',
  ];

  return needles.some((n) => text.includes(n));
}
