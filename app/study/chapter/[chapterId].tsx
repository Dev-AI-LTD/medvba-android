import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen, ScreenHeader } from '@/components/layout';
import GlassCard from '@/components/GlassCard';
import { StudyMarkdown } from '@/components/StudyMarkdown';
import { StudyAudioPlayer } from '@/components/StudyAudioPlayer';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useStudyChapterContent } from '@/lib/study-hooks';
import { resolveStudyContentLocale } from '@/lib/study-content-locale';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';
import {
  iconMd,
  screenPaddingX,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

function estimateReadMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

export default function StudyChapterReaderScreen() {
  const router = useRouter();
  const { chapterId, moduleId, fromQuiz } = useLocalSearchParams<{
    chapterId: string;
    moduleId: string;
    fromQuiz?: string;
  }>();
  const { t, getChapterTitle, currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const { isPremium, isPaywallEnabled } = useSubscription();
  const locale = resolveStudyContentLocale(currentLanguage);
  const { content, isLoading, isError } = useStudyChapterContent(
    moduleId ?? '',
    chapterId ?? '',
    locale,
  );

  const title = useMemo(() => {
    if (fromQuiz === '1' && chapterId) {
      return getChapterTitle(chapterId);
    }
    if (content && 'title' in content && content.title) return content.title;
    return chapterId ? getChapterTitle(chapterId) : '';
  }, [content, chapterId, getChapterTitle, fromQuiz]);

  const parentChapter = content && 'parentChapter' in content ? content.parentChapter : null;
  const isFallbackToParent =
    content && 'isFallbackToParent' in content && content.isFallbackToParent;
  const isTopicSummary =
    content && 'isTopicSummary' in content && content.isTopicSummary;

  const openParentChapter = () => {
    if (!parentChapter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/study/chapter/[chapterId]',
      params: {
        chapterId: parentChapter.studyChapterId,
        moduleId: parentChapter.studyModuleId,
      },
    });
  };

  if (!moduleId || !chapterId) {
    router.replace('/(tabs)/quiz');
    return null;
  }

  const startQuiz = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/quiz-session',
      params: {
        category: moduleId,
        mode: 'quick',
        chapterId,
      },
    });
  };

  const openPaywall = () => {
    router.push('/paywall');
  };

  const hasDisplayableContent =
    Boolean(content && 'locked' in content && content.locked) ||
    Boolean(content && 'summaryMarkdown' in content && content.summaryMarkdown) ||
    Boolean(content && 'notFound' in content && content.notFound);

  if (isLoading && !hasDisplayableContent) {
    return (
      <Screen withGradient edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (content && 'locked' in content && content.locked) {
    return (
      <Screen withGradient edges={['top', 'bottom']} padded={false}>
        <ScreenHeader
          layout="stack-centered"
          onBack={() => router.back()}
          title={title}
        />
        <View style={styles.lockedWrap}>
          <GlassCard style={styles.lockedCard}>
            <Crown color={colors.warning} size={40} />
            <Text style={[styles.lockedTitle, { color: colors.text }]}>
              {t('study.lockedTitle')}
            </Text>
            <Text style={[styles.lockedBody, { color: colors.textSecondary }]}>
              {t('study.lockedMessage')}
            </Text>
            {isPaywallEnabled && !isPremium && (
              <TouchableOpacity onPress={openPaywall} style={styles.paywallBtn}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.paywallGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.paywallText}>{t('paywall.title')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>
      </Screen>
    );
  }

  const markdown =
    content && 'summaryMarkdown' in content ? content.summaryMarkdown : null;

  if (!markdown || (content && 'notFound' in content && content.notFound)) {
    return (
      <Screen withGradient edges={['top', 'bottom']} padded={false}>
        <ScreenHeader
          layout="stack-centered"
          onBack={() => router.back()}
          title={title}
        />
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>{t('study.summaryNotFound')}</Text>
          {isError && (
            <Text style={[styles.offlineHint, { color: colors.textMuted }]}>
              {t('study.summaryApiUnavailable')}
            </Text>
          )}
        </View>
      </Screen>
    );
  }

  const showOfflineHint =
    isError &&
    content &&
    'source' in content &&
    (content.source === 'local' || content.source === 'bundle');

  const readMin = estimateReadMinutes(markdown);
  const audioUrl =
    content && 'audioUrl' in content ? content.audioUrl : null;

  return (
    <Screen withGradient edges={['top', 'bottom']} padded={false}>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        title={title}
        subtitle={
          fromQuiz === '1'
            ? t('study.fromQuiz')
            : t('study.minRead').replace('{minutes}', String(readMin))
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showOfflineHint && (
          <Text style={[styles.offlineHint, { color: colors.textMuted }]}>
            {t('study.summaryOfflinePreview')}
          </Text>
        )}
        {isFallbackToParent && (
          <GlassCard style={styles.fallbackBanner}>
            <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
              {t('study.topicSummaryFallback')}
            </Text>
          </GlassCard>
        )}
        {fromQuiz === '1' && isTopicSummary && parentChapter && (
          <TouchableOpacity onPress={openParentChapter} style={styles.parentLink}>
            <Text style={[styles.parentLinkLabel, { color: colors.textSecondary }]}>
              {t('study.partOfChapter').replace(
                '{chapter}',
                getChapterTitle(parentChapter.studyChapterId),
              )}
            </Text>
            <ChevronRight color={colors.primary} size={iconMd} />
          </TouchableOpacity>
        )}
        <StudyAudioPlayer
          key={`${chapterId}-${locale}`}
          audioUrl={audioUrl}
          fallbackText={markdown}
          locale={locale}
          moduleId={moduleId}
          chapterId={chapterId}
        />
        <GlassCard style={styles.bodyCard}>
          <StudyMarkdown markdown={markdown} />
        </GlassCard>
        {moduleId === STUDY_PILOT_MODULE_ID || fromQuiz === '1' ? (
          <TouchableOpacity onPress={startQuiz} style={styles.quizBtn}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.quizGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.quizText}>{t('study.startChapterQuiz')}</Text>
              <ChevronRight color={colors.text} size={iconMd} />
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: sectionGap,
    gap: space.space4,
  },
  bodyCard: { padding: space.space3, overflow: 'hidden' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: screenPaddingX,
    gap: space.space2,
  },
  offlineHint: {
    ...typeScale.footnote,
    textAlign: 'center',
    paddingHorizontal: screenPaddingX,
  },
  fallbackBanner: {
    padding: space.space3,
  },
  fallbackText: {
    ...typeScale.footnote,
    textAlign: 'center',
  },
  parentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.space1,
  },
  parentLinkLabel: {
    ...typeScale.subheadline,
    flex: 1,
  },
  lockedWrap: {
    flex: 1,
    padding: screenPaddingX,
    justifyContent: 'center',
  },
  lockedCard: {
    padding: space.space6,
    alignItems: 'center',
    gap: space.space3,
  },
  lockedTitle: { ...typeScale.title3, fontWeight: '700', textAlign: 'center' },
  lockedBody: { ...typeScale.body, textAlign: 'center' },
  paywallBtn: { marginTop: space.space4, width: '100%' },
  paywallGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  paywallText: { ...typeScale.body, fontWeight: '700', color: '#fff' },
  quizBtn: { marginTop: space.space2 },
  quizGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: space.space2,
  },
  quizText: { ...typeScale.body, fontWeight: '700', color: '#fff' },
});
