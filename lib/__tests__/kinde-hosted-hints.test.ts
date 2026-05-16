import {
  buildKindeRegisterHint,
  buildKindeSignInHint,
  buildKindeSocialRegisterHint,
  buildKindeSocialSignInHint,
} from '@/lib/kinde-hosted-hints';

describe('kinde-hosted-hints', () => {
  it('register hint uses prompt=create', () => {
    const hint = buildKindeRegisterHint({});
    expect(hint.authUrlParams).toEqual({ prompt: 'create' });
  });

  it('register hint adds email connection and login_hint when configured', () => {
    const hint = buildKindeRegisterHint({
      email: 'user@example.com',
      emailConnectionId: 'conn_email',
    });
    expect(hint.connectionId).toBe('conn_email');
    expect(hint.authUrlParams).toEqual({
      prompt: 'create',
      login_hint: 'user@example.com',
    });
  });

  it('register hint does not pass login_hint without email connection', () => {
    const hint = buildKindeRegisterHint({ email: 'user@example.com' });
    expect(hint.authUrlParams).toEqual({ prompt: 'create' });
    expect(hint.connectionId).toBeUndefined();
  });

  it('sign-in hint passes login_hint for known email', () => {
    const hint = buildKindeSignInHint({ email: 'user@example.com' });
    expect(hint?.authUrlParams).toEqual({ login_hint: 'user@example.com' });
  });

  it('sign-in hint is undefined when empty', () => {
    expect(buildKindeSignInHint({})).toBeUndefined();
  });

  it('social register hint uses prompt=create and connectionId', () => {
    const hint = buildKindeSocialRegisterHint('conn_google');
    expect(hint.connectionId).toBe('conn_google');
    expect(hint.authUrlParams).toEqual({ prompt: 'create' });
  });

  it('social sign-in hint omits prompt=create and sets connectionId', () => {
    const hint = buildKindeSocialSignInHint('conn_google');
    expect(hint.connectionId).toBe('conn_google');
    expect(hint.authUrlParams).toBeUndefined();
  });

  it('social sign-in hint is empty without connectionId', () => {
    expect(buildKindeSocialSignInHint()).toEqual({});
  });
});
