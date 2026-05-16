/**
 * Launch gate: when `true`, the app uses **English only** for UI strings, chapter titles in quiz,
 * and quiz question translation (`translateQuestion` follows `currentLanguage` from `LanguageProvider`).
 *
 * Romanian locale files, `questionTranslations`, and the user’s saved language in AsyncStorage
 * are **not** removed — set to `false` after launch to turn Romanian back on.
 */
export const APP_LAUNCH_ENGLISH_UI_ONLY = true;
