import { z } from "zod";
import { sampleQuestions } from "@/mocks/questions";
import { questionTranslations, QuestionTranslation } from "@/locales/questionTranslations";
import { llmGenerateObjectJson } from "@/lib/llm-generate-object-json";

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

export interface TranslationProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

export type TranslationResult = Record<string, Record<string, QuestionTranslation>>;

const translationSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      explanation: z.string(),
    })
  ),
});

export async function batchTranslateQuestions(
  targetLanguages: ('ro' | 'es' | 'pt')[] = ['ro'],
  onProgress?: (progress: TranslationProgress) => void
): Promise<TranslationResult> {
  const untranslatedQuestions = sampleQuestions.filter(
    (q) => targetLanguages.some(lang => !questionTranslations[q.id]?.[lang])
  );

  console.log(`Found ${untranslatedQuestions.length} untranslated questions`);

  const result: TranslationResult = JSON.parse(JSON.stringify(questionTranslations));
  const errors: string[] = [];
  let completed = 0;

  for (let i = 0; i < untranslatedQuestions.length; i += BATCH_SIZE) {
    const batch = untranslatedQuestions.slice(i, i + BATCH_SIZE);
    
    try {
      onProgress?.({
        total: untranslatedQuestions.length,
        completed,
        current: `Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(untranslatedQuestions.length / BATCH_SIZE)}`,
        errors,
      });

      const questionsForTranslation = batch.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      }));

      const languageNames = {
        ro: 'Romanian',
        es: 'Spanish',
        pt: 'Portuguese'
      };
      
      const targetLangNames = targetLanguages.map(l => languageNames[l]).join(', ');
      
      const prompt = `Translate the following anatomy quiz questions from English to ${targetLangNames}. 
Keep medical terminology accurate and professional.
Return the SAME translations for ALL languages requested.

Questions to translate:
${JSON.stringify(questionsForTranslation, null, 2)}

Important:
- Translate all medical terms accurately
- Keep the professional tone
- Ensure each question has the same number of options as the original
- Make sure explanations are clear and educational
- The translations should be identical for each requested language`;

      const translation = await llmGenerateObjectJson(prompt, translationSchema);

      for (const t of translation.translations) {
        if (!result[t.id]) {
          result[t.id] = {};
        }
        for (const lang of targetLanguages) {
          result[t.id][lang] = {
            question: t.question,
            options: t.options,
            explanation: t.explanation,
          };
        }
        completed++;
      }

      onProgress?.({
        total: untranslatedQuestions.length,
        completed,
        current: `Completed batch ${Math.floor(i / BATCH_SIZE) + 1}`,
        errors,
      });

      if (i + BATCH_SIZE < untranslatedQuestions.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    } catch (error) {
      const errorMsg = `Error translating batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return result;
}

export function generateTranslationFile(translations: TranslationResult): string {
  return `export interface QuestionTranslation {
  question: string;
  options: string[];
  explanation: string;
}

export const questionTranslations: Record<string, Record<string, QuestionTranslation>> = ${JSON.stringify(translations, null, 2)};
`;
}

export async function translateSpecificCategory(
  category: string,
  targetLanguages: ('ro' | 'es' | 'pt')[] = ['ro'],
  onProgress?: (progress: TranslationProgress) => void
): Promise<TranslationResult> {
  const categoryQuestions = sampleQuestions.filter((q) => 
    q.category === category && targetLanguages.some(lang => !questionTranslations[q.id]?.[lang])
  );

  console.log(`Found ${categoryQuestions.length} untranslated questions in category: ${category}`);

  const result: TranslationResult = JSON.parse(JSON.stringify(questionTranslations));
  const errors: string[] = [];
  let completed = 0;

  for (let i = 0; i < categoryQuestions.length; i += BATCH_SIZE) {
    const batch = categoryQuestions.slice(i, i + BATCH_SIZE);
    
    try {
      onProgress?.({
        total: categoryQuestions.length,
        completed,
        current: `Translating ${category} - batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(categoryQuestions.length / BATCH_SIZE)}`,
        errors,
      });

      const questionsForTranslation = batch.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      }));

      const languageNames = {
        ro: 'Romanian',
        es: 'Spanish',
        pt: 'Portuguese'
      };
      
      const targetLangNames = targetLanguages.map(l => languageNames[l]).join(', ');
      
      const prompt = `Translate the following anatomy quiz questions from English to ${targetLangNames}.
Keep medical terminology accurate and professional.
Return the SAME translations for ALL languages requested.

Questions to translate:
${JSON.stringify(questionsForTranslation, null, 2)}

Important:
- Translate all medical terms accurately
- Keep the professional tone
- Ensure each question has the same number of options as the original
- Make sure explanations are clear and educational
- The translations should be identical for each requested language`;

      const translation = await llmGenerateObjectJson(prompt, translationSchema);

      for (const t of translation.translations) {
        if (!result[t.id]) {
          result[t.id] = {};
        }
        for (const lang of targetLanguages) {
          result[t.id][lang] = {
            question: t.question,
            options: t.options,
            explanation: t.explanation,
          };
        }
        completed++;
      }

      onProgress?.({
        total: categoryQuestions.length,
        completed,
        current: `Completed ${category} - batch ${Math.floor(i / BATCH_SIZE) + 1}`,
        errors,
      });

      if (i + BATCH_SIZE < categoryQuestions.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    } catch (error) {
      const errorMsg = `Error translating ${category} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return result;
}
