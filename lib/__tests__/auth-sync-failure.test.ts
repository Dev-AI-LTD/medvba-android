import { shouldClearMedvbaSessionAfterSyncFailure } from '@/lib/auth-sync-failure';

function makeJwtWithExp(expSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds, profile_id: 'test' })).toString(
    'base64url',
  );
  return `${header}.${payload}.signature`;
}

describe('shouldClearMedvbaSessionAfterSyncFailure', () => {
  const nowMs = 1_700_000_000_000;

  it('clears when token is null', () => {
    expect(shouldClearMedvbaSessionAfterSyncFailure(null, nowMs)).toBe(true);
  });

  it('does not clear when JWT is still valid', () => {
    const futureExp = Math.floor(nowMs / 1000) + 600;
    const token = makeJwtWithExp(futureExp);
    expect(shouldClearMedvbaSessionAfterSyncFailure(token, nowMs)).toBe(false);
  });

  it('clears when JWT is expired', () => {
    const pastExp = Math.floor(nowMs / 1000) - 60;
    const token = makeJwtWithExp(pastExp);
    expect(shouldClearMedvbaSessionAfterSyncFailure(token, nowMs)).toBe(true);
  });
});
