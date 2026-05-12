import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { en } from '@/locales/en';
import { ro } from '@/locales/ro';
import { chapterTranslations } from '@/locales/chapterTranslations';
import { log } from '@/lib/log';

export type Language = 'en' | 'ro';

/** Canonical AsyncStorage key for UI language (`en` default until user picks another in Settings). */
export const APP_LANGUAGE_STORAGE_KEY = '@medvba_language';

/** Older builds used this key; we read once and migrate to {@link APP_LANGUAGE_STORAGE_KEY}. */
export const LEGACY_APP_LANGUAGE_STORAGE_KEY = '@medvba_app_language';

/** Default UI language on first install and after account deletion clears storage. */
export const DEFAULT_APP_LANGUAGE: Language = 'en';

const translations: Record<Language, Record<string, string>> = {
  en,
  ro,
};

function isSupportedLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'ro';
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_APP_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        let stored = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
        if (!isSupportedLanguage(stored)) {
          const legacy = await AsyncStorage.getItem(LEGACY_APP_LANGUAGE_STORAGE_KEY);
          if (isSupportedLanguage(legacy)) {
            stored = legacy;
            await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, legacy);
            await AsyncStorage.removeItem(LEGACY_APP_LANGUAGE_STORAGE_KEY);
            log.debug('Migrated UI language from legacy storage key:', legacy);
          }
        }
        if (isSupportedLanguage(stored)) {
          setCurrentLanguage(stored);
          log.debug('Loaded language from storage:', stored);
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
      setCurrentLanguage(lang);
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);
      await AsyncStorage.removeItem(LEGACY_APP_LANGUAGE_STORAGE_KEY);
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
    return chapterTrans[currentLanguage] || chapterTrans['en'] || chapterId;
  }, [currentLanguage]);

  const getModuleName = useCallback((moduleId: string): string => {
    const moduleKeys: Record<string, string> = {
      'upper-lower-limbs': 'module.upperLowerLimbs',
      'internal-organs': 'module.internalOrgans',
      'head-neck': 'module.headNeck',
      'neuroanatomy': 'module.neuroanatomy',
      'med-admission-barrons': 'module.medAdmissionBarrons',
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
