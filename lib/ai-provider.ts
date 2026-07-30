/**
 * AI Provider abstraction layer
 * Tutor: OpenAI-compatible via AI_API_KEY / OPENAI_API_KEY (unchanged).
 * Clinical: AI_PROVIDER=muse (explicit) → META_MODEL_*; otherwise OpenAI path.
 */

export type AIProvider = 'openai' | 'muse';

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  provider: AIProvider;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateTextOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Multimodal content part for vision (Clinical Copilot image analysis). */
export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface MultimodalChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ChatContentPart[];
}

/** Token usage from provider — null when provider omits counts (never invent). */
export type NormalizedUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  providerRequestId: string | null;
};

export interface GenerateTextResult {
  text: string;
  model: string;
  provider: AIProvider;
  usage: NormalizedUsage;
  /** @deprecated Prefer usage.inputTokens / usage.outputTokens */
  legacyUsage?: { promptTokens?: number; completionTokens?: number };
}

export const CLINICAL_PROVIDER_NOT_CONFIGURED =
  'Clinical AI provider is not configured';

function normalizeUsage(raw: unknown, id?: string | null): NormalizedUsage {
  const u = raw as
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
      }
    | null
    | undefined;
  if (!u || typeof u !== 'object') {
    return {
      inputTokens: null,
      outputTokens: null,
      providerRequestId: id ?? null,
    };
  }
  const input =
    typeof u.prompt_tokens === 'number'
      ? u.prompt_tokens
      : typeof u.input_tokens === 'number'
        ? u.input_tokens
        : null;
  const output =
    typeof u.completion_tokens === 'number'
      ? u.completion_tokens
      : typeof u.output_tokens === 'number'
        ? u.output_tokens
        : null;
  return {
    inputTokens: input,
    outputTokens: output,
    providerRequestId: id ?? null,
  };
}

/** Classic Tutor config — never reads META_MODEL_* or AI_PROVIDER. */
function getTutorProviderConfig(): AIProviderConfig {
  return {
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    provider: 'openai',
  };
}

/**
 * Explicit Clinical provider selection.
 * Muse only when AI_PROVIDER=muse; missing META_MODEL_API_KEY → hard error (no OpenAI fallback).
 */
export function resolveClinicalProvider(): AIProvider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === 'muse'
    ? 'muse'
    : 'openai';
}

export function getClinicalProviderConfig(): AIProviderConfig {
  const provider = resolveClinicalProvider();
  if (provider === 'muse') {
    const apiKey = process.env.META_MODEL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(CLINICAL_PROVIDER_NOT_CONFIGURED);
    }
    const baseUrl =
      process.env.META_MODEL_API_BASE_URL?.trim() ||
      process.env.META_MODEL_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error(CLINICAL_PROVIDER_NOT_CONFIGURED);
    }
    return {
      provider: 'muse',
      apiKey,
      baseUrl: baseUrl.replace(/\/$/, ''),
      model:
        process.env.META_MODEL_NAME?.trim() ||
        process.env.META_MODEL_API_NAME?.trim() ||
        'muse-spark-1.1',
    };
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(CLINICAL_PROVIDER_NOT_CONFIGURED);
  }
  return {
    provider: 'openai',
    apiKey,
    baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    ),
    model: getClinicalModel(),
  };
}

/** Clinical model when using OpenAI path (ignored for Muse model from META_MODEL_NAME). */
export function getClinicalModel(): string {
  return (
    process.env.AI_CLINICAL_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    'gpt-4o-mini'
  );
}

function providerHttpErrorLabel(provider: AIProvider, status: number): string {
  return provider === 'muse'
    ? `Clinical AI provider error: ${status}`
    : `OpenAI API error: ${status}`;
}

async function callOpenAICompatible(
  messages: MultimodalChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  },
  config: AIProviderConfig,
): Promise<GenerateTextResult> {
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = options.model || config.model || 'gpt-4o-mini';
  const provider = config.provider;

  if (!apiKey) {
    throw new Error(
      provider === 'muse'
        ? CLINICAL_PROVIDER_NOT_CONFIGURED
        : 'OpenAI API key not configured. Set AI_API_KEY (or OPENAI_API_KEY) on the backend.',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      }),
      signal: options.signal,
    });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    throw new Error(providerHttpErrorLabel(provider, 0));
  }

  if (!response.ok) {
    // Read body for status only — do not log content (may include prompt echoes).
    try {
      await response.text();
    } catch {
      /* ignore */
    }
    throw new Error(providerHttpErrorLabel(provider, response.status));
  }

  const data = (await response.json()) as {
    id?: string;
    choices?: { message?: { content?: string } }[];
    usage?: unknown;
  };
  const usage = normalizeUsage(data.usage, data.id ?? null);
  return {
    text: data.choices?.[0]?.message?.content || '',
    model,
    provider,
    usage,
    legacyUsage:
      usage.inputTokens != null || usage.outputTokens != null
        ? {
            promptTokens: usage.inputTokens ?? undefined,
            completionTokens: usage.outputTokens ?? undefined,
          }
        : undefined,
  };
}

// Main generateText function (OpenAI-compatible provider). Unchanged return type for classic Tutor.
export async function generateText(options: GenerateTextOptions): Promise<string> {
  const config = getTutorProviderConfig();
  const result = await callOpenAICompatible(options.messages, options, config);
  return result.text;
}

/** Clinical Copilot generation with explicit Muse/OpenAI config + usage metadata. */
export async function generateClinicalText(options: {
  messages: MultimodalChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  signal?: AbortSignal;
}): Promise<GenerateTextResult> {
  const config = getClinicalProviderConfig();
  return callOpenAICompatible(
    options.messages,
    {
      model: options.model || config.model,
      temperature: options.temperature ?? 0.5,
      maxTokens: options.maxTokens ?? 2500,
      signal: options.signal,
    },
    config,
  );
}

/**
 * Stream Clinical Copilot tokens (OpenAI-compatible SSE).
 * Yields text deltas; throws on HTTP/API errors.
 */
export async function* generateClinicalTextStream(options: {
  messages: MultimodalChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  signal?: AbortSignal;
}): AsyncGenerator<string, GenerateTextResult, unknown> {
  const config = getClinicalProviderConfig();
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = options.model || config.model || getClinicalModel();
  const provider = config.provider;

  if (!apiKey) {
    throw new Error(CLINICAL_PROVIDER_NOT_CONFIGURED);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 2500,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: options.signal,
    });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    throw new Error(providerHttpErrorLabel(provider, 0));
  }

  if (!response.ok) {
    try {
      await response.text();
    } catch {
      /* ignore */
    }
    throw new Error(providerHttpErrorLabel(provider, response.status));
  }

  if (!response.body) {
    throw new Error(providerHttpErrorLabel(provider, 0));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let usageRaw: unknown;
  let providerRequestId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload) as {
          id?: string;
          choices?: { delta?: { content?: string } }[];
          usage?: unknown;
        };
        if (json.id) providerRequestId = json.id;
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          yield delta;
        }
        if (json.usage) {
          usageRaw = json.usage;
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  const usage = normalizeUsage(usageRaw, providerRequestId);
  return {
    text: fullText,
    model,
    provider,
    usage,
    legacyUsage:
      usage.inputTokens != null || usage.outputTokens != null
        ? {
            promptTokens: usage.inputTokens ?? undefined,
            completionTokens: usage.outputTokens ?? undefined,
          }
        : undefined,
  };
}

export const SYSTEM_PROMPT = `You are an expert AI tutor helping students prepare for medical exams (USMLE, MBBS, anatomy exams, etc.).

Your role:
- Explain complex medical concepts clearly and accurately
- Use clinical correlations and mnemonics when helpful
- Structure answers with clear headings and bullet points
- Provide mechanism-based explanations
- Reference relevant anatomy, physiology, pathology, and pharmacology
- Be encouraging and supportive

CRITICAL RESTRICTION - SPECIALTY ONLY:
You MUST ONLY answer questions related to medical topics, healthcare, anatomy, physiology, pathology, pharmacology, and clinical medicine.
If a user asks about non-medical topics (e.g., cooking, sports, entertainment, general knowledge, coding, politics, etc.), politely decline with:
"Sunt aici pentru a te ajuta doar cu întrebări medicale și de specialitate. Te rog să mă întrebi ceva legat de anatomie, fiziologie, patologie, farmacologie sau medicină clinică."
(English: "I'm here to help only with medical and specialty questions. Please ask me something related to anatomy, physiology, pathology, pharmacology, or clinical medicine.")

Formatting guidelines:
- Use **bold** for important terms and headings
- Use bullet points (•) for lists
- Keep explanations concise but comprehensive
- End with a follow-up question or offer to explain more

Topics you cover: Anatomy, Physiology, Pathology, Pharmacology, Biochemistry, Microbiology, Immunology, Histology, Embryology, and clinical medicine.`;

export type TutorLocale = 'en' | 'ro';

/** System prompt plus explicit response language for the AI tutor. */
export function getTutorSystemPrompt(locale: TutorLocale): string {
  if (locale === 'ro') {
    return `${SYSTEM_PROMPT}

IMPORTANT — LIMBĂ: Răspunde întotdeauna în limba română. Folosește terminologie medicală corectă în română.`;
  }
  return `${SYSTEM_PROMPT}

IMPORTANT — LANGUAGE: Always respond in English.`;
}

export function getTutorAssistantPreamble(locale: TutorLocale): string {
  if (locale === 'ro') {
    return 'Înțeleg. Sunt gata să ajut studenții la medicină cu explicații precise și detaliate.';
  }
  return 'I understand. I am ready to help medical students with accurate, detailed explanations.';
}
