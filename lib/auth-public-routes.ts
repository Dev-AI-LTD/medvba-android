/**
 * Routes reachable without a MEDVBA session (auth wall bypass).
 * Used by `useProtectedRoute` in `app/_layout.tsx`.
 */
export function isPublicUnauthenticatedRoute(segments: readonly string[]): boolean {
  if (segments.length === 0 || segments[0] === undefined) {
    return false;
  }

  if (segments[0] === 'legal') {
    return true;
  }

  if (segments[0] === '(auth)') {
    const screen = segments[1];
    return screen === 'forgot-password' || screen === 'verify-email';
  }

  return false;
}
