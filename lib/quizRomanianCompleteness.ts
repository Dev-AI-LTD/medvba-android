import type { Question } from '@/mocks/questions';
import { questionTranslations } from '@/locales/questionTranslations';

/** EN has a non-empty explanation → RO must provide one (embedded or questionTranslations). */
function englishExplanationPresent(q: Question): boolean {
  return Boolean(q.explanation?.trim());
}

/**
 * True when Romanian covers everything the user sees in RO mode:
 * question, all option labels, and (if English has one) the post-answer explanation.
 * Matches resolution order in translateQuestion: embedded ro fields first, else questionTranslations.ro.
 */
export function hasFullRomanianQuizContent(q: Question): boolean {
  const n = q.options?.length ?? 0;
  if (n === 0) return false;

  const embeddedStemAndOptions =
    Boolean(q.question_ro?.trim()) &&
    Boolean(q.options_ro?.length === n);

  if (embeddedStemAndOptions) {
    if (!englishExplanationPresent(q)) return true;
    return Boolean(q.explanation_ro?.trim());
  }

  const tr = questionTranslations[q.id]?.ro;
  if (!tr?.question?.trim() || !tr.options || tr.options.length !== n) return false;
  if (!englishExplanationPresent(q)) return true;
  return Boolean(tr.explanation?.trim());
}

/** Non-null when RO exists but is inconsistent or incomplete (for audit reports). */
export function romanianTranslationIssue(q: Question): string | null {
  const n = q.options?.length ?? 0;
  const tr = questionTranslations[q.id]?.ro;

  if (tr?.question && tr.options && tr.options.length !== n) {
    return `questionTranslations.ro: ${tr.options.length} variante vs EN ${n}`;
  }
  if (q.question_ro && q.options_ro && q.options_ro.length !== n) {
    return `embedded: options_ro are ${q.options_ro.length} vs EN ${n}`;
  }

  const embeddedStemAndOptions =
    Boolean(q.question_ro?.trim()) &&
    Boolean(q.options_ro?.length === n);
  if (embeddedStemAndOptions && englishExplanationPresent(q) && !q.explanation_ro?.trim()) {
    return 'embedded: lipsă explanation_ro (există explicație EN)';
  }
  if (tr?.question && tr.options && tr.options.length === n && englishExplanationPresent(q) && !tr.explanation?.trim()) {
    return 'questionTranslations.ro: lipsă explanation (există explicație EN)';
  }

  return null;
}
