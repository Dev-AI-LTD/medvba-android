/**
 * Clinical Copilot SSE streaming endpoint (Hono).
 * POST /api/clinical/stream — only when CLINICAL_COPILOT_ENABLED=true.
 *
 * Pipeline: flag → JWT → schema/size → rate → guards → debit → provider → usage.
 * Credit policy: client abort = charge kept; timeout/provider failure = refund once.
 */

import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { createClient } from '@supabase/supabase-js';

import { verifyMedvbaRequestJwt } from './auth/decode-request-jwt';
import {
  generateClinicalTextStream,
  resolveClinicalProvider,
  type TutorLocale,
} from '../lib/ai-provider';
import {
  CLINICAL_CASE_TOPICS,
  CLINICAL_CREDIT_COSTS,
  isClinicalCopilotEnabled,
} from '../constants/clinical-copilot';
import {
  consumeClinicalCredits,
  getCreditBalance,
  PAYWALL_REQUIRED,
  refundClinicalCredits,
  TOPUP_REQUIRED,
} from './lib/ai-credits';
import {
  CLINICAL_AI_LIMITS,
  ClinicalGuardError,
  assertUserTextWithinLimit,
  createClinicalAbortBundle,
  isAbortError,
  newClinicalRequestId,
  truncateHistoryMessages,
} from './lib/clinical-ai-guards';
import { recordClinicalUsage } from './lib/clinical-usage';
import {
  clinicalDisclaimer,
  ensureDisclaimerFooter,
  getCaseSystemPrompt,
  getExplainSystemPrompt,
  getReplyModeHint,
} from './lib/clinical-prompts';
import { tutorRateLimiter } from './trpc/rate-limiter';
import { TRPCError } from '@trpc/server';

type StreamBody = {
  sessionId: string;
  message: string;
  locale?: 'en' | 'ro';
  mode?: 'history' | 'exam' | 'labs' | 'differential' | 'management' | 'free';
};

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error');
  return createClient(url, key);
}

export function registerClinicalStreamRoutes(app: Hono) {
  app.post('/api/clinical/stream', async (c) => {
    if (!isClinicalCopilotEnabled()) {
      return c.json({ error: 'Clinical Copilot is not enabled' }, 412);
    }

    const auth = c.req.header('authorization');
    const token = auth?.replace(/^Bearer\s+/i, '').trim() ?? '';
    if (!token) return c.json({ error: 'Authentication required' }, 401);

    let userId: string;
    try {
      const v = await verifyMedvbaRequestJwt(token);
      userId = v.userId;
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }

    let body: StreamBody;
    try {
      body = (await c.req.json()) as StreamBody;
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body.sessionId || typeof body.message !== 'string') {
      return c.json({ error: 'sessionId and message required' }, 400);
    }

    const requestId = newClinicalRequestId();
    const supabase = adminClient();
    const startedAt = Date.now();

    let guardedMessage: string;
    try {
      guardedMessage = assertUserTextWithinLimit(body.message, 'follow_up');
    } catch (err) {
      if (err instanceof ClinicalGuardError) {
        await recordClinicalUsage({
          supabase,
          requestId,
          userId,
          operation: 'follow_up',
          provider: resolveClinicalProvider(),
          status: 'guard_reject',
          creditCost: 0,
          latencyMs: Date.now() - startedAt,
        });
        return c.json({ error: err.message, code: 'GUARD_REJECT' }, 400);
      }
      throw err;
    }

    try {
      await tutorRateLimiter(userId);
    } catch (err) {
      if (err instanceof TRPCError && err.code === 'TOO_MANY_REQUESTS') {
        return c.json({ error: err.message }, 429);
      }
      throw err;
    }

    const locale = (body.locale === 'ro' ? 'ro' : 'en') as TutorLocale;

    const { data: session } = await supabase
      .from('ai_sessions')
      .select('id, user_id, type, case_topic, status')
      .eq('id', body.sessionId)
      .maybeSingle();

    if (!session || session.user_id !== userId) {
      return c.json({ error: 'Session not found' }, 404);
    }
    if (session.status !== 'active') {
      return c.json({ error: 'Session is not active' }, 400);
    }

    const cost = CLINICAL_CREDIT_COSTS.followUp;
    let chargedAmount = 0;
    let usedTrial = false;
    let refunded = false;
    const providerName = resolveClinicalProvider();

    async function refundOnce() {
      if (chargedAmount <= 0 || refunded) return;
      refunded = true;
      await refundClinicalCredits({
        supabase,
        userId,
        amount: chargedAmount,
        sessionId: session!.id,
        meta: { feature: 'follow_up', stream: true, requestId },
        usedTrial,
      });
    }

    try {
      const charge = await consumeClinicalCredits({
        supabase,
        userId,
        cost,
        feature: 'follow_up',
        sessionId: session.id,
      });
      chargedAmount = charge.amount;
      usedTrial = charge.usedTrial;

      const modeHint = getReplyModeHint(locale, body.mode);
      const userContent = modeHint
        ? `${modeHint}\n\n${guardedMessage}`
        : guardedMessage;

      const { count } = await supabase
        .from('ai_messages')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id);
      const seqUser = (count ?? 0) + 1;

      await supabase.from('ai_messages').insert({
        session_id: session.id,
        role: 'user',
        content: userContent,
        user_id: userId,
        sequence_no: seqUser,
        credits_charged: usedTrial ? 0 : chargedAmount,
      });

      const [{ data: snap }, { data: recent }] = await Promise.all([
        supabase
          .from('ai_case_snapshots')
          .select('summary_text')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ai_messages')
          .select('role, content')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(16),
      ]);

      const history = truncateHistoryMessages(
        [...(recent ?? [])].reverse(),
        'follow_up',
      );
      const system =
        session.type === 'clinical_case' && session.case_topic
          ? getCaseSystemPrompt(
              locale,
              session.case_topic as (typeof CLINICAL_CASE_TOPICS)[number],
            )
          : getExplainSystemPrompt(locale);

      const messages = [
        { role: 'system' as const, content: system },
        ...(snap?.summary_text
          ? [
              {
                role: 'system' as const,
                content: `Prior case summary:\n${snap.summary_text.slice(0, 4000)}`,
              },
            ]
          : []),
        ...history.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ];

      const limits = CLINICAL_AI_LIMITS.follow_up;

      return streamSSE(c, async (stream) => {
        const abortBundle = createClinicalAbortBundle({
          requestSignal: c.req.raw.signal,
          timeoutMs: limits.timeoutMs,
        });

        let full = '';
        try {
          const gen = generateClinicalTextStream({
            messages,
            maxTokens: limits.maxOutputTokens,
            signal: abortBundle.signal,
          });
          let result = await gen.next();
          while (!result.done) {
            if (abortBundle.signal.aborted) break;
            const chunk = result.value;
            full += chunk;
            await stream.writeSSE({
              event: 'delta',
              data: JSON.stringify({ text: chunk }),
            });
            result = await gen.next();
          }

          const cause = abortBundle.getCause();
          if (cause === 'client' || (abortBundle.signal.aborted && cause !== 'timeout')) {
            await recordClinicalUsage({
              supabase,
              requestId,
              userId,
              sessionId: session.id,
              operation: 'follow_up',
              provider: providerName,
              status: 'aborted',
              creditCost: usedTrial ? 0 : chargedAmount,
              usedTrial,
              latencyMs: Date.now() - startedAt,
            });
            return;
          }

          if (cause === 'timeout') {
            await refundOnce();
            await recordClinicalUsage({
              supabase,
              requestId,
              userId,
              sessionId: session.id,
              operation: 'follow_up',
              provider: providerName,
              status: 'timeout',
              creditCost: usedTrial ? 0 : chargedAmount,
              usedTrial,
              latencyMs: Date.now() - startedAt,
            });
            await stream.writeSSE({
              event: 'error',
              data: JSON.stringify({
                error: 'Request timed out. Credits were restored.',
                code: 'CLINICAL_TIMEOUT',
              }),
            });
            return;
          }

          const final = result.done
            ? (result.value as
                | {
                    text?: string;
                    model?: string;
                    provider?: string;
                    usage?: {
                      inputTokens: number | null;
                      outputTokens: number | null;
                      providerRequestId: string | null;
                    };
                  }
                | undefined)
            : undefined;
          const text = ensureDisclaimerFooter(final?.text || full, locale);
          if (text.length > full.length) {
            await stream.writeSSE({
              event: 'delta',
              data: JSON.stringify({ text: text.slice(full.length) }),
            });
          }

          await supabase.from('ai_messages').insert({
            session_id: session.id,
            role: 'assistant',
            content: text,
            model: final?.model,
            token_input: final?.usage?.inputTokens ?? null,
            token_output: final?.usage?.outputTokens ?? null,
            user_id: userId,
            sequence_no: seqUser + 1,
            total_tokens:
              (final?.usage?.inputTokens ?? 0) +
                (final?.usage?.outputTokens ?? 0) || null,
          });

          await recordClinicalUsage({
            supabase,
            requestId,
            userId,
            sessionId: session.id,
            operation: 'follow_up',
            provider: final?.provider ?? providerName,
            model: final?.model ?? null,
            tokenInput: final?.usage?.inputTokens ?? null,
            tokenOutput: final?.usage?.outputTokens ?? null,
            providerRequestId: final?.usage?.providerRequestId ?? null,
            status: 'ok',
            creditCost: usedTrial ? 0 : chargedAmount,
            usedTrial,
            latencyMs: Date.now() - startedAt,
          });

          const balance = await getCreditBalance(supabase, userId);
          await stream.writeSSE({
            event: 'done',
            data: JSON.stringify({
              sessionId: session.id,
              response: text,
              disclaimer: clinicalDisclaimer(locale),
              balance,
              requestId,
            }),
          });
        } catch (err) {
          const cause = abortBundle.getCause();
          if (cause === 'client' || (isAbortError(err) && cause !== 'timeout')) {
            await recordClinicalUsage({
              supabase,
              requestId,
              userId,
              sessionId: session.id,
              operation: 'follow_up',
              provider: providerName,
              status: 'aborted',
              creditCost: usedTrial ? 0 : chargedAmount,
              usedTrial,
              latencyMs: Date.now() - startedAt,
            });
            return;
          }
          if (cause === 'timeout') {
            await refundOnce();
            await recordClinicalUsage({
              supabase,
              requestId,
              userId,
              sessionId: session.id,
              operation: 'follow_up',
              provider: providerName,
              status: 'timeout',
              creditCost: usedTrial ? 0 : chargedAmount,
              usedTrial,
              latencyMs: Date.now() - startedAt,
            });
            await stream.writeSSE({
              event: 'error',
              data: JSON.stringify({
                error: 'Request timed out. Credits were restored.',
                code: 'CLINICAL_TIMEOUT',
              }),
            });
            return;
          }
          console.error('[clinical-stream] failed', {
            requestId,
            sessionId: session.id,
            error: err instanceof Error ? err.message : 'unknown',
          });
          await refundOnce();
          await recordClinicalUsage({
            supabase,
            requestId,
            userId,
            sessionId: session.id,
            operation: 'follow_up',
            provider: providerName,
            status: 'provider_error',
            creditCost: usedTrial ? 0 : chargedAmount,
            usedTrial,
            latencyMs: Date.now() - startedAt,
          });
          await stream.writeSSE({
            event: 'error',
            data: JSON.stringify({
              error: 'Nu am putut genera răspunsul. Creditele au fost restaurate.',
              code: 'CLINICAL_STREAM_FAILED',
            }),
          });
        } finally {
          abortBundle.cleanup();
        }
      });
    } catch (err) {
      await refundOnce();
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes(TOPUP_REQUIRED) || message.includes(PAYWALL_REQUIRED)) {
        return c.json({ error: message }, 403);
      }
      await recordClinicalUsage({
        supabase,
        requestId,
        userId,
        sessionId: session.id,
        operation: 'follow_up',
        provider: providerName,
        status: 'provider_error',
        creditCost: usedTrial ? 0 : chargedAmount,
        usedTrial,
        latencyMs: Date.now() - startedAt,
      });
      console.error('[clinical-stream] request failed', {
        requestId,
        sessionId: session.id,
        error: message,
      });
      return c.json({ error: 'Clinical stream request failed' }, 500);
    }
  });
}
