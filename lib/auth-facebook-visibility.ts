/**
 * Facebook button on login/signup (next to Google).
 *
 * Default: **shown** so hosted Kinde can list Facebook when it is enabled in the Kinde dashboard.
 * Optional `EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID` still skips the provider picker when set.
 *
 * Opt out:
 * - `EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED=false` — hide the button entirely.
 * - `EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN=false` — hide the button (alias for builds that already use this flag).
 */
export function isFacebookLoginEnabledForBuild(extra: Record<string, unknown>): boolean {
  if (String(extra.EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED ?? '').toLowerCase() === 'false') {
    return false;
  }
  if (String(extra.EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN ?? '').toLowerCase() === 'false') {
    return false;
  }
  return true;
}
