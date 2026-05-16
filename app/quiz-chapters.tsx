import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import { getChaptersForModule } from '@/mocks/chapters';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { TOUCH_TARGET_MIN } from '@/theme/paperTheme';

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={styles.backButton}
          >
            <ChevronRight size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {moduleName}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('quiz.chaptersSubtitle')}
        </Text>
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
                <BookOpen color={colors.primary} size={22} />
                <View style={styles.chapterInfo}>
                  <Text style={[styles.chapterName, { color: colors.text }]} numberOfLines={2}>
                    {getChapterTitle(chapter.id)}
                  </Text>
                  <Text style={[styles.chapterCount, { color: colors.textSecondary }]}>
                    {chapter.questions.length} {t('quiz.questionsShort')}
                  </Text>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </GlassCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: 8,
  },
  backButton: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: TOUCH_TARGET_MIN,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  chapterCount: {
    fontSize: 13,
    marginTop: 2,
  },
});
