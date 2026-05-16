import { z } from "zod";
import type { Question } from "@/mocks/questions";
import { questionTranslations, QuestionTranslation } from "@/locales/questionTranslations";
import { llmGenerateObjectJson } from "@/lib/llm-generate-object-json";
import { allQuestions } from "@/lib/quizSessionQuestionPool";
import { hasFullRomanianQuizContent } from "@/lib/quizRomanianCompleteness";

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

/** Dedupe by `id` (first occurrence wins), same as canonical quiz pool semantics. */
export function dedupeQuizPoolQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of questions) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

function needsLanguageTranslation(q: Question, lang: "ro" | "es" | "pt"): boolean {
  if (lang === "ro") {
    return !hasFullRomanianQuizContent(q);
  }
  return !questionTranslations[q.id]?.[lang];
}

/** For UI / CLI: whether this quiz question still needs a row in `questionTranslations` for `lang`. */
export function questionNeedsTargetLanguage(q: Question, lang: "ro" | "es" | "pt"): boolean {
  return needsLanguageTranslation(q, lang);
}

function countTranslationUnits(questions: Question[], langs: ("ro" | "es" | "pt")[]): number {
  let n = 0;
  for (const q of questions) {
    for (const l of langs) {
      if (needsLanguageTranslation(q, l)) n++;
    }
  }
  return n;
}

function buildTranslationPrompt(
  questionsForTranslation: { id: string; question: string; options: string[]; explanation: string }[],
  targetLanguages: ("ro" | "es" | "pt")[],
): string {
  const languageNames = { ro: "Romanian", es: "Spanish", pt: "Portuguese" } as const;
  const targetLangNames = targetLanguages.map((l) => languageNames[l]).join(", ");

  const scopeNote =
    targetLanguages.length === 1
      ? `Translate each question from English to ${targetLangNames} only.`
      : `Translate each question from English to ${targetLangNames}.`;

  return `You are a medical translator specializing in anatomy and medical terminology.

${scopeNote}

Questions to translate:
${JSON.stringify(questionsForTranslation, null, 2)}

Important:
- Medical terminology must be accurate and professional; keep an educational tone.
- Each translated question MUST have the same number of options as the English original.
- Translate the explanation whenever the English source has a non-empty explanation (post-answer feedback).
- Preserve meaning; do not add or remove answer choices.

Output shape (required): a single JSON object with exactly one top-level key "translations", whose value is an array with one element per input question, in any order, each element shaped as:
{"id":"<same as input>","question":"...","options":["..."],"explanation":"..."}
Do not wrap the JSON in markdown. Do not add other top-level keys.`;
}

export interface BatchTranslateOptions {
  /** After filtering, skip this many questions (resume / chunking). */
  skipQuestions?: number;
  /** After skip, process at most this many questions (default: all remaining). */
  maxQuestions?: number;
  /** Override question list (default: deduped {@link allQuestions} from quiz session pool). */
  sourceQuestions?: Question[];
}

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

/** Models sometimes use another key or a bare array; normalize to `{ translations }` before Zod. */
export function coerceTranslationBatchRoot(parsed: unknown): unknown {
  if (parsed === null || parsed === undefined) return parsed;
  if (Array.isArray(parsed)) {
    return { translations: parsed };
  }
  if (typeof parsed !== "object") return parsed;
  const o = parsed as Record<string, unknown>;
  const keys = [
    "translations",
    "items",
    "data",
    "questions",
    "results",
    "translated_questions",
    "output",
  ];
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return { translations: v };
  }
  if (Array.isArray(o.result)) return { translations: o.result };
  return parsed;
}

async function translateAndMergeBatch(
  batch: Question[],
  targetLanguages: ("ro" | "es" | "pt")[],
  result: TranslationResult,
  errors: string[],
): Promise<number> {
  let pairs = 0;
  for (let li = 0; li < targetLanguages.length; li++) {
    const lang = targetLanguages[li];
    const subBatch = batch.filter((q) => needsLanguageTranslation(q, lang));
    if (subBatch.length === 0) continue;

    if (li > 0) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    const questionsForTranslation = subBatch.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      explanation: q.explanation,
    }));

    const prompt = buildTranslationPrompt(questionsForTranslation, [lang]);
    const translation = await llmGenerateObjectJson(prompt, translationSchema, {
      coerceParsedJson: coerceTranslationBatchRoot,
    });

    const byId = new Map(subBatch.map((q) => [q.id, q]));
    for (const t of translation.translations) {
      const source = byId.get(t.id);
      if (!source) {
        errors.push(`Batch returned unknown id: ${t.id}`);
        continue;
      }
      if (t.options.length !== source.options.length) {
        errors.push(
          `Id ${t.id} (${lang}): expected ${source.options.length} options, got ${t.options.length}`,
        );
        continue;
      }
      if (!result[t.id]) {
        result[t.id] = {};
      }
      result[t.id][lang] = {
        question: t.question,
        options: t.options,
        explanation: t.explanation,
      };
      pairs++;
    }
  }
  return pairs;
}

/** Questions still needing any of `targetLanguages`, after skip/max (same slice as batch translate). */
export function getPendingTranslationQuestions(
  targetLanguages: ("ro" | "es" | "pt")[],
  opts?: BatchTranslateOptions,
): Question[] {
  const base = dedupeQuizPoolQuestions(opts?.sourceQuestions ?? allQuestions);
  let list = base.filter((q) =>
    targetLanguages.some((lang) => needsLanguageTranslation(q, lang)),
  );
  const skip = Math.max(0, opts?.skipQuestions ?? 0);
  if (skip > 0) {
    list = list.slice(skip);
  }
  if (opts?.maxQuestions !== undefined) {
    list = list.slice(0, Math.max(0, opts.maxQuestions));
  }
  return list;
}

export async function batchTranslateQuestions(
  targetLanguages: ("ro" | "es" | "pt")[] = ["ro"],
  onProgress?: (progress: TranslationProgress) => void,
  opts?: BatchTranslateOptions,
): Promise<TranslationResult> {
  const untranslatedQuestions = getPendingTranslationQuestions(targetLanguages, opts);

  console.log(
    `Found ${untranslatedQuestions.length} question(s) needing translation (${targetLanguages.join(", ")})`,
  );

  const result: TranslationResult = JSON.parse(JSON.stringify(questionTranslations));
  const errors: string[] = [];
  let completed = 0;
  const total = countTranslationUnits(untranslatedQuestions, targetLanguages);
  const totalBatches = Math.ceil(untranslatedQuestions.length / BATCH_SIZE) || 0;

  for (let i = 0; i < untranslatedQuestions.length; i += BATCH_SIZE) {
    const batch = untranslatedQuestions.slice(i, i + BATCH_SIZE);

    try {
      onProgress?.({
        total,
        completed,
        current: `Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches || 1}`,
        errors,
      });

      const n = await translateAndMergeBatch(batch, targetLanguages, result, errors);
      completed += n;

      onProgress?.({
        total,
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
  correctAnswer?: number;
}

export const questionTranslations: Record<string, Record<string, QuestionTranslation>> = ${JSON.stringify(translations, null, 2)};
`;
}

export async function translateSpecificCategory(
  category: string,
  targetLanguages: ("ro" | "es" | "pt")[] = ["ro"],
  onProgress?: (progress: TranslationProgress) => void,
  opts?: Omit<BatchTranslateOptions, "sourceQuestions">,
): Promise<TranslationResult> {
  const base = dedupeQuizPoolQuestions(allQuestions).filter((q) => q.category === category);
  let categoryQuestions = base.filter((q) =>
    targetLanguages.some((lang) => needsLanguageTranslation(q, lang)),
  );
  const skip = Math.max(0, opts?.skipQuestions ?? 0);
  if (skip > 0) {
    categoryQuestions = categoryQuestions.slice(skip);
  }
  if (opts?.maxQuestions !== undefined) {
    categoryQuestions = categoryQuestions.slice(0, Math.max(0, opts.maxQuestions));
  }

  console.log(`Found ${categoryQuestions.length} question(s) in "${category}" needing translation`);

  const result: TranslationResult = JSON.parse(JSON.stringify(questionTranslations));
  const errors: string[] = [];
  let completed = 0;
  const total = countTranslationUnits(categoryQuestions, targetLanguages);
  const totalBatches = Math.ceil(categoryQuestions.length / BATCH_SIZE) || 0;

  for (let i = 0; i < categoryQuestions.length; i += BATCH_SIZE) {
    const batch = categoryQuestions.slice(i, i + BATCH_SIZE);

    try {
      onProgress?.({
        total,
        completed,
        current: `Translating ${category} - batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches || 1}`,
        errors,
      });

      const n = await translateAndMergeBatch(batch, targetLanguages, result, errors);
      completed += n;

      onProgress?.({
        total,
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
