import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Clock, CheckCircle, XCircle, ChevronRight, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuizProgress, type SessionState } from '@/providers/QuizProgressProvider';
import GlassCard from '@/components/GlassCard';
import type { Question } from '@/mocks/questions';
import { useLanguage } from '@/providers/LanguageProvider';
import { getAllQuestionsWithChapters } from '@/mocks/chapters';
import { translateQuestions, translateAndShuffleQuestions } from '@/lib/translateQuestion';

import {
  generalVertebraeQuestions,
  regionalVertebraeQuestions,
  thoracicVertebraeQuestions,
  lumbarVertebraeQuestions,
  sacrumQuestions,
  atlasAxisVertebraeQuestions,
  ribsGeneralQuestions,
  sternumQuestions
} from '@/mocks/questions_bones_axial';

import {
  clavicleQuestions,
  humerusQuestions,
  radiusAndUlnaQuestions,
  carpalBonesQuestions,
  hipBoneQuestions,
  femurQuestions,
  patellaQuestions,
  tibiaQuestions,
  fibulaQuestions,
  tibiaFibulaQuestions,
  talusQuestions,
  calcaneusQuestions,
  tarsalBonesQuestions,
  upperLimbBonesQuestions
} from '@/mocks/questions_bones_appendicular';

import {
  shoulderMusclesQuestions,
  armMusclesQuestions,
  forearmMusclesQuestions,
  anteriorThighMusclesQuestions,
  hamstringMusclesQuestions,
  medialThighMusclesQuestions,
  legMusclesQuestions,
  halluxMusclesQuestions,
  midplantarMusclesQuestions
} from '@/mocks/questions_muscles';

import {
  brachialArteryQuestions
} from '@/mocks/questions_vessels';

import {
  medianNerveQuestions,
  musculocutaneousNerveQuestions,
  radialNerveQuestions
} from '@/mocks/questions_nerves';

import {
  brachialPlexusQuestions,
  lumbarPlexusQuestions,
  sacralPlexusQuestions,
  sensoryInnervationQuestions
} from '@/mocks/questions_plexuses';

import {
  shoulderJointQuestions,
  elbowJointQuestions,
  wristJointQuestions,
  hipJointQuestions,
  kneeJointQuestions,
  ankleJointQuestions
} from '@/mocks/questions_joints';

import {
  internalOrgansQuestions,
  headNeckQuestions,
  neuroanatomyQuestions,
  pulmonaryAndBronchialCirculationQuestions,
  systemicAndPortalCirculationQuestions,
  fetalCirculationQuestions,
  microcirculationAndCapillaryExchangeQuestions,
  hemodynamicsAndFlowQuestions,
  baroreflexChemoreflexAutoregulationQuestions,
  coronaryCirculationQuestions,
  cerebralAutoregulationAndBBBQuestions,
  lymphaticSystemOverviewQuestions
} from '@/mocks/questions_internal_organs';

import {
  perforatingAndWatershedQuestions
} from '@/mocks/questions_neuro';

import {
  cardioAdmissionSet1,
  bloodAdmissionSet1,
  respiratoryAdmissionSet1,
  metabolismNutritionAdmissionSet1,
  digestiveAdmissionSet1,
  nervousAdmissionSet1,
  introAnatPhysAdmissionSet1,
  chemBasicsAdmissionSet1,
  cellBiologyAdmissionSet1,
  tissuesAdmissionSet1,
  integumentaryAdmissionSet1,
  skeletalAdmissionSet1,
  muscularAdmissionSet1,
  sensesAdmissionSet1,
  endocrineAdmissionSet1,
  lymphaticAdmissionSet1,
  urinaryAdmissionSet1,
  reproMaleAdmissionSet1,
  reproFemaleAdmissionSet1,
  embryologyAdmissionSet1,
} from '@/mocks/questions_med_admission';

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
}

const bonesQuestions: Question[] = [
  ...generalVertebraeQuestions,
  ...regionalVertebraeQuestions,
  ...thoracicVertebraeQuestions,
  ...lumbarVertebraeQuestions,
  ...sacrumQuestions,
  ...atlasAxisVertebraeQuestions,
  ...ribsGeneralQuestions,
  ...sternumQuestions,
  ...clavicleQuestions,
  ...humerusQuestions,
  ...radiusAndUlnaQuestions,
  ...carpalBonesQuestions,
  ...hipBoneQuestions,
  ...femurQuestions,
  ...patellaQuestions,
  ...tibiaQuestions,
  ...fibulaQuestions,
  ...tibiaFibulaQuestions,
  ...talusQuestions,
  ...calcaneusQuestions,
  ...tarsalBonesQuestions,
  ...upperLimbBonesQuestions,
];

const musclesQuestions: Question[] = [
  ...shoulderMusclesQuestions,
  ...armMusclesQuestions,
  ...forearmMusclesQuestions,
  ...anteriorThighMusclesQuestions,
  ...hamstringMusclesQuestions,
  ...medialThighMusclesQuestions,
  ...legMusclesQuestions,
  ...halluxMusclesQuestions,
  ...midplantarMusclesQuestions,
];

const vesselsQuestions: Question[] = [
  ...brachialArteryQuestions,
];

const nervesQuestions: Question[] = [
  ...medianNerveQuestions,
  ...musculocutaneousNerveQuestions,
  ...radialNerveQuestions,
];

const plexusesQuestions: Question[] = [
  ...brachialPlexusQuestions,
  ...lumbarPlexusQuestions,
  ...sacralPlexusQuestions,
  ...sensoryInnervationQuestions,
];

const jointsQuestions: Question[] = [
  ...shoulderJointQuestions,
  ...elbowJointQuestions,
  ...wristJointQuestions,
  ...hipJointQuestions,
  ...kneeJointQuestions,
  ...ankleJointQuestions,
];

const internalOrgansAllQuestions: Question[] = [
  ...internalOrgansQuestions,
  ...pulmonaryAndBronchialCirculationQuestions,
  ...systemicAndPortalCirculationQuestions,
  ...fetalCirculationQuestions,
  ...microcirculationAndCapillaryExchangeQuestions,
  ...hemodynamicsAndFlowQuestions,
  ...baroreflexChemoreflexAutoregulationQuestions,
  ...coronaryCirculationQuestions,
  ...cerebralAutoregulationAndBBBQuestions,
  ...lymphaticSystemOverviewQuestions,
];

const headNeckAllQuestions: Question[] = [
  ...headNeckQuestions,
];

const neuroanatomyAllQuestions: Question[] = [
  ...neuroanatomyQuestions,
  ...perforatingAndWatershedQuestions,
];

const medAdmissionAllQuestions: Question[] = [
  ...introAnatPhysAdmissionSet1,
  ...chemBasicsAdmissionSet1,
  ...cellBiologyAdmissionSet1,
  ...tissuesAdmissionSet1,
  ...integumentaryAdmissionSet1,
  ...skeletalAdmissionSet1,
  ...muscularAdmissionSet1,
  ...nervousAdmissionSet1,
  ...sensesAdmissionSet1,
  ...endocrineAdmissionSet1,
  ...bloodAdmissionSet1,
  ...cardioAdmissionSet1,
  ...lymphaticAdmissionSet1,
  ...respiratoryAdmissionSet1,
  ...digestiveAdmissionSet1,
  ...metabolismNutritionAdmissionSet1,
  ...urinaryAdmissionSet1,
  ...reproMaleAdmissionSet1,
  ...reproFemaleAdmissionSet1,
  ...embryologyAdmissionSet1,
];

const upperLowerLimbsSubcategories = {
  bones: bonesQuestions,
  muscles: musclesQuestions,
  vessels: vesselsQuestions,
  nerves: nervesQuestions,
  plexuses: plexusesQuestions,
  joints: jointsQuestions,
};

const allUpperLowerLimbsQuestions: Question[] = [
  ...bonesQuestions,
  ...musclesQuestions,
  ...vesselsQuestions,
  ...nervesQuestions,
  ...plexusesQuestions,
  ...jointsQuestions,
];

const allQuestions: Question[] = [
  ...allUpperLowerLimbsQuestions,
  ...internalOrgansAllQuestions,
  ...headNeckAllQuestions,
  ...neuroanatomyAllQuestions,
  ...medAdmissionAllQuestions,
];

function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function getSeenQuestionIds(category: string): Promise<Set<string>> {
  try {
    const key = `user_seen_questions_${category}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (error) {
    console.log('Error loading seen questions:', error);
  }
  return new Set();
}

async function markQuestionsAsSeen(category: string, questionIds: string[]): Promise<void> {
  try {
    const key = `user_seen_questions_${category}`;
    const existingIds = await getSeenQuestionIds(category);
    questionIds.forEach(id => existingIds.add(id));
    await AsyncStorage.setItem(key, JSON.stringify([...existingIds]));
    console.log(`Marked ${questionIds.length} questions as seen for category: ${category}`);
  } catch (error) {
    console.log('Error saving seen questions:', error);
  }
}

async function resetSeenQuestions(category: string): Promise<void> {
  try {
    const key = `user_seen_questions_${category}`;
    await AsyncStorage.removeItem(key);
    console.log(`Reset seen questions for category: ${category}`);
  } catch (error) {
    console.log('Error resetting seen questions:', error);
  }
}

function filterUnseenQuestions(questions: Question[], seenIds: Set<string>): Question[] {
  return questions.filter(q => !seenIds.has(q.id));
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

async function selectQuestionsForQuiz(
  category: string,
  mode: string,
  count: number
): Promise<{ questions: Question[]; resetHistory: boolean }> {
  console.log(`Selecting ${count} questions for category: ${category}, mode: ${mode}`);
  
  const seenIds = await getSeenQuestionIds(category);
  console.log(`Previously seen questions: ${seenIds.size}`);
  
  let availableQuestions: Question[];
  let selectedQuestions: Question[];
  let resetHistory = false;
  
  if (category === 'upper-lower-limbs') {
    const unseenSubcats: Record<string, Question[]> = {};
    let totalUnseen = 0;
    
    Object.entries(upperLowerLimbsSubcategories).forEach(([key, questions]) => {
      unseenSubcats[key] = filterUnseenQuestions(questions, seenIds);
      totalUnseen += unseenSubcats[key].length;
    });
    
    console.log(`Total unseen upper-lower-limbs questions: ${totalUnseen}`);
    
    if (totalUnseen < count) {
      const seenInLimbs = allUpperLowerLimbsQuestions.filter(q => seenIds.has(q.id));
      const balancedUnseen = selectBalancedFromSubcategories(unseenSubcats, totalUnseen, seenIds);
      const need = count - totalUnseen;
      selectedQuestions = [...balancedUnseen, ...fisherYatesShuffle(seenInLimbs).slice(0, need)];
    } else {
      selectedQuestions = selectBalancedFromSubcategories(unseenSubcats, count, seenIds);
    }
  } else if (category === 'internal-organs') {
    availableQuestions = filterUnseenQuestions(internalOrgansAllQuestions, seenIds);
    const seenQuestions = internalOrgansAllQuestions.filter(q => seenIds.has(q.id));
    if (availableQuestions.length < count) {
      const need = count - availableQuestions.length;
      selectedQuestions = [...fisherYatesShuffle(availableQuestions), ...fisherYatesShuffle(seenQuestions).slice(0, need)];
    } else {
      selectedQuestions = fisherYatesShuffle(availableQuestions).slice(0, count);
    }
  } else if (category === 'head-neck') {
    availableQuestions = filterUnseenQuestions(headNeckAllQuestions, seenIds);
    const seenQuestions = headNeckAllQuestions.filter(q => seenIds.has(q.id));
    if (availableQuestions.length < count) {
      const need = count - availableQuestions.length;
      selectedQuestions = [...fisherYatesShuffle(availableQuestions), ...fisherYatesShuffle(seenQuestions).slice(0, need)];
    } else {
      selectedQuestions = fisherYatesShuffle(availableQuestions).slice(0, count);
    }
  } else if (category === 'neuroanatomy') {
    availableQuestions = filterUnseenQuestions(neuroanatomyAllQuestions, seenIds);
    const seenQuestions = neuroanatomyAllQuestions.filter(q => seenIds.has(q.id));
    if (availableQuestions.length < count) {
      const need = count - availableQuestions.length;
      selectedQuestions = [...fisherYatesShuffle(availableQuestions), ...fisherYatesShuffle(seenQuestions).slice(0, need)];
    } else {
      selectedQuestions = fisherYatesShuffle(availableQuestions).slice(0, count);
    }
  } else if (category === 'med-admission-barrons') {
    availableQuestions = filterUnseenQuestions(medAdmissionAllQuestions, seenIds);
    const seenQuestions = medAdmissionAllQuestions.filter(q => seenIds.has(q.id));
    if (availableQuestions.length < count) {
      const need = count - availableQuestions.length;
      selectedQuestions = [...fisherYatesShuffle(availableQuestions), ...fisherYatesShuffle(seenQuestions).slice(0, need)];
    } else {
      selectedQuestions = fisherYatesShuffle(availableQuestions).slice(0, count);
    }
  } else {
    availableQuestions = filterUnseenQuestions(allQuestions, seenIds);
    const seenQuestions = allQuestions.filter(q => seenIds.has(q.id));
    if (availableQuestions.length < count) {
      const need = count - availableQuestions.length;
      selectedQuestions = [...fisherYatesShuffle(availableQuestions), ...fisherYatesShuffle(seenQuestions).slice(0, need)];
    } else {
      selectedQuestions = fisherYatesShuffle(availableQuestions).slice(0, count);
    }
  }
  
  console.log(`Selected ${selectedQuestions.length} questions`);
  return { questions: selectedQuestions, resetHistory };
}

export default function QuizSessionScreen() {
  const router = useRouter();
  const { t, getChapterTitle, currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const { category, mode, resume } = useLocalSearchParams<{ category: string; mode: string; resume?: string }>();
  const insets = useSafeAreaInsets();
  
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0);
  
  const { 
    updateDailyProgress, 
    saveSessionState, 
    clearSessionState, 
    sessionState: savedSession,
    addStudyTime 
  } = useQuizProgress();
  
  const sessionStartTimeRef = useRef<number>(Date.now());
  const sessionLanguageRef = useRef<'en' | 'ro' | undefined>(undefined);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsWithChapters, setQuestionsWithChapters] = useState<QuestionWithChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'exam' ? 180 * 60 : 0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answeredInSession, setAnsweredInSession] = useState<string[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<string>(new Date().toISOString());
  
  const fadeAnim = useState(new Animated.Value(1))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let isMounted = true;
    
    const loadQuestions = async () => {
      console.log('[QuizSession] Starting loadQuestions - category:', category, 'mode:', mode, 'resume:', resume);
      
      try {
        if (resume === 'true' && savedSession) {
          console.log('[QuizSession] Resuming from saved session at index:', savedSession.currentIndex);
          if (isMounted) {
            if (!savedSession.questions || savedSession.questions.length === 0) {
              console.error('[QuizSession] Invalid saved session: empty questions');
              await clearSessionState();
              router.replace('/' as any);
              return;
            }
            
            if (savedSession.currentIndex >= savedSession.questions.length) {
              console.error('[QuizSession] Invalid saved session: index out of bounds');
              await clearSessionState();
              router.replace('/' as any);
              return;
            }
            
            setQuestions(savedSession.questions);
            setCurrentIndex(savedSession.currentIndex);
            setScore(savedSession.score);
            setAnsweredInSession(savedSession.answeredInSession);
            setSessionStartedAt(savedSession.startedAt);
            sessionStartTimeRef.current = Date.now();
            sessionLanguageRef.current = savedSession.sessionLanguage ?? (currentLanguage === 'ro' ? 'ro' : 'en');
            setIsLoading(false);
          }
          return;
        }
        
        sessionLanguageRef.current = currentLanguage === 'ro' ? 'ro' : 'en';
        const startedAt = new Date().toISOString();
        if (isMounted) setSessionStartedAt(startedAt);
        
        if (mode === 'sequential') {
          const cat = category || 'upper-lower-limbs';
          const allWithChapters = getAllQuestionsWithChapters(cat);
          const seenIds = await getSeenQuestionIds(cat);
          const unseenFirst = allWithChapters.filter(qc => !seenIds.has(qc.question.id));
          const seenRest = allWithChapters.filter(qc => seenIds.has(qc.question.id));
          const orderedWithChapters = [...unseenFirst, ...seenRest];
          const baseQuestions = orderedWithChapters.map(qc => qc.question);
          console.log(`[QuizSession] Sequential mode: ${orderedWithChapters.length} questions (${unseenFirst.length} unseen first) for ${cat}`);
          if (isMounted) {
            const translatedQuestions = translateAndShuffleQuestions(baseQuestions, currentLanguage);
            setQuestionsWithChapters(orderedWithChapters);
            setQuestions(translatedQuestions);
            setIsLoading(false);
          }
        } else {
          const questionCount = QUESTION_COUNTS[mode as keyof typeof QUESTION_COUNTS] || 10;
          console.log(`[QuizSession] Selecting ${questionCount} questions for mode: ${mode}`);
          
          const { questions: selectedQuestions } = await selectQuestionsForQuiz(
            category || 'mixed',
            mode || 'quick',
            questionCount
          );
          
          console.log(`[QuizSession] Selected ${selectedQuestions.length} questions`);
          
          if (isMounted) {
            if (selectedQuestions.length === 0) {
              console.error('[QuizSession] No questions selected');
              setIsLoading(false);
              return;
            }
            
            const translatedQuestions = translateAndShuffleQuestions(selectedQuestions, currentLanguage);
            if (!translatedQuestions || translatedQuestions.length === 0) {
              console.error('[QuizSession] Translation failed');
              setQuestions(selectedQuestions);
            } else {
              setQuestions(translatedQuestions);
            }
            
            if (selectedQuestions.length > 0) {
              const questionIds = selectedQuestions.map(q => q.id);
              await markQuestionsAsSeen(category || 'mixed', questionIds);
              console.log(`[QuizSession] Marked ${questionIds.length} questions as seen on load`);
              
              const initialSessionState: SessionState = {
                category: category || 'mixed',
                mode: mode || 'quick',
                questions: translatedQuestions,
                currentIndex: 0,
                score: 0,
                answeredInSession: [],
                startedAt,
                sessionLanguage: currentLanguage === 'ro' ? 'ro' : 'en',
              };
              await saveSessionState(initialSessionState);
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('[QuizSession] Error loading questions:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadQuestions();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mode, resume]);



  const currentQuestion = questions[currentIndex] || null;

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

  const handleAnswerSelect = useCallback(async (index: number) => {
    if (showResult || !currentQuestion || !questions[currentIndex]) {
      console.warn('[QuizSession] Invalid state for answer selection');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(index);
    setShowResult(true);
    
    const isCorrect = index === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    await updateDailyProgress(isCorrect, currentQuestion.id);
    await markQuestionsAsSeen(category || 'mixed', [currentQuestion.id]);
    
    const newAnsweredInSession = [...answeredInSession, currentQuestion.id];
    setAnsweredInSession(newAnsweredInSession);
    
    if (mode !== 'sequential') {
      const updatedSessionState: SessionState = {
        category: category || 'mixed',
        mode: mode || 'quick',
        questions,
        currentIndex: currentIndex + 1,
        score: isCorrect ? score + 1 : score,
        answeredInSession: newAnsweredInSession,
        startedAt: sessionStartedAt,
        sessionLanguage: sessionLanguageRef.current ?? (currentLanguage === 'ro' ? 'ro' : 'en'),
      };
      await saveSessionState(updatedSessionState);
      console.log('[QuizSession] Saved progress after question', currentIndex + 1);
    }
  }, [showResult, currentQuestion, updateDailyProgress, answeredInSession, mode, category, questions, currentIndex, score, sessionStartedAt, saveSessionState]);

  const handleNext = useCallback(async () => {
    if (!questions || questions.length === 0) {
      console.error('[QuizSession] No questions available');
      router.replace('/' as any);
      return;
    }
    
    if (currentIndex < questions.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
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
      console.log('[QuizSession] Session complete. Time spent:', elapsedSeconds, 'seconds');
      await clearSessionState();
      console.log('[QuizSession] Quiz complete, cleared session state');
      setQuizComplete(true);
    }
  }, [currentIndex, questions, fadeAnim, clearSessionState, addStudyTime, router]);

  const handleClose = useCallback(async () => {
    const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    if (elapsedSeconds > 5) {
      await addStudyTime(elapsedSeconds);
      console.log('[QuizSession] Session closed. Time spent:', elapsedSeconds, 'seconds');
    }
    
    await AsyncStorage.setItem('quiz_just_exited', Date.now().toString());
    console.log('[QuizSession] Closing quiz, session state preserved for resume');
    router.replace('/' as any);
  }, [addStudyTime, router]);

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
          <View style={styles.resultContainer}>
            <GlassCard style={styles.resultCard} variant="accent">
              <View style={styles.resultIconContainer}>
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
              
              <TouchableOpacity style={styles.finishButton} onPress={handleClose}>
                <LinearGradient
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
    console.warn('[QuizSession] Current question not available, going back');
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.safeArea, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color={colors.text} size={24} />
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
              {mode === 'sequential' && questionsWithChapters[currentIndex] && (
                <View style={styles.chapterBadge}>
                  <Text style={styles.chapterText}>{t('session.chapter')}: {getChapterTitle(questionsWithChapters[currentIndex].chapterId)}</Text>
                </View>
              )}
              {currentQuestion.difficulty && (
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
                </View>
              )}
              <Text style={styles.questionText}>{currentQuestion.question || t('session.questionUnavailable')}</Text>
            </View>

            <View style={styles.optionsContainer}>
              {(currentQuestion.options || []).map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleAnswerSelect(index)}
                    disabled={showResult}
                  >
                    <GlassCard
                      style={StyleSheet.flatten([
                        styles.optionCard,
                        isSelected ? styles.optionSelected : null,
                        showCorrect ? styles.optionCorrect : null,
                        showWrong ? styles.optionWrong : null,
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
                      {showCorrect && <CheckCircle color={colors.success} size={20} />}
                      {showWrong && <XCircle color={colors.error} size={20} />}
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
                    <Copy color={colors.primary} size={18} />
                    <Text style={styles.copyButtonText}>{t('session.copy')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
              </GlassCard>
            )}
          </Animated.View>
        </ScrollView>

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
                <ChevronRight color={colors.text} size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.cardBgLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    marginBottom: 24,
  },
  chapterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '25',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  chapterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardBgLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterCorrect: {
    backgroundColor: colors.success,
  },
  optionLetterWrong: {
    backgroundColor: colors.error,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  explanationCard: {
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    borderColor: colors.primary,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary + '20',
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  explanationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  resultIconContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  resultPercentage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  resultStat: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  resultStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.glassBorder,
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  resultStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  finishButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
});
