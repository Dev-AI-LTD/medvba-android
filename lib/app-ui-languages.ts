import { getMergedExpoExtra } from '@/lib/expo-public-extra';

/**
 * App UI language source of truth (Settings picker + LanguageProvider).
 * Portuguese (`pt`) catalog exists on disk but is not wired for UI selection.
 */
export const APP_UI_LANGUAGES = ['en', 'ro', 'es'] as const;
export type AppUiLanguage = (typeof APP_UI_LANGUAGES)[number];

export function isAppUiLanguage(value: string | null | undefined): value is AppUiLanguage {
  return value === 'en' || value === 'ro' || value === 'es';
}

/**
 * Quiz/study content locale.
 * Until reviewed medical corpora ship for RO/ES, content is always English for every UI locale.
 */
export type AppContentLanguage = 'en' | 'ro';

export function resolveAppContentLanguage(_uiLanguage: AppUiLanguage): AppContentLanguage {
  return 'en';
}

/**
 * Production/default launch gate: English UI only (picker hidden; `currentLanguage` forced to `en`).
 * Romanian/Spanish locale files and AsyncStorage preference (`@medvba_language`) are preserved —
 * the gate must never rewrite that key.
 *
 * Testing override (does not change store default): set `EXPO_PUBLIC_ALLOW_UI_LOCALES=true`
 * (or `1`) in `.env` / EAS env / `app.config` extra so the picker and stored language apply.
 */
const APP_LAUNCH_ENGLISH_UI_ONLY_DEFAULT = true;

function readAllowUiLocales(): boolean {
  const extra = getMergedExpoExtra();
  const fromExtra = extra.EXPO_PUBLIC_ALLOW_UI_LOCALES;
  const raw =
    fromExtra != null && String(fromExtra).trim() !== ''
      ? fromExtra
      : process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;
  if (raw == null || String(raw).trim() === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === '1';
}

/** Runtime gate — re-read config each call (do not freeze at module import). */
export function isAppLaunchEnglishUiOnly(): boolean {
  return APP_LAUNCH_ENGLISH_UI_ONLY_DEFAULT && !readAllowUiLocales();
}
