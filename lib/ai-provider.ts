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

function getProviderConfig(): AIProviderConfig {
  return {
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  };
}

// OpenAI compatible API call
async function callOpenAI(options: GenerateTextOptions, config: AIProviderConfig): Promise<string> {
  const { messages, model, temperature = 0.7, maxTokens = 2000 } = options;
  
  const apiKey = config.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set AI_API_KEY (or OPENAI_API_KEY) on the backend.');
  }
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || config.model || 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Main generateText function (OpenAI-compatible provider).
export async function generateText(options: GenerateTextOptions): Promise<string> {
  const config = getProviderConfig();
  return callOpenAI(options, config);
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
