/**
 * AI Tutor SSE streaming endpoint (Hono).
 * POST /api/tutor/stream — same auth + free-tier rules as tutor.chat tRPC.
 */

import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';

import { verifyMedvbaRequestJwt } from './auth/decode-request-jwt';
import {
  generateTutorTextStream,
  getTutorAssistantPreamble,
  getTutorSystemPrompt,
  type TutorLocale,
} from '../lib/ai-provider';
import { decrementFreeAiUsage, incrementFreeAiUsage } from './lib/free-ai-usage';
import { userHasActivePremiumAccess } from './lib/premium-access';
import { tutorRateLimiter } from './trpc/rate-limiter';

type StreamBody = {
  messages: { role: 'user' | 'assistant'; content: string }[];
  locale?: 'en' | 'ro';
};

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error');
  return createClient(url, key);
}

function isAiMissingConfigError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('api key not configured') ||
    m.includes('openai api key') ||
    m.includes('base url not configured')
  );
}

export function registerTutorStreamRoutes(app: Hono) {
  app.post('/api/tutor/stream', async (c) => {
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

    if (!Array.isArray(body.messages) || body.messages.length < 1) {
      return c.json({ error: 'messages required' }, 400);
    }

    try {
      await tutorRateLimiter(userId);
    } catch (err) {
      if (err instanceof TRPCError && err.code === 'TOO_MANY_REQUESTS') {
        return c.json({ error: err.message }, 429);
      }
      throw err;
    }

    const supabase = adminClient();
    const locale = (body.locale === 'ro' ? 'ro' : 'en') as TutorLocale;
    const isPremium = await userHasActivePremiumAccess(supabase, userId);
    let reservedFreeSlot = false;

    try {
      if (!isPremium) {
        await incrementFreeAiUsage(supabase, userId);
        reservedFreeSlot = true;
      }

      const fullMessages = [
        { role: 'system' as const, content: getTutorSystemPrompt(locale) },
        {
          role: 'assistant' as const,
          content: getTutorAssistantPreamble(locale),
        },
        ...body.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      return streamSSE(c, async (stream) => {
        let full = '';
        try {
          const gen = generateTutorTextStream({
            messages: fullMessages,
            maxTokens: 1200,
            temperature: 0.65,
            signal: c.req.raw.signal,
          });
          let result = await gen.next();
          while (!result.done) {
            const chunk = result.value;
            full += chunk;
            await stream.writeSSE({
              event: 'delta',
              data: JSON.stringify({ text: chunk }),
            });
            result = await gen.next();
          }

          const final = result.done ? result.value : undefined;
          const text = (final?.text || full).trim();

          await stream.writeSSE({
            event: 'done',
            data: JSON.stringify({ response: text }),
          });
        } catch (err) {
          if (reservedFreeSlot) {
            await decrementFreeAiUsage(supabase, userId);
            reservedFreeSlot = false;
          }
          const message = err instanceof Error ? err.message : String(err);
          if (isAiMissingConfigError(message)) {
            await stream.writeSSE({
              event: 'error',
              data: JSON.stringify({
                error: 'AI tutor is not configured. Please contact support.',
                code: 'PRECONDITION_FAILED',
              }),
            });
            return;
          }
          await stream.writeSSE({
            event: 'error',
            data: JSON.stringify({
              error: message || 'Tutor stream failed',
              code: 'TUTOR_STREAM_FAILED',
            }),
          });
        }
      });
    } catch (err) {
      if (reservedFreeSlot) {
        await decrementFreeAiUsage(supabase, userId);
      }
      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof TRPCError) {
        return c.json({ error: err.message }, err.code === 'FORBIDDEN' ? 403 : 500);
      }
      return c.json({ error: message || 'Tutor stream request failed' }, 500);
    }
  });
}
