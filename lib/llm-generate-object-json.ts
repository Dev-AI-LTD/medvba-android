import { z } from 'zod';

/**
 * OpenAI key for batch translation tooling (CLI + optional in-app dev screen).
 * Prefer OPENAI_API_KEY / AI_API_KEY (scripts, never bundled).
 * EXPO_PUBLIC_OPENAI_API_KEY is only for local Expo when using app/batch-translate — never ship real keys in production store builds.
 */
export function resolveOpenAIApiKeyForBatchTools(): string {
  const fromSecret =
    (typeof process !== 'undefined' && process.env.OPENAI_API_KEY?.trim()) ||
    (typeof process !== 'undefined' && process.env.AI_API_KEY?.trim()) ||
    '';
  const fromPublic =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim()) || '';
  const key = fromSecret || fromPublic;
  if (!key) {
    throw new Error(
      'Missing OpenAI API key. Set OPENAI_API_KEY or AI_API_KEY in .env for scripts. ' +
        'For the in-app batch translator in Expo dev only, you may set EXPO_PUBLIC_OPENAI_API_KEY — do not use production secrets in store builds.',
    );
  }
  return key;
}

/**
 * Structured JSON via OpenAI `response_format: json_object` + Zod validation.
 * Same transport style as {@link ./ai-provider.ts} `callOpenAI`.
 */
export async function llmGenerateObjectJson<T extends z.ZodTypeAny>(
  prompt: string,
  schema: T,
): Promise<z.infer<T>> {
  const apiKey = resolveOpenAIApiKeyForBatchTools();
  const baseUrl = (process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL?.trim() || 'gpt-4o-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nReply with a single JSON object only (no markdown code fences). The JSON must match the expected structure.`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenAI response missing message content');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON message content');
  }

  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI JSON failed schema validation: ${parsed.error.message}`);
  }

  return parsed.data;
}
