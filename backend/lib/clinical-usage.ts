/**
 * Clinical AI usage events — no PHI / prompts / images.
 * Writes are best-effort and must never change credit policy or AI responses.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AIProvider } from '../../lib/ai-provider';
import type { ClinicalOperation } from './clinical-ai-guards';

export type ClinicalUsageStatus =
  | 'ok'
  | 'provider_error'
  | 'aborted'
  | 'timeout'
  | 'guard_reject';

export async function recordClinicalUsage(params: {
  supabase: SupabaseClient;
  requestId: string;
  userId: string;
  sessionId?: string | null;
  operation: ClinicalOperation;
  provider: AIProvider | string;
  model?: string | null;
  tokenInput?: number | null;
  tokenOutput?: number | null;
  providerRequestId?: string | null;
  latencyMs?: number | null;
  status: ClinicalUsageStatus;
  creditCost: number;
  usedTrial?: boolean;
}): Promise<void> {
  try {
    const { error } = await params.supabase.from('ai_usage_events').insert({
      request_id: params.requestId,
      user_id: params.userId,
      session_id: params.sessionId ?? null,
      operation: params.operation,
      provider: String(params.provider),
      model: params.model ?? null,
      token_input: params.tokenInput ?? null,
      token_output: params.tokenOutput ?? null,
      provider_request_id: params.providerRequestId ?? null,
      latency_ms: params.latencyMs ?? null,
      status: params.status,
      credit_cost: Math.max(0, Math.floor(params.creditCost)),
      used_trial: Boolean(params.usedTrial),
    });
    if (error) {
      console.error('[clinical-usage] insert failed', {
        requestId: params.requestId,
        operation: params.operation,
        status: params.status,
        code: error.code,
      });
    }
  } catch (err) {
    console.error('[clinical-usage] insert exception', {
      requestId: params.requestId,
      operation: params.operation,
      error: err instanceof Error ? err.name : 'unknown',
    });
  }
}
