import { APP_LAUNCH_ENGLISH_UI_ONLY } from '@/lib/app-ui-languages';

export type StudyContentLocale = 'ro' | 'en';

/** Locale for study summary markdown (not UI strings). */
export function resolveStudyContentLocale(
  appLanguage: 'ro' | 'en',
): StudyContentLocale {
  if (APP_LAUNCH_ENGLISH_UI_ONLY) return 'en';
  return appLanguage === 'ro' ? 'ro' : 'en';
}
