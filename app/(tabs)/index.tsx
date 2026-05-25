import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Clock, ChevronRight, Bone, Heart, User, Brain, Stethoscope, Sparkles, Lock, Crown } from 'lucide-react-native';
import { Screen, HomeWelcomeHeader } from '@/components/layout';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, Button } from 'react-native-paper';
import { UIButton } from '@/ui';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import ProgressRing from '@/components/ProgressRing';
import PremiumBadge from '@/components/PremiumBadge';
import { categories } from '@/mocks/questions';
import { useQuizProgress } from '@/providers/QuizProgressProvider';
import { FREE_QUIZ_ANSWER_LIMIT } from '@/constants/subscription';
import {
  cardPadding,
  fieldGap,
  iconLg,
  iconMd,
  iconXl,
  radiusLg,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { log } from '@/lib/log';

export default function HomeScreen() {
  const router = useRouter();
  const { t, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const { isPremium, isPaywallEnabled, getRemainingQuizzes } = useSubscription();
  const { dailyProgress, hasActiveSession, sessionState, lastSessionInfo, accuracy, formattedQuestionsCount, formattedStudyTime } = useQuizProgress();

  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questionCount, 0);
  const completedQuestions = categories.reduce((sum, cat) => sum + cat.completedCount, 0);
  const overallProgress = (completedQuestions / totalQuestions) * 100;

  const todayGoal = dailyProgress.goal;
  const todayProgress = dailyProgress.questionsAnswered;

  const hasReachedFreeQuizLimit = isPaywallEnabled && !isPremium && getRemainingQuizzes() === 0;

  const handleUpgradePress = useCallback(() => {
    if (!isPaywallEnabled) return;
    log.info('[Home] Navigate to paywall');
    router.push('/paywall');
  }, [router, isPaywallEnabled]);

  const handleContinueLearning = useCallback(() => {
    if (hasReachedFreeQuizLimit) {
      Alert.alert(
        `📚 ${t('home.freeQuizLimitTitle')}`,
        t('home.freeQuizLimitMessage').replace('{count}', String(FREE_QUIZ_ANSWER_LIMIT)),
        [
          { text: t('home.later'), style: 'cancel' },
          { text: `⭐ ${t('home.upgradePremiumShort')}`, onPress: handleUpgradePress, style: 'default' },
        ]
      );
      return;
    }

    if (hasActiveSession && sessionState) {
      log.info('[Home] Resuming active session at question', sessionState.currentIndex + 1, 'of', sessionState.questions.length);
      router.push({
        pathname: '/quiz-session',
        params: {
          category: sessionState.category,
          mode: sessionState.mode,
          resume: 'true'
        }
      });
    } else if (lastSessionInfo) {
      log.info('[Home] Starting new session with last used settings:', lastSessionInfo.category, lastSessionInfo.mode);
      router.push({
        pathname: '/quiz-session',
        params: {
          category: lastSessionInfo.category,
          mode: lastSessionInfo.mode
        }
      });
    } else {
      log.info('[Home] Starting default session');
      router.push({
        pathname: '/quiz-session',
        params: {
          category: 'mixed',
          mode: 'practice'
        }
      });
    }
  }, [hasActiveSession, sessionState, lastSessionInfo, router, hasReachedFreeQuizLimit, handleUpgradePress, t]);

  return (
    <Screen withGradient edges={['top']} padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HomeWelcomeHeader />

          <Card
            style={[styles.heroCard, { backgroundColor: colors.primary + '18', borderWidth: 1, borderColor: colors.glassBorder }]}
            mode="elevated"
            onPress={handleContinueLearning}
          >
            {isPaywallEnabled && isPremium && (
              <View style={styles.premiumBadgeContainer}>
                <PremiumBadge size="small" />
              </View>
            )}
            {hasReachedFreeQuizLimit && (
              <TouchableOpacity
                activeOpacity={1}
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'E6', borderRadius: radiusLg, zIndex: 5 }]}
                onPress={handleContinueLearning}
              >
              <View style={styles.limitOverlay}>
                <Lock size={32} color={colors.warning} strokeWidth={2} />
                <Text style={[styles.limitTitle, { color: colors.text }]}>{t('home.freeQuizLimitTitle')}</Text>
                <Text style={[styles.limitText, { color: colors.textSecondary }]}>
                  {t('home.freeQuizLimitMessage').replace('{count}', String(FREE_QUIZ_ANSWER_LIMIT))}
                </Text>
                <View style={styles.limitUpgradeButton}>
                  <UIButton variant="borderedProminent" onPress={handleUpgradePress} color={colors.warning}>
                    {t('home.upgradePremiumShort')}
                  </UIButton>
                </View>
              </View>
              </TouchableOpacity>
            )}
            <Card.Content style={styles.heroCardContent}>
              <View style={styles.heroContent}>
                <View style={styles.heroLeft}>
                  <Text style={[styles.heroTitle, { color: colors.text }]}>
                    {t('home.continueLearning')}
                  </Text>
                  <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                    {t('home.questionsToday').replace('{current}', String(todayProgress)).replace('{goal}', String(todayGoal))}
                  </Text>
                  <View style={styles.heroButton}>
                    <UIButton
                      variant="borderedProminent"
                      onPress={handleContinueLearning}
                      color={colors.primary}
                    >
                      {hasActiveSession ? t('home.continueQuiz') : t('home.startQuiz')}
                    </UIButton>
                  </View>
                </View>
                <ProgressRing
                  progress={(todayProgress / todayGoal) * 100}
                  size={90}
                  strokeWidth={10}
                  color={colors.accent}
                  label={t('home.today')}
                />
              </View>
            </Card.Content>
          </Card>

          {isPaywallEnabled && !isPremium && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleUpgradePress}
              style={styles.upgradeBanner}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.upgradeBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.upgradeBannerIcon}>
                  <Crown color="#FFF" size={iconXl} strokeWidth={2.5} />
                </View>
                <View style={styles.upgradeBannerText}>
                  <Text style={styles.upgradeBannerTitle}>{t('profile.upgradeToPremium')}</Text>
                  <Text style={styles.upgradeBannerSubtitle}>{t('profile.upgradeBannerSubtitleAll')}</Text>
                </View>
                <ChevronRight color="#FFF" size={iconLg} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <Card style={[styles.statCard, { borderWidth: 1, borderColor: colors.glassBorder }]} mode="elevated">
                <Card.Content style={styles.statCardContent}>
                  <TrendingUp color={colors.success} size={iconXl} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{accuracy.toFixed(1)}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {t('home.accuracy')}
                  </Text>
                </Card.Content>
              </Card>
            </View>
            <View style={styles.statCardWrapper}>
              <Card style={[styles.statCard, { borderWidth: 1, borderColor: colors.glassBorder }]} mode="elevated">
                <Card.Content style={styles.statCardContent}>
                  <Target color={colors.accentPink} size={iconXl} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{formattedQuestionsCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {t('home.questions')}
                  </Text>
                </Card.Content>
              </Card>
            </View>
            <View style={styles.statCardWrapper}>
              <Card style={[styles.statCard, { borderWidth: 1, borderColor: colors.glassBorder }]} mode="elevated">
                <Card.Content style={styles.statCardContent}>
                  <Clock color={colors.warning} size={iconXl} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{formattedStudyTime}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {t('home.studyTime')}
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.yourProgress')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>{overallProgress.toFixed(1)}% {t('home.complete')}</Text>
            </View>
            <Card style={[styles.progressCard, { borderWidth: 1, borderColor: colors.glassBorder }]} mode="elevated">
              <Card.Content>
                <View style={[styles.progressBar, { backgroundColor: colors.cardBgLight }]}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    style={[styles.progressFill, { width: `${overallProgress}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <View style={styles.progressStats}>
                  <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                    <Text style={[styles.progressHighlight, { color: colors.text }]}>{completedQuestions.toLocaleString()}</Text> {t('home.ofQuestions').replace('{total}', totalQuestions.toLocaleString())}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickStartAnatomy')}</Text>
              <Button mode="text" compact onPress={() => router.push('/quiz')} textColor={colors.primary}>
                {t('home.seeAll')}
              </Button>
            </View>
            {categories.map((category) => {
              const iconMap: Record<string, React.ComponentType<{ color: string; size: number }>> = {
                'upper-lower-limbs': Bone,
                'internal-organs': Heart,
                'head-neck': User,
                'neuroanatomy': Brain,
                'med-admission-barrons': Stethoscope,
              };
              const IconComponent = iconMap[category.id] || Bone;
              const isLocked = isPaywallEnabled && !isPremium;

              const handleCategoryPress = () => {
                if (isLocked) {
                  Alert.alert(
                    `🔒 ${t('home.premiumFeatureTitle')}`,
                    t('home.premiumFeatureMessage').replace('{module}', getModuleName(category.id)),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: `⭐ ${t('home.upgradePremiumShort')}`, onPress: handleUpgradePress, style: 'default' },
                    ]
                  );
                  return;
                }

                if (category.id === 'med-admission-barrons') {
                  router.push('/quiz-chapters?category=med-admission-barrons');
                  return;
                }

                const mode =
                  category.id === 'head-neck' ? 'quick' : 'sequential';
                router.push({
                  pathname: '/quiz-session',
                  params: { category: category.id, mode },
                });
              };

              const label = getModuleName(category.id) || category.name;

              const openHeadNeckSummary = () => {
                if (isLocked) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/study/chapter/[chapterId]',
                  params: { chapterId: 'head-neck-intro', moduleId: 'head-neck' },
                });
              };

              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.7}
                  onPress={handleCategoryPress}
                  onLongPress={
                    category.id === 'head-neck' ? openHeadNeckSummary : undefined
                  }
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.cardBg ?? colors.backgroundLight, borderWidth: 1, borderColor: colors.glassBorder },
                    isLocked && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    {isLocked ? (
                      <Lock color={category.color} size={iconMd} strokeWidth={2.5} />
                    ) : (
                      <IconComponent color={category.color} size={iconMd} />
                    )}
                  </View>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryNameRow}>
                      <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                        {label}
                      </Text>
                      {isLocked && (
                        <View style={[styles.premiumTag, { backgroundColor: colors.warning + '20' }]}>
                          <Sparkles size={10} color={colors.warning} strokeWidth={2.5} />
                          <Text style={[styles.premiumTagText, { color: colors.warning }]}>{t('tutor.premium')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.categoryProgress, { color: colors.textSecondary }]} numberOfLines={1}>
                      {isLocked
                        ? t('home.categoryLockedSubtitle')
                        : t('home.categoryQuestions')
                            .replace('{current}', category.completedCount.toLocaleString())
                            .replace('{total}', category.questionCount.toLocaleString())
                      }
                    </Text>
                  </View>
                  {isLocked ? (
                    <Lock color={colors.textMuted} size={iconMd} strokeWidth={2} />
                  ) : (
                    <ChevronRight color={colors.textMuted} size={iconMd} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: sectionGap,
  },
  upgradeBanner: {
    marginBottom: sectionGap,
    borderRadius: radiusLg,
    overflow: 'hidden',
  },
  upgradeBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: cardPadding,
    paddingHorizontal: screenPaddingX,
  },
  upgradeBannerIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    ...typeScale.body,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    ...typeScale.footnote,
    color: 'rgba(255,255,255,0.85)',
  },
  premiumBadgeContainer: {
    position: 'absolute',
    top: space.space3,
    right: space.space3,
    zIndex: 10,
  },
  limitOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sectionGap,
  },
  limitTitle: {
    ...typeScale.headline,
    fontWeight: '700' as const,
    marginTop: space.space3,
    textAlign: 'center',
  },
  limitText: {
    ...typeScale.subhead,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: cardPadding,
  },
  limitUpgradeButton: {
    marginTop: space.space2,
  },
  heroCard: {
    marginBottom: sectionGap,
    minHeight: 140,
    borderRadius: radiusLg,
  },
  heroCardContent: {
    paddingVertical: fieldGap,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    marginRight: fieldGap,
    justifyContent: 'center',
  },
  heroTitle: {
    ...typeScale.title3,
    fontWeight: '700' as const,
    marginBottom: space.space2,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heroSubtitle: {
    ...typeScale.subhead,
    marginBottom: fieldGap,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heroButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: fieldGap,
    marginBottom: sectionGap,
    alignItems: 'stretch',
  },
  statCardWrapper: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  statCard: {
    flex: 1,
    width: '100%',
    height: 100,
    borderRadius: radiusLg,
    overflow: 'hidden',
  },
  statCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: fieldGap,
    paddingHorizontal: space.space2,
  },
  statValue: {
    ...typeScale.title3,
    fontWeight: '700' as const,
    marginTop: 6,
  },
  statLabel: {
    ...typeScale.caption,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: fieldGap,
  },
  progressCard: {
    borderRadius: radiusLg,
  },
  sectionTitle: {
    ...typeScale.headline,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  seeAll: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    marginTop: fieldGap,
  },
  progressText: {
    ...typeScale.subhead,
  },
  progressHighlight: {
    fontWeight: '600' as const,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: fieldGap,
    height: 80,
    borderRadius: radiusLg,
    width: '100%',
    paddingHorizontal: fieldGap,
  },
  categoryIcon: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: fieldGap,
    justifyContent: 'center',
    minWidth: 0,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space2,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  categoryName: {
    ...typeScale.body,
    fontWeight: '600' as const,
    flexShrink: 1,
    minWidth: 0,
    flex: 1,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumTagText: {
    ...typeScale.caption2,
    fontWeight: '700' as const,
  },
  categoryProgress: {
    ...typeScale.footnote,
    marginTop: 2,
    flexShrink: 1,
  },
});
