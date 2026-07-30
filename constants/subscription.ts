/** Free quiz answers per calendar day before paywall (one pool across all chapters; resets at local midnight). */
export const FREE_QUIZ_ANSWER_LIMIT = 10;

/** Free AI tutor messages per rolling 24h window (`ai_question_usage` on server; keep in sync with backend). */
export const FREE_AI_LIMIT = 10;

/** Alias for clarity in UI copy and docs. */
export const FREE_DAILY_QUIZ_LIMIT = FREE_QUIZ_ANSWER_LIMIT;

/** Entitlement identifier in RevenueCat dashboard — live legacy id. Prefer checking both via hasProAi(). */
export const ENTITLEMENT_ID = 'pro';
/** New Clinical / Pro AI entitlement (also accept legacy `pro`). */
export const PRO_AI_ENTITLEMENT_ID = 'medvba_pro_ai';

/** Package identifiers for Monthly and Yearly products */
export const PACKAGE_MONTHLY = 'monthly';
export const PACKAGE_YEARLY = 'yearly';

/** i18n keys for free-tier feature bullets (`getFreeFeatureLines` + `useLanguage().t`). */
export const FREE_FEATURE_KEYS = [
  'subscription.freeFeature1',
  'subscription.freeFeature2',
  'subscription.freeFeature3',
  'subscription.freeFeature4',
] as const;

export type FreeFeatureKey = (typeof FREE_FEATURE_KEYS)[number];

/** Resolved free-tier bullet strings for the current locale. */
export function getFreeFeatureLines(t: (key: string) => string): string[] {
  const count = String(FREE_QUIZ_ANSWER_LIMIT);
  return FREE_FEATURE_KEYS.map((key) => t(key).replace(/\{count\}/g, count));
}

export const PREMIUM_FEATURE_KEYS = [
  'premium.feature1',
  'premium.feature2',
  'premium.feature3',
  'premium.feature4',
  'premium.feature5',
  'premium.feature6',
  'premium.feature7',
  'premium.feature8',
  'premium.feature9',
];

export const PRICING = {
  monthly: {
    price: '50 RON',
    priceValue: 50,
    period: 'lună',
    description: 'Facturat lunar',
  },
  yearly: {
    price: '500 RON',
    priceValue: 500,
    period: 'an',
    description: 'Facturat anual',
    savings: '17%',
    savingsText: 'Economisești 17% (100 RON/an)',
  },
};
