import React, { createContext, useContext, useMemo } from 'react';
import {
  QUIZ_FONT_FAMILY,
  useQuizFonts,
  type QuizFontFamilies,
} from '@/lib/use-quiz-fonts';

type QuizFontsContextValue = {
  loaded: boolean;
  families: QuizFontFamilies;
};

const QuizFontsContext = createContext<QuizFontsContextValue>({
  loaded: false,
  families: QUIZ_FONT_FAMILY,
});

export function QuizFontsProvider({ children }: { children: React.ReactNode }) {
  const { loaded, families } = useQuizFonts();
  const value = useMemo(() => ({ loaded, families }), [loaded, families]);
  return <QuizFontsContext.Provider value={value}>{children}</QuizFontsContext.Provider>;
}

export function useQuizFontsContext(): QuizFontsContextValue {
  return useContext(QuizFontsContext);
}
