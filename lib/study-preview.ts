import medAdmissionPreview from '@/assets/study/med-admission-preview.json';
import headNeckPreview from '@/assets/study/head-neck-preview.json';
import {
  STUDY_PILOT_MODULE_ID,
  isStudyFreePreviewChapter,
  type StudyFreePreviewChapterId,
} from '@/constants/study';

export type LocalStudyChapter = {
  chapterId: string;
  title: string | null;
  summaryMarkdown: string;
  summaryVersion: number;
  audioUrl: string | null;
  audioDurationSec: number | null;
};

type PreviewBundle = {
  moduleId: string;
  chaptersByLocale?: Record<'ro' | 'en', Record<string, LocalStudyChapter>>;
  chapters?: Record<StudyFreePreviewChapterId, LocalStudyChapter>;
};

const bundlesByModuleId: Record<string, PreviewBundle> = {
  [STUDY_PILOT_MODULE_ID]: medAdmissionPreview as PreviewBundle,
  'head-neck': headNeckPreview as PreviewBundle,
};

function getBundle(moduleId: string): PreviewBundle | null {
  return bundlesByModuleId[moduleId] ?? null;
}

function getChaptersForLocale(
  moduleId: string,
  locale: 'ro' | 'en',
): Record<string, LocalStudyChapter> {
  const bundle = getBundle(moduleId);
  if (!bundle) return {};
  if (bundle.chaptersByLocale?.[locale]) {
    return bundle.chaptersByLocale[locale];
  }
  if (locale === 'ro' && bundle.chapters) {
    return bundle.chapters;
  }
  return {};
}

export function resolveStudyModuleId(moduleId: string, chapterId: string): string {
  if (getBundle(moduleId)) return moduleId;
  if (isStudyFreePreviewChapter(chapterId, 'head-neck')) return 'head-neck';
  if (isStudyFreePreviewChapter(chapterId, STUDY_PILOT_MODULE_ID)) {
    return STUDY_PILOT_MODULE_ID;
  }
  return moduleId;
}

export function getLocalPreviewChapter(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en' = 'ro',
): LocalStudyChapter | null {
  const effectiveModuleId = resolveStudyModuleId(moduleId, chapterId);
  if (!getBundle(effectiveModuleId)) return null;
  if (!isStudyFreePreviewChapter(chapterId, effectiveModuleId)) return null;
  const chapters = getChaptersForLocale(effectiveModuleId, locale);
  return (
    chapters[chapterId] ??
    (locale === 'en' ? getChaptersForLocale(effectiveModuleId, 'ro')[chapterId] : null) ??
    null
  );
}

export function listLocalPreviewChapterIds(
  moduleId: string,
  locale: 'ro' | 'en' = 'ro',
): string[] {
  if (!getBundle(moduleId)) return [];
  return Object.keys(getChaptersForLocale(moduleId, locale));
}

export function getLocalPreviewChapterCount(
  moduleId: string,
  locale: 'ro' | 'en' = 'ro',
): number {
  return listLocalPreviewChapterIds(moduleId, locale).length;
}

export function getEffectivePublishedSummaryCount(
  moduleId: string,
  apiPublishedCount: number,
): number {
  const localCount = Math.max(
    getLocalPreviewChapterCount(moduleId, 'ro'),
    getLocalPreviewChapterCount(moduleId, 'en'),
  );
  if (localCount === 0) return apiPublishedCount;
  return Math.max(apiPublishedCount, localCount);
}
