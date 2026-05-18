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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Crown,
  Lock,
  RotateCcw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import GlassCard from '@/components/GlassCard';
import { log } from '@/lib/log';
import { saveAuthReturnToPath } from '@/lib/auth-return-url';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import { TOUCH_TARGET_MIN } from '@/theme/paperTheme';
import { OfflineFeatureNotice } from '@/components/OfflineFeatureNotice';

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

function getTutorErrorContent(error: unknown, t: (key: string) => string): string {
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastUserMessageRef = useRef<string>('');
  const router = useRouter();
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

  const tutorLocale = currentLanguage === 'ro' ? 'ro' : 'en';

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
    setMessages((prev) => (prev.length === 0 ? [getInitialMessage()] : prev));
  }, [getInitialMessage]);

  const chatMutation = trpc.tutor.chat.useMutation();

  const generateAIResponse = useCallback(
    async (conversationHistory: Message[], locale: 'en' | 'ro'): Promise<string> => {
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
      setMessages((prev) => [...prev, paywallRouteErrorMessage]);
    }
  }, [router, t]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const aiResponseText = await generateAIResponse(updatedMessages, tutorLocale);
      const trimmed = (aiResponseText ?? '').trim();
      const content = trimmed.length > 0 ? trimmed : t('tutor.emptyResponse');

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      void syncAiQuestionCountFromServer();
    } catch (error) {
      const errStr = error instanceof Error ? error.message : String(error);
      log.debug('[Tutor] Failed to get AI response:', errStr);
      console.error('[Tutor] Full error:', error);

      // protectedProcedure on the backend throws UNAUTHORIZED when the user is not logged in.
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

      // Network/connection errors
      if (
        errStr.toLowerCase().includes('fetch') ||
        errStr.toLowerCase().includes('network') ||
        errStr.toLowerCase().includes('connection') ||
        errStr.toLowerCase().includes('failed to fetch')
      ) {
        const networkErrorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: t('tutor.errorMessage'),
          timestamp: new Date(),
          isError: true,
        };
        setMessages(prev => [...prev, networkErrorMessage]);
        return;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getTutorErrorContent(error, t),
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleRetry = useCallback(async () => {
    const lastContent = lastUserMessageRef.current;
    if (!lastContent || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Remove the last error message
    setMessages(prev => {
      const last = prev[prev.length - 1];
      return last?.isError ? prev.slice(0, -1) : prev;
    });
    setIsTyping(true);

    try {
      const messagesForRetry = messages.filter(m => !m.isError);
      const aiResponseText = await generateAIResponse(messagesForRetry, tutorLocale);
      const trimmed = (aiResponseText ?? '').trim();
      const content = trimmed.length > 0 ? trimmed : t('tutor.emptyResponse');
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
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
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isTyping, messages, generateAIResponse, t, tutorLocale, openPaywallWithFallback, syncAiQuestionCountFromServer]);

  const handleSuggestion = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(text);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          enabled={Platform.OS !== 'web'}
        >
          <OfflineFeatureNotice />
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Bot color={colors.primary} size={24} />
            </View>
            <View>
              <Text style={styles.title}>{t('tutor.title')}</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.status}>{t('tutor.alwaysAvailable')}</Text>
              </View>
            </View>
            {isPaywallEnabled && isPremium ? (
              <View style={styles.premiumBadge}>
                <Sparkles color={colors.warning} size={14} />
                <Text style={styles.premiumText}>{t('tutor.premium')}</Text>
              </View>
            ) : isPaywallEnabled ? (
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => router.push('/paywall')}
              >
                <Crown color={colors.warning} size={14} />
                <Text style={styles.upgradeButtonText}>{t('tutor.upgrade')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {isPaywallEnabled && !isPremium && (
              <View style={styles.freeLimitBanner}>
                <View style={styles.freeLimitContent}>
                  <Text style={styles.freeLimitText}>
                    {remainingAiQuestions > 0 
                      ? t('tutor.freeQuestionRemaining').replace('{remaining}', String(remainingAiQuestions)).replace('{total}', String(FREE_AI_LIMIT))
                      : t('tutor.dailyLimitReached')}
                  </Text>
                  {remainingAiQuestions === 0 && (
                    <Lock color={colors.error} size={16} />
                  )}
                </View>
              </View>
            )}

            {messages.length === 1 && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>{t('tutor.tryAsking')}</Text>
                {suggestedQuestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSuggestion(suggestion.text)}
                  >
                    <GlassCard style={styles.suggestionCard}>
                      <suggestion.icon color={colors.primary} size={20} />
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionText}>{suggestion.text}</Text>
                        <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {messages.map((message) => (
              <View key={message.id}>
                <View
                  style={[
                    styles.messageRow,
                    message.role === 'user' && styles.messageRowUser
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={styles.avatarContainer}>
                      <Bot color={message.isError ? colors.error : colors.primary} size={18} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      message.isError && styles.errorBubble,
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      message.role === 'user' && styles.userMessageText
                    ]}>
                      {message.content}
                    </Text>
                  </View>
                  {message.role === 'user' && (
                    <View style={[styles.avatarContainer, styles.userAvatar]}>
                      <User color={colors.text} size={18} />
                    </View>
                  )}
                </View>
                {message.isError && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                    disabled={isTyping}
                  >
                    <RotateCcw color={colors.primary} size={14} />
                    <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                      {t('tutor.retry')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {isTyping && (
              <View style={styles.messageRow}>
                <View style={styles.avatarContainer}>
                  <Bot color={colors.primary} size={18} />
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
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.charCount, inputText.length > 450 && { color: colors.error }]}>
                  {inputText.length}/500
                </Text>
                <TouchableOpacity
                  style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isTyping}
                >
                  <Send color={inputText.trim() && !isTyping ? colors.text : colors.textMuted} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: typeof import('@/constants/colors').darkColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  headerIcon: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  status: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  suggestions: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  suggestionCategory: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    backgroundColor: colors.primary,
    marginRight: 0,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 14,
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
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
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
    gap: 6,
    marginLeft: TOUCH_TARGET_MIN + 4,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  typingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
  },
  inputWrapper: {
    flexDirection: 'column',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  input: {
    width: '100%',
    minHeight: 44,
    fontSize: 16,
    color: colors.text,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  sendButton: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.cardBgLight,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
    gap: 4,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  freeLimitBanner: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderColor: 'rgba(255, 184, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  freeLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeLimitText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500' as const,
    flex: 1,
  },
});

