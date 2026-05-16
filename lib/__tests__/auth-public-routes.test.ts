import { isPublicUnauthenticatedRoute } from '@/lib/auth-public-routes';

describe('isPublicUnauthenticatedRoute', () => {
  it('allows legal pages', () => {
    expect(isPublicUnauthenticatedRoute(['legal', 'terms-of-service'])).toBe(true);
    expect(isPublicUnauthenticatedRoute(['legal', 'privacy-policy'])).toBe(true);
  });

  it('allows forgot-password and verify-email under (auth)', () => {
    expect(isPublicUnauthenticatedRoute(['(auth)', 'forgot-password'])).toBe(true);
    expect(isPublicUnauthenticatedRoute(['(auth)', 'verify-email'])).toBe(true);
  });

  it('blocks tabs and login', () => {
    expect(isPublicUnauthenticatedRoute(['(tabs)'])).toBe(false);
    expect(isPublicUnauthenticatedRoute(['(auth)', 'login'])).toBe(false);
    expect(isPublicUnauthenticatedRoute(['quiz-session'])).toBe(false);
  });

  it('blocks empty segments', () => {
    expect(isPublicUnauthenticatedRoute([])).toBe(false);
  });
});
