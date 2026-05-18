import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronRight, BookOpen } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/layout';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import { getChaptersForModule } from '@/mocks/chapters';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import {
  iconLg,
  iconMd,
  screenPaddingX,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

export default function QuizChaptersScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { t, getChapterTitle, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const { isPremium, isPaywallEnabled, canStartQuiz, incrementQuizCount } = useSubscription();

  const chapters = category ? getChaptersForModule(category) : [];
  const moduleName = category ? getModuleName(category) : '';

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
      params: { category: category || 'med-admission-barrons', mode: 'quick', chapterId },
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
        >
          {chapters.map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              onPress={() => startQuiz(chapter.id)}
              activeOpacity={0.8}
              style={styles.chapterRowWrap}
            >
              <GlassCard style={styles.chapterCard}>
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
              </GlassCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    ...typeScale.body,
    fontWeight: '600',
  },
  chapterCount: {
    fontSize: 13,
    marginTop: 2,
  },
});
