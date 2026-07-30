import { SignJWT } from 'jose';

import { verifyMedvbaRequestJwt } from '@/backend/auth/decode-request-jwt';

const TEST_SECRET = 'test-jwt-signing-secret-for-unit-tests-only';

describe('verifyMedvbaRequestJwt', () => {
  const prev = process.env.SUPABASE_JWT_SIGNING_SECRET;

  beforeAll(() => {
    process.env.SUPABASE_JWT_SIGNING_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    if (prev === undefined) delete process.env.SUPABASE_JWT_SIGNING_SECRET;
    else process.env.SUPABASE_JWT_SIGNING_SECRET = prev;
  });

  async function mint(claims: Record<string, unknown>, aud?: string) {
    const builder = new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(String(claims.profile_id))
      .setIssuedAt()
      .setExpirationTime('15m');
    if (aud !== undefined) {
      builder.setAudience(aud);
    } else {
      builder.setAudience('authenticated');
    }
    return builder.sign(new TextEncoder().encode(TEST_SECRET));
  }

  it('accepts mint-shaped JWT with aud=authenticated and role', async () => {
    const profileId = '11111111-1111-4111-8111-111111111111';
    const token = await mint({
      role: 'authenticated',
      profile_id: profileId,
      kinde_sub: 'kp_abc123',
    });
    const v = await verifyMedvbaRequestJwt(token);
    expect(v.userId).toBe(profileId);
    expect(v.kindeSub).toBe('kp_abc123');
  });

  it('rejects wrong audience', async () => {
    const profileId = '22222222-2222-4222-8222-222222222222';
    const token = await mint(
      {
        role: 'authenticated',
        profile_id: profileId,
        kinde_sub: 'kp_xyz',
      },
      'wrong-aud',
    );
    await expect(verifyMedvbaRequestJwt(token)).rejects.toThrow();
  });

  it('rejects non-authenticated role', async () => {
    const profileId = '33333333-3333-4333-8333-333333333333';
    const token = await mint({
      role: 'anon',
      profile_id: profileId,
      kinde_sub: 'kp_anon',
    });
    await expect(verifyMedvbaRequestJwt(token)).rejects.toThrow(/authenticated/);
  });
});
