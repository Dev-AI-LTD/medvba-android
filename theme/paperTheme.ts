import { MD3LightTheme, MD3DarkTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import {
  SPACING,
  TOUCH_TARGET_MIN,
  fontFamily,
  radiusMd,
  typeScale,
} from '@/theme/iosDesign';

export { SPACING, TOUCH_TARGET_MIN };

const iosFonts = configureFonts({
  config: {
    displayLarge: { ...typeScale.largeTitle, fontFamily },
    displayMedium: { ...typeScale.title1, fontFamily },
    displaySmall: { ...typeScale.title2, fontFamily },
    headlineLarge: { ...typeScale.title2, fontFamily },
    headlineMedium: { ...typeScale.headline, fontFamily },
    headlineSmall: { ...typeScale.headline, fontFamily },
    titleLarge: { ...typeScale.title2, fontFamily },
    titleMedium: { ...typeScale.headline, fontFamily },
    titleSmall: { ...typeScale.subheadMedium, fontFamily },
    bodyLarge: { ...typeScale.body, fontFamily },
    bodyMedium: { ...typeScale.subhead, fontFamily },
    bodySmall: { ...typeScale.caption, fontFamily },
    labelLarge: { ...typeScale.headline, fontFamily },
    labelMedium: { ...typeScale.subheadMedium, fontFamily },
    labelSmall: { ...typeScale.caption, fontFamily },
  },
});

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
    roundness: radiusMd,
    fonts: iosFonts,
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
