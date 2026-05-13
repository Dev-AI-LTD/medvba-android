import type { Question } from '@/mocks/questions';
import { questionTranslations } from '@/locales/questionTranslations';

/** Locales supported for per-question translations (questionTranslations + embedded ro fields). */
export type QuestionTranslateLanguage = 'en' | 'ro' | 'es' | 'pt';

/** Fisher–Yates shuffle so answer order (A/B/C/D/E) is unbiased per question */
function shuffleArray<T>(array: T[]): { shuffled: T[]; indices: number[] } {
  const indices = array.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffled = indices.map(i => array[i]);
  return { shuffled, indices };
}

/** Shuffle options and update correctAnswer so the correct option appears in random position (fixes A/B/C bias) */
export function shuffleQuestionOptions(question: Question): Question {
  const opts = question.options ?? [];
  if (opts.length < 2) return question;
  const { shuffled, indices } = shuffleArray(opts);
  const oldCorrect = question.correctAnswer;
  const newCorrect = indices.indexOf(oldCorrect);
  if (newCorrect === -1) return { ...question, options: shuffled };
  return { ...question, options: shuffled, correctAnswer: newCorrect };
}

export function translateQuestion(question: Question, language: QuestionTranslateLanguage): Question {
  if (language === 'en') {
    return question;
  }

  if (language === 'ro' && question.question_ro && question.options_ro?.length === (question.options?.length ?? 0)) {
    return {
      ...question,
      question: question.question_ro,
      options: question.options_ro,
      explanation: question.explanation_ro ?? question.explanation,
    };
  }

  const translation = questionTranslations[question.id]?.[language];
  
  if (!translation) {
    return question;
  }

  const translated: Question = {
    ...question,
    question: translation.question,
    options: translation.options ?? question.options,
    explanation: translation.explanation ?? question.explanation,
  };
  if (translation.correctAnswer !== undefined) {
    translated.correctAnswer = translation.correctAnswer;
  }
  return translated;
}

export function translateQuestions(questions: Question[], language: QuestionTranslateLanguage): Question[] {
  return questions.map(q => translateQuestion(q, language));
}

/** Translate and shuffle options for each question (fair distribution of correct answer position) */
export function translateAndShuffleQuestions(
  questions: Question[],
  language: QuestionTranslateLanguage,
): Question[] {
  return questions.map(q => shuffleQuestionOptions(translateQuestion(q, language)));
}
