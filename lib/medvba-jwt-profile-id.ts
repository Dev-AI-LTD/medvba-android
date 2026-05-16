/**
 * Read `profile_id` from a MEDVBA JWT (HS256 payload from backend `/api/auth/session`).
 * Kept dependency-free for onboarding + auth bootstrap order.
 */
export function decodeProfileIdFromMedvbaJwt(token: string | null | undefined): string | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('binary');
    const json = decodeURIComponent(
      Array.from(binary)
        .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const claims = JSON.parse(json) as { profile_id?: unknown };
    const id = claims.profile_id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}
