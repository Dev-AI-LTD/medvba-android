import * as Sentry from '@sentry/react-native';
import { log } from '@/lib/log';

// Use React Native's built-in production flag — reliable in all build types
const isProduction = !__DEV__;

export function initializeMonitoring() {
  if (!isProduction) {
    log.debug('[Monitoring] Sentry disabled in development');
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    log.warn('[Monitoring] EXPO_PUBLIC_SENTRY_DSN not set — Sentry disabled');
    return;
  }

  Sentry.init({
    dsn,
    debug: false,
    tracesSampleRate: 0.2,
    environment: 'production',
    beforeSend(event) {
      // Scrub common PII / secrets from breadcrumbs and extras before upload.
      const scrubString = (value: string): string => {
        let s = value
          .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [redacted]')
          .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt-redacted]')
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email-redacted]')
          .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=\s]+/gi, '[image-data-url-redacted]')
          .replace(/[A-Za-z0-9+/]{200,}={0,2}/g, '[base64-redacted]');
        if (s.length > 8000) {
          s = `${s.slice(0, 4000)}…[truncated]…${s.slice(-500)}`;
        }
        return s;
      };

      const scrub = (value: unknown): unknown => {
        if (typeof value === 'string') {
          return scrubString(value);
        }
        if (Array.isArray(value)) return value.map(scrub);
        if (value && typeof value === 'object') {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (
              /email|token|password|authorization|secret|cookie|prompt|message|content|image|clinical/i.test(
                k,
              )
            ) {
              out[k] = '[redacted]';
            } else {
              out[k] = scrub(v);
            }
          }
          return out;
        }
        return value;
      };

      if (event.user) {
        event.user = {
          id: event.user.id,
          // Drop email / username from production crash reports
        };
      }
      if (event.extra) {
        event.extra = scrub(event.extra) as typeof event.extra;
      }
      if (event.contexts) {
        event.contexts = scrub(event.contexts) as typeof event.contexts;
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => ({
          ...b,
          message: typeof b.message === 'string' ? (scrub(b.message) as string) : b.message,
          data: b.data ? (scrub(b.data) as typeof b.data) : b.data,
        }));
      }
      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        for (const h of Object.keys(headers)) {
          if (/authorization|cookie|set-cookie|x-api-key/i.test(h)) {
            headers[h] = '[redacted]';
          } else if (typeof headers[h] === 'string') {
            headers[h] = scrubString(headers[h]);
          }
        }
        event.request.headers = headers;
      }
      return event;
    },
  });

  log.info('[Monitoring] Sentry initialized');
}

export function logError(error: Error, context?: Record<string, any>) {
  log.error('[Monitoring] Error: ' + error.message, context);

  if (isProduction) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

export function logEvent(eventName: string, properties?: Record<string, any>) {
  log.debug('[Monitoring] Event: ' + eventName, properties);

  if (isProduction) {
    Sentry.addBreadcrumb({
      message: eventName,
      data: properties,
      level: 'info',
    });
  }
}

export function setUserContext(userId: string, email?: string, name?: string) {
  log.debug('[Monitoring] Setting user context');

  if (isProduction) {
    Sentry.setUser({
      id: userId,
    });
  }
}

export function clearUserContext() {
  log.debug('[Monitoring] Clearing user context');

  if (isProduction) {
    Sentry.setUser(null);
  }
}

export const monitoring = {
  init: initializeMonitoring,
  logError,
  logEvent,
  setUser: setUserContext,
  clearUser: clearUserContext,
};
