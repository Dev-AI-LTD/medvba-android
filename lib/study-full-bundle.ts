import medAdmissionFull from '@/assets/study/med-admission-full.json';
import internalOrgansFull from '@/assets/study/internal-organs-full.json';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';
import type { LocalStudyChapter } from '@/lib/study-preview';

type FullBundle = {
  moduleId: string;
  chaptersByLocale?: Record<'ro' | 'en', Record<string, LocalStudyChapter>>;
};

const bundlesByModuleId: Record<string, FullBundle> = {
  [STUDY_PILOT_MODULE_ID]: medAdmissionFull as FullBundle,
  'internal-organs': internalOrgansFull as FullBundle,
};

function chaptersForLocale(
  moduleId: string,
  locale: 'ro' | 'en',
): Record<string, LocalStudyChapter> {
  const bundle = bundlesByModuleId[moduleId];
  if (!bundle) return {};
  return bundle.chaptersByLocale?.[locale] ?? {};
}

export function getFullBundleChapter(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en' = 'ro',
): LocalStudyChapter | null {
  return chaptersForLocale(moduleId, locale)[chapterId] ?? null;
}

export function listFullBundleChapterIds(moduleId: string, locale: 'ro' | 'en' = 'ro'): string[] {
  return Object.keys(chaptersForLocale(moduleId, locale));
}

export function hasFullBundleChapter(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en' = 'ro',
): boolean {
  return getFullBundleChapter(moduleId, chapterId, locale) !== null;
}

export function hasFullBundleModule(moduleId: string): boolean {
  return moduleId in bundlesByModuleId;
}
