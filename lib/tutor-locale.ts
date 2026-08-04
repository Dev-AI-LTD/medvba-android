import { z } from 'zod';
import type { AppUiLanguage } from './app-ui-languages';

/** Locales supported for generated Tutor / Clinical AI responses. */
export const TUTOR_LOCALES = ['en', 'ro', 'es'] as const;
export type TutorLocale = (typeof TUTOR_LOCALES)[number];

export const tutorLocaleSchema = z.enum(TUTOR_LOCALES);

export function isTutorLocale(value: unknown): value is TutorLocale {
  return value === 'en' || value === 'ro' || value === 'es';
}

/** Accept valid Tutor locales; invalid/missing values fall back (default `en`). */
export function resolveTutorLocaleOrDefault(
  value: unknown,
  fallback: TutorLocale = 'en',
): TutorLocale {
  return isTutorLocale(value) ? value : fallback;
}

/**
 * Map app UI language → Tutor response locale.
 * UI locale is the sole source of truth — never infer from question text,
 * quiz content language, chapter titles, or image labels.
 */
export function resolveTutorResponseLocale(uiLanguage: AppUiLanguage): TutorLocale {
  return uiLanguage;
}
