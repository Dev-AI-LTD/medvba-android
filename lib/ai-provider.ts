/**
 * AI Provider abstraction layer
 * MEDVBA backend AI client (OpenAI-compatible).
 */

export type AIProvider = 'openai';

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
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

export interface GenerateTextResult {
  text: string;
  model: string;
  /** Estimated usage when API returns usage; otherwise undefined. */
  usage?: { promptTokens?: number; completionTokens?: number };
}

function getProviderConfig(): AIProviderConfig {
  return {
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  };
}

/** Clinical / Muse Spark compatible model override (falls back to AI_MODEL). */
export function getClinicalModel(): string {
  return (
    process.env.AI_CLINICAL_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    'gpt-4o-mini'
  );
}

async function callOpenAICompatible(
  messages: MultimodalChatMessage[],
  options: { model?: string; temperature?: number; maxTokens?: number },
  config: AIProviderConfig,
): Promise<GenerateTextResult> {
  const apiKey = config.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = options.model || config.model || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set AI_API_KEY (or OPENAI_API_KEY) on the backend.');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        }
      : undefined,
  };
}

// Main generateText function (OpenAI-compatible provider). Unchanged return type for classic Tutor.
export async function generateText(options: GenerateTextOptions): Promise<string> {
  const config = getProviderConfig();
  const result = await callOpenAICompatible(options.messages, options, config);
  return result.text;
}

/** Clinical Copilot generation with model override + usage metadata. */
export async function generateClinicalText(options: {
  messages: MultimodalChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): Promise<GenerateTextResult> {
  const config = getProviderConfig();
  return callOpenAICompatible(
    options.messages,
    {
      model: options.model || getClinicalModel(),
      temperature: options.temperature ?? 0.5,
      maxTokens: options.maxTokens ?? 2500,
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
  const config = getProviderConfig();
  const apiKey = config.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = options.model || getClinicalModel() || config.model || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set AI_API_KEY (or OPENAI_API_KEY) on the backend.');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
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
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  if (!response.body) {
    throw new Error('OpenAI API returned empty stream body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;

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
          choices?: { delta?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          yield delta;
        }
        if (json.usage) {
          promptTokens = json.usage.prompt_tokens;
          completionTokens = json.usage.completion_tokens;
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  return {
    text: fullText,
    model,
    usage:
      promptTokens != null || completionTokens != null
        ? { promptTokens, completionTokens }
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
