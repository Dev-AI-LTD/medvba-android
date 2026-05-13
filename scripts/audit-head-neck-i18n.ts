/**
 * Audit Head & Neck question bank for EN/RO i18n readiness.
 *
 * Target model (aligned with internal-organs / intro hn-001):
 * - `question`, `options`, `explanation` = English (primary for UI language "en")
 * - `question_ro`, `options_ro`, `explanation_ro` = Romanian
 *
 * Lot plan (suggested order — smallest / most isolated first, then by chapter file order):
 * DONE: frontalBoneQuestions, parietalBoneQuestions, ethmoidBoneQuestions, sphenoidBoneQuestions,
 *       occipitalBoneQuestions, temporalBoneQuestions, maxillaQuestions, mandibulaQuestions,
 *       zigomaticBoneQuestions, palatineBoneQuestions, inferiorNasalConchaQuestions,
 *       lacrimalBoneQuestions, vomerQuestions
 * THEN: nasalBoneQuestions … masticatoryMusclesQuestions (questions_head_neck_continued.ts)
 *
 * Run from repo root: `bun run audit:head-neck-i18n`
 */
import * as hn from '../mocks/questions_head_neck';
import * as hn2 from '../mocks/questions_head_neck_continued';
import { headNeckQuestions } from '../mocks/questions_internal_organs';
import type { Question } from '../mocks/questions';
import { questionTranslations } from '../locales/questionTranslations';

type Row = {
  id: string;
  bank: string;
  hasQuestionRo: boolean;
  hasOptionsRo: boolean;
  hasExplanationRo: boolean;
  optionsRoLenOk: boolean;
  hasJsonEn: boolean;
  hasJsonRo: boolean;
};

function isQuestionArray(v: unknown): v is Question[] {
  return Array.isArray(v) && v.length > 0 && typeof (v[0] as Question)?.id === 'string';
}

function collectRows(mod: Record<string, unknown>, bankLabel: string): Row[] {
  const rows: Row[] = [];
  for (const [exportName, val] of Object.entries(mod)) {
    if (!exportName.endsWith('Questions') || !isQuestionArray(val)) continue;
    for (const q of val) {
      if (q.category !== 'head-neck') continue;
      const optsLen = q.options?.length ?? 0;
      const roLen = q.options_ro?.length ?? 0;
      const json = questionTranslations[q.id];
      rows.push({
        id: q.id,
        bank: `${bankLabel}:${exportName}`,
        hasQuestionRo: typeof q.question_ro === 'string' && q.question_ro.length > 0,
        hasOptionsRo: Array.isArray(q.options_ro) && q.options_ro.length > 0,
        hasExplanationRo: typeof q.explanation_ro === 'string' && q.explanation_ro.length > 0,
        optionsRoLenOk: roLen === 0 || roLen === optsLen,
        hasJsonEn: !!json?.en,
        hasJsonRo: !!json?.ro,
      });
    }
  }
  return rows;
}

function main() {
  const intro = headNeckQuestions.filter((q) => q.category === 'head-neck');
  const introBilingual = intro.filter(
    (q) =>
      typeof q.question_ro === 'string' &&
      q.question_ro.length > 0 &&
      Array.isArray(q.options_ro) &&
      q.options_ro.length === (q.options?.length ?? 0),
  );

  const rows = [...collectRows(hn as Record<string, unknown>, 'head_neck'), ...collectRows(hn2 as Record<string, unknown>, 'head_neck_continued')];

  const missingQuestionRo = rows.filter((r) => !r.hasQuestionRo);
  const missingOptionsRo = rows.filter((r) => !r.hasOptionsRo || !r.optionsRoLenOk);
  const missingExplanationRo = rows.filter((r) => !r.hasExplanationRo);
  const hasRoFields = rows.filter((r) => r.hasQuestionRo && r.hasOptionsRo && r.optionsRoLenOk);
  const jsonEnButNoBilingual = rows.filter((r) => r.hasJsonEn && !r.hasQuestionRo);

  console.log('=== Head & Neck i18n audit ===\n');
  console.log(`Intro bank (questions_internal_organs.headNeckQuestions): ${intro.length} items, bilingual-ready: ${introBilingual.length}`);
  console.log(`Detailed banks (questions_head_neck*.ts): ${rows.length} items\n`);
  console.log(`Total head-neck questions: ${rows.length}`);
  console.log(`With question_ro + options_ro (length match): ${hasRoFields.length}`);
  console.log(`Missing question_ro (RO not split to _ro — primary likely RO-only): ${missingQuestionRo.length}`);
  console.log(`Missing or length-mismatched options_ro: ${missingOptionsRo.length}`);
  console.log(`Missing explanation_ro: ${missingExplanationRo.length}`);
  console.log(`questionTranslations[id].en present (JSON) but no question_ro on card: ${jsonEnButNoBilingual.length}`);
  console.log('');

  const byBank = new Map<string, number>();
  for (const r of missingQuestionRo) {
    byBank.set(r.bank, (byBank.get(r.bank) ?? 0) + 1);
  }
  console.log('--- Missing question_ro, by export (work queue) ---');
  const sorted = [...byBank.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [bank, n] of sorted) {
    console.log(`${n}\t${bank}`);
  }
  console.log('');

  const args = process.argv.slice(2);
  if (args.includes('--ids')) {
    console.log('--- IDs missing question_ro (first 80) ---');
    console.log(missingQuestionRo.slice(0, 80).map((r) => r.id).join('\n'));
    if (missingQuestionRo.length > 80) console.log(`… +${missingQuestionRo.length - 80} more`);
    console.log('');
  }

  console.log('Tip: run with --ids to print missing question_ro ids (truncated to 80).');
  console.log('Remediation: move current RO text from primary fields to *_ro, add EN primary, or add `en` in questionTranslations and teach translateQuestion to apply it for UI en.');
}

main();
