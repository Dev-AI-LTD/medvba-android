/**
 * Clinical Copilot credits: ai_entitlements cache + append-only ledger.
 * Does not touch ai_question_usage (classic Tutor free limit).
 */

import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CLINICAL_FREE_TRIALS,
  CLINICAL_TOPUP_PRODUCTS,
  CLINICAL_TRIAL_CREDITS_TOTAL,
  PRO_AI_ENTITLEMENT_ID,
  inferSubscriptionPlan,
  monthlyCreditsForProduct,
} from '../../constants/clinical-copilot';
import { userHasActivePremiumAccess } from './premium-access';

export type CreditReason =
  | 'grant_monthly'
  | 'monthly_grant'
  | 'trial'
  | 'trial_grant'
  | 'consume'
  | 'usage_debit'
  | 'topup'
  | 'topup_purchase'
  | 'refund'
  | 'admin_adjustment'
  | 'reserve'
  | 'release';

export const PAYWALL_REQUIRED = 'PAYWALL_REQUIRED';
export const TOPUP_REQUIRED = 'TOPUP_REQUIRED';

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type EntitlementRow = {
  user_id: string;
  is_pro: boolean;
  entitlement_key: string | null;
  monthly_credit_grant: number;
  current_balance: number;
  trial_credits_remaining: number;
  renews_at: string | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
};

async function ensureEntitlement(
  supabase: SupabaseClient,
  userId: string,
): Promise<EntitlementRow> {
  const { data, error } = await supabase
    .from('ai_entitlements')
    .select(
      'user_id, is_pro, entitlement_key, monthly_credit_grant, current_balance, trial_credits_remaining, renews_at, last_synced_at, metadata',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[ai-credits] entitlement read failed:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to read AI entitlements',
    });
  }

  if (data) {
    return {
      ...data,
      current_balance: toNum(data.current_balance),
      trial_credits_remaining: toNum(data.trial_credits_remaining),
      monthly_credit_grant: toNum(data.monthly_credit_grant),
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
    };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('ai_entitlements')
    .insert({
      user_id: userId,
      is_pro: false,
      current_balance: 0,
      trial_credits_remaining: CLINICAL_TRIAL_CREDITS_TOTAL,
      monthly_credit_grant: 0,
      metadata: {},
    })
    .select(
      'user_id, is_pro, entitlement_key, monthly_credit_grant, current_balance, trial_credits_remaining, renews_at, last_synced_at, metadata',
    )
    .single();

  if (insertErr || !inserted) {
    // Race: another writer created the row
    const { data: retry } = await supabase
      .from('ai_entitlements')
      .select(
        'user_id, is_pro, entitlement_key, monthly_credit_grant, current_balance, trial_credits_remaining, renews_at, last_synced_at, metadata',
      )
      .eq('user_id', userId)
      .maybeSingle();
    if (retry) {
      return {
        ...retry,
        current_balance: toNum(retry.current_balance),
        trial_credits_remaining: toNum(retry.trial_credits_remaining),
        monthly_credit_grant: toNum(retry.monthly_credit_grant),
        metadata: (retry.metadata ?? {}) as Record<string, unknown>,
      };
    }
    console.error('[ai-credits] entitlement create failed:', insertErr);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to initialize AI entitlements',
    });
  }

  return {
    ...inserted,
    current_balance: toNum(inserted.current_balance),
    trial_credits_remaining: toNum(inserted.trial_credits_remaining),
    monthly_credit_grant: toNum(inserted.monthly_credit_grant),
    metadata: (inserted.metadata ?? {}) as Record<string, unknown>,
  };
}

export async function getCreditBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const ent = await ensureEntitlement(supabase, userId);
  return round2(ent.current_balance);
}

export async function getEntitlementStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  balance: number;
  isPro: boolean;
  trialCreditsRemaining: number;
  renewsAt: string | null;
  monthlyCreditGrant: number;
}> {
  const ent = await ensureEntitlement(supabase, userId);
  return {
    balance: round2(ent.current_balance),
    isPro: !!ent.is_pro,
    trialCreditsRemaining: round2(ent.trial_credits_remaining),
    renewsAt: ent.renews_at,
    monthlyCreditGrant: round2(ent.monthly_credit_grant),
  };
}

/**
 * Apply delta to entitlements + ledger in a logical transaction
 * (read → update entitlement → insert ledger). Optimistic concurrency on balance.
 */
async function applyBalanceDelta(
  supabase: SupabaseClient,
  params: {
    userId: string;
    delta: number;
    reason: CreditReason;
    sessionId?: string | null;
    meta?: Record<string, unknown>;
    revenuecatTransactionId?: string | null;
    note?: string | null;
    trialDelta?: number;
    allowNegative?: boolean;
  },
): Promise<number> {
  const maxAttempts = 3;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ent = await ensureEntitlement(supabase, params.userId);
    const prevBalance = round2(ent.current_balance);
    const prevTrial = round2(ent.trial_credits_remaining);
    const nextBalance = round2(prevBalance + params.delta);
    const nextTrial =
      params.trialDelta !== undefined
        ? round2(prevTrial + params.trialDelta)
        : prevTrial;

    if (!params.allowNegative && nextBalance < -0.001 && params.delta < 0) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: TOPUP_REQUIRED,
      });
    }

    const { data: updated, error: updErr } = await supabase
      .from('ai_entitlements')
      .update({
        current_balance: Math.max(0, nextBalance),
        trial_credits_remaining: Math.max(0, nextTrial),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId)
      .eq('current_balance', ent.current_balance)
      .select('current_balance')
      .maybeSingle();

    if (updErr) {
      lastErr = updErr;
      continue;
    }
    if (!updated) {
      // concurrent update — retry
      continue;
    }

    const balanceAfter = round2(toNum(updated.current_balance));
    const { error: ledErr } = await supabase.from('ai_credit_ledger').insert({
      user_id: params.userId,
      delta: params.delta,
      balance_after: balanceAfter,
      reason: params.reason,
      session_id: params.sessionId ?? null,
      meta: params.meta ?? {},
      revenuecat_transaction_id: params.revenuecatTransactionId ?? null,
      note: params.note ?? null,
    });

    if (ledErr) {
      // Best-effort rollback of entitlement to previous balance
      await supabase
        .from('ai_entitlements')
        .update({
          current_balance: prevBalance,
          trial_credits_remaining: prevTrial,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', params.userId);
      console.error('[ai-credits] ledger insert failed:', ledErr);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record AI credits',
      });
    }

    return balanceAfter;
  }

  console.error('[ai-credits] concurrent update exhausted:', lastErr);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to update AI credit balance',
  });
}

export async function countTrialUses(
  supabase: SupabaseClient,
  userId: string,
  feature: 'explain' | 'clinical_case',
): Promise<number> {
  const { data, error } = await supabase
    .from('ai_credit_ledger')
    .select('id, meta')
    .eq('user_id', userId)
    .in('reason', ['trial', 'trial_grant']);

  if (error) {
    console.error('[ai-credits] trial count failed:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify clinical trial usage',
    });
  }

  return (data ?? []).filter((row) => {
    const meta = (row.meta ?? {}) as { feature?: string };
    return meta.feature === feature;
  }).length;
}

/**
 * Charge credits for a clinical feature, or consume trial credits / free slots.
 * Entitlement is resolved server-side — callers must not pass isPremium.
 */
export async function consumeClinicalCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  cost: number;
  feature: 'explain' | 'clinical_case' | 'image' | 'summary' | 'follow_up';
  sessionId?: string | null;
}): Promise<{ amount: number; usedTrial: boolean; balanceAfter: number }> {
  const { supabase, userId, cost, feature, sessionId } = params;
  const ent = await ensureEntitlement(supabase, userId);
  const premiumAccess = await userHasActivePremiumAccess(supabase, userId);
  const effectivePro = premiumAccess || ent.is_pro;

  // Prefer trial_credits_remaining bucket for non-pro (any clinical feature)
  if (!effectivePro) {
    if (ent.trial_credits_remaining + 1e-9 >= cost) {
      const balanceAfter = await applyBalanceDelta(supabase, {
        userId,
        delta: 0,
        trialDelta: -cost,
        reason: 'trial_grant',
        sessionId,
        meta: { feature, cost, from: 'trial_credits_remaining' },
      });
      return { amount: cost, usedTrial: true, balanceAfter };
    }

    // Legacy per-feature trial counts if trial bucket empty
    if (feature === 'explain' || feature === 'clinical_case') {
      const used = await countTrialUses(supabase, userId, feature);
      const max =
        feature === 'explain'
          ? CLINICAL_FREE_TRIALS.explain
          : CLINICAL_FREE_TRIALS.clinicalCase;
      if (used < max) {
        const balanceAfter = await applyBalanceDelta(supabase, {
          userId,
          delta: 0,
          reason: 'trial',
          sessionId,
          meta: { feature, trialIndex: used + 1, legacy: true },
        });
        return { amount: cost, usedTrial: true, balanceAfter };
      }
    }

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: PAYWALL_REQUIRED,
    });
  }

  if (ent.current_balance + 1e-9 < cost) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: TOPUP_REQUIRED,
    });
  }

  const balanceAfter = await applyBalanceDelta(supabase, {
    userId,
    delta: -cost,
    reason: 'usage_debit',
    sessionId,
    meta: { feature, cost },
  });

  return { amount: cost, usedTrial: false, balanceAfter };
}

export async function refundClinicalCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  amount: number;
  sessionId?: string | null;
  meta?: Record<string, unknown>;
  /** When true, restore trial_credits_remaining — never mint paid current_balance. */
  usedTrial?: boolean;
}): Promise<void> {
  if (params.amount <= 0) return;
  if (params.usedTrial) {
    await applyBalanceDelta(params.supabase, {
      userId: params.userId,
      delta: 0,
      trialDelta: params.amount,
      reason: 'refund',
      sessionId: params.sessionId,
      meta: { ...(params.meta ?? {}), restored: 'trial_credits_remaining' },
    });
    return;
  }
  await applyBalanceDelta(params.supabase, {
    userId: params.userId,
    delta: params.amount,
    reason: 'refund',
    sessionId: params.sessionId,
    meta: params.meta ?? {},
  });
}

/** Sync Pro flag on entitlements (does not grant credits by itself). */
export async function syncEntitlementProFlag(params: {
  supabase: SupabaseClient;
  userId: string;
  isPro: boolean;
  entitlementKey?: string | null;
  renewsAt?: string | null;
  revenuecatCustomerId?: string | null;
  monthlyCreditGrant?: number | null;
}): Promise<void> {
  await ensureEntitlement(params.supabase, params.userId);
  const patch: Record<string, unknown> = {
    is_pro: params.isPro,
    entitlement_key: params.entitlementKey ?? (params.isPro ? PRO_AI_ENTITLEMENT_ID : null),
    renews_at: params.renewsAt ?? null,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (params.revenuecatCustomerId !== undefined) {
    patch.revenuecat_customer_id = params.revenuecatCustomerId;
  }
  if (params.monthlyCreditGrant != null) {
    patch.monthly_credit_grant = params.monthlyCreditGrant;
  }
  await params.supabase.from('ai_entitlements').update(patch).eq('user_id', params.userId);
}

/**
 * Idempotent monthly grant.
 * Prefer revenuecat_transaction_id dedupe (purchase/renewal webhooks);
 * fall back to YYYY-MM period key for REST sync without a txn id.
 */
export async function grantMonthlyCreditsIfNeeded(params: {
  supabase: SupabaseClient;
  userId: string;
  plan?: 'monthly' | 'yearly';
  productId?: string | null;
  revenuecatTransactionId?: string | null;
  renewsAt?: string | null;
}): Promise<{ granted: boolean; balanceAfter: number }> {
  const plan =
    params.plan ?? inferSubscriptionPlan(params.productId);
  const amount = monthlyCreditsForProduct(params.productId, plan);
  const period = new Date().toISOString().slice(0, 7);
  const rcTxn = params.revenuecatTransactionId?.trim() || null;

  await ensureEntitlement(params.supabase, params.userId);
  await syncEntitlementProFlag({
    supabase: params.supabase,
    userId: params.userId,
    isPro: true,
    entitlementKey: PRO_AI_ENTITLEMENT_ID,
    renewsAt: params.renewsAt,
    monthlyCreditGrant: amount,
  });

  if (rcTxn) {
    const { data: dupTxn } = await params.supabase
      .from('ai_credit_ledger')
      .select('id')
      .eq('revenuecat_transaction_id', rcTxn)
      .limit(1)
      .maybeSingle();
    if (dupTxn) {
      return {
        granted: false,
        balanceAfter: await getCreditBalance(params.supabase, params.userId),
      };
    }
  }

  const { data: existing, error } = await params.supabase
    .from('ai_credit_ledger')
    .select('id')
    .eq('user_id', params.userId)
    .in('reason', ['grant_monthly', 'monthly_grant'])
    .contains('meta', { period })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[ai-credits] grant check failed:', error);
    // Fail closed so sync/webhook can retry — silent skip leaves Pro + 0 credits.
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify monthly AI credit grant',
    });
  }

  if (existing) {
    await params.supabase
      .from('ai_entitlements')
      .update({
        monthly_credit_grant: amount,
        last_synced_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId);
    return {
      granted: false,
      balanceAfter: await getCreditBalance(params.supabase, params.userId),
    };
  }

  const balanceAfter = await applyBalanceDelta(params.supabase, {
    userId: params.userId,
    delta: amount,
    reason: 'monthly_grant',
    revenuecatTransactionId: rcTxn,
    meta: {
      period,
      plan,
      amount,
      productId: params.productId ?? null,
    },
    note: `Monthly grant ${period}`,
  });

  await params.supabase
    .from('ai_entitlements')
    .update({
      monthly_credit_grant: amount,
      last_synced_at: new Date().toISOString(),
    })
    .eq('user_id', params.userId);

  return { granted: true, balanceAfter };
}

/** Look up top-up amount; supports exact product id or suffix match. */
export function resolveTopupCredits(productId: string): number {
  const pid = String(productId ?? '').trim();
  if (!pid) return 0;
  if (CLINICAL_TOPUP_PRODUCTS[pid] != null) return CLINICAL_TOPUP_PRODUCTS[pid];
  const lower = pid.toLowerCase();
  for (const [key, amount] of Object.entries(CLINICAL_TOPUP_PRODUCTS)) {
    if (lower === key.toLowerCase() || lower.endsWith(key.toLowerCase())) {
      return amount;
    }
  }
  return 0;
}

export async function grantTopupCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  productId: string;
  eventId?: string;
  revenuecatTransactionId?: string;
}): Promise<{ granted: boolean; amount: number; balanceAfter: number }> {
  const amount = resolveTopupCredits(params.productId);
  if (amount <= 0) {
    return {
      granted: false,
      amount: 0,
      balanceAfter: await getCreditBalance(params.supabase, params.userId),
    };
  }

  const rcTxn =
    params.revenuecatTransactionId?.trim() ||
    params.eventId?.trim() ||
    null;

  if (rcTxn) {
    const { data: dup } = await params.supabase
      .from('ai_credit_ledger')
      .select('id')
      .eq('revenuecat_transaction_id', rcTxn)
      .limit(1)
      .maybeSingle();
    if (dup) {
      return {
        granted: false,
        amount,
        balanceAfter: await getCreditBalance(params.supabase, params.userId),
      };
    }

    // Also check legacy meta.eventId
    if (params.eventId) {
      const { data: dupMeta } = await params.supabase
        .from('ai_credit_ledger')
        .select('id')
        .eq('user_id', params.userId)
        .in('reason', ['topup', 'topup_purchase'])
        .contains('meta', { eventId: params.eventId })
        .limit(1)
        .maybeSingle();
      if (dupMeta) {
        return {
          granted: false,
          amount,
          balanceAfter: await getCreditBalance(params.supabase, params.userId),
        };
      }
    }
  }

  const balanceAfter = await applyBalanceDelta(params.supabase, {
    userId: params.userId,
    delta: amount,
    reason: 'topup_purchase',
    revenuecatTransactionId: rcTxn,
    meta: {
      productId: params.productId,
      eventId: params.eventId ?? null,
      amount,
    },
    note: `Top-up ${params.productId}`,
  });

  return { granted: true, amount, balanceAfter };
}
