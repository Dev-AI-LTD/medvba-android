import {
  getCorrectAnswerIndices,
  isAnswerCorrect,
  isMultiSelectQuestion,
  toggleSelectedIndex,
} from '@/lib/questionAnswer';
import type { Question } from '@/mocks/questions';

describe('questionAnswer', () => {
  const multiQuestion: Question = {
    id: 'test-multi',
    category: 'neuroanatomy',
    difficulty: 'medium',
    format: 'multiple',
    question: 'Stem',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    correctAnswers: [0, 2, 3],
    explanation: 'x',
  };

  const singleQuestion: Question = {
    id: 'test-single',
    category: 'neuroanatomy',
    difficulty: 'easy',
    question: 'Stem',
    options: ['A', 'B'],
    correctAnswer: 1,
    explanation: 'x',
  };

  it('detects multi-select questions', () => {
    expect(isMultiSelectQuestion(multiQuestion)).toBe(true);
    expect(isMultiSelectQuestion(singleQuestion)).toBe(false);
  });

  it('validates exact multi-select answers only', () => {
    expect(isAnswerCorrect(multiQuestion, [0, 2, 3])).toBe(true);
    expect(isAnswerCorrect(multiQuestion, [0, 2])).toBe(false);
    expect(isAnswerCorrect(multiQuestion, [0, 2, 3, 1])).toBe(false);
  });

  it('falls back to single correct answer', () => {
    expect(getCorrectAnswerIndices(singleQuestion)).toEqual([1]);
    expect(isAnswerCorrect(singleQuestion, 1)).toBe(true);
    expect(isAnswerCorrect(singleQuestion, 0)).toBe(false);
  });

  it('toggles selected indices', () => {
    expect(toggleSelectedIndex([0, 2], 3)).toEqual([0, 2, 3]);
    expect(toggleSelectedIndex([0, 2, 3], 2)).toEqual([0, 3]);
  });
});
