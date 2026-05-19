import type { Question } from '@/mocks/questions';

export function isMultiSelectQuestion(question: Question): boolean {
  return question.format === 'multiple' || (question.correctAnswers?.length ?? 0) > 0;
}

export function getCorrectAnswerIndices(question: Question): number[] {
  if (question.correctAnswers?.length) {
    return [...question.correctAnswers].sort((a, b) => a - b);
  }
  return [question.correctAnswer];
}

export function isAnswerCorrect(question: Question, selected: number | number[] | null): boolean {
  if (selected === null) return false;

  const correct = getCorrectAnswerIndices(question);
  const selectedIndices = (Array.isArray(selected) ? selected : [selected]).sort((a, b) => a - b);

  if (selectedIndices.length !== correct.length) return false;
  return selectedIndices.every((value, index) => value === correct[index]);
}

export function toggleSelectedIndex(selected: number[], index: number): number[] {
  if (selected.includes(index)) {
    return selected.filter((value) => value !== index);
  }
  return [...selected, index].sort((a, b) => a - b);
}
