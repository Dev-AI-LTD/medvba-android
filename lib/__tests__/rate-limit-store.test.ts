import { checkRateLimit, isDistributedRateLimitConfigured } from '@/backend/trpc/rate-limit-store';

describe('rate-limit-store', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('allows requests under limit in memory mode', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_MEMORY_FALLBACK = 'true';

    const key = `test-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit(key, 60_000, 5);
      expect(r.allowed).toBe(true);
    }
  });

  it('blocks when over limit without debiting side effects (429 contract)', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.REDIS_URL;
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_MEMORY_FALLBACK = 'true';

    const key = `block-${Date.now()}`;
    for (let i = 0; i < 2; i++) {
      await checkRateLimit(key, 60_000, 2);
    }
    const blocked = await checkRateLimit(key, 60_000, 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('reports distributed config when Upstash env present', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    expect(isDistributedRateLimitConfigured()).toBe(true);
  });
});
