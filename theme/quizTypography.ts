import type { TextStyle } from 'react-native';
import type { QuizFontFamilies } from '@/lib/use-quiz-fonts';
import { fontFamily as systemFontFamily } from '@/theme/iosDesign';

export function getQuizFontFamilies(
  loaded: boolean,
  families: QuizFontFamilies,
): QuizFontFamilies {
  if (loaded) return families;
  return {
    regular: systemFontFamily,
    medium: systemFontFamily,
    semiBold: systemFontFamily,
    bold: systemFontFamily,
  };
}

export function createQuizTypography(
  loaded: boolean,
  families: QuizFontFamilies,
): {
  cardTitle: TextStyle;
  cardMeta: TextStyle;
  modeTitle: TextStyle;
  modeSubtitle: TextStyle;
  question: TextStyle;
  option: TextStyle;
  optionLetter: TextStyle;
  badge: TextStyle;
  hint: TextStyle;
  explanation: TextStyle;
} {
  const f = getQuizFontFamilies(loaded, families);

  return {
    cardTitle: {
      fontFamily: f.semiBold,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      textAlign: 'center',
    },
    cardMeta: {
      fontFamily: f.regular,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.05,
      textAlign: 'center',
    },
    modeTitle: {
      fontFamily: f.bold,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    modeSubtitle: {
      fontFamily: f.medium,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.05,
    },
    question: {
      fontFamily: f.semiBold,
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 0.1,
    },
    option: {
      fontFamily: f.medium,
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0.05,
    },
    optionLetter: {
      fontFamily: f.bold,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    badge: {
      fontFamily: f.semiBold,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.08,
    },
    hint: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.05,
    },
    explanation: {
      fontFamily: f.regular,
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0.05,
    },
  };
}
