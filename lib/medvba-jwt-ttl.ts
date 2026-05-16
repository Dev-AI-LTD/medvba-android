import { getMedvbaAccessToken } from '@/lib/medvba-access-token';

function decodeJwtClaims(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('Invalid JWT');
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
  return JSON.parse(json) as Record<string, unknown>;
}

/** True when missing, invalid, expired, or expiring within buffer (ms). */
export function shouldRefreshMedvbaAccessToken(
  bufferMs: number,
  token: string | null = getMedvbaAccessToken(),
  nowMs: number = Date.now(),
): boolean {
  if (!token) return true;
  try {
    const c = decodeJwtClaims(token);
    const exp = c.exp;
    if (typeof exp !== 'number') return true;
    return exp * 1000 <= nowMs + bufferMs;
  } catch {
    return true;
  }
}
