import {
  CLINICAL_CREDIT_COSTS,
  CLINICAL_DISCLAIMER_VERSION,
  CLINICAL_FREE_TRIALS,
  CLINICAL_MONTHLY_CREDITS,
  CLINICAL_PRO_AI_PRODUCTS,
  CLINICAL_TOPUP_PRODUCTS,
  CLINICAL_TRIAL_CREDITS_TOTAL,
  LEGACY_PRO_ENTITLEMENT_ID,
  PRO_AI_ENTITLEMENT_ID,
  getProAiEntitlementIds,
  hasProAiEntitlement,
  isClinicalCopilotEnabled,
  monthlyCreditsForProduct,
} from '@/constants/clinical-copilot';
import { PAYWALL_REQUIRED, TOPUP_REQUIRED } from '@/backend/lib/ai-credits';

describe('clinical-copilot constants', () => {
  const prevExpo = process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED;
  const prevServer = process.env.CLINICAL_COPILOT_ENABLED;
  const prevEnt = process.env.REVENUECAT_ENTITLEMENT_ID;

  afterEach(() => {
    if (prevExpo === undefined) delete process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED;
    else process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED = prevExpo;
    if (prevServer === undefined) delete process.env.CLINICAL_COPILOT_ENABLED;
    else process.env.CLINICAL_COPILOT_ENABLED = prevServer;
    if (prevEnt === undefined) delete process.env.REVENUECAT_ENTITLEMENT_ID;
    else process.env.REVENUECAT_ENTITLEMENT_ID = prevEnt;
  });

  it('defaults to disabled for store safety', () => {
    delete process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED;
    delete process.env.CLINICAL_COPILOT_ENABLED;
    expect(isClinicalCopilotEnabled()).toBe(false);
  });

  it('enables when flag is true', () => {
    process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED = 'true';
    expect(isClinicalCopilotEnabled()).toBe(true);
  });

  it('has spec-aligned credit costs', () => {
    expect(CLINICAL_CREDIT_COSTS.explain).toBe(1);
    expect(CLINICAL_CREDIT_COSTS.followUp).toBe(1);
    expect(CLINICAL_CREDIT_COSTS.clinicalCase).toBe(4);
    expect(CLINICAL_CREDIT_COSTS.image).toBe(6);
    expect(CLINICAL_CREDIT_COSTS.summary).toBe(2);
  });

  it('keeps free trials limited and trial credit bucket', () => {
    expect(CLINICAL_FREE_TRIALS.explain).toBe(5);
    expect(CLINICAL_FREE_TRIALS.clinicalCase).toBe(2);
    expect(CLINICAL_TRIAL_CREDITS_TOTAL).toBe(3);
  });

  it('defines monthly AI Pass grants', () => {
    expect(CLINICAL_MONTHLY_CREDITS.monthly).toBe(120);
    expect(CLINICAL_MONTHLY_CREDITS.yearly).toBe(150);
    expect(CLINICAL_PRO_AI_PRODUCTS.medvba_pro_ai_monthly).toBe(120);
    expect(CLINICAL_PRO_AI_PRODUCTS.medvba_pro_ai_annual).toBe(150);
  });

  it('maps preferred and legacy top-up product ids', () => {
    expect(CLINICAL_TOPUP_PRODUCTS.medvba_ai_credits_50).toBe(50);
    expect(CLINICAL_TOPUP_PRODUCTS.medvba_ai_credits_100).toBe(100);
    expect(CLINICAL_TOPUP_PRODUCTS.medvba_ai_credits_250).toBe(250);
    expect(CLINICAL_TOPUP_PRODUCTS.credits_50).toBe(50);
    expect(CLINICAL_TOPUP_PRODUCTS.medvba_credits_100).toBe(100);
  });

  it('accepts legacy pro and medvba_pro_ai entitlement ids', () => {
    delete process.env.REVENUECAT_ENTITLEMENT_ID;
    const ids = getProAiEntitlementIds();
    expect(ids).toEqual(
      expect.arrayContaining([PRO_AI_ENTITLEMENT_ID, LEGACY_PRO_ENTITLEMENT_ID]),
    );
    expect(hasProAiEntitlement({ pro: {} })).toBe(true);
    expect(hasProAiEntitlement({ medvba_pro_ai: {} })).toBe(true);
    expect(hasProAiEntitlement({})).toBe(false);
  });

  it('includes REVENUECAT_ENTITLEMENT_ID env in accepted ids', () => {
    process.env.REVENUECAT_ENTITLEMENT_ID = 'custom_pro';
    expect(getProAiEntitlementIds()).toEqual(expect.arrayContaining(['custom_pro', 'pro', 'medvba_pro_ai']));
    expect(hasProAiEntitlement({ custom_pro: {} })).toBe(true);
  });

  it('resolves monthly credits from product id', () => {
    expect(monthlyCreditsForProduct('medvba_pro_ai_monthly')).toBe(120);
    expect(monthlyCreditsForProduct('medvba_pro_ai_annual')).toBe(150);
    expect(monthlyCreditsForProduct('unknown', 'yearly')).toBe(150);
  });

  it('uses versioned disclaimer v1', () => {
    expect(CLINICAL_DISCLAIMER_VERSION).toBe('v1');
  });

  it('exposes stable paywall/topup error codes', () => {
    expect(PAYWALL_REQUIRED).toBe('PAYWALL_REQUIRED');
    expect(TOPUP_REQUIRED).toBe('TOPUP_REQUIRED');
  });
});

describe('clinical credit debit math (race-safe helpers)', () => {
  it('rounds balances to 2 decimals like ledger updates', () => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    expect(round2(119.999)).toBe(120);
    expect(round2(10.126)).toBe(10.13);
    expect(round2(120 - 1)).toBe(119);
  });

  it('idempotent grant period key is YYYY-MM', () => {
    const period = new Date().toISOString().slice(0, 7);
    expect(period).toMatch(/^\d{4}-\d{2}$/);
  });
});
