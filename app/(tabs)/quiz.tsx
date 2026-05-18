import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, ScreenHeader } from '@/components/layout';
import { 
  Bone, 
  Heart, 
  User, 
  Brain,
  Stethoscope,
  Clock,
  Zap,
  Trophy,
  ChevronRight,
  Crown,
  Lock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import { categories } from '@/mocks/questions';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useQuizProgress } from '@/providers/QuizProgressProvider';
import { log } from '@/lib/log';
import {
  iconSm,
  iconXl,
  screenPaddingX,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

const categoryIcons: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  'upper-lower-limbs': Bone,
  'internal-organs': Heart,
  'head-neck': User,
  'neuroanatomy': Brain,
  'med-admission-barrons': Stethoscope,
};

type QuizMode = 'practice' | 'exam' | 'quick';

export default function QuizScreen() {
  const router = useRouter();
  const { t, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const {
    isPremium,
    isPaywallEnabled,
    canStartQuiz,
    getRemainingQuizzes,
    FREE_QUIZ_LIMIT
  } = useSubscription();
  const { hasActiveSession, sessionState, clearSessionState } = useQuizProgress();

  const remainingQuizzes = getRemainingQuizzes();

  useEffect(() => {
    const checkOldSession = async () => {
      if (hasActiveSession && sessionState) {
        const sessionDate = new Date(sessionState.startedAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          log.info('[Quiz] Session older than 24 hours, clearing');
          Alert.alert(
            t('session.expiredTitle'),
            t('session.expiredMessage'),
            [{ text: t('common.ok') }]
          );
          clearSessionState();
        }
      }
    };
    
    checkOldSession();
  }, [hasActiveSession, sessionState, clearSessionState, t]);

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const startQuizSession = async (category: string, mode: QuizMode) => {
    if (isPaywallEnabled && !canStartQuiz()) {
      router.push('/paywall');
      return;
    }
    router.push({
      pathname: '/quiz-session',
      params: { category, mode },
    });
  };

  const handleStartQuiz = async (mode: QuizMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startQuizSession(selectedCategory || 'mixed', mode);
  };

  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === 'med-admission-barrons') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/quiz-chapters?category=med-admission-barrons');
      return;
    }
    handleCategorySelect(categoryId);
  };

  return (
    <Screen withGradient edges={['top']} padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          layout="tab"
          large
          inset={false}
          title={t('quiz.title')}
          subtitle={t('quiz.subtitle')}
          style={styles.screenHeader}
        />

          {isPaywallEnabled && !isPremium && (
            <GlassCard style={styles.freeLimitBanner}>
              <View style={styles.freeLimitContent}>
                <Text style={[styles.freeLimitText, { color: colors.textSecondary }]}>
                  {remainingQuizzes > 0 
                    ? t('quiz.freeQuizzesRemaining').replace('{remaining}', String(remainingQuizzes)).replace('{total}', String(FREE_QUIZ_LIMIT))
                    : t('quiz.dailyLimitReached')}
                </Text>
                {remainingQuizzes === 0 && (
                  <TouchableOpacity
                    style={styles.upgradeMiniButton}
                    onPress={() => router.push('/paywall')}
                    accessibilityRole="button"
                    accessibilityLabel={t('tutor.upgrade')}
                  >
                    <Crown color={colors.warning} size={iconSm} />
                    <Text style={[styles.upgradeMiniText, { color: colors.warning }]}>{t('tutor.upgrade')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          )}

          <View style={styles.modesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quiz.quizModes')}</Text>
            <View style={styles.modesGrid}>
              <TouchableOpacity
                style={styles.modeCard}
                onPress={() => handleStartQuiz('quick')}
                accessibilityRole="button"
                accessibilityLabel={t('quiz.quickQuiz')}
                accessibilityHint={t('quiz.quickQuizCount')}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.modeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Zap color={colors.text} size={iconXl} />
                  <Text style={[styles.modeTitle, { color: colors.text }]}>{t('quiz.quickQuiz')}</Text>
                  <Text style={styles.modeSubtitle}>{t('quiz.quickQuizCount')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeCard}
                onPress={() => handleStartQuiz('practice')}
                accessibilityRole="button"
                accessibilityLabel={t('quiz.practice')}
                accessibilityHint={t('quiz.practiceCount')}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#FF4757']}
                  style={styles.modeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Clock color={colors.text} size={iconXl} />
                  <Text style={[styles.modeTitle, { color: colors.text }]}>{t('quiz.practice')}</Text>
                  <Text style={styles.modeSubtitle}>{t('quiz.practiceCount')}</Text>
                  {isPaywallEnabled && !isPremium && (
                    <View style={styles.premiumBadge}>
                      <Lock color={colors.warning} size={iconSm} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, styles.examCard]}
                onPress={() => handleStartQuiz('exam')}
                accessibilityRole="button"
                accessibilityLabel={t('quiz.examSimulation')}
                accessibilityHint={t('quiz.examDetails')}
              >
                <LinearGradient
                  colors={[colors.secondary, '#012A5E']}
                  style={[styles.modeGradient, styles.examGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Trophy color={colors.warning} size={iconXl} />
                  <View style={styles.examContent}>
                    <Text style={[styles.modeTitle, { color: colors.text }]}>{t('quiz.examSimulation')}</Text>
                    <Text style={styles.modeSubtitle}>{t('quiz.examDetails')}</Text>
                  </View>
                  {isPaywallEnabled && !isPremium ? (
                    <View style={styles.premiumBadge}>
                      <Lock color={colors.warning} size={iconSm} />
                    </View>
                  ) : (
                    <ChevronRight color={colors.text} size={iconXl} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quiz.categories')}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {selectedCategory ? t('quiz.tapToDeselect') : t('quiz.selectCategory')}
            </Text>
            
            <View style={styles.categoriesGrid}>
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.id] || Zap;
                const isSelected = selectedCategory === category.id;
                const progress = (category.completedCount / category.questionCount) * 100;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryPress(category.id)}
                    accessibilityRole="button"
                    accessibilityLabel={getModuleName(category.id)}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <GlassCard 
                      style={StyleSheet.flatten([
                        styles.categoryCard,
                        isSelected ? styles.categoryCardSelected : null,
                        isSelected ? { borderColor: category.color } : null
                      ])}
                      variant={isSelected ? 'light' : 'default'}
                    >
                      <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '25' }]}>
                        <IconComponent color={category.color} size={iconXl} />
                      </View>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{getModuleName(category.id)}</Text>
                      <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                        {category.questionCount.toLocaleString()} {t('quiz.questionsShort')}
                      </Text>
                      <View style={[styles.categoryProgressBar, { backgroundColor: colors.cardBgLight }]}>
                        <View 
                          style={[
                            styles.categoryProgressFill, 
                            { width: `${progress}%`, backgroundColor: category.color }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.categoryProgressText, { color: colors.textMuted }]}>{progress.toFixed(0)}%</Text>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <GlassCard style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={[styles.statsTitle, { color: colors.primary }]}>28,055+</Text>
              <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>{t('quiz.totalQuestions')}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statItemValue, { color: colors.text }]}>4</Text>
                <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t('quiz.languages')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statItemValue, { color: colors.text }]}>3</Text>
                <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t('quiz.difficultyLevels')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statItemValue, { color: colors.text }]}>∞</Text>
                <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>{t('quiz.practiceUnlimited')}</Text>
              </View>
            </View>
          </GlassCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: screenPaddingX,
  },
  screenHeader: {
    marginBottom: sectionGap,
  },
  modesSection: {
    marginBottom: sectionGap,
  },
  section: {
    marginBottom: sectionGap,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  modesGrid: {
    gap: 16,
    marginTop: 16,
  },
  modeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenPaddingX,
    gap: space.space3,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  modeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  examCard: {
    marginTop: 0,
  },
  examGradient: {
    paddingVertical: 24,
  },
  examContent: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: 160,
    height: 180,
    alignItems: 'center',
    paddingVertical: 20,
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    ...typeScale.subheadMedium,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    marginBottom: 8,
  },
  categoryProgressBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryProgressText: {
    fontSize: 11,
    marginTop: 6,
  },
  statsCard: {
    marginBottom: screenPaddingX,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  statsSubtitle: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statItemLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  freeLimitBanner: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderColor: 'rgba(255, 184, 0, 0.3)',
    borderWidth: 1,
  },
  freeLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeLimitText: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  upgradeMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: space.space3,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  upgradeMiniText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  premiumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
