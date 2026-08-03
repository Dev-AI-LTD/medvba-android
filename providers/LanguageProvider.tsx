import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { en } from '@/locales/en';
import { ro } from '@/locales/ro';
import { es } from '@/locales/es';
import { chapterTranslations } from '@/locales/chapterTranslations';
import {
  APP_UI_LANGUAGES,
  isAppLaunchEnglishUiOnly,
  isAppUiLanguage,
  resolveAppContentLanguage,
  type AppUiLanguage,
} from '@/lib/app-ui-languages';
import { log } from '@/lib/log';

export type Language = AppUiLanguage;
export { APP_UI_LANGUAGES };

/** Canonical AsyncStorage key for UI language (`en` default until user picks another in Settings). */
export const APP_LANGUAGE_STORAGE_KEY = '@medvba_language';

/** Older builds used this key; we read once and migrate to {@link APP_LANGUAGE_STORAGE_KEY}. */
export const LEGACY_APP_LANGUAGE_STORAGE_KEY = '@medvba_app_language';

/** Default UI language on first install and after account deletion clears storage. */
export const DEFAULT_APP_LANGUAGE: Language = 'en';

const translations: Record<Language, Record<string, string>> = {
  en,
  ro,
  es,
};

function normalizeLanguageCode(value: string | null): Language | null {
  if (value == null) return null;
  const v = value.trim().toLowerCase();
  return isAppUiLanguage(v) ? v : null;
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  /** Persisted choice (en/ro/es); UI may still show English only while {@link isAppLaunchEnglishUiOnly} is true. */
  const [storedLanguage, setStoredLanguage] = useState<Language>(DEFAULT_APP_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  /** Gate may hide non-EN UI for store/launch; it never rewrites {@link APP_LANGUAGE_STORAGE_KEY}. */
  const currentLanguage: Language = isAppLaunchEnglishUiOnly() ? 'en' : storedLanguage;

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        let stored = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
        let normalized = normalizeLanguageCode(stored);
        if (!normalized) {
          const legacy = await AsyncStorage.getItem(LEGACY_APP_LANGUAGE_STORAGE_KEY);
          const legacyNorm = normalizeLanguageCode(legacy);
          if (legacyNorm) {
            stored = legacyNorm;
            await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, legacyNorm);
            await AsyncStorage.removeItem(LEGACY_APP_LANGUAGE_STORAGE_KEY);
            log.debug('Migrated UI language from legacy storage key:', legacyNorm);
            normalized = legacyNorm;
          }
        }
        if (normalized) {
          setStoredLanguage(normalized);
          log.debug('Loaded language from storage:', normalized);
        }
      } catch (error) {
        log.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);
      await AsyncStorage.removeItem(LEGACY_APP_LANGUAGE_STORAGE_KEY);
      setStoredLanguage(lang);
      log.debug('Language changed and saved:', lang);
    } catch (error) {
      log.error('Error saving language:', error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const translation = translations[currentLanguage]?.[key];
    if (!translation) {
      log.warn(`Missing translation for key: ${key} in language: ${currentLanguage}`);
      return translations['en']?.[key] || key;
    }
    return translation;
  }, [currentLanguage]);

  const getChapterTitle = useCallback((chapterId: string): string => {
    const chapterTrans = chapterTranslations[chapterId];
    if (!chapterTrans) {
      log.warn(`Missing chapter translation for: ${chapterId}`);
      return chapterId;
    }
    /** Medical chapter titles follow content locale (always EN for now), not UI language. */
    const contentLanguage = resolveAppContentLanguage(currentLanguage);
    return chapterTrans[contentLanguage] || chapterTrans.en || chapterId;
  }, [currentLanguage]);

  const getModuleName = useCallback((moduleId: string): string => {
    const moduleKeys: Record<string, string> = {
      'upper-lower-limbs': 'module.upperLowerLimbs',
      'internal-organs': 'module.internalOrgans',
      'head-neck': 'module.headNeck',
      'neuroanatomy': 'module.neuroanatomy',
      'med-admission-barrons': 'module.medAdmission',
    };
    const key = moduleKeys[moduleId];
    return key ? t(key) : moduleId;
  }, [t]);

  return useMemo(() => ({
    currentLanguage,
    changeLanguage,
    t,
    getChapterTitle,
    getModuleName,
    isLoading,
  }), [currentLanguage, changeLanguage, t, getChapterTitle, getModuleName, isLoading]);
});
