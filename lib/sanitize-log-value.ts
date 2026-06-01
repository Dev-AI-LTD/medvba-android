/** Redact emails, JWTs, and Supabase publishable keys before logging or Sentry. */
export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
      .replace(
        /(eyJ[a-zA-Z0-9_-]+?\.[a-zA-Z0-9_-]+?\.[a-zA-Z0-9_-]+?)/g,
        '[redacted-jwt]',
      )
      .replace(/(sb_publishable_[a-zA-Z0-9._-]+)/g, '[redacted-supabase-key]');
  }
  if (value && typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value);
      if (serialized) {
        return sanitizeLogValue(serialized);
      }
    } catch {
      return '[redacted-object]';
    }
  }
  return value;
}

export function sanitizeLogArgs(args: unknown[]): unknown[] {
  return __DEV__ ? args : args.map(sanitizeLogValue);
}
