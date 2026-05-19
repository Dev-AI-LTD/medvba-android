import medAdmissionFull from '@/assets/study/med-admission-full.json';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';
import type { LocalStudyChapter } from '@/lib/study-preview';

type FullBundle = {
  moduleId: string;
  chaptersByLocale?: Record<'ro' | 'en', Record<string, LocalStudyChapter>>;
};

const bundle = medAdmissionFull as FullBundle;

function chaptersForLocale(locale: 'ro' | 'en'): Record<string, LocalStudyChapter> {
  return bundle.chaptersByLocale?.[locale] ?? {};
}

export function getFullBundleChapter(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en' = 'ro',
): LocalStudyChapter | null {
  if (moduleId !== STUDY_PILOT_MODULE_ID) return null;
  return chaptersForLocale(locale)[chapterId] ?? null;
}

export function listFullBundleChapterIds(moduleId: string, locale: 'ro' | 'en' = 'ro'): string[] {
  if (moduleId !== STUDY_PILOT_MODULE_ID) return [];
  return Object.keys(chaptersForLocale(locale));
}

export function hasFullBundleChapter(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en' = 'ro',
): boolean {
  return getFullBundleChapter(moduleId, chapterId, locale) !== null;
}
