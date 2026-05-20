import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

export const QUIZ_FONT_FAMILY = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export type QuizFontFamilies = typeof QUIZ_FONT_FAMILY;

export function useQuizFonts() {
  const [loaded, error] = useFonts({
    [QUIZ_FONT_FAMILY.regular]: PlusJakartaSans_400Regular,
    [QUIZ_FONT_FAMILY.medium]: PlusJakartaSans_500Medium,
    [QUIZ_FONT_FAMILY.semiBold]: PlusJakartaSans_600SemiBold,
    [QUIZ_FONT_FAMILY.bold]: PlusJakartaSans_700Bold,
  });

  return {
    loaded,
    error,
    families: QUIZ_FONT_FAMILY,
  };
}
