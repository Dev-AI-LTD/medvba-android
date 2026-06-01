import { sanitizeLogArgs } from '@/lib/sanitize-log-value';

const isDevelopment = __DEV__;

let sentry: any = null;
const getSentry = () => {
  if (!sentry) {
    try {
      sentry = require('@sentry/react-native').Sentry;
    } catch {
      // Sentry not configured
    }
  }
  return sentry;
};

export const log = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    const safeArgs = sanitizeLogArgs(args);
    console.error(`[ERROR] ${message}`, ...safeArgs);
    const sentryInstance = getSentry();
    if (sentryInstance && !isDevelopment) {
      sentryInstance.captureException(new Error(message), {
        extra: { args: safeArgs },
      });
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};
