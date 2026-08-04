import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { Screen, TutorTabHeader } from '@/components/layout';
import { StudyMarkdown } from '@/components/StudyMarkdown';
import {
  Send,
  Bot,
  User,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Lock,
  RotateCcw,
  Image as ImageIcon,
  FileText,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import GlassCard from '@/components/GlassCard';
import { log } from '@/lib/log';
import { saveAuthReturnToPath } from '@/lib/auth-return-url';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import {
  cardPadding,
  fieldGap,
  iconMd,
  iconSm,
  inputHeight,
  radiusLg,
  radiusPill,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { OfflineFeatureNotice } from '@/components/OfflineFeatureNotice';
import type { AppColors } from '@/constants/colors';
import { isClinicalCopilotUiEnabled } from '@/lib/clinical-copilot-flag';
import {
  CLINICAL_CASE_TOPICS,
  CLINICAL_DISCLAIMER_VERSION,
  type ClinicalCaseTopic,
} from '@/constants/clinical-copilot';
import { ClinicalTopupSheet } from '@/components/ClinicalTopupSheet';
import { streamClinicalReply } from '@/lib/clinical-stream-client';
import { streamTutorReply } from '@/lib/tutor-stream-client';
import {
  resolveTutorResponseLocale,
  type TutorLocale,
} from '@/lib/tutor-locale';
import { getMedvbaAccessToken } from '@/lib/medvba-access-token';
import { trackClinicalEvent } from '@/lib/clinical-analytics';
import {
  CLINICAL_PENDING_EXPLAIN_KEY,
  friendlyClinicalExplainError,
  isExplainIntent,
  type ClinicalPendingExplain,
  type ClinicalPendingExplainIntent,
} from '@/lib/clinical-pending-explain';
import AsyncStorage from '@react-native-async-storage/async-storage';
function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TRPCClientError) {
    const msg = error.message?.trim();
    if (msg) return msg;
  }
  if (error instanceof Error && error.message?.trim()) {
    return error.message.trim();
  }
  return fallback;
}

/** tRPC PRECONDITION_FAILED → HTTP 412 (e.g. AI keys missing on server). */
function isTrpcPreconditionFailed(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  const httpStatus = (error.data as { httpStatus?: number } | undefined)?.httpStatus;
  return httpStatus === 412;
}

function isTrpcForbidden(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  const code = (error.data as { code?: string } | undefined)?.code;
  return code === 'FORBIDDEN';
}

function isClinicalProcedureMissing(error: unknown): boolean {
  const msg = getMutationErrorMessage(error, '').toLowerCase();
  return (
    msg.includes('no procedure found') ||
    (msg.includes('clinical.') && msg.includes('not found')) ||
    msg.includes("path 'clinical.")
  );
}

function getTutorErrorContent(error: unknown, t: (key: string) => string): string {
  if (isClinicalProcedureMissing(error)) {
    return t('clinical.apiUnavailable');
  }
  if (isTrpcPreconditionFailed(error)) {
    return t('tutor.serverConfigError');
  }
  return getMutationErrorMessage(error, t('tutor.errorMessage'));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const getSuggestedQuestions = (t: (key: string) => string) => [
  { icon: BookOpen, text: t('tutor.suggestion1'), category: t('subject.physiology') },
  { icon: Lightbulb, text: t('tutor.suggestion2'), category: t('subject.pathology') },
  { icon: HelpCircle, text: t('tutor.suggestion3'), category: t('subject.pharmacology') },
];

export default function TutorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tutorMessages, setTutorMessages] = useState<Message[]>([]);
  const [clinicalMessages, setClinicalMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const clinicalUiEnabled = isClinicalCopilotUiEnabled();
  const [copilotMode, setCopilotMode] = useState<'tutor' | 'clinical'>('tutor');
  const messages =
    clinicalUiEnabled && copilotMode === 'clinical'
      ? clinicalMessages
      : tutorMessages;
  const [clinicalSessionId, setClinicalSessionId] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [clinicalBalance, setClinicalBalance] = useState<number | null>(null);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [topupVisible, setTopupVisible] = useState(false);
  const [howToExpanded, setHowToExpanded] = useState(true);
  const [casesToolsExpanded, setCasesToolsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastUserMessageRef = useRef<string>('');
  const clinicalStreamAbortRef = useRef<AbortController | null>(null);
  const tutorStreamAbortRef = useRef<AbortController | null>(null);
  const explainInFlightRef = useRef(false);
  const router = useRouter();
  const params = useLocalSearchParams<{
    clinicalMode?: string | string[];
    fromExplain?: string | string[];
    openTopup?: string | string[];
  }>();
  const paramFlag = useCallback((value: string | string[] | undefined) => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === '1';
  }, []);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const {
    isPremium,
    isPaywallEnabled,
    canAskAiQuestion,
    getRemainingAiQuestions,
    FREE_AI_LIMIT,
    syncAiQuestionCountFromServer,
  } = useSubscription();

  const remainingAiQuestions = getRemainingAiQuestions();
  const { t, currentLanguage } = useLanguage();
  const tabBarHeight = useBottomTabBarHeight();
  const keyboardHeight = useKeyboardHeight();
  const keyboardVerticalOffset = tabBarHeight;

  const tutorLocale = resolveTutorResponseLocale(currentLanguage);

  const clinicalFocus =
    clinicalUiEnabled &&
    copilotMode === 'clinical' &&
    (!!clinicalSessionId ||
      clinicalMessages.some((m) => m.role === 'assistant' && !m.isError));

  useEffect(() => {
    if (!clinicalFocus) return;
    setHowToExpanded(false);
    setCasesToolsExpanded(false);
  }, [clinicalFocus]);

  useEffect(() => {
    return () => {
      clinicalStreamAbortRef.current?.abort();
      clinicalStreamAbortRef.current = null;
      tutorStreamAbortRef.current?.abort();
      tutorStreamAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (copilotMode !== 'clinical') {
      clinicalStreamAbortRef.current?.abort();
      clinicalStreamAbortRef.current = null;
    } else {
      tutorStreamAbortRef.current?.abort();
      tutorStreamAbortRef.current = null;
    }
    setIsTyping(false);
    setIsStreamingReply(false);
  }, [copilotMode]);

  useEffect(() => {
    void syncAiQuestionCountFromServer();
  }, [syncAiQuestionCountFromServer]);

  const suggestedQuestions = getSuggestedQuestions(t);

  const getInitialMessage = useCallback((): Message => ({
    id: '1',
    role: 'assistant',
    content: t('tutor.welcomeMessage'),
    timestamp: new Date(),
  }), [t]);

  useEffect(() => {
    setTutorMessages((prev) => (prev.length === 0 ? [getInitialMessage()] : prev));
  }, [getInitialMessage]);

  const chatMutation = trpc.tutor.chat.useMutation();
  const startCaseMutation = trpc.clinical.startCase.useMutation();
  const explainQuestionMutation = trpc.clinical.explainQuestion.useMutation();
  const clinicalReplyMutation = trpc.clinical.reply.useMutation();
  const analyzeImageMutation = trpc.clinical.analyzeImage.useMutation();
  const generateSummaryMutation = trpc.clinical.generateSummary.useMutation();
  const clinicalStatusQuery = trpc.clinical.getStatus.useQuery(undefined, {
    enabled: clinicalUiEnabled,
    retry: false,
  });
  const syncClinicalEntitlement = trpc.clinical.syncEntitlement.useMutation();
  const trpcUtils = trpc.useUtils();
  const explainQuestionMutateRef = useRef(explainQuestionMutation.mutateAsync);
  explainQuestionMutateRef.current = explainQuestionMutation.mutateAsync;

  useEffect(() => {
    if (clinicalStatusQuery.data?.enabled) {
      setClinicalBalance(clinicalStatusQuery.data.balance);
      if (typeof clinicalStatusQuery.data.trialCreditsRemaining === 'number') {
        setTrialRemaining(clinicalStatusQuery.data.trialCreditsRemaining);
      }
    }
  }, [clinicalStatusQuery.data]);

  useEffect(() => {
    if (!clinicalUiEnabled) return;
    trackClinicalEvent('clinical_opened');
    void (async () => {
      try {
        const v = await AsyncStorage.getItem('clinical_disclaimer_v');
        if (v === CLINICAL_DISCLAIMER_VERSION) {
          setDisclaimerAccepted(true);
          setHowToExpanded(false);
        }
        const howTo = await AsyncStorage.getItem('clinical_howto_collapsed');
        if (howTo === '1') setHowToExpanded(false);
      } catch {
        /* ignore */
      }
    })();
  }, [clinicalUiEnabled]);

  const acceptDisclaimer = useCallback(async () => {
    setDisclaimerAccepted(true);
    setHowToExpanded(false);
    trackClinicalEvent('clinical_disclaimer_accepted', {
      version: CLINICAL_DISCLAIMER_VERSION,
    });
    try {
      await AsyncStorage.setItem('clinical_disclaimer_v', CLINICAL_DISCLAIMER_VERSION);
      await AsyncStorage.setItem('clinical_howto_collapsed', '1');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleHowTo = useCallback(async () => {
    setHowToExpanded((prev) => {
      const next = !prev;
      void AsyncStorage.setItem('clinical_howto_collapsed', next ? '0' : '1').catch(() => {});
      return next;
    });
  }, []);

  const generateAIResponse = useCallback(
    async (conversationHistory: Message[], locale: TutorLocale): Promise<string> => {
    const historyForBackend = conversationHistory
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    log.debug('[Tutor] Sending request to backend with ' + historyForBackend.length + ' messages');
    const result = await chatMutation.mutateAsync({ messages: historyForBackend, locale });
    log.debug('[Tutor] Received AI response from backend');
    return result.response;
  },
    [chatMutation],
  );

  const openPaywallWithFallback = useCallback(() => {
    try {
      router.push('/paywall');
    } catch (error) {
      log.error('[Tutor] Failed to open paywall route:', error);
      const paywallRouteErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('tutor.errorMessage'),
        timestamp: new Date(),
        isError: true,
      };
      setTutorMessages((prev) => [...prev, paywallRouteErrorMessage]);
    }
  }, [router, t]);

  const openTopupOrPaywall = useCallback(
    (message?: string) => {
      const msg = message ?? '';
      const needsTopup =
        msg.includes('TOPUP_REQUIRED') || msg.includes('Insufficient');
      // Pro + 0 credits must never re-open subscription paywall ("already subscribed").
      const looksPro = isPremium || !!clinicalStatusQuery.data?.isPro;

      if (needsTopup || looksPro) {
        void (async () => {
          try {
            const synced = await syncClinicalEntitlement.mutateAsync();
            await trpcUtils.clinical.getStatus.invalidate();
            await trpcUtils.clinical.getCredits.invalidate();
            if (typeof synced.balance === 'number') {
              setClinicalBalance(synced.balance);
            }
            if ((synced.balance ?? 0) + 1e-9 >= 1) {
              Alert.alert(
                t('clinical.errorTitle'),
                t('clinical.creditsRestored').replace(
                  '{count}',
                  String(synced.balance),
                ),
              );
              return;
            }
            if (synced.isPro || looksPro || needsTopup) {
              trackClinicalEvent('clinical_insufficient_credits');
              trackClinicalEvent('clinical_topup_shown');
              setTopupVisible(true);
              return;
            }
          } catch {
            if (needsTopup || looksPro) {
              trackClinicalEvent('clinical_insufficient_credits');
              trackClinicalEvent('clinical_topup_shown');
              setTopupVisible(true);
              return;
            }
          }
          trackClinicalEvent('clinical_paywall_shown');
          openPaywallWithFallback();
        })();
        return;
      }

      trackClinicalEvent('clinical_paywall_shown');
      openPaywallWithFallback();
    },
    [
      openPaywallWithFallback,
      isPremium,
      clinicalStatusQuery.data?.isPro,
      syncClinicalEntitlement,
      trpcUtils,
      t,
    ],
  );

  const openTopupOrPaywallRef = useRef(openTopupOrPaywall);
  openTopupOrPaywallRef.current = openTopupOrPaywall;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const clearExplainRouteParams = () => {
        const p = paramsRef.current;
        if (
          paramFlag(p.clinicalMode) ||
          paramFlag(p.fromExplain) ||
          paramFlag(p.openTopup)
        ) {
          router.setParams({
            clinicalMode: '',
            fromExplain: '',
            openTopup: '',
          });
        }
      };

      const optionLetter = (index: number) =>
        String.fromCharCode(65 + Math.max(0, index));

      const buildQuizUserLabel = (intent: ClinicalPendingExplainIntent) => {
        const stem =
          intent.question.length > 280
            ? `${intent.question.slice(0, 277)}…`
            : intent.question;
        const chosen = intent.options[intent.chosenIndex];
        const correct = intent.options[intent.correctIndex];
        if (!chosen && !correct) return stem;
        const chosenLine = chosen
          ? `${optionLetter(intent.chosenIndex)}. ${chosen}`
          : null;
        const correctLine = correct
          ? `${optionLetter(intent.correctIndex)}. ${correct}`
          : null;
        if (
          chosenLine &&
          correctLine &&
          intent.chosenIndex === intent.correctIndex
        ) {
          return `${stem}\n\n✓ ${chosenLine}`;
        }
        const parts = [stem];
        if (chosenLine) parts.push(`→ ${chosenLine}`);
        if (correctLine && intent.chosenIndex !== intent.correctIndex) {
          parts.push(`✓ ${correctLine}`);
        }
        return parts.join('\n');
      };

      const runQuizExplainIntent = async (intent: ClinicalPendingExplainIntent) => {
        if (explainInFlightRef.current) return;
        explainInFlightRef.current = true;
        const userLabel = buildQuizUserLabel(intent);
        const userMsgId = `quiz-user-${intent.questionId ?? Date.now()}`;
        setDisclaimerAccepted(true);
        setHowToExpanded(false);
        setCasesToolsExpanded(false);
        setCopilotMode('clinical');
        setClinicalSessionId(null);
        setClinicalMessages([
          {
            id: userMsgId,
            role: 'user',
            content: userLabel,
            timestamp: new Date(),
          },
        ]);
        // Clear after the question is visible so focus cleanup cannot drop the intent mid-flight.
        await AsyncStorage.removeItem(CLINICAL_PENDING_EXPLAIN_KEY);
        setIsTyping(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);

        try {
          const res = await explainQuestionMutateRef.current({
            question: intent.question,
            options: intent.options,
            chosenIndex: intent.chosenIndex,
            correctIndex: intent.correctIndex,
            staticExplanation: intent.staticExplanation,
            locale: intent.locale,
            acceptDisclaimer: true,
            questionId: intent.questionId,
            entryPoint: intent.entryPoint ?? 'quiz_wrong_answer',
          });
          if (cancelled) return;
          const text = (res?.response ?? '').trim();
          if (!text || !res.sessionId) {
            throw new Error(t('clinical.errorGeneric'));
          }
          setClinicalSessionId(res.sessionId);
          if (typeof res.balance === 'number') {
            setClinicalBalance(res.balance);
          }
          setClinicalMessages((prev) => [
            ...prev,
            {
              id: `quiz-assistant-${res.sessionId}`,
              role: 'assistant',
              content: text,
              timestamp: new Date(),
            },
          ]);
          trackClinicalEvent('clinical_explain_completed', {
            questionId: intent.questionId,
          });
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 200);
        } catch (error) {
          if (cancelled) return;
          const msg = getMutationErrorMessage(error, '');
          if (
            isTrpcForbidden(error) ||
            /TOPUP_REQUIRED|PAYWALL_REQUIRED|Insufficient/i.test(msg)
          ) {
            openTopupOrPaywallRef.current(msg);
            setClinicalMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: friendlyClinicalExplainError(
                  msg,
                  t('clinical.insufficientCredits'),
                ),
                timestamp: new Date(),
                isError: true,
              },
            ]);
            return;
          }
          setClinicalMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: friendlyClinicalExplainError(
                msg,
                t('clinical.errorGeneric'),
              ),
              timestamp: new Date(),
              isError: true,
            },
          ]);
        } finally {
          explainInFlightRef.current = false;
          clearExplainRouteParams();
          setIsTyping(false);
        }
      };

      const hydrateFromQuizExplain = async () => {
        if (!clinicalUiEnabled) return;

        const p = paramsRef.current;
        const wantClinical =
          paramFlag(p.clinicalMode) ||
          paramFlag(p.fromExplain) ||
          paramFlag(p.openTopup);
        if (wantClinical) {
          setCopilotMode('clinical');
        }
        if (paramFlag(p.openTopup)) {
          trackClinicalEvent('clinical_topup_shown');
          setTopupVisible(true);
        }

        try {
          const raw = await AsyncStorage.getItem(CLINICAL_PENDING_EXPLAIN_KEY);
          if (!raw || cancelled) {
            if (wantClinical && !paramFlag(p.openTopup)) {
              clearExplainRouteParams();
            }
            return;
          }
          const pending = JSON.parse(raw) as ClinicalPendingExplain;

          if (isExplainIntent(pending)) {
            await runQuizExplainIntent(pending);
            return;
          }

          // Legacy result payload (pre-intent)
          if (!pending?.sessionId || !pending.response?.trim()) return;
          await AsyncStorage.removeItem(CLINICAL_PENDING_EXPLAIN_KEY);
          if (cancelled) return;
          setDisclaimerAccepted(true);
          setHowToExpanded(false);
          setCasesToolsExpanded(false);
          setCopilotMode('clinical');
          setClinicalSessionId(pending.sessionId);
          if (typeof pending.balance === 'number') {
            setClinicalBalance(pending.balance);
          }
          setClinicalMessages([
            {
              id: `quiz-user-${pending.questionId ?? 'q'}`,
              role: 'user',
              content: pending.userLabel || t('clinical.explainCta'),
              timestamp: new Date(),
            },
            {
              id: `quiz-assistant-${pending.sessionId}`,
              role: 'assistant',
              content: pending.response,
              timestamp: new Date(),
            },
          ]);
          clearExplainRouteParams();
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 250);
        } catch {
          // Ignore corrupt pending payload
        }
      };

      void hydrateFromQuizExplain();
      return () => {
        cancelled = true;
      };
    }, [clinicalUiEnabled, t, paramFlag, router]),
  );

  const startClinicalCase = useCallback(
    async (topic: ClinicalCaseTopic) => {
      if (!disclaimerAccepted) {
        setClinicalMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: t('clinical.acceptDisclaimerFirst'),
            timestamp: new Date(),
          },
        ]);
        return;
      }
      setIsTyping(true);
      trackClinicalEvent('clinical_case_started', { topic });
      try {
        const res = await startCaseMutation.mutateAsync({
          topic,
          locale: tutorLocale,
          acceptDisclaimer: true,
        });
        setClinicalSessionId(res.sessionId);
        setClinicalBalance(res.balance);
        setClinicalMessages([
          {
            id: '1',
            role: 'assistant',
            content: `${t('clinical.disclaimer')}\n\n${res.response}`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        if (isTrpcForbidden(error)) {
          openTopupOrPaywall(getMutationErrorMessage(error, ''));
          return;
        }
        setClinicalMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: getTutorErrorContent(error, t),
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [
      disclaimerAccepted,
      startCaseMutation,
      tutorLocale,
      t,
      openTopupOrPaywall,
    ],
  );

  const handleClinicalImage = useCallback(async () => {
    if (!disclaimerAccepted) {
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('clinical.acceptDisclaimerFirst'),
          timestamp: new Date(),
        },
      ]);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    if (!asset.base64) {
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('clinical.errorGeneric'),
          timestamp: new Date(),
          isError: true,
        },
      ]);
      return;
    }
    const dataUrl = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    setIsTyping(true);
    try {
      const res = await analyzeImageMutation.mutateAsync({
        imageDataUrl: dataUrl,
        locale: tutorLocale,
        acceptDisclaimer: true,
      });
      setClinicalSessionId(res.sessionId);
      setClinicalBalance(res.balance);
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'user',
          content: t('clinical.imageUploaded'),
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${t('clinical.disclaimer')}\n\n${res.response}`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      if (isTrpcForbidden(error)) {
        openTopupOrPaywall(getMutationErrorMessage(error, ''));
        return;
      }
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: getTutorErrorContent(error, t),
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [
    disclaimerAccepted,
    analyzeImageMutation,
    tutorLocale,
    t,
    openTopupOrPaywall,
  ]);

  const handleClinicalSummary = useCallback(async () => {
    if (!clinicalSessionId) {
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('clinical.pickCaseFirst'),
          timestamp: new Date(),
        },
      ]);
      return;
    }
    setIsTyping(true);
    try {
      const res = await generateSummaryMutation.mutateAsync({
        sessionId: clinicalSessionId,
        locale: tutorLocale,
      });
      setClinicalBalance(res.balance);
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: res.response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      if (isTrpcForbidden(error)) {
        openTopupOrPaywall(getMutationErrorMessage(error, ''));
        return;
      }
      setClinicalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: getTutorErrorContent(error, t),
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [
    clinicalSessionId,
    generateSummaryMutation,
    tutorLocale,
    t,
    openTopupOrPaywall,
  ]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (clinicalUiEnabled && copilotMode === 'clinical') {
      if (!clinicalSessionId) {
        setClinicalMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: t('clinical.pickCaseFirst'),
            timestamp: new Date(),
          },
        ]);
        return;
      }
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputText.trim(),
        timestamp: new Date(),
      };
      setClinicalMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);
      const assistantId = (Date.now() + 1).toString();
      try {
        trackClinicalEvent('clinical_reply_sent', { streaming: true });
        const token = getMedvbaAccessToken();
        if (token && clinicalStatusQuery.data?.flags?.streaming !== false) {
          setClinicalMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
            },
          ]);
          setIsStreamingReply(true);
          clinicalStreamAbortRef.current?.abort();
          const streamController = new AbortController();
          clinicalStreamAbortRef.current = streamController;
          const res = await streamClinicalReply({
            token,
            sessionId: clinicalSessionId,
            message: userMessage.content,
            locale: tutorLocale,
            signal: streamController.signal,
            onDelta: (chunk) => {
              setIsTyping(false);
              setClinicalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + chunk }
                    : m,
                ),
              );
            },
          });
          if (clinicalStreamAbortRef.current === streamController) {
            clinicalStreamAbortRef.current = null;
          }
          trackClinicalEvent('clinical_stream_used');
          setClinicalBalance(res.balance);
          setClinicalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: res.response } : m,
            ),
          );
        } else {
          const res = await clinicalReplyMutation.mutateAsync({
            sessionId: clinicalSessionId,
            message: userMessage.content,
            locale: tutorLocale,
          });
          setClinicalBalance(res.balance);
          setClinicalMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: 'assistant',
              content: res.response,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        const aborted =
          (error instanceof Error && error.name === 'AbortError') ||
          (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            (error as { name?: string }).name === 'AbortError');
        if (aborted) {
          return;
        }
        const msg = getMutationErrorMessage(error, '');
        if (
          isTrpcForbidden(error) ||
          msg.includes('TOPUP_REQUIRED') ||
          msg.includes('PAYWALL_REQUIRED')
        ) {
          openTopupOrPaywall(msg);
          return;
        }
        setClinicalMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: getTutorErrorContent(error, t),
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsTyping(false);
        setIsStreamingReply(false);
      }
      return;
    }

    // Check if free user can ask AI question
    if (isPaywallEnabled && !canAskAiQuestion()) {
      openPaywallWithFallback();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    lastUserMessageRef.current = userMessage.content;
    const updatedMessages = [...tutorMessages, userMessage];
    setTutorMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const assistantId = (Date.now() + 1).toString();
    const historyForBackend = updatedMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const applyAssistantText = (text: string) => {
      const trimmed = (text ?? '').trim();
      const content =
        trimmed.length > 0 ? trimmed : t('tutor.emptyResponse');
      setTutorMessages((prev) => {
        const hasPlaceholder = prev.some((m) => m.id === assistantId);
        if (hasPlaceholder) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content, isError: false } : m,
          );
        }
        return [
          ...prev,
          {
            id: assistantId,
            role: 'assistant' as const,
            content,
            timestamp: new Date(),
          },
        ];
      });
      void syncAiQuestionCountFromServer();
    };

    const runNonStreamFallback = async () => {
      const aiResponseText = await generateAIResponse(
        updatedMessages,
        tutorLocale,
      );
      applyAssistantText(aiResponseText ?? '');
    };

    try {
      const token = getMedvbaAccessToken();
      if (token) {
        setTutorMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          },
        ]);
        setIsStreamingReply(true);
        tutorStreamAbortRef.current?.abort();
        const streamController = new AbortController();
        tutorStreamAbortRef.current = streamController;
        try {
          const res = await streamTutorReply({
            token,
            messages: historyForBackend,
            locale: tutorLocale,
            signal: streamController.signal,
            onDelta: (chunk) => {
              setIsTyping(false);
              setTutorMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + chunk }
                    : m,
                ),
              );
            },
          });
          if (tutorStreamAbortRef.current === streamController) {
            tutorStreamAbortRef.current = null;
          }
          applyAssistantText(res.response ?? '');
        } catch (streamErr) {
          const streamAborted =
            (streamErr instanceof Error && streamErr.name === 'AbortError') ||
            (typeof streamErr === 'object' &&
              streamErr !== null &&
              'name' in streamErr &&
              (streamErr as { name?: string }).name === 'AbortError');
          if (streamAborted) {
            return;
          }
          // Native fetch often lacks stream body; fall back to classic tRPC chat.
          log.debug(
            '[Tutor] Stream failed, falling back to tRPC:',
            streamErr instanceof Error ? streamErr.message : String(streamErr),
          );
          setIsStreamingReply(false);
          await runNonStreamFallback();
        }
      } else {
        await runNonStreamFallback();
      }
    } catch (error) {
      const errStr = error instanceof Error ? error.message : String(error);
      const aborted =
        (error instanceof Error && error.name === 'AbortError') ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name?: string }).name === 'AbortError');
      if (aborted) {
        return;
      }
      log.debug('[Tutor] Failed to get AI response:', errStr);
      console.error('[Tutor] Full error:', error);

      if (
        errStr.toLowerCase().includes('unauthorized') ||
        errStr.toLowerCase().includes('authentication required') ||
        errStr.toLowerCase().includes('not authenticated')
      ) {
        void saveAuthReturnToPath('(tabs)/tutor');
        router.replace('/(auth)/login');
        return;
      }

      if (isTrpcForbidden(error)) {
        openPaywallWithFallback();
        return;
      }

      if (
        errStr.toLowerCase().includes('fetch') ||
        errStr.toLowerCase().includes('network') ||
        errStr.toLowerCase().includes('connection') ||
        errStr.toLowerCase().includes('failed to fetch')
      ) {
        const networkErrorMessage: Message = {
          id: assistantId,
          role: 'assistant',
          content: t('tutor.errorMessage'),
          timestamp: new Date(),
          isError: true,
        };
        setTutorMessages((prev) => {
          const withoutEmpty = prev.filter(
            (m) => !(m.id === assistantId && !m.content),
          );
          return [...withoutEmpty, networkErrorMessage];
        });
        return;
      }

      const errorMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: getTutorErrorContent(error, t),
        timestamp: new Date(),
        isError: true,
      };
      setTutorMessages((prev) => {
        const withoutEmpty = prev.filter(
          (m) => !(m.id === assistantId && !m.content),
        );
        return [...withoutEmpty, errorMessage];
      });
    } finally {
      setIsTyping(false);
      setIsStreamingReply(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleRetry = useCallback(async () => {
    const lastContent = lastUserMessageRef.current;
    if (!lastContent || isTyping || copilotMode === 'clinical') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTutorMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.isError ? prev.slice(0, -1) : prev;
    });
    setIsTyping(true);

    try {
      const messagesForRetry = tutorMessages.filter((m) => !m.isError);
      const aiResponseText = await generateAIResponse(messagesForRetry, tutorLocale);
      const trimmed = (aiResponseText ?? '').trim();
      const content = trimmed.length > 0 ? trimmed : t('tutor.emptyResponse');
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      setTutorMessages((prev) => [...prev, aiResponse]);
      void syncAiQuestionCountFromServer();
    } catch (error) {
      if (isTrpcForbidden(error)) {
        openPaywallWithFallback();
        return;
      }
      log.debug('[Tutor] Retry failed:', String(error));
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: getTutorErrorContent(error, t),
        timestamp: new Date(),
        isError: true,
      };
      setTutorMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [
    isTyping,
    copilotMode,
    tutorMessages,
    generateAIResponse,
    t,
    tutorLocale,
    openPaywallWithFallback,
    syncAiQuestionCountFromServer,
  ]);

  const handleSuggestion = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(text);
  };

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollToEnd();
    }
  }, [keyboardHeight, scrollToEnd]);

  const messagesContentStyle = useMemo(
    () => [
      styles.messagesContent,
      { paddingBottom: keyboardHeight > 0 ? 12 : 10 },
    ],
    [keyboardHeight],
  );

  return (
    <Screen withGradient edges={['top']} padded={false} contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
        style={styles.keyboardView}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={Platform.OS !== 'web'}
      >
        <OfflineFeatureNotice />
        <TutorTabHeader compact={clinicalFocus} />

        {clinicalUiEnabled ? (
          <View style={[styles.clinicalBar, clinicalFocus && styles.clinicalBarCompact]}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeChip, copilotMode === 'tutor' && styles.modeChipActive]}
                onPress={() => setCopilotMode('tutor')}
              >
                <Text style={styles.modeChipText}>{t('clinical.modeTutor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeChip, copilotMode === 'clinical' && styles.modeChipActive]}
                onPress={() => setCopilotMode('clinical')}
              >
                <Text style={styles.modeChipText}>{t('clinical.modeClinical')}</Text>
              </TouchableOpacity>
            </View>
            {copilotMode === 'clinical' ? (
              <View>
                {clinicalFocus && disclaimerAccepted ? (
                  <Text style={styles.clinicalDisclaimerCompact}>
                    {t('clinical.disclaimerCompact')}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.clinicalDisclaimer}>{t('clinical.disclaimer')}</Text>
                    <TouchableOpacity
                      onPress={() => void acceptDisclaimer()}
                      style={styles.disclaimerAccept}
                    >
                      <Text style={styles.disclaimerAcceptText}>
                        {disclaimerAccepted
                          ? t('clinical.disclaimerAccepted')
                          : t('clinical.acceptDisclaimer')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {!clinicalFocus ? (
                  <>
                    <View style={styles.howToHeader}>
                      <Text style={styles.howToTitle}>{t('clinical.howToTitle')}</Text>
                      <TouchableOpacity onPress={() => void toggleHowTo()} accessibilityRole="button">
                        <Text style={styles.disclaimerAcceptText}>
                          {howToExpanded ? t('clinical.howToHide') : t('clinical.howToShow')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {howToExpanded ? (
                      <View style={styles.howToBox}>
                        <Text style={styles.howToStep}>{t('clinical.howToStep1')}</Text>
                        <Text style={styles.howToStep}>{t('clinical.howToStep2')}</Text>
                        <Text style={styles.howToStep}>{t('clinical.howToStep3')}</Text>
                        <Text style={styles.howToStep}>{t('clinical.howToStep4')}</Text>
                      </View>
                    ) : null}
                  </>
                ) : null}

                <View style={[styles.creditRow, clinicalFocus && styles.creditRowCompact]}>
                  {clinicalBalance != null ? (
                    <Text style={styles.creditBalance}>
                      {t('clinical.creditsRemaining').replace('{count}', String(clinicalBalance))}
                    </Text>
                  ) : null}
                  {trialRemaining != null && trialRemaining > 0 && !isPremium ? (
                    <Text style={styles.creditBalance}>
                      {t('clinical.trialBanner').replace('{count}', String(trialRemaining))}
                    </Text>
                  ) : null}
                  {clinicalBalance != null ? (
                    <TouchableOpacity
                      onPress={() => {
                        trackClinicalEvent('clinical_topup_shown');
                        setTopupVisible(true);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.topupLink}>{t('clinical.topupLink')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {clinicalFocus ? (
                  <TouchableOpacity
                    style={styles.casesToolsToggle}
                    onPress={() => setCasesToolsExpanded((v) => !v)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.disclaimerAcceptText}>
                      {casesToolsExpanded
                        ? t('clinical.casesToolsHide')
                        : t('clinical.casesToolsShow')}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {!clinicalFocus || casesToolsExpanded ? (
                  <View style={styles.caseGrid}>
                    {CLINICAL_CASE_TOPICS.map((topic) => (
                      <TouchableOpacity
                        key={topic}
                        style={styles.caseChip}
                        onPress={() => void startClinicalCase(topic)}
                        disabled={isTyping}
                      >
                        <Text style={styles.caseChipText}>{t(`clinical.topic.${topic}`)}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.caseChip, styles.caseChipAction]}
                      onPress={() => void handleClinicalImage()}
                      disabled={isTyping}
                    >
                      <ImageIcon color={colors.primary} size={iconSm} />
                      <Text style={styles.caseChipText}>{t('clinical.analyzeImage')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.caseChip, styles.caseChipAction]}
                      onPress={() => void handleClinicalSummary()}
                      disabled={isTyping || !clinicalSessionId}
                    >
                      <FileText color={colors.primary} size={iconSm} />
                      <Text style={styles.caseChipText}>{t('clinical.generateSummary')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={messagesContentStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {isPaywallEnabled && !isPremium && copilotMode === 'tutor' && (
              <View style={styles.freeLimitBanner}>
                <View style={styles.freeLimitContent}>
                  <Text style={styles.freeLimitText}>
                    {remainingAiQuestions > 0 
                      ? t('tutor.freeQuestionRemaining').replace('{remaining}', String(remainingAiQuestions)).replace('{total}', String(FREE_AI_LIMIT))
                      : t('tutor.dailyLimitReached')}
                  </Text>
                  {remainingAiQuestions === 0 && (
                    <Lock color={colors.error} size={iconMd} />
                  )}
                </View>
              </View>
            )}

            {copilotMode === 'tutor' && tutorMessages.length === 1 && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>{t('tutor.tryAsking')}</Text>
                {suggestedQuestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSuggestion(suggestion.text)}
                  >
                    <GlassCard style={styles.suggestionCard}>
                      <suggestion.icon color={colors.primary} size={iconMd} />
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionText}>{suggestion.text}</Text>
                        <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {messages.map((message) => {
              const clinicalStudyAnswer =
                clinicalFocus &&
                message.role === 'assistant' &&
                !message.isError &&
                message.content.trim().length > 0;

              return (
              <View key={message.id}>
                <View
                  style={[
                    styles.messageRow,
                    message.role === 'user' && styles.messageRowUser,
                    clinicalStudyAnswer && styles.messageRowStudy,
                  ]}
                >
                  {message.role === 'assistant' && !clinicalStudyAnswer && (
                    <View style={styles.avatarContainer}>
                      <Bot color={message.isError ? colors.error : colors.primary} size={iconSm} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      message.isError && styles.errorBubble,
                      clinicalStudyAnswer && styles.clinicalStudyBubble,
                    ]}
                  >
                    {clinicalStudyAnswer ? (
                      <StudyMarkdown markdown={message.content} />
                    ) : (
                      <Text style={[
                        styles.messageText,
                        message.role === 'user' && styles.userMessageText
                      ]}>
                        {message.content}
                      </Text>
                    )}
                  </View>
                  {message.role === 'user' && (
                    <View style={[styles.avatarContainer, styles.userAvatar]}>
                      <User color={colors.text} size={iconSm} />
                    </View>
                  )}
                </View>
                {message.isError && copilotMode === 'tutor' && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                    disabled={isTyping}
                  >
                    <RotateCcw color={colors.primary} size={iconSm} />
                    <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                      {t('tutor.retry')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              );
            })}

            {isTyping && !isStreamingReply && (
              <View style={styles.messageRow}>
                <View style={styles.avatarContainer}>
                  <Bot color={colors.primary} size={iconSm} />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.cardBgLight,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('tutor.inputPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isTyping}
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
                returnKeyType="default"
                blurOnSubmit={false}
                onFocus={scrollToEnd}
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.charCount, inputText.length > 450 && { color: colors.error }]}>
                  {inputText.length}/500
                </Text>
                <TouchableOpacity
                  style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                >
                  <Send color={inputText.trim() && !isTyping ? colors.text : colors.textMuted} size={iconMd} />
                </TouchableOpacity>
              </View>
            </View>
            <Text
              style={[styles.disclaimer, { color: colors.textMuted }]}
              accessibilityRole="text"
            >
              {t('tutor.disclaimerShort')}
            </Text>
          </View>
      </KeyboardAvoidingView>
      {clinicalUiEnabled ? (
        <ClinicalTopupSheet
          visible={topupVisible}
          onClose={() => setTopupVisible(false)}
          onSelectProduct={(productId, credits) => {
            // Analytics only — purchase + syncEntitlement happen inside the sheet.
            trackClinicalEvent('clinical_topup_intent', { productId, credits });
          }}
        />
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  clinicalBar: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: space.space2,
    gap: space.space2,
  },
  clinicalBarCompact: {
    paddingBottom: space.space1,
    gap: space.space1,
  },
  modeRow: {
    flexDirection: 'row',
    gap: space.space2,
  },
  modeChip: {
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    borderRadius: radiusPill,
    backgroundColor: colors.cardBgLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
  },
  modeChipText: {
    ...typeScale.caption,
    color: colors.text,
    fontWeight: '600' as const,
  },
  clinicalDisclaimer: {
    ...typeScale.caption,
    color: colors.textSecondary,
    marginBottom: space.space1,
  },
  clinicalDisclaimerCompact: {
    ...typeScale.caption,
    color: colors.textMuted,
    marginBottom: space.space1,
  },
  disclaimerAccept: {
    alignSelf: 'flex-start',
    marginBottom: space.space2,
  },
  disclaimerAcceptText: {
    ...typeScale.caption,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  howToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.space1,
    gap: space.space2,
  },
  howToTitle: {
    ...typeScale.caption,
    color: colors.text,
    fontWeight: '700' as const,
    flex: 1,
  },
  howToBox: {
    marginBottom: space.space2,
    padding: space.space3,
    borderRadius: radiusMd,
    backgroundColor: colors.cardBgLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    gap: space.space1,
  },
  howToStep: {
    ...typeScale.caption,
    color: colors.textSecondary,
  },
  creditRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.space2,
    marginBottom: space.space2,
  },
  creditRowCompact: {
    marginBottom: space.space1,
  },
  creditBalance: {
    ...typeScale.caption,
    color: colors.textMuted,
  },
  topupLink: {
    ...typeScale.caption,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  casesToolsToggle: {
    alignSelf: 'flex-start',
    marginBottom: space.space1,
    minHeight: 32,
    justifyContent: 'center',
  },
  caseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.space2,
  },
  caseChip: {
    paddingHorizontal: space.space3,
    paddingVertical: space.space2,
    minHeight: 36,
    borderRadius: radiusMd,
    backgroundColor: colors.cardBgLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.space1,
  },
  caseChipAction: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: '46%',
  },
  caseChipText: {
    ...typeScale.caption,
    color: colors.text,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: screenPaddingX,
    paddingBottom: space.space2 + 2,
  },
  suggestions: {
    marginBottom: fieldGap + space.space1,
  },
  suggestionsTitle: {
    ...typeScale.subhead,
    color: colors.textSecondary,
    marginBottom: space.space3,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.space2 + 2,
    gap: space.space3,
    minHeight: touchTargetMin,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    ...typeScale.subhead,
    color: colors.text,
    fontWeight: '500' as const,
  },
  suggestionCategory: {
    ...typeScale.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: cardPadding,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowStudy: {
    alignItems: 'stretch',
  },
  avatarContainer: {
    width: touchTargetMin - space.space3,
    height: touchTargetMin - space.space3,
    borderRadius: (touchTargetMin - space.space3) / 2,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.space2,
  },
  userAvatar: {
    backgroundColor: colors.primary,
    marginRight: 0,
    marginLeft: space.space2,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: radiusLg + 2,
    padding: cardPadding - 2,
  },
  clinicalStudyBubble: {
    maxWidth: '100%',
    flex: 1,
    width: '100%',
    borderRadius: radiusMd,
    borderBottomLeftRadius: radiusMd,
    paddingHorizontal: space.space3,
    paddingVertical: space.space3,
    backgroundColor: 'transparent',
  },
  assistantBubble: {
    backgroundColor: colors.cardBgLight,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...typeScale.subhead,
    color: colors.text,
  },
  userMessageText: {
    color: colors.text,
  },
  errorBubble: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2 - 2,
    marginLeft: touchTargetMin + space.space1,
    marginTop: space.space1,
    marginBottom: space.space1,
    minHeight: touchTargetMin,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    ...typeScale.footnote,
    fontWeight: '600' as const,
  },
  typingBubble: {
    paddingVertical: fieldGap,
    paddingHorizontal: screenPaddingX,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: space.space1,
  },
  typingDot: {
    width: space.space2,
    height: space.space2,
    borderRadius: space.space1,
    backgroundColor: colors.textMuted,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: Platform.OS === 'ios' ? space.space2 : space.space2 - 2,
    paddingTop: space.space2 + 2,
  },
  disclaimer: {
    ...typeScale.caption2,
    textAlign: 'center',
    marginTop: space.space2,
    paddingHorizontal: space.space1,
  },
  inputWrapper: {
    flexDirection: 'column',
    paddingVertical: space.space2,
    paddingHorizontal: space.space3,
    borderRadius: radiusPill,
    borderWidth: 1,
  },
  input: {
    width: '100%',
    minHeight: inputHeight,
    ...typeScale.body,
    color: colors.text,
    maxHeight: touchTargetMin + space.space8,
    paddingVertical: space.space2,
    paddingHorizontal: space.space1,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.space1,
  },
  charCount: {
    ...typeScale.caption,
    color: colors.textMuted,
    flex: 1,
  },
  sendButton: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.cardBgLight,
  },
  freeLimitBanner: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderColor: 'rgba(255, 184, 0, 0.3)',
    borderWidth: 1,
    borderRadius: radiusMd,
    padding: space.space3,
    marginBottom: cardPadding,
  },
  freeLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeLimitText: {
    ...typeScale.subhead,
    color: colors.warning,
    fontWeight: '500' as const,
    flex: 1,
  },
});

