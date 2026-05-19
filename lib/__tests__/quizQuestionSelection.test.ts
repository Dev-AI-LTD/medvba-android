import type { Question } from '@/mocks/questions';
import {
  dedupeQuestionsByStem,
  getSeenQuestionsStorageKey,
  normalizeQuestionStem,
  selectUniqueQuestions,
} from '@/lib/quizQuestionSelection';

const baseQuestion = (id: string, question: string): Question => ({
  id,
  category: 'head-neck',
  difficulty: 'easy',
  question,
  options: ['A', 'B', 'C', 'D', 'E'],
  correctAnswer: 0,
  explanation: 'x',
});

describe('quizQuestionSelection', () => {
  it('normalizes stems for dedupe', () => {
    expect(normalizeQuestionStem('Care   dintre  oase?')).toBe('care dintre oase?');
  });

  it('dedupes questions with the same stem', () => {
    const pool = [
      baseQuestion('a', 'Care dintre oase?'),
      baseQuestion('b', 'Care dintre oase?'),
      baseQuestion('c', 'Altă întrebare'),
    ];
    expect(dedupeQuestionsByStem(pool)).toHaveLength(2);
  });

  it('never selects duplicate stems in exam mode selection', () => {
    const pool = [
      baseQuestion('a', 'Care dintre oase?'),
      baseQuestion('b', 'Care dintre oase?'),
      baseQuestion('c', 'Altă întrebare'),
      baseQuestion('d', 'A treia'),
    ];
    const selected = selectUniqueQuestions(pool, 3, new Set());
    const stems = selected.map((question) => normalizeQuestionStem(question.question));
    expect(new Set(stems).size).toBe(stems.length);
    expect(selected).toHaveLength(3);
  });

  it('uses separate storage keys for exam history', () => {
    expect(getSeenQuestionsStorageKey('head-neck')).toBe('user_seen_questions_head-neck');
    expect(getSeenQuestionsStorageKey('head-neck', 'exam')).toBe('user_seen_questions_head-neck_exam');
  });
});
