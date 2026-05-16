import { MD3LightTheme, MD3DarkTheme, type MD3Theme } from 'react-native-paper';

/** Material Design 3 spacing: use multiples of 8dp */
export const SPACING = {
  /** 8dp */
  x1: 8,
  /** 16dp */
  x2: 16,
  /** 24dp */
  x3: 24,
  /** 32dp */
  x4: 32,
  /** 40dp */
  x5: 40,
  /** 48dp */
  x6: 48,
  /** 56dp */
  x7: 56,
  /** 64dp */
  x8: 64,
} as const;

/**
 * Minimum interactive size (pt on iOS, dp on Android). Single value for both platforms:
 * aligns with Material guidance (~48) and is comfortable on iOS (HIG often cites ~44).
 */
export const TOUCH_TARGET_MIN = 48;

type AppColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  backgroundLight: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  error: string;
  success?: string;
  warning?: string;
};

export function getPaperTheme(colors: AppColors, dark: boolean): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    dark,
    roundness: 12,
    colors: {
      ...base.colors,
      primary: colors.primary,
      primaryContainer: dark ? `${colors.primary}30` : `${colors.primary}20`,
      onPrimary: '#FFFFFF',
      onPrimaryContainer: colors.primary,
      secondary: colors.primaryLight,
      secondaryContainer: dark ? `${colors.primaryLight}25` : `${colors.primaryLight}35`,
      onSecondary: dark ? '#000000' : '#FFFFFF',
      onSecondaryContainer: colors.primaryDark,
      surface: colors.cardBg || colors.backgroundLight,
      surfaceVariant: colors.backgroundLight,
      background: colors.background,
      onBackground: colors.text,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.textMuted,
      outlineVariant: colors.textMuted + '60',
      error: colors.error,
      onError: '#FFFFFF',
      errorContainer: `${colors.error}20`,
      onErrorContainer: colors.error,
    },
  };
}
