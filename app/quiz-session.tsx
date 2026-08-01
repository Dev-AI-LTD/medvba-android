import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Clock, CheckCircle, XCircle, ChevronRight, Copy, Lock, Crown, BookOpen, Sparkles } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuizProgress, type SessionState } from '@/providers/QuizProgressProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import GlassCard from '@/components/GlassCard';
import type { Question } from '@/mocks/questions';
import { useLanguage } from '@/providers/LanguageProvider';
import { getAllQuestionsWithChapters } from '@/mocks/chapters';
import {
  translateAndShuffleQuestions,
  type QuestionTranslateLanguage,
} from '@/lib/translateQuestion';
import { log } from '@/lib/log';
import type { AppColors } from '@/constants/colors';
import {
  buttonHeight,
  cardPadding,
  fieldGap,
  iconMd,
  iconSm,
  iconXl,
  radiusLg,
  radiusMd,
  radiusPill,
  radiusSm,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { useQuizFontsContext } from '@/providers/QuizFontsProvider';
import { createQuizTypography } from '@/theme/quizTypography';

import {
  allQuestions,
  allUpperLowerLimbsQuestions,
  headNeckAllQuestions,
  headNeckExamSimulationQuestions,
  internalOrgansAllQuestions,
  medAdmissionAllQuestions,
  neuroanatomyAllQuestions,
  neuroanatomyExamQuestions,
  upperLowerLimbsSubcategories,
} from '@/lib/quizSessionQuestionPool';
import {
  getCorrectAnswerIndices,
  isAnswerCorrect,
  isMultiSelectQuestion,
  toggleSelectedIndex,
} from '@/lib/questionAnswer';
import {
  filterUnseenQuestions,
  fisherYatesShuffle,
  getSeenQuestionsStorageKey,
  selectUniqueQuestions,
} from '@/lib/quizQuestionSelection';
import { buildQuestionsWithChapters } from '@/lib/questionChapterLink';
import { getParentStudyChapter } from '@/lib/quizToStudyChapter';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';
import { isClinicalCopilotUiEnabled } from '@/lib/clinical-copilot-flag';
import { trackClinicalEvent } from '@/lib/clinical-analytics';
import {
  CLINICAL_PENDING_EXPLAIN_KEY,
  type ClinicalPendingExplain,
} from '@/lib/clinical-pending-explain';
import { trpc } from '@/lib/trpc';
import { TRPCClientError } from '@trpc/client';

const QUESTION_COUNTS = {
  quick: 10,
  practice: 25,
  exam: 100,
  sequential: 9999,
} as const;

interface QuestionWithChapter {
  question: Question;
  chapterId: string;
  chapterName: string;
  moduleId: string;
}

let canonicalQuestionById: Map<string, Question> | null = null;

function ensureCanonicalQuestionById(): Map<string, Question> {
  if (!canonicalQuestionById) {
    canonicalQuestionById = new Map();
    for (const q of allQuestions) {
      if (!canonicalQuestionById.has(q.id)) {
        canonicalQuestionById.set(q.id, q);
      }
    }
  }
  return canonicalQuestionById;
}

/** Rebuild English-canonical questions in the same order as the current session (for re-translation after UI language change). */
function questionsToCanonicalInSessionOrder(ordered: Question[]): Question[] {
  const map = ensureCanonicalQuestionById();
  return ordered.map((q) => map.get(q.id) ?? q);
}

async function getSeenQuestionIds(category: string, mode?: string): Promise<Set<string>> {
  try {
    const key = getSeenQuestionsStorageKey(category, mode);
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (error) {
    log.warn('Error loading seen questions:', error);
  }
  return new Set();
}

async function markQuestionsAsSeen(category: string, questionIds: string[], mode?: string): Promise<void> {
  try {
    const key = getSeenQuestionsStorageKey(category, mode);
    const existingIds = await getSeenQuestionIds(category, mode);
    questionIds.forEach(id => existingIds.add(id));
    await AsyncStorage.setItem(key, JSON.stringify([...existingIds]));
    log.info(`Marked ${questionIds.length} questions as seen for category: ${category}`);
  } catch (error) {
    log.warn('Error saving seen questions:', error);
  }
}

function selectBalancedFromSubcategories(
  subcategories: Record<string, Question[]>,
  totalCount: number,
  seenIds: Set<string>
): Question[] {
  const subcatKeys = Object.keys(subcategories);
  const basePerSubcat = Math.floor(totalCount / subcatKeys.length);
  const remainder = totalCount % subcatKeys.length;
  
  const selected: Question[] = [];
  
  subcatKeys.forEach((key, index) => {
    const count = basePerSubcat + (index < remainder ? 1 : 0);
    const unseenInSubcat = filterUnseenQuestions(subcategories[key], seenIds);
    const shuffled = fisherYatesShuffle(unseenInSubcat);
    selected.push(...shuffled.slice(0, count));
  });
  
  return fisherYatesShuffle(selected);
}

function selectFromPool(pool: Question[], count: number, seenIds: Set<string>, mode: string): Question[] {
  if (mode === 'exam') {
    return selectUniqueQuestions(pool, count, seenIds);
  }

  const availableQuestions = filterUnseenQuestions(pool, seenIds);
  const seenQuestions = pool.filter((question) => seenIds.has(question.id));
  if (availableQuestions.length < count) {
    const need = count - availableQuestions.length;
    return [...fisherYatesShuffle(availableQuestions), ...fisherYatesShuffle(seenQuestions).slice(0, need)];
  }
  return fisherYatesShuffle(availableQuestions).slice(0, count);
}

async function selectQuestionsForQuiz(
  category: string,
  mode: string,
  count: number
): Promise<{ questions: Question[]; resetHistory: boolean }> {
  log.info(`Selecting ${count} questions for category: ${category}, mode: ${mode}`);

  const seenIds = await getSeenQuestionIds(category, mode);
  log.info(`Previously seen questions: ${seenIds.size}`);

  let selectedQuestions: Question[];
  const resetHistory = false;

  if (category === 'upper-lower-limbs') {
    const unseenSubcats: Record<string, Question[]> = {};
    let totalUnseen = 0;
    
    Object.entries(upperLowerLimbsSubcategories).forEach(([key, questions]) => {
      unseenSubcats[key] = filterUnseenQuestions(questions, seenIds);
      totalUnseen += unseenSubcats[key].length;
    });
    
      log.info(`Total unseen upper-lower-limbs questions: ${totalUnseen}`);
    
    if (totalUnseen < count) {
      const seenInLimbs = allUpperLowerLimbsQuestions.filter(q => seenIds.has(q.id));
      const balancedUnseen = selectBalancedFromSubcategories(unseenSubcats, totalUnseen, seenIds);
      const need = count - totalUnseen;
      selectedQuestions = [...balancedUnseen, ...fisherYatesShuffle(seenInLimbs).slice(0, need)];
    } else {
      selectedQuestions = selectBalancedFromSubcategories(unseenSubcats, count, seenIds);
    }
  } else if (category === 'internal-organs') {
    selectedQuestions = selectFromPool(internalOrgansAllQuestions, count, seenIds, mode);
  } else if (category === 'head-neck') {
    const examPool = mode === 'exam' ? headNeckExamSimulationQuestions : headNeckAllQuestions;
    selectedQuestions = selectFromPool(examPool, count, seenIds, mode);
  } else if (category === 'neuroanatomy') {
    const examPool = mode === 'exam' ? neuroanatomyExamQuestions : neuroanatomyAllQuestions;
    selectedQuestions = selectFromPool(examPool, count, seenIds, mode);
  } else if (category === 'med-admission-barrons') {
    selectedQuestions = selectFromPool(medAdmissionAllQuestions, count, seenIds, mode);
  } else {
    selectedQuestions = selectFromPool(allQuestions, count, seenIds, mode);
  }
  
  log.info(`Selected ${selectedQuestions.length} questions`);
  return { questions: selectedQuestions, resetHistory };
}

export default function QuizSessionScreen() {
  const router = useRouter();
  const { t, getChapterTitle, currentLanguage, isLoading: isLanguageHydrating } = useLanguage();
  const { colors } = useTheme();
  const { category, mode, resume, chapterId } = useLocalSearchParams<{
    category: string;
    mode: string;
    resume?: string;
    chapterId?: string;
  }>();
  const insets = useSafeAreaInsets();
   
  // Use safeAreaInsets directly - react-native-safe-area-context handles edge-to-edge properly
  // No need for StatusBar.currentHeight fallback as edgeToEdgeEnabled is set in app.config.ts
  const topPadding = insets.top;
  const bottomPadding = insets.bottom;
  
  const {
    updateDailyProgress,
    saveSessionState,
    clearSessionState,
    sessionState: savedSession,
    addStudyTime,
    isLoading: isProgressHydrating,
  } = useQuizProgress();
  const { incrementQuestionAnsweredCount, FREE_QUIZ_LIMIT } = useSubscription();
  const [limitReached, setLimitReached] = useState(false);
  
  const sessionStartTimeRef = useRef<number>(Date.now());
  const sessionLanguageRef = useRef<'en' | 'ro' | undefined>(undefined);
  /** English-source questions in session order; used to re-translate when UI language changes. */
  const sessionCanonicalQuestionsRef = useRef<Question[]>([]);
  const lastSyncedQuizUiLanguageRef = useRef<'en' | 'ro' | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsWithChapters, setQuestionsWithChapters] = useState<QuestionWithChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'exam' ? 180 * 60 : 0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answeredInSession, setAnsweredInSession] = useState<string[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<string>(new Date().toISOString());
  
  const fadeAnim = useState(new Animated.Value(1))[0];

  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  
  const categoryRef = useRef(category);
  categoryRef.current = category;
  
  const modeRef = useRef(mode);
  modeRef.current = mode;
  
  const scoreRef = useRef(score);
  scoreRef.current = score;
  
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  
  const answeredInSessionRef = useRef(answeredInSession);
  answeredInSessionRef.current = answeredInSession;
  
  const sessionStartedAtRef = useRef(sessionStartedAt);
  sessionStartedAtRef.current = sessionStartedAt;

  const chapterIdRef = useRef(chapterId);
  chapterIdRef.current = chapterId;

  const { loaded: quizFontsLoaded, families: quizFontFamilies } = useQuizFontsContext();
  const quizTypography = useMemo(
    () => createQuizTypography(quizFontsLoaded, quizFontFamilies),
    [quizFontsLoaded, quizFontFamilies],
  );
  const styles = useMemo(
    () => createStyles(colors, quizTypography),
    [colors, quizTypography],
  );

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      log.info(
        '[QuizSession] Starting loadQuestions - category:',
        category,
        'mode:',
        mode,
        'resume:',
        resume,
        'chapterId:',
        chapterId
      );

      try {
        /** Avoid translating with default `en` before AsyncStorage resolves the user's real UI language.
         *  Also wait for quiz progress restore so `resume=true` sees `savedSession` instead of starting a new quiz. */
        if (isLanguageHydrating || isProgressHydrating) {
          log.info(
            '[QuizSession] Waiting for providers',
            { language: isLanguageHydrating, progress: isProgressHydrating },
          );
          return;
        }
        if (resume === 'true' && savedSession) {
          log.info(
            '[QuizSession] Resuming from saved session at index:',
            savedSession.currentIndex
          );
          if (isMounted) {
            if (!savedSession.questions || savedSession.questions.length === 0) {
              log.error('[QuizSession] Invalid saved session: empty questions');
              await clearSessionState();
              router.replace('/(tabs)');
              return;
            }

            if (savedSession.currentIndex >= savedSession.questions.length) {
              log.error('[QuizSession] Invalid saved session: index out of bounds');
              await clearSessionState();
              router.replace('/(tabs)');
              return;
            }

            const canonicalOrdered = questionsToCanonicalInSessionOrder(
              savedSession.questions,
            );
            sessionCanonicalQuestionsRef.current = canonicalOrdered;
            lastSyncedQuizUiLanguageRef.current = null;

            /** Always map from English canonical + current UI language — saved blobs may be EN from an older session or before `sessionLanguage` was stored. */
            const resumedQuestions = translateAndShuffleQuestions(
              canonicalOrdered,
              currentLanguage as QuestionTranslateLanguage,
            );

            setQuestions(resumedQuestions);
            setQuestionsWithChapters(
              buildQuestionsWithChapters(canonicalOrdered, category || 'mixed'),
            );
            setCurrentIndex(savedSession.currentIndex);
            setScore(savedSession.score);
            setAnsweredInSession(savedSession.answeredInSession);
            setSessionStartedAt(savedSession.startedAt);
            sessionStartTimeRef.current = Date.now();
            sessionLanguageRef.current = currentLanguage;
            setIsLoading(false);
          }
          return;
        }

        sessionLanguageRef.current = currentLanguage;
        /** UI language for this load; mid-session changes are applied via `sessionCanonicalQuestionsRef` + effect. */
        const quizTranslateLanguage = currentLanguage;
        const startedAt = new Date().toISOString();
        if (isMounted) setSessionStartedAt(startedAt);

        if (mode === 'sequential') {
          const cat = category || 'upper-lower-limbs';

          const allWithChapters = getAllQuestionsWithChapters(cat);
          const seenIds = await getSeenQuestionIds(cat);
          const unseenFirst = allWithChapters.filter(
            (qc) => !seenIds.has(qc.question.id)
          );
          const seenRest = allWithChapters.filter((qc) =>
            seenIds.has(qc.question.id)
          );
          let orderedWithChapters = [...unseenFirst, ...seenRest];

          if (cat === 'med-admission-barrons' && chapterId) {
            orderedWithChapters = orderedWithChapters.filter(
              (qc) => qc.chapterId === chapterId
            );
          }

          const baseQuestions = orderedWithChapters.map((qc) => qc.question);
          log.info(
            `[QuizSession] Sequential mode: ${orderedWithChapters.length} questions (${unseenFirst.length} unseen first) for ${cat}, chapterId=${chapterId}`
          );

          if (isMounted) {
            sessionCanonicalQuestionsRef.current = baseQuestions.slice();
            lastSyncedQuizUiLanguageRef.current = null;
            const translatedQuestions = translateAndShuffleQuestions(
              baseQuestions,
              quizTranslateLanguage
            );
            setQuestionsWithChapters(
              orderedWithChapters.map((entry) => ({
                ...entry,
                moduleId: cat,
              })),
            );
            setQuestions(translatedQuestions);
            setIsLoading(false);
          }
        } else {
          const questionCount =
            QUESTION_COUNTS[mode as keyof typeof QUESTION_COUNTS] || 10;
          log.info(
            `[QuizSession] Selecting ${questionCount} questions for mode: ${mode}`
          );

          const { questions: selectedBase } = await selectQuestionsForQuiz(
            category || 'mixed',
            mode || 'quick',
            questionCount
          );

          let selectedQuestions = selectedBase;

          if (category === 'med-admission-barrons' && chapterId) {
            const allWithChapters = getAllQuestionsWithChapters(
              'med-admission-barrons'
            );
            const chapterQuestions = allWithChapters
              .filter((qc) => qc.chapterId === chapterId)
              .map((qc) => qc.question);

            const pool = chapterQuestions.length > 0 ? chapterQuestions : selectedBase;
            const shuffled = fisherYatesShuffle(pool);
            selectedQuestions = shuffled.slice(0, questionCount);
          }

          log.info(
            `[QuizSession] Selected ${selectedQuestions.length} questions (after chapter filter)`
          );

          if (isMounted) {
            if (selectedQuestions.length === 0) {
              log.error('[QuizSession] No questions selected');
              setIsLoading(false);
              return;
            }

            sessionCanonicalQuestionsRef.current = selectedQuestions.slice();
            lastSyncedQuizUiLanguageRef.current = null;
            const translatedQuestions = translateAndShuffleQuestions(
              selectedQuestions,
              quizTranslateLanguage
            );
            if (!translatedQuestions || translatedQuestions.length === 0) {
              log.error('[QuizSession] Translation failed');
              setQuestions(selectedQuestions);
            } else {
              setQuestions(translatedQuestions);
            }

            setQuestionsWithChapters(
              buildQuestionsWithChapters(selectedQuestions, category || 'mixed'),
            );

            if (selectedQuestions.length > 0) {
              const questionIds = selectedQuestions.map((q) => q.id);
              await markQuestionsAsSeen(category || 'mixed', questionIds, mode || undefined);
              log.info(
                `[QuizSession] Marked ${questionIds.length} questions as seen on load`
              );

            const initialSessionState: SessionState = {
              category: category || 'mixed',
              mode: mode || 'quick',
              questions: translatedQuestions,
              currentIndex: 0,
              score: 0,
              answeredInSession: [],
              startedAt,
              sessionLanguage: quizTranslateLanguage,
            };
            await saveSessionState(initialSessionState);
          }
          setIsLoading(false);
        }
      }
    } catch (error) {
      log.error('[QuizSession] Error loading questions:', error);
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  loadQuestions();

  return () => {
    isMounted = false;
  };
  }, [category, mode, resume, chapterId, isLanguageHydrating, isProgressHydrating]);

  useEffect(() => {
    if (isLanguageHydrating || isProgressHydrating) return;
    if (isLoading) return;
    const canonical = sessionCanonicalQuestionsRef.current;
    if (canonical.length === 0) return;

    if (lastSyncedQuizUiLanguageRef.current === null) {
      lastSyncedQuizUiLanguageRef.current = currentLanguage;
      return;
    }
    if (lastSyncedQuizUiLanguageRef.current === currentLanguage) return;
    lastSyncedQuizUiLanguageRef.current = currentLanguage;

    const lang: QuestionTranslateLanguage = currentLanguage;
    const reTranslated = translateAndShuffleQuestions(canonical, lang);
    sessionLanguageRef.current = currentLanguage;
    setQuestions(reTranslated);
    setQuestionsWithChapters(
      buildQuestionsWithChapters(canonical, categoryRef.current || 'mixed'),
    );
    setSelectedAnswers([]);
    setShowResult(false);

    if (modeRef.current !== 'sequential') {
      void saveSessionState({
        category: categoryRef.current || 'mixed',
        mode: modeRef.current || 'quick',
        questions: reTranslated,
        currentIndex: currentIndexRef.current,
        score: scoreRef.current,
        answeredInSession: answeredInSessionRef.current,
        startedAt: sessionStartedAtRef.current,
        sessionLanguage: currentLanguage,
      });
    }
  }, [
    currentLanguage,
    isLanguageHydrating,
    isProgressHydrating,
    isLoading,
    saveSessionState,
  ]);

  const currentQuestion = questions[currentIndex] || null;

  const currentQuestionRef = useRef<Question | null>(null);
  currentQuestionRef.current = currentQuestion;

  useEffect(() => {
    if (mode === 'exam' && timeLeft > 0 && !quizComplete) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, timeLeft, quizComplete]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const finalizeAnswer = useCallback(async (answers: number[]) => {
    if (showResult || !currentQuestionRef.current || !questionsRef.current[currentIndexRef.current]) {
      log.warn('[QuizSession] Invalid state for answer selection');
      return;
    }

    const question = currentQuestionRef.current;
    const currentIdx = currentIndexRef.current;
    const isCorrect = isAnswerCorrect(question, answers);

    setSelectedAnswers(answers);
    setShowResult(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    await updateDailyProgress(isCorrect, question.id);
    await markQuestionsAsSeen(categoryRef.current || 'mixed', [question.id], modeRef.current || undefined);

    const withinLimit = await incrementQuestionAnsweredCount();
    if (!withinLimit) {
      setLimitReached(true);
    }

    const newAnsweredInSession = [...answeredInSessionRef.current, question.id];
    setAnsweredInSession(newAnsweredInSession);

    if (modeRef.current !== 'sequential') {
      const updatedSessionState: SessionState = {
        category: categoryRef.current || 'mixed',
        mode: modeRef.current || 'quick',
        questions: questionsRef.current,
        currentIndex: currentIdx + 1,
        score: isCorrect ? scoreRef.current + 1 : scoreRef.current,
        answeredInSession: newAnsweredInSession,
        startedAt: sessionStartedAtRef.current,
        sessionLanguage: sessionLanguageRef.current ?? 'en',
      };
      await saveSessionState(updatedSessionState);
      log.info('[QuizSession] Saved progress after question', currentIdx + 1);
    }
  }, [showResult, updateDailyProgress, saveSessionState, incrementQuestionAnsweredCount]);

  const handleAnswerSelect = useCallback(async (index: number) => {
    if (showResult || !currentQuestionRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await finalizeAnswer([index]);
  }, [showResult, finalizeAnswer]);

  const handleOptionToggle = useCallback((index: number) => {
    if (showResult || !currentQuestionRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswers(prev => toggleSelectedIndex(prev, index));
  }, [showResult]);

  const handleSubmitMultiSelect = useCallback(async () => {
    if (showResult || selectedAnswers.length === 0) return;
    await finalizeAnswer(selectedAnswers);
  }, [showResult, selectedAnswers, finalizeAnswer]);

  const handleNext = useCallback(async () => {
    if (!questionsRef.current || questionsRef.current.length === 0) {
      log.error('[QuizSession] No questions available');
      router.replace('/(tabs)');
      return;
    }
    
    if (currentIndexRef.current < questionsRef.current.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswers([]);
        setShowResult(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    } else {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      await addStudyTime(elapsedSeconds);
      log.info('[QuizSession] Session complete. Time spent:', elapsedSeconds, 'seconds');
      await clearSessionState();
      log.info('[QuizSession] Quiz complete, cleared session state');
      setQuizComplete(true);
    }
  }, [fadeAnim, clearSessionState, addStudyTime, router]);

  const navigateAwayFromQuiz = useCallback(() => {
    if (categoryRef.current === 'med-admission-barrons' && chapterId) {
      if (router.canGoBack()) {
        router.back();
        return;
      }
    }
    if (typeof router.dismiss === 'function' && router.canDismiss()) {
      router.dismiss();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/quiz' as never);
  }, [router, chapterId]);

  const handleClose = useCallback(() => {
    const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    void (async () => {
      try {
        if (!quizComplete && elapsedSeconds > 5) {
          await addStudyTime(elapsedSeconds);
          log.info('[QuizSession] Session closed. Time spent:', elapsedSeconds, 'seconds');
        }
        await AsyncStorage.setItem('quiz_just_exited', Date.now().toString());
        log.info('[QuizSession] Closing quiz, session state preserved for resume');
      } catch (error) {
        log.warn('[QuizSession] close cleanup failed:', error);
      }
    })();
    navigateAwayFromQuiz();
  }, [addStudyTime, navigateAwayFromQuiz, quizComplete]);

  const handleCopyExplanation = useCallback(async () => {
    if (!currentQuestion?.explanation) return;

    const cleanText = currentQuestion.explanation.replace(/\[(web|screenshot|image|source|ref):\d+\]/gi, '').trim();

    await Clipboard.setStringAsync(cleanText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (Platform.OS === 'web') {
      Alert.alert(t('session.copied'), t('session.explanationCopied'));
    } else {
      Alert.alert(t('session.explanationCopied'));
    }
  }, [currentQuestion, t]);

  const clinicalEnabled = isClinicalCopilotUiEnabled();
  const [clinicalExplainLoading, setClinicalExplainLoading] = useState(false);
  const explainMutation = trpc.clinical.explainQuestion.useMutation();

  const handleClinicalExplain = useCallback(async () => {
    if (!currentQuestion || !clinicalEnabled || clinicalExplainLoading) return;
    const correct = getCorrectAnswerIndices(currentQuestion);
    const correctIndex = correct[0] ?? 0;
    const chosenIndex = selectedAnswers[0] ?? 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    log.info('[ClinicalCopilot] explain CTA → Clinical chat', {
      questionId: currentQuestion.id,
      chosenIndex,
      correctIndex,
    });
    trackClinicalEvent('clinical_explain_started', { questionId: currentQuestion.id });
    setClinicalExplainLoading(true);
    try {
      const res = await explainMutation.mutateAsync({
        question: currentQuestion.question,
        options: currentQuestion.options ?? [],
        chosenIndex,
        correctIndex,
        staticExplanation: currentQuestion.explanation,
        locale: currentLanguage === 'ro' ? 'ro' : 'en',
        acceptDisclaimer: true,
        questionId: String(currentQuestion.id),
        entryPoint: 'quiz_wrong_answer',
      });
      const text = (res?.response ?? '').trim();
      if (!text || !res.sessionId) {
        throw new Error(t('clinical.errorGeneric'));
      }
      const userLabel =
        currentQuestion.question.length > 280
          ? `${currentQuestion.question.slice(0, 277)}…`
          : currentQuestion.question;
      const pending: ClinicalPendingExplain = {
        sessionId: res.sessionId,
        response: text,
        userLabel,
        balance: typeof res.balance === 'number' ? res.balance : undefined,
        questionId: String(currentQuestion.id),
      };
      await AsyncStorage.setItem(CLINICAL_PENDING_EXPLAIN_KEY, JSON.stringify(pending));
      trackClinicalEvent('clinical_explain_completed', { questionId: currentQuestion.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: '/(tabs)/tutor',
        params: { clinicalMode: '1', fromExplain: '1' },
      });
    } catch (e) {
      const code = (e instanceof TRPCClientError
        ? (e.data as { code?: string } | undefined)?.code
        : undefined) ?? '';
      const msg =
        e instanceof TRPCClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : t('clinical.errorGeneric');
      if (
        code === 'FORBIDDEN' ||
        code === 'UNAUTHORIZED' ||
        /TOPUP_REQUIRED|PAYWALL_REQUIRED|Insufficient/i.test(msg)
      ) {
        trackClinicalEvent('clinical_paywall_shown', { source: 'quiz_explain' });
        const needsTopup = /TOPUP_REQUIRED|Insufficient/i.test(msg);
        Alert.alert(
          needsTopup ? t('clinical.errorTitle') : t('clinical.contextualPaywallTitle'),
          needsTopup ? t('clinical.insufficientCredits') : t('clinical.contextualPaywallBody'),
          [
            { text: t('home.later'), style: 'cancel' },
            {
              text: needsTopup ? t('clinical.topupLink') : t('home.upgradePremiumShort'),
              onPress: () =>
                router.push(
                  needsTopup
                    ? { pathname: '/(tabs)/tutor', params: { clinicalMode: '1', openTopup: '1' } }
                    : '/paywall',
                ),
            },
          ],
        );
        return;
      }
      log.debug('[ClinicalCopilot] explain failed:', msg);
      Alert.alert(t('clinical.errorTitle'), msg || t('clinical.errorGeneric'));
    } finally {
      setClinicalExplainLoading(false);
    }
  }, [
    clinicalEnabled,
    clinicalExplainLoading,
    currentQuestion,
    selectedAnswers,
    explainMutation,
    currentLanguage,
    router,
    t,
  ]);

  const activeChapterMeta = questionsWithChapters[currentIndex];
  const activeChapterId = activeChapterMeta?.chapterId ?? '';
  const activeModuleId =
    activeChapterMeta?.moduleId || categoryRef.current || category;
  const showChapterContext = mode !== 'exam' && Boolean(activeChapterId);

  const handleOpenChapterSummary = useCallback(() => {
    if (!activeChapterId || !activeModuleId) return;

    const parent = getParentStudyChapter(activeModuleId, activeChapterId);
    const isDirectStudyModule = activeModuleId === STUDY_PILOT_MODULE_ID;
    if (!parent && !isDirectStudyModule) {
      Alert.alert(t('study.summaryNotFound'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/study/chapter/[chapterId]',
      params: {
        chapterId: activeChapterId,
        moduleId: activeModuleId,
        fromQuiz: '1',
      },
    });
  }, [activeChapterId, activeModuleId, router, t]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.safeArea, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('session.loading')}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.safeArea, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('session.noQuestions')}</Text>
            <TouchableOpacity style={styles.backButton} onPress={handleClose}>
              <Text style={styles.backButtonText}>{t('session.goBack')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (quizComplete) {
    const percentage = (score / questions.length) * 100;
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.safeArea, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t('session.back')}
            >
              <X color={colors.text} size={iconXl} />
            </TouchableOpacity>
          </View>
          <View style={styles.resultContainer}>
            <GlassCard style={styles.resultCard} variant="accent">
              <View style={styles.resultIconContainer} pointerEvents="none">
                {percentage >= 70 ? (
                  <CheckCircle color={colors.success} size={64} />
                ) : (
                  <XCircle color={colors.error} size={64} />
                )}
              </View>
              <Text style={styles.resultTitle}>
                {percentage >= 70 ? t('session.greatJob') : t('session.keepPracticing')}
              </Text>
              <Text style={styles.resultScore}>{score}/{questions.length}</Text>
              <Text style={styles.resultPercentage}>{t('session.percentCorrect').replace('{percent}', percentage.toFixed(0))}</Text>
              
              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatValue}>{score}</Text>
                  <Text style={styles.resultStatLabel}>{t('session.correct')}</Text>
                </View>
                <View style={styles.resultStatDivider} />
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatValue}>{questions.length - score}</Text>
                  <Text style={styles.resultStatLabel}>{t('session.wrong')}</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleClose}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('session.backToQuiz')}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.finishButtonGradient}
                >
                  <Text style={styles.finishButtonText}>{t('session.backToQuiz')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </View>
      </View>
    );
  }

  if (!currentQuestion || !questions[currentIndex]) {
    log.warn('[QuizSession] Current question not available, going back');
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.safeArea, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('session.error')}</Text>
            <TouchableOpacity style={styles.backButton} onPress={handleClose}>
              <Text style={styles.backButtonText}>{t('session.goBack')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (limitReached) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.safeArea, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
          <View style={styles.limitReachedContainer}>
            <View style={styles.limitReachedIconWrap}>
              <Lock size={48} color={colors.warning} strokeWidth={2} />
            </View>
            <Text style={styles.limitReachedTitle}>{t('session.limitReachedTitle')}</Text>
            <Text style={styles.limitReachedSubtitle}>
              {t('session.limitReachedMessage').replace('{count}', String(FREE_QUIZ_LIMIT))}
            </Text>
            <Text style={styles.limitReachedScore}>
              {t('session.limitReachedScore').replace('{score}', String(score)).replace('{total}', String(currentIndex + 1))}
            </Text>
            <TouchableOpacity
              style={styles.limitReachedUpgradeButton}
              activeOpacity={0.8}
              onPress={() => router.push('/paywall')}
            >
              <LinearGradient
                colors={[colors.warning, '#FF9500', '#FFB800']}
                style={styles.limitReachedUpgradeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Crown color="#FFF" size={iconMd} strokeWidth={2.5} />
                <Text style={styles.limitReachedUpgradeText}>{t('session.upgradePremium')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.limitReachedBackButton}
              activeOpacity={0.7}
              onPress={handleClose}
            >
              <Text style={styles.limitReachedBackText}>{t('session.back')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isMultiSelect = isMultiSelectQuestion(currentQuestion);
  const correctIndices = new Set(getCorrectAnswerIndices(currentQuestion));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.safeArea, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color={colors.text} size={iconXl} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentIndex + 1) / questions.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{questions.length}
            </Text>
          </View>
          
          {mode === 'exam' && (
            <View style={styles.timerContainer}>
              <Clock color={colors.warning} size={16} />
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.questionContainer}>
              {showChapterContext && (
                <TouchableOpacity
                  onPress={handleOpenChapterSummary}
                  activeOpacity={0.75}
                  style={styles.chapterBadge}
                  accessibilityRole="button"
                  accessibilityLabel={t('session.openStudyChapter')}
                >
                  <BookOpen color={colors.primary} size={iconSm} />
                  <Text style={styles.chapterText}>
                    {t('session.chapter')}: {getChapterTitle(activeChapterId)}
                  </Text>
                </TouchableOpacity>
              )}
              {currentQuestion.difficulty && (
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>
                    {(['easy', 'medium', 'hard'].includes(currentQuestion.difficulty)
                      ? t(`session.difficulty${currentQuestion.difficulty.charAt(0).toUpperCase()}${currentQuestion.difficulty.slice(1)}` as 'session.difficultyEasy' | 'session.difficultyMedium' | 'session.difficultyHard')
                      : currentQuestion.difficulty)}
                  </Text>
                </View>
              )}
              <Text style={styles.questionText}>{currentQuestion.question || t('session.questionUnavailable')}</Text>
              {isMultiSelect && !showResult && (
                <Text style={styles.multiSelectHint}>{t('session.multiSelectHint')}</Text>
              )}
            </View>

            <View style={styles.optionsContainer}>
              {(currentQuestion.options || []).map((option, index) => {
                const isSelected = selectedAnswers.includes(index);
                const isCorrect = correctIndices.has(index);
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => (isMultiSelect ? handleOptionToggle(index) : handleAnswerSelect(index))}
                    disabled={showResult}
                  >
                    <GlassCard
                      style={StyleSheet.flatten([
                        styles.optionCard,
                        ...(isSelected ? [styles.optionSelected] : []),
                        ...(showCorrect ? [styles.optionCorrect] : []),
                        ...(showWrong ? [styles.optionWrong] : []),
                      ])}
                      variant={isSelected ? 'light' : 'default'}
                    >
                      <View style={[
                        styles.optionLetter,
                        showCorrect && styles.optionLetterCorrect,
                        showWrong && styles.optionLetterWrong,
                      ]}>
                        <Text style={styles.optionLetterText}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                      {showCorrect && <CheckCircle color={colors.success} size={iconMd} />}
                      {showWrong && <XCircle color={colors.error} size={iconMd} />}
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showResult && currentQuestion.explanation && (
              <GlassCard style={styles.explanationCard}>
                <View style={styles.explanationHeader}>
                  <Text style={styles.explanationTitle}>{t('session.explanation')}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton} 
                    onPress={handleCopyExplanation}
                  >
                    <Copy color={colors.primary} size={iconSm} />
                    <Text style={styles.copyButtonText}>{t('session.copy')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                {showChapterContext && activeModuleId && (
                  <TouchableOpacity
                    style={styles.summaryLink}
                    onPress={handleOpenChapterSummary}
                    activeOpacity={0.8}
                  >
                    <BookOpen color={colors.primary} size={iconSm} />
                    <Text style={[styles.summaryLinkText, { color: colors.primary }]}>
                      {t('session.readChapterSummary')}
                    </Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            )}

            {showResult &&
              clinicalEnabled &&
              selectedAnswers.length > 0 &&
              !isAnswerCorrect(currentQuestion, selectedAnswers) && (
                <TouchableOpacity
                  style={[
                    styles.clinicalExplainButton,
                    clinicalExplainLoading && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    void handleClinicalExplain();
                  }}
                  disabled={clinicalExplainLoading}
                  activeOpacity={0.85}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('clinical.explainCta')}
                >
                  <Sparkles color={colors.primary} size={iconSm} />
                  <Text style={[styles.clinicalExplainButtonText, { color: colors.primary }]}>
                    {clinicalExplainLoading
                      ? t('clinical.explainLoading')
                      : t('clinical.explainCta')}
                  </Text>
                </TouchableOpacity>
              )}

            {showResult &&
              !currentQuestion.explanation &&
              showChapterContext &&
              activeModuleId && (
                <TouchableOpacity
                  style={styles.summaryLink}
                  onPress={handleOpenChapterSummary}
                  activeOpacity={0.8}
                >
                  <BookOpen color={colors.primary} size={iconSm} />
                  <Text style={[styles.summaryLinkText, { color: colors.primary }]}>
                    {t('session.readChapterSummary')}
                  </Text>
                </TouchableOpacity>
              )}
          </Animated.View>
        </ScrollView>

        {!showResult && isMultiSelect && (
          <View style={[styles.footer, { paddingBottom: bottomPadding + 8 }]}>
            <TouchableOpacity
              style={[styles.nextButton, selectedAnswers.length === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmitMultiSelect}
              disabled={selectedAnswers.length === 0}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextButtonText}>{t('session.confirmAnswer')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {showResult && (
          <View style={[styles.footer, { paddingBottom: bottomPadding + 8 }]}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextButtonText}>
                  {currentIndex < questions.length - 1 ? t('session.nextQuestion') : t('session.seeResults')}
                </Text>
                <ChevronRight color={colors.text} size={iconMd} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (
  colors: AppColors,
  quizTypo: ReturnType<typeof createQuizTypography>,
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: screenPaddingX,
  },
  loadingText: {
    ...typeScale.title3,
    color: colors.text,
    marginBottom: fieldGap + space.space1,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: sectionGap,
    paddingVertical: space.space3,
    borderRadius: radiusMd,
    minHeight: touchTargetMin,
    justifyContent: 'center',
  },
  backButtonText: {
    ...typeScale.body,
    fontWeight: '600' as const,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space3,
    gap: space.space3,
  },
  closeButton: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space3,
  },
  progressBar: {
    flex: 1,
    height: space.space2 - 2,
    backgroundColor: colors.cardBgLight,
    borderRadius: radiusSm - 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radiusSm - 5,
  },
  progressText: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    borderRadius: radiusPill,
    gap: space.space2 - 2,
    minHeight: touchTargetMin - space.space4,
  },
  timerText: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: fieldGap + space.space1,
  },
  content: {
    flex: 1,
    paddingHorizontal: screenPaddingX,
  },
  questionContainer: {
    marginBottom: sectionGap,
  },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '25',
    paddingHorizontal: screenPaddingX,
    paddingVertical: space.space2,
    borderRadius: radiusMd,
    marginBottom: space.space3,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  summaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2,
    marginTop: space.space4,
    paddingTop: space.space3,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  summaryLinkText: {
    ...quizTypo.badge,
    textAlign: 'left',
  },
  chapterText: {
    ...quizTypo.badge,
    color: colors.primary,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBgLight,
    paddingHorizontal: space.space3,
    paddingVertical: space.space2 - 2,
    borderRadius: radiusMd,
    marginBottom: fieldGap,
  },
  difficultyText: {
    ...typeScale.caption,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  questionText: {
    ...quizTypo.question,
    color: colors.text,
  },
  multiSelectHint: {
    ...quizTypo.hint,
    marginTop: space.space3,
    color: colors.textSecondary,
  },
  optionsContainer: {
    gap: space.space3,
    marginBottom: fieldGap + space.space1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: cardPadding,
    minHeight: touchTargetMin,
  },
  optionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optionCorrect: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 196, 140, 0.1)',
  },
  optionWrong: {
    borderColor: colors.error,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  optionLetter: {
    width: touchTargetMin - space.space3,
    height: touchTargetMin - space.space3,
    borderRadius: (touchTargetMin - space.space3) / 2,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.space3,
  },
  optionLetterCorrect: {
    backgroundColor: colors.success,
  },
  optionLetterWrong: {
    backgroundColor: colors.error,
  },
  optionLetterText: {
    ...quizTypo.optionLetter,
    color: colors.text,
  },
  optionText: {
    ...quizTypo.option,
    flex: 1,
    color: colors.text,
  },
  explanationCard: {
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    borderColor: colors.primary,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.space2,
  },
  explanationTitle: {
    ...typeScale.subhead,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2 - 2,
    paddingHorizontal: space.space3,
    paddingVertical: space.space2 - 2,
    borderRadius: radiusMd,
    backgroundColor: colors.primary + '20',
    minHeight: touchTargetMin - space.space4,
  },
  copyButtonText: {
    ...typeScale.footnote,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  explanationText: {
    ...quizTypo.explanation,
    color: colors.textSecondary,
  },
  clinicalExplainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.space2,
    marginTop: space.space3,
    marginHorizontal: screenPaddingX,
    paddingVertical: space.space3,
    paddingHorizontal: space.space4,
    minHeight: touchTargetMin,
    borderRadius: radiusMd,
    backgroundColor: colors.cardBgLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  clinicalExplainButtonText: {
    ...typeScale.subhead,
    fontWeight: '700' as const,
  },
  footer: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: space.space3,
  },
  nextButton: {
    borderRadius: radiusLg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: buttonHeight,
    paddingVertical: space.space4,
    gap: space.space2,
  },
  nextButtonText: {
    ...typeScale.body,
    fontWeight: '700' as const,
    color: colors.text,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: screenPaddingX,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: space.space7,
  },
  resultIconContainer: {
    marginBottom: fieldGap + space.space1,
  },
  resultTitle: {
    ...typeScale.title1,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: space.space2,
  },
  resultScore: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: space.space1,
  },
  resultPercentage: {
    ...typeScale.body,
    color: colors.textSecondary,
    marginBottom: sectionGap,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.space7,
  },
  resultStat: {
    alignItems: 'center',
    paddingHorizontal: space.space7,
  },
  resultStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: touchTargetMin - space.space1,
    backgroundColor: colors.glassBorder,
  },
  resultStatValue: {
    ...typeScale.title2,
    fontWeight: '700' as const,
    color: colors.text,
  },
  resultStatLabel: {
    ...typeScale.footnote,
    color: colors.textSecondary,
    marginTop: space.space1,
  },
  finishButton: {
    width: '100%',
    borderRadius: radiusLg,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: buttonHeight,
    paddingVertical: space.space4,
  },
  finishButtonText: {
    ...typeScale.body,
    fontWeight: '700' as const,
    color: colors.text,
  },
  limitReachedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.space7,
  },
  limitReachedIconWrap: {
    width: touchTargetMin + space.space8,
    height: touchTargetMin + space.space8,
    borderRadius: (touchTargetMin + space.space8) / 2,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sectionGap,
  },
  limitReachedTitle: {
    ...typeScale.title1,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: space.space3,
    textAlign: 'center',
  },
  limitReachedSubtitle: {
    ...typeScale.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: fieldGap,
  },
  limitReachedScore: {
    ...typeScale.title3,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: space.space7,
  },
  limitReachedUpgradeButton: {
    borderRadius: radiusLg,
    overflow: 'hidden',
    width: '100%',
    marginBottom: fieldGap,
  },
  limitReachedUpgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: buttonHeight,
    paddingVertical: space.space4,
    gap: space.space2 + 2,
  },
  limitReachedUpgradeText: {
    ...typeScale.headline,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  limitReachedBackButton: {
    minHeight: touchTargetMin,
    paddingVertical: space.space3 + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitReachedBackText: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
});
