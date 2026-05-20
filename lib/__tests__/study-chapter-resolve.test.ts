import { resolveStudyChapterContent } from '@/lib/study-chapter-resolve';
import { getParentStudyChapter } from '@/lib/quizToStudyChapter';

describe('study-chapter-resolve', () => {
  it('returns granular topic summary for internal-organs heart-external (free preview)', () => {
    const result = resolveStudyChapterContent({
      moduleId: 'internal-organs',
      chapterId: 'heart-external',
      locale: 'en',
      isPremium: false,
      apiData: { found: false },
    });

    expect(result.summaryMarkdown).toContain('## Key concepts');
    expect(result.summaryMarkdown).not.toContain('## Concepte cheie');
    expect(result.isTopicSummary).toBe(true);
    expect(result.isFallbackToParent).toBe(false);
    expect(result.locked).toBe(false);
    expect(result.parentChapter).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'cardiovascular',
    });
  });

  it('parent nervous summary is fully English when used as fallback', () => {
    const result = resolveStudyChapterContent({
      moduleId: 'neuroanatomy',
      chapterId: 'cerebellum-external',
      locale: 'en',
      isPremium: true,
      apiData: { found: false },
    });

    expect(result.isFallbackToParent).toBe(true);
    expect(result.summaryMarkdown).toContain('## Key concepts');
    expect(result.summaryMarkdown).not.toMatch(/Diviziuni principale|Concepte cheie/);
  });

  it('falls back to parent cardiovascular when granular chapter has no content', () => {
    const result = resolveStudyChapterContent({
      moduleId: 'internal-organs',
      chapterId: 'lung-apex',
      locale: 'en',
      isPremium: true,
      apiData: { found: false },
    });

    expect(result.isFallbackToParent).toBe(true);
    expect(result.summaryMarkdown).toBeTruthy();
    expect(result.parentChapter).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'respiratory',
    });
  });

  it('getParentStudyChapter matches resolveStudyChapterForQuiz', () => {
    expect(getParentStudyChapter('internal-organs', 'heart-external')).toEqual({
      studyModuleId: 'med-admission-barrons',
      studyChapterId: 'cardiovascular',
    });
  });
});
