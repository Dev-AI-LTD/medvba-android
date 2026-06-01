import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookOpen, ChevronRight, Headphones, Zap } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/layout';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import { getChaptersForModule } from '@/mocks/chapters';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';
import { chapterHasBundledStudyContent } from '@/lib/study-preview';
import { resolveStudyContentLocale } from '@/lib/study-content-locale';
import {
  cardPadding,
  iconLg,
  iconMd,
  iconSm,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { useQuizFontsContext } from '@/providers/QuizFontsProvider';
import { createQuizTypography } from '@/theme/quizTypography';

export default function QuizChaptersScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { t, getChapterTitle, getModuleName, currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const { isPremium, isPaywallEnabled, canStartQuiz, incrementQuizCount } = useSubscription();
  const locale = resolveStudyContentLocale(currentLanguage);

  const chapters = category ? getChaptersForModule(category) : [];
  const moduleName = category ? getModuleName(category) : '';
  const studyEnabled = category === STUDY_PILOT_MODULE_ID;
  const { loaded: quizFontsLoaded, families: quizFontFamilies } = useQuizFontsContext();
  const quizTypography = useMemo(
    () => createQuizTypography(quizFontsLoaded, quizFontFamilies),
    [quizFontsLoaded, quizFontFamilies],
  );
  const styles = useMemo(() => createChapterListStyles(quizTypography), [quizTypography]);

  const startQuiz = async (chapterId: string) => {
    if (isPaywallEnabled && !canStartQuiz()) {
      router.push('/paywall');
      return;
    }
    const success = await incrementQuizCount();
    if (isPaywallEnabled && !success && !isPremium) {
      router.push('/paywall');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/quiz-session',
      params: { category: category || STUDY_PILOT_MODULE_ID, mode: 'quick', chapterId },
    });
  };

  const openSummary = (chapterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/study/chapter/[chapterId]',
      params: {
        chapterId,
        moduleId: category || STUDY_PILOT_MODULE_ID,
        fromQuiz: '1',
      },
    });
  };

  if (!category) {
    router.replace('/(tabs)/quiz');
    return null;
  }

  return (
    <Screen withGradient edges={['top', 'bottom']} padded={false}>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        title={moduleName}
        subtitle={t('quiz.chaptersSubtitle')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {chapters.map((chapter) => {
          const hasBundledSummary =
            studyEnabled &&
            chapterHasBundledStudyContent(
              category || STUDY_PILOT_MODULE_ID,
              chapter.id,
              locale,
            );

          return (
            <View key={chapter.id} style={styles.chapterRowWrap}>
              <GlassCard style={styles.chapterCard} noPadding>
                <TouchableOpacity
                  onPress={() =>
                    hasBundledSummary ? openSummary(chapter.id) : startQuiz(chapter.id)
                  }
                  activeOpacity={0.8}
                  style={styles.chapterMainPress}
                  accessibilityRole="button"
                  accessibilityLabel={
                    hasBundledSummary
                      ? `${t('quiz.readChapterSummary')}: ${getChapterTitle(chapter.id)}`
                      : getChapterTitle(chapter.id)
                  }
                >
                  <BookOpen color={colors.primary} size={iconLg} />
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterName, { color: colors.text }]} numberOfLines={2}>
                      {getChapterTitle(chapter.id)}
                    </Text>
                    <Text style={[styles.chapterCount, { color: colors.textSecondary }]}>
                      {chapter.questions.length} {t('quiz.questionsShort')}
                    </Text>
                  </View>
                  <ChevronRight color={colors.textMuted} size={iconMd} />
                </TouchableOpacity>

                {hasBundledSummary ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => openSummary(chapter.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('quiz.readChapterSummary')}
                    >
                      <Headphones color={colors.text} size={iconSm} />
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>
                        {t('quiz.readChapterSummary')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnSecondary, { borderColor: colors.glassBorder }]}
                      onPress={() => void startQuiz(chapter.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('quiz.quickQuiz')}
                    >
                      <Zap color={colors.primary} size={iconSm} />
                      <Text style={[styles.actionBtnTextSecondary, { color: colors.primary }]}>
                        {t('quiz.quickQuiz')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </GlassCard>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const createChapterListStyles = (quizTypo: ReturnType<typeof createQuizTypography>) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: screenPaddingX,
      paddingBottom: sectionGap,
      gap: space.space3,
    },
    chapterRowWrap: {
      marginBottom: 4,
    },
    chapterCard: {
      overflow: 'hidden',
    },
    chapterMainPress: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: cardPadding,
      gap: space.space3,
      minHeight: touchTargetMin,
    },
    chapterInfo: {
      flex: 1,
    },
    chapterName: {
      ...quizTypo.question,
      ...typeScale.body,
      textAlign: 'left',
    },
    chapterCount: {
      ...quizTypo.cardMeta,
      textAlign: 'left',
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      gap: space.space2,
      paddingHorizontal: cardPadding,
      paddingBottom: cardPadding,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.space2,
      minHeight: touchTargetMin,
      borderRadius: 12,
      paddingHorizontal: space.space3,
    },
    actionBtnPrimary: {
      backgroundColor: 'rgba(0, 180, 216, 0.35)',
    },
    actionBtnSecondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
    },
    actionBtnText: {
      ...typeScale.subhead,
      fontWeight: '600',
    },
    actionBtnTextSecondary: {
      ...typeScale.subhead,
      fontWeight: '600',
    },
  });
