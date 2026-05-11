/**
 * Facebook button is shown only when explicitly enabled for this build:
 * - `EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED` is not the string `false`, and
 * - either `EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID` is set (direct social connection id), or
 * - `EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN` is `true` (e.g. hosted login page that lists Facebook).
 *
 * Users who only use email and other providers never need Facebook; leaving connection id unset hides the button.
 */
export function isFacebookLoginEnabledForBuild(extra: Record<string, unknown>): boolean {
  if (String(extra.EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED ?? '').toLowerCase() === 'false') {
    return false;
  }
  if (String(extra.EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID ?? '').trim().length > 0) {
    return true;
  }
  return String(extra.EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN ?? '').toLowerCase() === 'true';
}
