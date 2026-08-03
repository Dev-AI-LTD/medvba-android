import Constants from 'expo-constants';

/**
 * App UI language source of truth (Settings picker + LanguageProvider).
 * Portuguese (`pt`) catalog exists on disk but is not wired for UI selection.
 */
export const APP_UI_LANGUAGES = ['en', 'ro', 'es'] as const;
export type AppUiLanguage = (typeof APP_UI_LANGUAGES)[number];

export function isAppUiLanguage(value: string | null | undefined): value is AppUiLanguage {
  return value === 'en' || value === 'ro' || value === 'es';
}

/** Quiz/study content locales currently shipped (`es` UI falls back to English content). */
export type AppContentLanguage = 'en' | 'ro';

export function resolveAppContentLanguage(uiLanguage: AppUiLanguage): AppContentLanguage {
  return uiLanguage === 'ro' ? 'ro' : 'en';
}

/**
 * Production/default launch gate: English UI only (picker hidden; `currentLanguage` forced to `en`).
 * Romanian/Spanish locale files and AsyncStorage preference are preserved.
 *
 * Testing override (does not change store default): set `EXPO_PUBLIC_ALLOW_UI_LOCALES=true`
 * (or `1`) in `.env` / EAS env / `app.config` extra so the picker and stored language apply.
 *
 * Behavior:
 * - Before: `APP_LAUNCH_ENGLISH_UI_ONLY` was always `true` → English-only for everyone.
 * - After: still `true` by default (same production/store behavior for existing users).
 *   With `EXPO_PUBLIC_ALLOW_UI_LOCALES=true`, gate is `false` → ro/es selectable when picker is shown.
 */
const APP_LAUNCH_ENGLISH_UI_ONLY_DEFAULT = true;

function readAllowUiLocales(): boolean {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const fromExtra = extra?.EXPO_PUBLIC_ALLOW_UI_LOCALES;
  const raw =
    fromExtra != null && String(fromExtra).trim() !== ''
      ? fromExtra
      : process.env.EXPO_PUBLIC_ALLOW_UI_LOCALES;
  if (raw == null || String(raw).trim() === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === '1';
}

export const APP_LAUNCH_ENGLISH_UI_ONLY =
  APP_LAUNCH_ENGLISH_UI_ONLY_DEFAULT && !readAllowUiLocales();
