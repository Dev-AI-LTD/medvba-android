/**
 * Clinical Copilot constants.
 * Classic Tutor (tutor.chat + ai_question_usage) is unchanged for live store users.
 * Clinical features are gated by EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED / CLINICAL_COPILOT_ENABLED.
 */

/** Client + server: off by default so store builds stay unchanged until opt-in. */
export function isClinicalCopilotEnabled(): boolean {
  const raw =
    process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED ??
    process.env.CLINICAL_COPILOT_ENABLED ??
    'false';
  return String(raw).trim().toLowerCase() === 'true' || String(raw).trim() === '1';
}

/** Credit costs (spec-aligned). */
export const CLINICAL_CREDIT_COSTS = {
  explain: 1,
  followUp: 1,
  clinicalCase: 4,
  image: 6,
  summary: 2,
} as const;

/** Free trial credits total (entitlements.trial_credits_remaining). */
export const CLINICAL_TRIAL_CREDITS_TOTAL = 3;

/** Free trials by feature count (legacy UI); trial bucket is preferred. */
export const CLINICAL_FREE_TRIALS = {
  explain: 5,
  clinicalCase: 2,
} as const;

export const CLINICAL_DISCLAIMER_VERSION = 'v1';

/** Canonical Pro AI entitlement (new). Live store may still use legacy `pro`. */
export const PRO_AI_ENTITLEMENT_ID = 'medvba_pro_ai';
export const LEGACY_PRO_ENTITLEMENT_ID = 'pro';

/**
 * Entitlement ids that unlock Premium / Pro AI.
 * Prefer REVENUECAT_ENTITLEMENT_ID when set; always accept both live legacy + new ids.
 */
export function getProAiEntitlementIds(): string[] {
  const fromEnv =
    process.env.REVENUECAT_ENTITLEMENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() ||
    '';
  const ids = new Set<string>([PRO_AI_ENTITLEMENT_ID, LEGACY_PRO_ENTITLEMENT_ID]);
  if (fromEnv) ids.add(fromEnv);
  return Array.from(ids);
}

/** True if any configured Pro / Pro AI entitlement is active. */
export function hasProAiEntitlement(
  active: Record<string, unknown> | null | undefined,
): boolean {
  if (!active) return false;
  return getProAiEntitlementIds().some((id) => Boolean(active[id]));
}

/** Pick the preferred entitlement key to store on ai_entitlements. */
export function resolveProAiEntitlementKey(
  active: Record<string, unknown> | null | undefined,
): string {
  if (active?.[PRO_AI_ENTITLEMENT_ID]) return PRO_AI_ENTITLEMENT_ID;
  if (active?.[LEGACY_PRO_ENTITLEMENT_ID]) return LEGACY_PRO_ENTITLEMENT_ID;
  const fromEnv = process.env.REVENUECAT_ENTITLEMENT_ID?.trim();
  if (fromEnv && active?.[fromEnv]) return fromEnv;
  return PRO_AI_ENTITLEMENT_ID;
}

/** Subscription product ids → monthly credit grant amount. */
export const CLINICAL_PRO_AI_PRODUCTS: Record<string, number> = {
  medvba_pro_ai_monthly: 120,
  medvba_pro_ai_annual: 150,
  // Common RC / store aliases
  monthly: 120,
  yearly: 150,
  annual: 150,
  $rc_monthly: 120,
  $rc_annual: 150,
};

/** Monthly AI Pass grants when Pro entitlement is active. */
export const CLINICAL_MONTHLY_CREDITS = {
  monthly: 120,
  yearly: 150,
} as const;

/**
 * RevenueCat package / product ids for top-ups (prefer medvba_ai_credits_*).
 * Keep legacy aliases so existing RC offerings keep working.
 */
export const CLINICAL_TOPUP_PACKAGE_IDS = [
  'medvba_ai_credits_50',
  'medvba_ai_credits_100',
  'medvba_ai_credits_250',
  'medvba_credits_50',
  'medvba_credits_100',
  'medvba_credits_250',
  'credits_50',
  'credits_100',
  'credits_250',
] as const;

/** RevenueCat consumable product id → credit amount. */
export const CLINICAL_TOPUP_PRODUCTS: Record<string, number> = {
  medvba_ai_credits_50: 50,
  medvba_ai_credits_100: 100,
  medvba_ai_credits_250: 250,
  medvba_credits_50: 50,
  medvba_credits_100: 100,
  medvba_credits_250: 250,
  credits_50: 50,
  credits_100: 100,
  credits_250: 250,
};

/** Resolve monthly grant amount from a subscription product id. */
export function monthlyCreditsForProduct(
  productId: string | undefined | null,
  planHint?: 'monthly' | 'yearly',
): number {
  const pid = String(productId ?? '').trim();
  if (pid && CLINICAL_PRO_AI_PRODUCTS[pid] != null) {
    return CLINICAL_PRO_AI_PRODUCTS[pid];
  }
  const lower = pid.toLowerCase();
  if (
    lower.includes('annual') ||
    lower.includes('year') ||
    lower.includes('yearly') ||
    planHint === 'yearly'
  ) {
    return CLINICAL_MONTHLY_CREDITS.yearly;
  }
  return CLINICAL_MONTHLY_CREDITS.monthly;
}

export function inferSubscriptionPlan(
  productId: string | undefined | null,
): 'monthly' | 'yearly' {
  const p = String(productId ?? '').toLowerCase();
  if (
    p.includes('annual') ||
    p.includes('year') ||
    p.includes('yearly') ||
    p === '$rc_annual'
  ) {
    return 'yearly';
  }
  return 'monthly';
}

export const CLINICAL_CASE_TOPICS = [
  'chest_pain',
  'acute_abdomen',
  'neuro',
  'pediatrics',
  'gyn',
] as const;

export type ClinicalCaseTopic = (typeof CLINICAL_CASE_TOPICS)[number];

export const CLINICAL_DISCLAIMER_EN =
  'Educational / simulated content only. Does not replace professional medical diagnosis or care.';

export const CLINICAL_DISCLAIMER_RO =
  'Conținut educațional/simulat. Nu înlocuiește un diagnostic medical profesional.';
