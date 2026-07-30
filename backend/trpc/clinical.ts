/**
 * Clinical Copilot tRPC router.
 * Gated by CLINICAL_COPILOT_ENABLED / EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED (default off).
 * Classic tutor.chat is untouched.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from './create-context';
import { generateClinicalText, type TutorLocale } from '../../lib/ai-provider';
import { userHasActivePremiumAccess } from '../lib/premium-access';
import {
  CLINICAL_CASE_TOPICS,
  CLINICAL_CREDIT_COSTS,
  CLINICAL_DISCLAIMER_VERSION,
  CLINICAL_TOPUP_PACKAGE_IDS,
  CLINICAL_TOPUP_PRODUCTS,
  isClinicalCopilotEnabled,
} from '../../constants/clinical-copilot';
import {
  consumeClinicalCredits,
  getCreditBalance,
  getEntitlementStatus,
  refundClinicalCredits,
} from '../lib/ai-credits';
import {
  fetchRevenueCatSubscriber,
  getRevenueCatSecretApiKey,
  syncSubscriberPayloadToSupabase,
} from '../lib/revenuecat-subscriber-sync';
import {
  buildExplainUserPrompt,
  clinicalDisclaimer,
  ensureDisclaimerFooter,
  getCaseKickoffUserMessage,
  getCaseSystemPrompt,
  getExplainSystemPrompt,
  getImageSystemPrompt,
  getReplyModeHint,
  getSnapshotSystemPrompt,
  getSummarySystemPrompt,
} from '../lib/clinical-prompts';
import { tutorRateLimiter } from './rate-limiter';

function assertClinicalEnabled() {
  if (!isClinicalCopilotEnabled()) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Clinical Copilot is not enabled on this environment.',
    });
  }
}

function getSupabaseAdminOrThrow() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server configuration error',
    });
  }
  return { url, serviceRoleKey };
}

async function adminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminOrThrow();
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceRoleKey);
}

function isAiMissingConfigError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('api key not configured') ||
    m.includes('openai api key') ||
    m.includes('base url not configured')
  );
}

async function nextSequenceNo(
  supabase: Awaited<ReturnType<typeof adminClient>>,
  sessionId: string,
): Promise<number> {
  const { data } = await supabase
    .from('ai_messages')
    .select('sequence_no')
    .eq('session_id', sessionId)
    .order('sequence_no', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sequence_no ?? 0) + 1;
}

async function insertMessage(
  supabase: Awaited<ReturnType<typeof adminClient>>,
  row: {
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    token_input?: number;
    token_output?: number;
    user_id?: string;
    credits_charged?: number;
  },
) {
  const sequence_no = await nextSequenceNo(supabase, row.session_id);
  const total_tokens =
    (row.token_input ?? 0) + (row.token_output ?? 0) || null;
  await supabase.from('ai_messages').insert({
    ...row,
    sequence_no,
    total_tokens,
  });
}

async function maybeSnapshotCase(
  supabase: Awaited<ReturnType<typeof adminClient>>,
  sessionId: string,
  userId: string,
  locale: TutorLocale,
) {
  const { count } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  const n = count ?? 0;
  if (n === 0 || n % 12 !== 0) return;

  const { data: msgs } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(40);

  if (!msgs?.length) return;

  try {
    const result = await generateClinicalText({
      messages: [
        { role: 'system', content: getSnapshotSystemPrompt(locale) },
        {
          role: 'user',
          content: msgs.map((m) => `${m.role}: ${m.content}`).join('\n\n'),
        },
      ],
      maxTokens: 800,
    });
    await supabase.from('ai_case_snapshots').insert({
      session_id: sessionId,
      user_id: userId,
      summary_text: result.text,
      message_count_at: n,
      message_count: n,
    });
  } catch (e) {
    console.warn('[clinical] snapshot failed:', e);
  }
}

const localeSchema = z.enum(['en', 'ro']).default('en');
const replyModeSchema = z
  .enum(['history', 'exam', 'labs', 'differential', 'management', 'free'])
  .optional();

async function runExplainQuestion(
  ctx: { userId: string },
  input: {
    question: string;
    options: string[];
    chosenIndex: number;
    correctIndex: number;
    chapter?: string;
    staticExplanation?: string;
    locale: 'en' | 'ro';
    acceptDisclaimer: boolean;
    questionId?: string;
    quizSessionId?: string;
    explanationLevel?: string;
    entryPoint?: string;
  },
) {
  assertClinicalEnabled();
  tutorRateLimiter(ctx.userId);

  if (input.chosenIndex >= input.options.length || input.correctIndex >= input.options.length) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid option index' });
  }

  const supabase = await adminClient();
  const locale = input.locale as TutorLocale;
  const isPremium = await userHasActivePremiumAccess(supabase, ctx.userId);
  const cost = CLINICAL_CREDIT_COSTS.explain;

  const { data: session, error: sessionErr } = await supabase
    .from('ai_sessions')
    .insert({
      user_id: ctx.userId,
      type: 'explain',
      status: 'active',
      locale,
      disclaimer_accepted_at: input.acceptDisclaimer ? new Date().toISOString() : null,
      disclaimer_accepted: input.acceptDisclaimer,
      disclaimer_version: CLINICAL_DISCLAIMER_VERSION,
      credit_cost_reserved: cost,
      estimated_credits: cost,
      entry_point: input.entryPoint ?? 'explain',
      source_question_id: input.questionId ?? null,
      source_quiz_session_id: input.quizSessionId ?? null,
      subject_area: input.chapter ?? null,
      meta: {
        chapter: input.chapter ?? null,
        explanationLevel: input.explanationLevel ?? null,
      },
    })
    .select('id')
    .single();

  if (sessionErr || !session) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create clinical session',
    });
  }

  let charged = false;
  let usedTrial = false;
  try {
    const charge = await consumeClinicalCredits({
      supabase,
      userId: ctx.userId,
      cost,
      isPremium,
      feature: 'explain',
      sessionId: session.id,
    });
    charged = !charge.usedTrial;
    usedTrial = charge.usedTrial;

    const userPrompt = buildExplainUserPrompt(input);
    await insertMessage(supabase, {
      session_id: session.id,
      role: 'user',
      content: userPrompt,
      user_id: ctx.userId,
    });

    const result = await generateClinicalText({
      messages: [
        { role: 'system', content: getExplainSystemPrompt(locale) },
        { role: 'user', content: userPrompt },
      ],
    });
    const text = ensureDisclaimerFooter(result.text, locale);

    await insertMessage(supabase, {
      session_id: session.id,
      role: 'assistant',
      content: text,
      model: result.model,
      token_input: result.usage?.promptTokens,
      token_output: result.usage?.completionTokens,
      user_id: ctx.userId,
      credits_charged: usedTrial ? 0 : cost,
    });

    await supabase
      .from('ai_sessions')
      .update({
        status: 'completed',
        model: result.model,
        actual_credits: usedTrial ? 0 : cost,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    const balance = await getCreditBalance(supabase, ctx.userId);
    return {
      sessionId: session.id,
      response: text,
      disclaimer: clinicalDisclaimer(locale),
      usedTrial,
      balance,
    };
  } catch (err) {
    if (charged) {
      await refundClinicalCredits({
        supabase,
        userId: ctx.userId,
        amount: cost,
        sessionId: session.id,
        meta: { feature: 'explain' },
      });
    }
    if (err instanceof TRPCError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (isAiMissingConfigError(message)) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'AI is not configured. Please contact support.',
      });
    }
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
  }
}

async function runStartCase(
  ctx: { userId: string },
  input: {
    topic: (typeof CLINICAL_CASE_TOPICS)[number];
    locale: 'en' | 'ro';
    acceptDisclaimer: true;
    specialty?: string;
    difficulty?: string;
    language?: string;
  },
) {
  assertClinicalEnabled();
  tutorRateLimiter(ctx.userId);

  const supabase = await adminClient();
  const locale = (input.language === 'ro' || input.language === 'en'
    ? input.language
    : input.locale) as TutorLocale;
  const isPremium = await userHasActivePremiumAccess(supabase, ctx.userId);
  const cost = CLINICAL_CREDIT_COSTS.clinicalCase;

  const { data: session, error: sessionErr } = await supabase
    .from('ai_sessions')
    .insert({
      user_id: ctx.userId,
      type: 'clinical_case',
      status: 'active',
      locale,
      case_topic: input.topic,
      subject_area: input.specialty ?? input.topic,
      disclaimer_accepted_at: new Date().toISOString(),
      disclaimer_accepted: true,
      disclaimer_version: CLINICAL_DISCLAIMER_VERSION,
      credit_cost_reserved: cost,
      estimated_credits: cost,
      entry_point: 'clinical_case',
      meta: {
        difficulty: input.difficulty ?? null,
        specialty: input.specialty ?? null,
      },
    })
    .select('id')
    .single();

  if (sessionErr || !session) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to start clinical case',
    });
  }

  let charged = false;
  try {
    const charge = await consumeClinicalCredits({
      supabase,
      userId: ctx.userId,
      cost,
      isPremium,
      feature: 'clinical_case',
      sessionId: session.id,
    });
    charged = !charge.usedTrial;

    const kickoff = getCaseKickoffUserMessage(locale, input.topic);
    await insertMessage(supabase, {
      session_id: session.id,
      role: 'user',
      content: kickoff,
      user_id: ctx.userId,
    });

    const result = await generateClinicalText({
      messages: [
        { role: 'system', content: getCaseSystemPrompt(locale, input.topic) },
        { role: 'user', content: kickoff },
      ],
      maxTokens: 2000,
    });
    const text = ensureDisclaimerFooter(result.text, locale);

    await insertMessage(supabase, {
      session_id: session.id,
      role: 'assistant',
      content: text,
      model: result.model,
      token_input: result.usage?.promptTokens,
      token_output: result.usage?.completionTokens,
      user_id: ctx.userId,
      credits_charged: charge.usedTrial ? 0 : cost,
    });

    await supabase
      .from('ai_sessions')
      .update({
        model: result.model,
        actual_credits: charge.usedTrial ? 0 : cost,
        title: input.topic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    return {
      sessionId: session.id,
      response: text,
      disclaimer: clinicalDisclaimer(locale),
      usedTrial: charge.usedTrial,
      balance: await getCreditBalance(supabase, ctx.userId),
    };
  } catch (err) {
    if (charged) {
      await refundClinicalCredits({
        supabase,
        userId: ctx.userId,
        amount: cost,
        sessionId: session.id,
        meta: { feature: 'clinical_case' },
      });
    }
    if (err instanceof TRPCError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
  }
}

async function runReply(
  ctx: { userId: string },
  input: {
    sessionId: string;
    message: string;
    locale: 'en' | 'ro';
    mode?: 'history' | 'exam' | 'labs' | 'differential' | 'management' | 'free';
  },
) {
  assertClinicalEnabled();
  tutorRateLimiter(ctx.userId);

  const supabase = await adminClient();
  const locale = input.locale as TutorLocale;

  const { data: session, error } = await supabase
    .from('ai_sessions')
    .select('id, user_id, type, case_topic, status')
    .eq('id', input.sessionId)
    .maybeSingle();

  if (error || !session || session.user_id !== ctx.userId) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
  }
  if (session.status !== 'active') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session is not active' });
  }

  const isPremium = await userHasActivePremiumAccess(supabase, ctx.userId);
  const cost = CLINICAL_CREDIT_COSTS.followUp;
  let charged = false;

  try {
    if (isPremium) {
      const charge = await consumeClinicalCredits({
        supabase,
        userId: ctx.userId,
        cost,
        isPremium: true,
        feature: 'follow_up',
        sessionId: session.id,
      });
      charged = !charge.usedTrial;
    }

    const modeHint = getReplyModeHint(locale, input.mode);
    const userContent = modeHint ? `${modeHint}\n\n${input.message}` : input.message;

    await insertMessage(supabase, {
      session_id: session.id,
      role: 'user',
      content: userContent,
      user_id: ctx.userId,
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

    const result = await generateClinicalText({ messages });
    const text = ensureDisclaimerFooter(result.text, locale);
    await insertMessage(supabase, {
      session_id: session.id,
      role: 'assistant',
      content: text,
      model: result.model,
      token_input: result.usage?.promptTokens,
      token_output: result.usage?.completionTokens,
      user_id: ctx.userId,
    });

    if (session.type === 'clinical_case') {
      await maybeSnapshotCase(supabase, session.id, ctx.userId, locale);
    }

    if (charged) {
      await supabase
        .from('ai_sessions')
        .update({
          actual_credits: cost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }

    return {
      sessionId: session.id,
      response: text,
      disclaimer: clinicalDisclaimer(locale),
      balance: await getCreditBalance(supabase, ctx.userId),
    };
  } catch (err) {
    if (charged) {
      await refundClinicalCredits({
        supabase,
        userId: ctx.userId,
        amount: cost,
        sessionId: session.id,
        meta: { feature: 'follow_up' },
      });
    }
    if (err instanceof TRPCError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
  }
}

const explainInput = z.object({
  question: z.string().trim().min(1).max(8000),
  options: z.array(z.string().trim().min(1).max(2000)).min(2).max(8),
  chosenIndex: z.number().int().min(0),
  correctIndex: z.number().int().min(0),
  chapter: z.string().trim().max(200).optional(),
  staticExplanation: z.string().trim().max(8000).optional(),
  locale: localeSchema,
  acceptDisclaimer: z.boolean().default(true),
  questionId: z.string().trim().max(200).optional(),
  quizSessionId: z.string().trim().max(200).optional(),
  explanationLevel: z.string().trim().max(40).optional(),
  entryPoint: z.string().trim().max(80).optional(),
  // Spec aliases
  userAnswer: z.string().trim().max(2000).optional(),
  correctAnswer: z.string().trim().max(2000).optional(),
});

const analyzeImageProcedure = protectedProcedure
  .input(
    z.object({
      imageDataUrl: z
        .string()
        .trim()
        .min(32)
        .max(6_000_000)
        .refine(
          (v) => v.startsWith('data:image/') && v.includes(';base64,'),
          'Expected a data:image/...;base64, URL',
        )
        .optional(),
      attachmentId: z.string().uuid().optional(),
      note: z.string().trim().max(2000).optional(),
      locale: localeSchema,
      acceptDisclaimer: z.literal(true),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    assertClinicalEnabled();
    tutorRateLimiter(ctx.userId);

    if (!input.imageDataUrl && !input.attachmentId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Provide imageDataUrl or attachmentId',
      });
    }

    const supabase = await adminClient();
    const locale = input.locale as TutorLocale;
    const isPremium = await userHasActivePremiumAccess(supabase, ctx.userId);
    if (!isPremium) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'PAYWALL_REQUIRED',
      });
    }

    let imageUrl = input.imageDataUrl ?? '';
    if (input.attachmentId) {
      const { data: att } = await supabase
        .from('ai_attachments')
        .select('id, storage_path, object_path, bucket_name, user_id')
        .eq('id', input.attachmentId)
        .maybeSingle();
      if (!att || (att.user_id && att.user_id !== ctx.userId)) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
      }
      const path = att.object_path || att.storage_path;
      if (path) {
        const { data: signed } = await supabase.storage
          .from(att.bucket_name || 'ai-attachments')
          .createSignedUrl(path, 300);
        if (signed?.signedUrl) imageUrl = signed.signedUrl;
      }
    }

    if (!imageUrl) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Could not resolve image URL',
      });
    }

    const cost = CLINICAL_CREDIT_COSTS.image;
    const { data: session, error: sessionErr } = await supabase
      .from('ai_sessions')
      .insert({
        user_id: ctx.userId,
        type: 'image',
        status: 'active',
        locale,
        disclaimer_accepted_at: new Date().toISOString(),
        disclaimer_accepted: true,
        disclaimer_version: CLINICAL_DISCLAIMER_VERSION,
        credit_cost_reserved: cost,
        estimated_credits: cost,
        entry_point: 'image',
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create image session',
      });
    }

    let charged = false;
    try {
      await consumeClinicalCredits({
        supabase,
        userId: ctx.userId,
        cost,
        isPremium: true,
        feature: 'image',
        sessionId: session.id,
      });
      charged = true;

      const userText =
        input.note?.trim() ||
        (locale === 'ro'
          ? 'Analizează imaginea în scop didactic.'
          : 'Provide a guided educational analysis of this image.');

      await insertMessage(supabase, {
        session_id: session.id,
        role: 'user',
        content: userText,
        user_id: ctx.userId,
        credits_charged: cost,
      });

      const result = await generateClinicalText({
        messages: [
          { role: 'system', content: getImageSystemPrompt(locale) },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        maxTokens: 2200,
      });
      const text = ensureDisclaimerFooter(result.text, locale);

      await insertMessage(supabase, {
        session_id: session.id,
        role: 'assistant',
        content: text,
        model: result.model,
        token_input: result.usage?.promptTokens,
        token_output: result.usage?.completionTokens,
        user_id: ctx.userId,
      });

      await supabase
        .from('ai_sessions')
        .update({
          status: 'completed',
          model: result.model,
          actual_credits: cost,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      return {
        sessionId: session.id,
        response: text,
        disclaimer: clinicalDisclaimer(locale),
        balance: await getCreditBalance(supabase, ctx.userId),
      };
    } catch (err) {
      if (charged) {
        await refundClinicalCredits({
          supabase,
          userId: ctx.userId,
          amount: cost,
          sessionId: session.id,
          meta: { feature: 'image' },
        });
      }
      if (err instanceof TRPCError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  });

const generateSummaryProcedure = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().uuid(),
      locale: localeSchema,
      topic: z.string().trim().max(200).optional(),
      source: z.string().trim().max(200).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    assertClinicalEnabled();
    tutorRateLimiter(ctx.userId);

    const supabase = await adminClient();
    const locale = input.locale as TutorLocale;
    const isPremium = await userHasActivePremiumAccess(supabase, ctx.userId);
    if (!isPremium) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'PAYWALL_REQUIRED',
      });
    }

    const { data: session } = await supabase
      .from('ai_sessions')
      .select('id, user_id')
      .eq('id', input.sessionId)
      .maybeSingle();

    if (!session || session.user_id !== ctx.userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
    }

    const cost = CLINICAL_CREDIT_COSTS.summary;
    let charged = false;
    try {
      await consumeClinicalCredits({
        supabase,
        userId: ctx.userId,
        cost,
        isPremium: true,
        feature: 'summary',
        sessionId: session.id,
      });
      charged = true;

      const { data: msgs } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
        .limit(50);

      const result = await generateClinicalText({
        messages: [
          { role: 'system', content: getSummarySystemPrompt(locale) },
          {
            role: 'user',
            content: [
              input.topic ? `Topic: ${input.topic}` : null,
              input.source ? `Source: ${input.source}` : null,
              (msgs ?? []).map((m) => `${m.role}: ${m.content}`).join('\n\n'),
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ],
      });
      const text = ensureDisclaimerFooter(result.text, locale);

      const { data: summarySession } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: ctx.userId,
          type: 'summary',
          status: 'completed',
          locale,
          credit_cost_reserved: cost,
          estimated_credits: cost,
          actual_credits: cost,
          model: result.model,
          cached_summary: text,
          completed_at: new Date().toISOString(),
          disclaimer_accepted: true,
          disclaimer_version: CLINICAL_DISCLAIMER_VERSION,
          meta: {
            sourceSessionId: session.id,
            topic: input.topic ?? null,
            source: input.source ?? null,
          },
        })
        .select('id')
        .single();

      if (summarySession) {
        await insertMessage(supabase, {
          session_id: summarySession.id,
          role: 'assistant',
          content: text,
          model: result.model,
          user_id: ctx.userId,
          credits_charged: cost,
        });
      }

      await supabase
        .from('ai_sessions')
        .update({ cached_summary: text, updated_at: new Date().toISOString() })
        .eq('id', session.id);

      return {
        sessionId: summarySession?.id ?? session.id,
        response: text,
        disclaimer: clinicalDisclaimer(locale),
        balance: await getCreditBalance(supabase, ctx.userId),
      };
    } catch (err) {
      if (charged) {
        await refundClinicalCredits({
          supabase,
          userId: ctx.userId,
          amount: cost,
          sessionId: session.id,
          meta: { feature: 'summary' },
        });
      }
      if (err instanceof TRPCError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  });

async function buildClinicalStatusPayload(userId: string) {
  const enabled = isClinicalCopilotEnabled();
  if (!enabled) {
    return {
      enabled: false,
      balance: 0,
      creditBalance: 0,
      isPro: false,
      isProAi: false,
      trialCreditsRemaining: 0,
      renewsAt: null as string | null,
      monthlyCreditGrant: 0,
      canStartClinicalCase: false,
      disclaimerVersion: CLINICAL_DISCLAIMER_VERSION,
      disclaimerEn: clinicalDisclaimer('en'),
      disclaimerRo: clinicalDisclaimer('ro'),
      costs: CLINICAL_CREDIT_COSTS,
      flags: { streaming: false, topup: false },
    };
  }
  const supabase = await adminClient();
  const ent = await getEntitlementStatus(supabase, userId);
  const isPremium = await userHasActivePremiumAccess(supabase, userId);
  const isProAi = ent.isPro || isPremium;
  const canStartClinicalCase =
    isProAi
      ? ent.balance + 1e-9 >= CLINICAL_CREDIT_COSTS.clinicalCase
      : ent.trialCreditsRemaining + 1e-9 >= CLINICAL_CREDIT_COSTS.clinicalCase;
  return {
    enabled: true,
    balance: ent.balance,
    creditBalance: ent.balance,
    isPro: isProAi,
    isProAi,
    trialCreditsRemaining: ent.trialCreditsRemaining,
    renewsAt: ent.renewsAt,
    monthlyCreditGrant: ent.monthlyCreditGrant,
    canStartClinicalCase,
    disclaimerVersion: CLINICAL_DISCLAIMER_VERSION,
    disclaimerEn: clinicalDisclaimer('en'),
    disclaimerRo: clinicalDisclaimer('ro'),
    costs: CLINICAL_CREDIT_COSTS,
    flags: { streaming: true, topup: true },
  };
}

export const clinicalRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    return buildClinicalStatusPayload(ctx.userId);
  }),

  /**
   * After purchase/restore: fetch RevenueCat subscriber server-side, sync
   * subscriptions + ai_entitlements, grant monthly credits if needed.
   * Client must never grant credits locally.
   * Spec alias note: prefer `clinical.syncEntitlement` (not a parallel clinicalAi router).
   */
  syncEntitlement: protectedProcedure.mutation(async ({ ctx }) => {
    const supabase = await adminClient();

    if (getRevenueCatSecretApiKey()) {
      const rcBody = await fetchRevenueCatSubscriber(ctx.userId);
      const sync = await syncSubscriberPayloadToSupabase(supabase, ctx.userId, rcBody, {
        grantMonthlyCredits: true,
      });
      if (!sync.ok) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: sync.error ?? 'Could not sync entitlement with RevenueCat.',
        });
      }
    }

    const status = await buildClinicalStatusPayload(ctx.userId);
    return {
      ok: true as const,
      ...status,
    };
  }),

  explainQuestion: protectedProcedure.input(explainInput).mutation(async ({ ctx, input }) => {
    return runExplainQuestion(ctx, input);
  }),

  /** Spec alias for explainQuestion */
  startExplainQuestion: protectedProcedure
    .input(explainInput)
    .mutation(async ({ ctx, input }) => runExplainQuestion(ctx, input)),

  startCase: protectedProcedure
    .input(
      z.object({
        topic: z.enum(CLINICAL_CASE_TOPICS),
        locale: localeSchema,
        acceptDisclaimer: z.literal(true),
        specialty: z.string().trim().max(120).optional(),
        difficulty: z.string().trim().max(40).optional(),
        language: z.enum(['en', 'ro']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => runStartCase(ctx, input)),

  /** Spec alias for startCase */
  startClinicalCase: protectedProcedure
    .input(
      z.object({
        topic: z.enum(CLINICAL_CASE_TOPICS),
        locale: localeSchema,
        acceptDisclaimer: z.literal(true),
        specialty: z.string().trim().max(120).optional(),
        difficulty: z.string().trim().max(40).optional(),
        language: z.enum(['en', 'ro']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => runStartCase(ctx, input)),

  reply: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        message: z.string().trim().min(1).max(4000),
        locale: localeSchema,
        mode: replyModeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => runReply(ctx, input)),

  /** Spec alias for reply */
  sendClinicalMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        message: z.string().trim().min(1).max(4000),
        locale: localeSchema,
        mode: replyModeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => runReply(ctx, input)),

  analyzeImage: analyzeImageProcedure,
  analyzeClinicalImage: analyzeImageProcedure,
  generateSummary: generateSummaryProcedure,
  generateStudySummary: generateSummaryProcedure,

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      assertClinicalEnabled();
      const supabase = await adminClient();
      const { data: session, error } = await supabase
        .from('ai_sessions')
        .select(
          'id, type, status, case_topic, title, subject_area, locale, created_at, updated_at, disclaimer_version, disclaimer_accepted, actual_credits, cached_summary',
        )
        .eq('id', input.sessionId)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (error || !session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      const { data: messages } = await supabase
        .from('ai_messages')
        .select('id, role, content, sequence_no, created_at, credits_charged')
        .eq('session_id', session.id)
        .order('sequence_no', { ascending: true });

      return { session, messages: messages ?? [] };
    }),

  archiveSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertClinicalEnabled();
      const supabase = await adminClient();
      const { data, error } = await supabase
        .from('ai_sessions')
        .update({
          status: 'archived',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.sessionId)
        .eq('user_id', ctx.userId)
        .select('id, status')
        .maybeSingle();

      if (error || !data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }
      return { sessionId: data.id, status: data.status };
    }),

  getCredits: protectedProcedure
    .input(
      z
        .object({
          ledgerLimit: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      assertClinicalEnabled();
      const supabase = await adminClient();
      const ent = await getEntitlementStatus(supabase, ctx.userId);
      const { data: ledger } = await supabase
        .from('ai_credit_ledger')
        .select(
          'id, delta, balance_after, reason, created_at, note, revenuecat_transaction_id, meta',
        )
        .eq('user_id', ctx.userId)
        .order('created_at', { ascending: false })
        .limit(input?.ledgerLimit ?? 20);

      return {
        balance: ent.balance,
        isPro: ent.isPro,
        trialCreditsRemaining: ent.trialCreditsRemaining,
        renewsAt: ent.renewsAt,
        monthlyCreditGrant: ent.monthlyCreditGrant,
        ledger: ledger ?? [],
        costs: CLINICAL_CREDIT_COSTS,
      };
    }),

  createTopupIntent: protectedProcedure
    .input(
      z
        .object({
          packageHint: z.enum(['50', '100', '250']).optional(),
        })
        .optional(),
    )
    .mutation(async ({ input }) => {
      assertClinicalEnabled();
      const hint = input?.packageHint;
      const products = CLINICAL_TOPUP_PACKAGE_IDS.filter((id) => {
        if (!hint) return true;
        return id.endsWith(`_${hint}`) || id.includes(`credits_${hint}`);
      }).map((id) => ({
        productId: id,
        credits: CLINICAL_TOPUP_PRODUCTS[id] ?? 0,
      }));

      return {
        checkout: 'revenuecat' as const,
        products:
          products.length > 0
            ? products
            : Object.entries(CLINICAL_TOPUP_PRODUCTS).map(([productId, credits]) => ({
                productId,
                credits,
              })),
        message:
          'Complete purchase via RevenueCat Purchases SDK on the client, then credits sync via webhook.',
      };
    }),

  listSessions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      assertClinicalEnabled();
      const supabase = await adminClient();
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('id, type, status, case_topic, title, created_at, updated_at')
        .eq('user_id', ctx.userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(input?.limit ?? 20);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list sessions',
        });
      }
      return { sessions: data ?? [] };
    }),
});
