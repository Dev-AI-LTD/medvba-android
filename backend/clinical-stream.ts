/**
 * Clinical Copilot SSE streaming endpoint (Hono).
 * POST /api/clinical/stream — only when CLINICAL_COPILOT_ENABLED=true.
 */

import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { verifyMedvbaRequestJwt } from '../auth/decode-request-jwt';
import {
  generateClinicalTextStream,
  type TutorLocale,
} from '../../lib/ai-provider';
import { isClinicalCopilotEnabled } from '../../constants/clinical-copilot';
import {
  CLINICAL_CASE_TOPICS,
  CLINICAL_CREDIT_COSTS,
} from '../../constants/clinical-copilot';
import {
  consumeClinicalCredits,
  getCreditBalance,
  refundClinicalCredits,
} from '../lib/ai-credits';
import {
  clinicalDisclaimer,
  ensureDisclaimerFooter,
  getCaseSystemPrompt,
  getExplainSystemPrompt,
  getReplyModeHint,
} from '../lib/clinical-prompts';
import { userHasActivePremiumAccess } from '../lib/premium-access';
import { createClient } from '@supabase/supabase-js';

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

    if (!body.sessionId || !body.message?.trim()) {
      return c.json({ error: 'sessionId and message required' }, 400);
    }

    const locale = (body.locale === 'ro' ? 'ro' : 'en') as TutorLocale;
    const supabase = adminClient();

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

    const isPremium = await userHasActivePremiumAccess(supabase, userId);
    const cost = CLINICAL_CREDIT_COSTS.followUp;
    let charged = false;

    try {
      if (isPremium) {
        await consumeClinicalCredits({
          supabase,
          userId,
          cost,
          isPremium: true,
          feature: 'follow_up',
          sessionId: session.id,
        });
        charged = true;
      }

      const modeHint = getReplyModeHint(locale, body.mode);
      const userContent = modeHint
        ? `${modeHint}\n\n${body.message.trim()}`
        : body.message.trim();

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
        credits_charged: charged ? cost : 0,
      });

      const { data: snap } = await supabase
        .from('ai_case_snapshots')
        .select('summary_text')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: recent } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(16);

      const history = [...(recent ?? [])].reverse();
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
                content: `Prior case summary:\n${snap.summary_text}`,
              },
            ]
          : []),
        ...history.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ];

      return streamSSE(c, async (stream) => {
        let full = '';
        try {
          const gen = generateClinicalTextStream({ messages });
          let result = await gen.next();
          while (!result.done) {
            const chunk = result.value;
            full += chunk;
            await stream.writeSSE({ event: 'delta', data: JSON.stringify({ text: chunk }) });
            result = await gen.next();
          }
          const final = result.value;
          const text = ensureDisclaimerFooter(final?.text || full, locale);
          // If disclaimer was appended beyond streamed content, send remainder
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
            token_input: final?.usage?.promptTokens,
            token_output: final?.usage?.completionTokens,
            user_id: userId,
            sequence_no: seqUser + 1,
            total_tokens:
              (final?.usage?.promptTokens ?? 0) + (final?.usage?.completionTokens ?? 0) ||
              null,
          });

          const balance = await getCreditBalance(supabase, userId);
          await stream.writeSSE({
            event: 'done',
            data: JSON.stringify({
              sessionId: session.id,
              response: text,
              disclaimer: clinicalDisclaimer(locale),
              balance,
            }),
          });
        } catch (err) {
          if (charged) {
            await refundClinicalCredits({
              supabase,
              userId,
              amount: cost,
              sessionId: session.id,
              meta: { feature: 'follow_up', stream: true },
            });
          }
          const message = err instanceof Error ? err.message : String(err);
          await stream.writeSSE({
            event: 'error',
            data: JSON.stringify({ error: message }),
          });
        }
      });
    } catch (err) {
      if (charged) {
        await refundClinicalCredits({
          supabase,
          userId,
          amount: cost,
          sessionId: session.id,
          meta: { feature: 'follow_up', stream: true },
        });
      }
      const message = err instanceof Error ? err.message : String(err);
      const code = message.includes('TOPUP') || message.includes('PAYWALL') ? 403 : 500;
      return c.json({ error: message }, code);
    }
  });
}
