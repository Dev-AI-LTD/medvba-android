import Constants from 'expo-constants';

/** Official App Store review account (see docs/APPLE_REVIEW_AUTH.md). */
const DEFAULT_REVIEW_PREMIUM_EMAILS = ['contact@devaieood.com'] as const;

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes('@'));
}

function getExtra(): Record<string, unknown> {
  return (
    Constants.expoConfig?.extra ??
    (Constants as { manifest?: { extra?: Record<string, unknown> } }).manifest?.extra ??
    {}
  );
}

/**
 * Client-side review premium bypass. Off in production store builds unless
 * EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM=true (set in EAS for App Review / TestFlight).
 */
export function isReviewPremiumFeatureEnabled(): boolean {
  if (__DEV__) return true;
  const extra = getExtra();
  const flag = String(
    extra.EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM ??
      process.env.EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM ??
      'false',
  ).trim();
  return flag === 'true';
}

function getConfiguredReviewPremiumEmails(): string[] {
  const fromEnv = parseEmailList(String(getExtra().EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS ?? ''));
  if (fromEnv.length > 0) return fromEnv;
  return [...DEFAULT_REVIEW_PREMIUM_EMAILS];
}

let cachedList: string[] | null = null;

export function getAppReviewPremiumEmails(): string[] {
  if (!cachedList) {
    cachedList = getConfiguredReviewPremiumEmails();
  }
  return cachedList;
}

export function isAppReviewPremiumEmail(email: string | null | undefined): boolean {
  if (!isReviewPremiumFeatureEnabled()) return false;
  if (!email?.includes('@')) return false;
  const normalized = email.trim().toLowerCase();
  return getAppReviewPremiumEmails().includes(normalized);
}

export function getKindeLoginHintEmail(): string | undefined {
  const hint = String(getExtra().EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL ?? '').trim().toLowerCase();
  return hint.includes('@') ? hint : undefined;
}
