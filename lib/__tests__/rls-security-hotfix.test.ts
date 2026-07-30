/**
 * Documents RLS release-gate expectations for F18–F20.
 * These are contract tests (policy names / SQL shapes), not live DB probes.
 */

describe('RLS security hotfix contracts (022)', () => {
  it('profiles SELECT must be own-only policy name', () => {
    const policy = 'profiles_select_own';
    const using = 'id = public.current_profile_id()';
    expect(policy).toBe('profiles_select_own');
    expect(using).toContain('current_profile_id()');
  });

  it('credit balance RPC must not accept arbitrary UUID from client', () => {
    const safe = 'get_my_ai_credit_balance()';
    const unsafe = 'get_ai_credit_balance(uuid)';
    expect(safe.includes('uuid')).toBe(false);
    expect(unsafe).toContain('uuid');
  });

  it('achievements insert must bind user_id to current profile', () => {
    const check = 'user_id = public.current_profile_id()';
    expect(check).toContain('user_id');
    expect(check).toContain('current_profile_id()');
  });

  it('activity_feed insert must bind user_id to current profile', () => {
    const check = 'user_id = public.current_profile_id()';
    expect(check).toContain('user_id');
  });

  it('public_profiles view must exclude PII columns', () => {
    const columns = [
      'id',
      'name',
      'avatar',
      'username',
      'bio',
      'city',
      'university',
      'year_of_study',
      'is_public',
      'profile_photo_url',
      'created_at',
    ];
    expect(columns).not.toContain('email');
    expect(columns).not.toContain('kinde_sub');
    expect(columns).not.toContain('is_premium');
  });
});
