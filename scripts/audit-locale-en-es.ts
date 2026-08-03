/**
 * Verify Batch 1 + Batch 2 UI strings for en ↔ es:
 * - Batch 1: auth.*, onboarding.*, offline.*
 * - Batch 2: Home + Quiz chrome + Home/Quiz tabs (exact 61 keys)
 *
 * Fails on missing, empty, or extra keys within those batches.
 * Full-catalog gaps remain informational.
 *
 * Run: bun run audit:locales-en-es
 */
import { en } from '../locales/en';
import { es } from '../locales/es';

const BATCH1_PREFIXES = ['auth.', 'onboarding.', 'offline.'] as const;

/** Approved Localization Phase 2 key list (Home 30 + Quiz chrome 27 + tabs 4 = 61). */
const BATCH2_KEYS = [
  // A. Home (30)
  'home.title',
  'home.greeting',
  'home.greetingMorning',
  'home.greetingAfternoon',
  'home.greetingEvening',
  'home.continueLearning',
  'home.questionsToday',
  'home.startQuiz',
  'home.continueQuiz',
  'home.today',
  'home.accuracy',
  'home.questions',
  'home.studyTime',
  'home.yourProgress',
  'home.complete',
  'home.ofQuestions',
  'home.quickStartAnatomy',
  'home.seeAll',
  'home.categoryQuestions',
  'home.categoryLockedSubtitle',
  'home.dailyLimitTitle',
  'home.dailyLimitMessage',
  'home.freeQuizLimitTitle',
  'home.freeQuizLimitMessage',
  'home.later',
  'home.upgradePremiumShort',
  'home.premiumFeatureTitle',
  'home.premiumFeatureMessage',
  'home.upgradeBannerTitle',
  'home.upgradeBannerSubtitle',
  // B. Quiz chrome (27) — quiz.* setup chrome + session.expired* + home.quickQuiz
  'home.quickQuiz',
  'quiz.title',
  'quiz.subtitle',
  'quiz.quizModes',
  'quiz.quickQuiz',
  'quiz.quickQuizCount',
  'quiz.practice',
  'quiz.practiceCount',
  'quiz.examSimulation',
  'quiz.examDetails',
  'quiz.categories',
  'quiz.tapToDeselect',
  'quiz.selectCategory',
  'quiz.totalQuestions',
  'quiz.languages',
  'quiz.difficultyLevels',
  'quiz.practiceUnlimited',
  'quiz.freeQuizzesRemaining',
  'quiz.dailyLimitReached',
  'quiz.chaptersSubtitle',
  'quiz.readChapterSummary',
  'quiz.studyCardTitle',
  'quiz.studyCardSubtitle',
  'quiz.allChapters',
  'quiz.questionsShort',
  'session.expiredTitle',
  'session.expiredMessage',
  // C. Shared Home/Quiz tabs (4)
  'tabs.home',
  'tabs.homeIconA11y',
  'tabs.quiz',
  'tabs.quizIconA11y',
] as const;

function isBatch1Key(key: string): boolean {
  return BATCH1_PREFIXES.some((p) => key.startsWith(p));
}

function auditBatch(
  label: string,
  batchKeys: string[],
  enMap: Record<string, string>,
  esMap: Record<string, string>,
): boolean {
  const enSet = new Set(Object.keys(enMap));
  const esSet = new Set(Object.keys(esMap));

  const missingInEn = batchKeys.filter((k) => !enSet.has(k));
  const missingInEs = batchKeys.filter((k) => !esSet.has(k));
  const emptyInEn = batchKeys.filter((k) => enSet.has(k) && String(enMap[k] ?? '').trim() === '');
  const emptyInEs = batchKeys.filter((k) => esSet.has(k) && String(esMap[k] ?? '').trim() === '');

  console.log(`=== ${label} ===\n`);
  console.log(`Batch keys: ${batchKeys.length}`);
  console.log(`Missing in en.ts: ${missingInEn.length}`);
  if (missingInEn.length) console.log(missingInEn.join('\n'));
  console.log(`\nMissing in es.ts: ${missingInEs.length}`);
  if (missingInEs.length) console.log(missingInEs.join('\n'));
  console.log(`\nEmpty values in en.ts: ${emptyInEn.length}`);
  if (emptyInEn.length) console.log(emptyInEn.join('\n'));
  console.log(`\nEmpty values in es.ts: ${emptyInEs.length}`);
  if (emptyInEs.length) console.log(emptyInEs.join('\n'));

  return (
    missingInEn.length === 0 &&
    missingInEs.length === 0 &&
    emptyInEn.length === 0 &&
    emptyInEs.length === 0
  );
}

function main() {
  const enKeys = Object.keys(en).sort();
  const esKeys = Object.keys(es).sort();
  const enSet = new Set(enKeys);
  const esSet = new Set(esKeys);

  const batch1En = enKeys.filter(isBatch1Key);
  const batch1Es = esKeys.filter(isBatch1Key);
  const batch1EnSet = new Set(batch1En);
  const batch1EsSet = new Set(batch1Es);

  const batch1MissingInEs = batch1En.filter((k) => !batch1EsSet.has(k));
  const batch1ExtraInEs = batch1Es.filter((k) => !batch1EnSet.has(k));
  const batch1EmptyInEs = batch1En.filter((k) => {
    if (!batch1EsSet.has(k)) return false;
    return String(es[k] ?? '').trim() === '';
  });
  const batch1EmptyInEn = batch1En.filter((k) => String(en[k] ?? '').trim() === '');

  console.log('=== audit:locales-en-es (Batch 1: auth/onboarding/offline) ===\n');
  console.log(`Batch 1 keys: en=${batch1En.length} es=${batch1Es.length}`);
  console.log(`Missing in es.ts: ${batch1MissingInEs.length}`);
  if (batch1MissingInEs.length) console.log(batch1MissingInEs.join('\n'));
  console.log(`\nExtra in es.ts (Batch 1): ${batch1ExtraInEs.length}`);
  if (batch1ExtraInEs.length) console.log(batch1ExtraInEs.join('\n'));
  console.log(`\nEmpty values in es.ts (Batch 1): ${batch1EmptyInEs.length}`);
  if (batch1EmptyInEs.length) console.log(batch1EmptyInEs.join('\n'));
  console.log(`\nEmpty values in en.ts (Batch 1): ${batch1EmptyInEn.length}`);
  if (batch1EmptyInEn.length) console.log(batch1EmptyInEn.join('\n'));

  const batch1Ok =
    batch1MissingInEs.length === 0 &&
    batch1ExtraInEs.length === 0 &&
    batch1EmptyInEs.length === 0 &&
    batch1EmptyInEn.length === 0;

  console.log('');
  const batch2Keys = [...BATCH2_KEYS];
  if (batch2Keys.length !== 61) {
    console.error(`FAILED: BATCH2_KEYS length is ${batch2Keys.length}, expected 61.`);
    process.exit(1);
  }
  const batch2Ok = auditBatch('audit:locales-en-es (Batch 2: Home + Quiz chrome)', batch2Keys, en, es);

  const catalogOnlyEn = enKeys.filter((k) => !esSet.has(k));
  const catalogOnlyEs = esKeys.filter((k) => !enSet.has(k));

  console.log('\n--- Full catalog (informational; not a batch failure) ---');
  console.log(`UI keys: en=${enKeys.length} es=${esKeys.length}`);
  console.log(`Only in en.ts (full catalog): ${catalogOnlyEn.length}`);
  console.log(`Only in es.ts (full catalog): ${catalogOnlyEs.length}`);

  if (!batch1Ok || !batch2Ok) {
    console.error('\nFAILED: fix Batch 1 / Batch 2 en/es mismatches above.');
    process.exit(1);
  }
  console.log('\nOK: Batch 1 + Batch 2 en/es locale parity.');
}

main();
