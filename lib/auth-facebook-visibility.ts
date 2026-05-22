/**
 * Facebook button on login/signup (next to Google).
 *
 * Default: **hidden** (App Store / review builds use email+password, Google, Apple only).
 *
 * Opt in:
 * - `EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED=true`
 * - `EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN=true`
 */
export function isFacebookLoginEnabledForBuild(extra: Record<string, unknown>): boolean {
  if (String(extra.EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED ?? '').toLowerCase() === 'true') {
    return true;
  }
  if (String(extra.EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN ?? '').toLowerCase() === 'true') {
    return true;
  }
  return false;
}
