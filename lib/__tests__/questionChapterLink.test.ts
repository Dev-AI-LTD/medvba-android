import type { Question } from '@/mocks/questions';
import { resolveQuestionChapterLink } from '@/lib/questionChapterLink';

const sampleQuestion = (overrides: Partial<Question> & Pick<Question, 'id'>): Question => ({
  id: overrides.id,
  category: overrides.category ?? 'head-neck',
  difficulty: 'easy',
  question: overrides.question ?? 'Sample question',
  options: overrides.options ?? ['A', 'B', 'C', 'D', 'E'],
  correctAnswer: 0,
  explanation: 'Explanation',
  ...overrides,
});

describe('questionChapterLink', () => {
  it('maps exam head-neck neurocranium question to intro chapter', () => {
    const link = resolveQuestionChapterLink(
      sampleQuestion({
        id: 'hn-exam-001',
        question_ro: 'Care dintre următoarele oase NU intră în componența neurocraniului?',
        options_ro: ['Osul frontal', 'Osul etmoid', 'Osul zigomatic', 'Osul sfenoid', 'Osul occipital'],
      }),
      'head-neck',
    );
    expect(link?.moduleId).toBe('head-neck');
    expect(link?.chapterId).toBeTruthy();
  });

  it('maps sphenoid foramen question to sphenoid chapter', () => {
    const link = resolveQuestionChapterLink(
      sampleQuestion({
        id: 'hn-exam-005',
        question_ro: 'Care dintre următoarele structuri trece prin gaura mare rotundă (foramen rotundum)?',
      }),
      'head-neck',
    );
    expect(link?.chapterId).toBe('sphenoid-bone');
  });

  it('maps indexed chapter questions by id', () => {
    const link = resolveQuestionChapterLink(
      sampleQuestion({
        id: 'hn-home-001',
        category: 'head-neck',
      }),
      'head-neck',
    );
    expect(link?.chapterId).toBe('head-neck-intro');
  });

  it('maps neuro exam question to a neuro chapter', () => {
    const link = resolveQuestionChapterLink(
      sampleQuestion({
        id: 'neuro-exam-aff-001',
        category: 'neuroanatomy',
        question_ro: 'În ceea ce privește dezvoltarea sistemului nervos central, se poate afirma că:',
      }),
      'neuroanatomy',
    );
    expect(link?.moduleId).toBe('neuroanatomy');
    expect(link?.chapterId).toBe('neuro-intro');
  });
});
