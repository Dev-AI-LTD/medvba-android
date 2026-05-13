import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { darkColors, lightColors } from '@/constants/colors';
import { log } from '@/lib/log';

type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  colorScheme: 'light' | 'dark';
  colors: typeof darkColors;
  isTransitioning: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = '@medvba_theme_preference';

/** Default for new installs — matches onboarding / login (dark UI). */
const DEFAULT_PREFERENCE: ThemePreference = 'dark';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        log.debug('[ThemeProvider] Loaded preference from storage:', stored);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        } else {
          setPreferenceState(DEFAULT_PREFERENCE);
        }
      })
      .catch(() => {
        setPreferenceState(DEFAULT_PREFERENCE);
      });
  }, []);

  const setPreference = (value: ThemePreference) => {
    log.debug('[ThemeProvider] Setting preference to:', value);
    setIsTransitioning(true);
    setPreferenceState(value);
    AsyncStorage.setItem(THEME_KEY, value).catch((error) => {
      log.error('Failed to save theme preference:', error);
    });
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    if (preference === 'system') {
      Appearance.setColorScheme(undefined);
    } else {
      Appearance.setColorScheme(preference);
    }
  }, [preference]);

  const colorScheme: 'light' | 'dark' = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference === 'light' ? 'light' : 'dark';
  }, [preference, systemScheme]);

  const colors = useMemo(() => {
    return colorScheme === 'dark' ? darkColors : lightColors;
  }, [colorScheme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    log.debug('[ThemeProvider] State updated - preference:', preference, 'systemScheme:', systemScheme, 'computed colorScheme:', colorScheme);
  }, [preference, systemScheme, colorScheme]);

  const value = useMemo(
    () => ({ preference, setPreference, colorScheme, colors, isTransitioning }),
    [preference, colorScheme, colors, isTransitioning]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

const FALLBACK_THEME: ThemeContextValue = {
  colors: darkColors,
  colorScheme: 'dark',
  preference: DEFAULT_PREFERENCE,
  setPreference: () => {},
  isTransitioning: false,
};

/** Safe version that returns default dark theme when outside provider (e.g. modal edge cases) */
export const useThemeSafe = () => {
  const ctx = useContext(ThemeContext);
  return ctx ?? FALLBACK_THEME;
};
