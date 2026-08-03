import { resolveAppContentLanguage, type AppUiLanguage } from '@/lib/app-ui-languages';

export type StudyContentLocale = 'ro' | 'en';

/**
 * Locale for study summary markdown (not UI strings).
 * Content is English for every UI locale until reviewed RO/ES corpora ship.
 */
export function resolveStudyContentLocale(appLanguage: AppUiLanguage): StudyContentLocale {
  return resolveAppContentLanguage(appLanguage);
}
