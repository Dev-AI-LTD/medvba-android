import type { Question } from '@/mocks/questions';

export function normalizeQuestionStem(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeQuestionsByStem(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const unique: Question[] = [];

  for (const question of questions) {
    const stem = normalizeQuestionStem(question.question_ro ?? question.question);
    if (seen.has(stem)) continue;
    seen.add(stem);
    unique.push(question);
  }

  return unique;
}

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function filterUnseenQuestions(questions: Question[], seenIds: Set<string>): Question[] {
  return questions.filter((question) => !seenIds.has(question.id));
}

/**
 * Pick up to `count` questions with unique stems. Prefers unseen ids; recycles only when needed.
 */
export function selectUniqueQuestions(
  pool: Question[],
  count: number,
  seenIds: Set<string>,
): Question[] {
  const dedupedPool = dedupeQuestionsByStem(pool);
  const unseen = filterUnseenQuestions(dedupedPool, seenIds);
  const seen = dedupedPool.filter((question) => seenIds.has(question.id));

  const selected: Question[] = [];
  const usedStems = new Set<string>();

  const takeFrom = (candidates: Question[]) => {
    for (const question of fisherYatesShuffle(candidates)) {
      if (selected.length >= count) return;
      const stem = normalizeQuestionStem(question.question_ro ?? question.question);
      if (usedStems.has(stem)) continue;
      usedStems.add(stem);
      selected.push(question);
    }
  };

  takeFrom(unseen);
  if (selected.length < count) {
    takeFrom(seen);
  }

  return selected;
}

export function getSeenQuestionsStorageKey(category: string, mode?: string): string {
  if (mode === 'exam') {
    return `user_seen_questions_${category}_exam`;
  }
  return `user_seen_questions_${category}`;
}
