/**
 * Bridge quiz "Explain clinically" → Clinical chat on Tutor tab.
 * Quiz writes an intent; Tutor consumes it once and runs explainQuestion.
 */

export const CLINICAL_PENDING_EXPLAIN_KEY = 'clinical_pending_explain_v1';

/** Quiz context saved before navigating to Clinical (no API call yet). */
export type ClinicalPendingExplainIntent = {
  kind: 'intent';
  question: string;
  options: string[];
  chosenIndex: number;
  correctIndex: number;
  staticExplanation?: string;
  locale: 'en' | 'ro';
  questionId?: string;
  entryPoint?: string;
};

/** @deprecated legacy completed payload — still accepted if present */
export type ClinicalPendingExplainResult = {
  kind?: 'result';
  sessionId: string;
  response: string;
  userLabel: string;
  balance?: number;
  questionId?: string;
};

export type ClinicalPendingExplain =
  | ClinicalPendingExplainIntent
  | ClinicalPendingExplainResult;

export function isExplainIntent(
  v: ClinicalPendingExplain,
): v is ClinicalPendingExplainIntent {
  return (v as ClinicalPendingExplainIntent).kind === 'intent';
}

/** Friendly message when Zod / validation dumps are shown to users. */
export function friendlyClinicalExplainError(
  raw: string,
  fallback: string,
): string {
  const msg = (raw ?? '').trim();
  if (!msg) return fallback;
  if (
    /too_big|expected array to have|options/i.test(msg) ||
    (msg.startsWith('[') && msg.includes('"code"'))
  ) {
    return fallback;
  }
  if (msg.length > 280) return fallback;
  return msg;
}
