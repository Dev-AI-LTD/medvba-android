import { resolveStudyChapterForQuiz, getParentStudyChapter } from '@/lib/quizToStudyChapter';

describe('quizToStudyChapter', () => {
  it('maps med-admission quiz chapters 1:1', () => {
    expect(resolveStudyChapterForQuiz('med-admission-barrons', 'intro-anat-phys')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'intro-anat-phys',
    });
  });

  it('maps internal organs heart chapter to cardiovascular study summary', () => {
    expect(resolveStudyChapterForQuiz('internal-organs', 'heart-external')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'cardiovascular',
    });
  });

  it('maps pulmonary circulation to cardiovascular', () => {
    expect(resolveStudyChapterForQuiz('internal-organs', 'pulmonary-circulation')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'cardiovascular',
    });
  });

  it('maps lung chapters to respiratory', () => {
    expect(resolveStudyChapterForQuiz('internal-organs', 'lung-apex')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'respiratory',
    });
  });

  it('maps humerus to skeletal', () => {
    expect(resolveStudyChapterForQuiz('upper-lower-limbs', 'humerus')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'skeletal',
    });
  });

  it('maps shoulder muscles to muscular', () => {
    expect(resolveStudyChapterForQuiz('upper-lower-limbs', 'shoulder-muscles')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'muscular',
    });
  });

  it('maps head-neck quiz chapters to head-neck intro study preview', () => {
    expect(resolveStudyChapterForQuiz('head-neck', 'sphenoid-bone')).toEqual({
      studyModuleId: 'head-neck',
      studyChapterId: 'head-neck-intro',
    });
  });

  it('maps neuro anatomy to nervous by default', () => {
    expect(resolveStudyChapterForQuiz('neuroanatomy', 'neuro-intro')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'nervous',
    });
  });

  it('maps neuro eye chapters to senses', () => {
    expect(resolveStudyChapterForQuiz('neuroanatomy', 'eye-anatomy')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'senses',
    });
  });

  it('returns null for unknown chapter', () => {
    expect(resolveStudyChapterForQuiz('mixed', 'unknown-chapter')).toBeNull();
  });

  it('getParentStudyChapter is an alias for resolveStudyChapterForQuiz', () => {
    expect(getParentStudyChapter('internal-organs', 'heart-external')).toEqual(
      resolveStudyChapterForQuiz('internal-organs', 'heart-external'),
    );
  });
});
