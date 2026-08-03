import {
  APP_LAUNCH_ENGLISH_UI_ONLY,
  resolveAppContentLanguage,
  type AppUiLanguage,
} from '@/lib/app-ui-languages';

export type StudyContentLocale = 'ro' | 'en';

/**
 * Locale for study summary markdown (not UI strings).
 * Spanish UI maps to English study content until an `es` study corpus exists.
 */
export function resolveStudyContentLocale(
  appLanguage: AppUiLanguage,
): StudyContentLocale {
  if (APP_LAUNCH_ENGLISH_UI_ONLY) return 'en';
  return resolveAppContentLanguage(appLanguage);
}
