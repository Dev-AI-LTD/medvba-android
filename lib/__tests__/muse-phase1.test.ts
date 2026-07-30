/**
 * Phase 1 Muse provider, guards, abort/refund policy, health split.
 */

import { Hono } from 'hono';

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

describe('resolveClinicalProvider / getClinicalProviderConfig', () => {
  afterEach(() => {
    restoreEnv();
    jest.resetModules();
  });

  it('AI_PROVIDER=muse without META_MODEL_API_KEY throws generic config error (no OpenAI fallback)', () => {
    process.env.AI_PROVIDER = 'muse';
    delete process.env.META_MODEL_API_KEY;
    delete process.env.META_MODEL_API_BASE_URL;
    process.env.AI_API_KEY = 'sk-openai-should-not-be-used';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      getClinicalProviderConfig,
      CLINICAL_PROVIDER_NOT_CONFIGURED,
    } = require('@/lib/ai-provider');

    expect(() => getClinicalProviderConfig()).toThrow(
      CLINICAL_PROVIDER_NOT_CONFIGURED,
    );
  });

  it('AI_PROVIDER=muse with Meta key uses muse config', () => {
    process.env.AI_PROVIDER = 'muse';
    process.env.META_MODEL_API_KEY = 'meta-key';
    process.env.META_MODEL_API_BASE_URL = 'https://example.meta/v1';
    process.env.META_MODEL_NAME = 'muse-spark-1.1';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getClinicalProviderConfig, resolveClinicalProvider } =
      require('@/lib/ai-provider');

    expect(resolveClinicalProvider()).toBe('muse');
    const cfg = getClinicalProviderConfig();
    expect(cfg.provider).toBe('muse');
    expect(cfg.apiKey).toBe('meta-key');
    expect(cfg.model).toBe('muse-spark-1.1');
  });

  it('AI_PROVIDER absent or openai does not require META_MODEL_*', () => {
    delete process.env.AI_PROVIDER;
    process.env.AI_API_KEY = 'sk-test';
    delete process.env.META_MODEL_API_KEY;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getClinicalProviderConfig, resolveClinicalProvider } =
      require('@/lib/ai-provider');

    expect(resolveClinicalProvider()).toBe('openai');
    const cfg = getClinicalProviderConfig();
    expect(cfg.provider).toBe('openai');
    expect(cfg.apiKey).toBe('sk-test');
  });

  it('META_MODEL_API_KEY alone does not select muse', () => {
    delete process.env.AI_PROVIDER;
    process.env.META_MODEL_API_KEY = 'meta-present';
    process.env.AI_API_KEY = 'sk-test';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveClinicalProvider } = require('@/lib/ai-provider');
    expect(resolveClinicalProvider()).toBe('openai');
  });

  it('generateText (Tutor) does not read META_MODEL_*', async () => {
    process.env.AI_PROVIDER = 'muse';
    process.env.META_MODEL_API_KEY = 'meta-key';
    process.env.META_MODEL_API_BASE_URL = 'https://example.meta/v1';
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { generateText } = require('@/lib/ai-provider');

    await expect(
      generateText({
        messages: [{ role: 'user', content: 'hello' }],
      }),
    ).rejects.toThrow(/OpenAI API key not configured|AI_API_KEY/);
  });
});

describe('clinical-ai-guards', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const guards = require('@/backend/lib/clinical-ai-guards') as typeof import('@/backend/lib/clinical-ai-guards');

  it('rejects invalid base64 image without debit path', () => {
    expect(() =>
      guards.assertImageDataUrlWithinLimit('data:image/png;base64,!!!'),
    ).toThrow(guards.ClinicalGuardError);
  });

  it('rejects decoded image larger than 2MB', () => {
    const bytes = Buffer.alloc(2 * 1024 * 1024 + 16, 1);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    expect(() => guards.assertImageDataUrlWithinLimit(dataUrl)).toThrow(
      /maximum size/i,
    );
  });

  it('accepts small valid base64 image', () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    expect(guards.assertImageDataUrlWithinLimit(dataUrl)).toBe(bytes.length);
  });

  it('assertUserTextWithinLimit rejects oversize text', () => {
    const long = 'x'.repeat(guards.CLINICAL_AI_LIMITS.follow_up.maxUserChars + 1);
    expect(() =>
      guards.assertUserTextWithinLimit(long, 'follow_up'),
    ).toThrow(guards.ClinicalGuardError);
  });

  it('createClinicalAbortBundle timeout cause is timeout not client', async () => {
    const bundle = guards.createClinicalAbortBundle({ timeoutMs: 20 });
    await new Promise((r) => setTimeout(r, 40));
    expect(bundle.signal.aborted).toBe(true);
    expect(bundle.getCause()).toBe('timeout');
    bundle.cleanup();
  });

  it('createClinicalAbortBundle client abort wins over timeout', async () => {
    const request = new AbortController();
    const bundle = guards.createClinicalAbortBundle({
      requestSignal: request.signal,
      timeoutMs: 5_000,
    });
    request.abort();
    expect(bundle.getCause()).toBe('client');
    bundle.cleanup();
  });
});

describe('eas clinical production flag', () => {
  it('production and development keep Clinical OFF; internal ON', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const eas = require('../../eas.json');
    expect(eas.build.production.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED).toBe(
      'false',
    );
    expect(eas.build.development.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED).toBe(
      'false',
    );
    expect(eas.build.internal.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED).toBe(
      'true',
    );
  });
});

describe('health split', () => {
  afterEach(() => {
    restoreEnv();
    jest.resetModules();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('jose', () => ({}));
    jest.doMock('@/backend/lib/health-supabase', () => ({
      probeSupabaseServiceRole: async () => ({ ok: true }),
    }));
    jest.doMock('@/backend/trpc/rate-limit-store', () => ({
      isDistributedRateLimitConfigured: () => false,
      probeRateLimitRedis: async () => false,
    }));
    jest.doMock('@/backend/webhooks/revenuecat-webhook', () => ({
      registerRevenueCatWebhookRoutes: () => undefined,
    }));
    jest.doMock('@/backend/auth/session-routes', () => ({
      registerAuthSessionRoutes: () => undefined,
    }));
    jest.doMock('@/backend/clinical-stream', () => ({
      registerClinicalStreamRoutes: () => undefined,
    }));
    jest.doMock('@/backend/trpc/app-router', () => ({
      appRouter: {},
    }));
    jest.doMock('@hono/trpc-server', () => ({
      trpcServer: () => async (_c: unknown, next: () => Promise<void>) => next(),
    }));
  });

  it('public /health does not expose provider keys or model URLs', async () => {
    process.env.AI_PROVIDER = 'muse';
    process.env.META_MODEL_API_KEY = 'secret-meta';
    process.env.META_MODEL_API_BASE_URL = 'https://secret.example/v1';
    process.env.CLINICAL_COPILOT_ENABLED = 'false';
    process.env.INTERNAL_HEALTH_SECRET = 'ready-secret';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('@/backend/hono').default as Hono;

    const res = await app.request('http://localhost/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body.clinicalCopilotEnabled).toBe(false);
    expect(body).not.toHaveProperty('aiProvider');
    expect(body).not.toHaveProperty('hasMetaModelApiKey');
    expect(JSON.stringify(body)).not.toContain('secret-meta');
    expect(JSON.stringify(body)).not.toContain('secret.example');
  });

  it('/health/ready requires secret and returns provider booleans only', async () => {
    process.env.AI_PROVIDER = 'muse';
    process.env.META_MODEL_API_KEY = 'secret-meta';
    process.env.INTERNAL_HEALTH_SECRET = 'ready-secret';
    process.env.CLINICAL_COPILOT_ENABLED = 'true';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('@/backend/hono').default as Hono;

    const denied = await app.request('http://localhost/health/ready');
    expect(denied.status).toBe(401);

    const ok = await app.request('http://localhost/health/ready', {
      headers: { Authorization: 'Bearer ready-secret' },
    });
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as Record<string, unknown>;
    expect(body.aiProvider).toBe('muse');
    expect(body.hasMetaModelApiKey).toBe(true);
    expect(body.clinicalCopilotEnabled).toBe(true);
    expect(body.redisConfigured).toBe(false);
    expect(body.redisReady).toBe(false);
    expect(typeof body.supabaseConfigured).toBe('boolean');
    expect(typeof body.supabaseReady).toBe('boolean');
    expect(JSON.stringify(body)).not.toContain('secret-meta');
  });
});

describe('stream abort vs timeout refund policy helpers', () => {
  it('documents credit policy matrix in guard helpers', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClinicalAbortBundle } =
      require('@/backend/lib/clinical-ai-guards');
    const client = new AbortController();
    const bundle = createClinicalAbortBundle({
      requestSignal: client.signal,
      timeoutMs: 60_000,
    });
    // before abort
    expect(bundle.getCause()).toBe('none');
    client.abort();
    expect(bundle.getCause()).toBe('client');
    bundle.cleanup();
  });
});
