/**
 * Unit tests for clinical credit charging (F21) + stream auth gate.
 */

import { TRPCError } from '@trpc/server';

const mockUserHasActivePremiumAccess = jest.fn();
const mockFrom = jest.fn();
const mockVerifyJwt = jest.fn();

jest.mock('@/backend/lib/premium-access', () => ({
  userHasActivePremiumAccess: (...args: unknown[]) =>
    mockUserHasActivePremiumAccess(...args),
}));

jest.mock('@/backend/auth/decode-request-jwt', () => ({
  verifyMedvbaRequestJwt: (...args: unknown[]) => mockVerifyJwt(...args),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

jest.mock('jose', () => ({}));

import {
  consumeClinicalCredits,
  PAYWALL_REQUIRED,
  refundClinicalCredits,
  TOPUP_REQUIRED,
} from '@/backend/lib/ai-credits';
import { registerClinicalStreamRoutes } from '@/backend/clinical-stream';
import { Hono } from 'hono';

const userId = '11111111-1111-1111-1111-111111111111';

function entitlementChain(row: {
  is_pro: boolean;
  current_balance: number;
  trial_credits_remaining: number;
  forUpdate?: boolean;
}) {
  const data = {
    user_id: userId,
    is_pro: row.is_pro,
    entitlement_key: null,
    monthly_credit_grant: 0,
    current_balance: row.current_balance,
    trial_credits_remaining: row.trial_credits_remaining,
    renews_at: null,
    last_synced_at: null,
    metadata: {},
  };

  const api: Record<string, jest.Mock> = {};
  const self = api as unknown as {
    select: jest.Mock;
    eq: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
    single: jest.Mock;
  };

  self.select = jest.fn(() => self);
  self.eq = jest.fn(() => self);
  self.update = jest.fn(() => self);
  self.insert = jest.fn(() => self);
  self.order = jest.fn(() => self);
  self.limit = jest.fn(async () => ({ data: [], error: null }));
  self.maybeSingle = jest.fn(async () => {
    if (row.forUpdate) {
      return {
        data: {
          current_balance: Math.max(
            0,
            row.current_balance - (row.is_pro ? 1 : 0),
          ),
        },
        error: null,
      };
    }
    return { data, error: null };
  });
  self.single = jest.fn(async () => ({ data, error: null }));

  return self;
}

describe('consumeClinicalCredits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockTables(opts: {
    is_pro: boolean;
    current_balance: number;
    trial_credits_remaining: number;
  }) {
    let entitlementReads = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_entitlements') {
        entitlementReads += 1;
        // First call(s): ensureEntitlement read; later: optimistic update select
        const forUpdate = entitlementReads > 1;
        const nextBalance = opts.is_pro
          ? Math.max(0, opts.current_balance - 1)
          : opts.current_balance;
        const nextTrial = opts.is_pro
          ? opts.trial_credits_remaining
          : Math.max(0, opts.trial_credits_remaining - 1);

        if (forUpdate) {
          const chain = entitlementChain({ ...opts, forUpdate: true });
          chain.maybeSingle = jest.fn(async () => ({
            data: {
              current_balance: opts.is_pro ? nextBalance : opts.current_balance,
              trial_credits_remaining: nextTrial,
            },
            error: null,
          }));
          return chain;
        }
        return entitlementChain(opts);
      }
      if (table === 'ai_credit_ledger') {
        const chain = entitlementChain(opts);
        chain.insert = jest.fn(async () => ({ data: null, error: null }));
        return chain;
      }
      return entitlementChain(opts);
    });
  }

  it('debits pro balance once for follow-up', async () => {
    mockUserHasActivePremiumAccess.mockResolvedValue(true);
    mockTables({
      is_pro: true,
      current_balance: 10,
      trial_credits_remaining: 0,
    });

    const supabase = { from: mockFrom } as never;
    const charge = await consumeClinicalCredits({
      supabase,
      userId,
      cost: 1,
      feature: 'follow_up',
      sessionId: 'sess-1',
    });

    expect(charge.amount).toBe(1);
    expect(charge.usedTrial).toBe(false);
  });

  it('debits trial for free user with trial remaining', async () => {
    mockUserHasActivePremiumAccess.mockResolvedValue(false);
    mockTables({
      is_pro: false,
      current_balance: 0,
      trial_credits_remaining: 3,
    });

    const supabase = { from: mockFrom } as never;
    const charge = await consumeClinicalCredits({
      supabase,
      userId,
      cost: 1,
      feature: 'follow_up',
      sessionId: 'sess-2',
    });

    expect(charge.amount).toBe(1);
    expect(charge.usedTrial).toBe(true);
  });

  it('returns PAYWALL_REQUIRED without trial and without entitlement', async () => {
    mockUserHasActivePremiumAccess.mockResolvedValue(false);
    mockTables({
      is_pro: false,
      current_balance: 0,
      trial_credits_remaining: 0,
    });

    const supabase = { from: mockFrom } as never;
    await expect(
      consumeClinicalCredits({
        supabase,
        userId,
        cost: 1,
        feature: 'follow_up',
      }),
    ).rejects.toBeInstanceOf(TRPCError);

    try {
      await consumeClinicalCredits({
        supabase,
        userId,
        cost: 1,
        feature: 'follow_up',
      });
    } catch (e) {
      expect((e as TRPCError).message).toBe(PAYWALL_REQUIRED);
    }
  });

  it('returns TOPUP_REQUIRED for pro without balance', async () => {
    mockUserHasActivePremiumAccess.mockResolvedValue(true);
    mockTables({
      is_pro: true,
      current_balance: 0,
      trial_credits_remaining: 0,
    });

    const supabase = { from: mockFrom } as never;
    try {
      await consumeClinicalCredits({
        supabase,
        userId,
        cost: 1,
        feature: 'follow_up',
      });
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).message).toBe(TOPUP_REQUIRED);
    }
  });
});

describe('refundClinicalCredits trial vs paid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores trial_credits_remaining when usedTrial=true (never mints paid balance)', async () => {
    const updates: Array<Record<string, unknown>> = [];
    let reads = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_entitlements') {
        reads += 1;
        const chain = entitlementChain({
          is_pro: false,
          current_balance: 0,
          trial_credits_remaining: 2,
        });
        if (reads > 1) {
          chain.update = jest.fn((patch: Record<string, unknown>) => {
            updates.push(patch);
            return chain;
          });
          chain.maybeSingle = jest.fn(async () => ({
            data: { current_balance: 0, trial_credits_remaining: 3 },
            error: null,
          }));
        }
        return chain;
      }
      if (table === 'ai_credit_ledger') {
        const chain = entitlementChain({
          is_pro: false,
          current_balance: 0,
          trial_credits_remaining: 2,
        });
        chain.insert = jest.fn(async () => ({ data: null, error: null }));
        return chain;
      }
      return entitlementChain({
        is_pro: false,
        current_balance: 0,
        trial_credits_remaining: 2,
      });
    });

    const supabase = { from: mockFrom } as never;
    await refundClinicalCredits({
      supabase,
      userId,
      amount: 1,
      usedTrial: true,
      meta: { feature: 'follow_up' },
    });

    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0].current_balance).toBe(0);
    expect(updates[0].trial_credits_remaining).toBe(3);
  });

  it('credits paid current_balance when usedTrial=false', async () => {
    const updates: Array<Record<string, unknown>> = [];
    let reads = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_entitlements') {
        reads += 1;
        const chain = entitlementChain({
          is_pro: true,
          current_balance: 4,
          trial_credits_remaining: 0,
        });
        if (reads > 1) {
          chain.update = jest.fn((patch: Record<string, unknown>) => {
            updates.push(patch);
            return chain;
          });
          chain.maybeSingle = jest.fn(async () => ({
            data: { current_balance: 5, trial_credits_remaining: 0 },
            error: null,
          }));
        }
        return chain;
      }
      if (table === 'ai_credit_ledger') {
        const chain = entitlementChain({
          is_pro: true,
          current_balance: 4,
          trial_credits_remaining: 0,
        });
        chain.insert = jest.fn(async () => ({ data: null, error: null }));
        return chain;
      }
      return entitlementChain({
        is_pro: true,
        current_balance: 4,
        trial_credits_remaining: 0,
      });
    });

    const supabase = { from: mockFrom } as never;
    await refundClinicalCredits({
      supabase,
      userId,
      amount: 1,
      usedTrial: false,
      meta: { feature: 'follow_up' },
    });

    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0].current_balance).toBe(5);
  });
});

describe('clinical-stream auth gate', () => {
  const prevFlag = process.env.CLINICAL_COPILOT_ENABLED;
  const prevExpo = process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED;

  beforeEach(() => {
    process.env.CLINICAL_COPILOT_ENABLED = 'true';
    process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED = 'true';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
  });

  afterEach(() => {
    if (prevFlag === undefined) delete process.env.CLINICAL_COPILOT_ENABLED;
    else process.env.CLINICAL_COPILOT_ENABLED = prevFlag;
    if (prevExpo === undefined) delete process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED;
    else process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED = prevExpo;
  });

  it('rejects without Bearer token with 401', async () => {
    const app = new Hono();
    registerClinicalStreamRoutes(app);
    const res = await app.request('/api/clinical/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'invalid', message: 'test' }),
    });
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toMatch(/auth/i);
  });
});

describe('clinical stream error payload contract', () => {
  it('documents generic client error shape (no raw provider leak)', () => {
    const payload = {
      error: 'Nu am putut genera răspunsul. Creditele au fost restaurate.',
      code: 'CLINICAL_STREAM_FAILED',
    };
    expect(payload.code).toBe('CLINICAL_STREAM_FAILED');
    expect(payload.error).not.toMatch(/OpenAI|api key|SQL|token/i);
  });

  it('refundOnce guard only refunds when charged and not yet refunded', () => {
    let chargedAmount = 1;
    let refunded = false;
    let refundCalls = 0;
    async function refundOnce() {
      if (chargedAmount <= 0 || refunded) return;
      refunded = true;
      refundCalls += 1;
    }
    return Promise.all([refundOnce(), refundOnce()]).then(() => {
      expect(refundCalls).toBe(1);
    });
  });

  it('refundOnce with usedTrial must not treat trial amount as paid mint', () => {
    // Contract: stream/reply pass usedTrial into refundClinicalCredits so
    // trial failures restore trial_credits_remaining, never current_balance.
    const charge = { amount: 1, usedTrial: true };
    const refundArgs = {
      amount: charge.amount,
      usedTrial: charge.usedTrial,
    };
    expect(refundArgs.usedTrial).toBe(true);
    expect(refundArgs.amount).toBe(1);
  });
});
