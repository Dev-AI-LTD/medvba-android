import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Clock, ChevronRight, Bone, Heart, User, Brain, Stethoscope, Sparkles, Lock, EyeOff, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card, Button } from 'react-native-paper';
import { UIButton } from '@/ui';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import ProgressRing from '@/components/ProgressRing';
import PremiumBadge from '@/components/PremiumBadge';
import { categories } from '@/mocks/questions';
import { useQuizProgress } from '@/providers/QuizProgressProvider';
import { FREE_QUIZ_ANSWER_LIMIT } from '@/constants/subscription';
import { SPACING } from '@/theme/paperTheme';
import { log } from '@/lib/log';

export default function HomeScreen() {
  const router = useRouter();
  const { t, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const { profile } = useAuth();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.appIcon}
              />
              <View style={styles.headerTextWrap}>
                <View style={styles.greetingRow}>
                  <Text style={[styles.greeting, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t(
                      (() => {
                        const hour = new Date().getHours();
                        if (hour >= 18) return 'home.greetingEvening';
                        if (hour >= 12) return 'home.greetingAfternoon';
                        return 'home.greetingMorning';
                      })()
                    )}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.privacyBadge, { backgroundColor: colors.textMuted + '20' }]}
                    onPress={() => router.push('/settings')}
                    activeOpacity={0.7}
                  >
                    <EyeOff size={12} color={colors.textMuted} />
                    <Text style={[styles.privacyBadgeText, { color: colors.textMuted }]}>
                      {profile?.isPublic === false ? 'Private' : 'Public'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {profile?.name?.split(' ')[0] || profile?.email || t('common.student')}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Image
                  key={`avatar:${profile?.id ?? 'anon'}:${profile?.profile_photo_url ?? profile?.avatar ?? 'default'}`}
                  source={{
                    uri:
                      profile?.profile_photo_url ||
                      profile?.avatar ||
                      'https://api.dicebear.com/7.x/avataaars/png?seed=default',
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>
          </View>

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
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + 'E6', borderRadius: 16, zIndex: 5 }]}
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
                  <Crown color="#FFF" size={24} strokeWidth={2.5} />
                </View>
                <View style={styles.upgradeBannerText}>
                  <Text style={styles.upgradeBannerTitle}>{t('profile.upgradeToPremium')}</Text>
                  <Text style={styles.upgradeBannerSubtitle}>{t('profile.upgradeBannerSubtitleAll')}</Text>
                </View>
                <ChevronRight color="#FFF" size={22} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCardWrapper}>
              <Card style={[styles.statCard, { borderWidth: 1, borderColor: colors.glassBorder }]} mode="elevated">
                <Card.Content style={styles.statCardContent}>
                  <TrendingUp color={colors.success} size={24} />
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
                  <Target color={colors.accentPink} size={24} />
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
                  <Clock color={colors.warning} size={24} />
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

                router.push({
                  pathname: '/quiz-session',
                  params: { category: category.id, mode: 'sequential' }
                });
              };

              const label = getModuleName(category.id) || category.name;
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.7}
                  onPress={handleCategoryPress}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.cardBg ?? colors.backgroundLight, borderWidth: 1, borderColor: colors.glassBorder },
                    isLocked && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    {isLocked ? (
                      <Lock color={category.color} size={20} strokeWidth={2.5} />
                    ) : (
                      <IconComponent color={category.color} size={20} />
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
                    <Lock color={colors.textMuted} size={20} strokeWidth={2} />
                  ) : (
                    <ChevronRight color={colors.textMuted} size={20} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
  scrollContent: {
    paddingHorizontal: SPACING.x3,
    paddingBottom: SPACING.x3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.x3,
    marginTop: SPACING.x1,
  },
  greeting: {
    fontSize: 14,
    flexShrink: 0,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    flexShrink: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  upgradeBanner: {
    marginBottom: SPACING.x3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  upgradeBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  premiumBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  limitOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 12,
    textAlign: 'center',
  },
  limitText: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  limitUpgradeButton: {
    marginTop: SPACING.x2,
  },
  heroCard: {
    marginBottom: SPACING.x3,
    minHeight: 140,
    borderRadius: 16,
  },
  heroCardContent: {
    paddingVertical: SPACING.x2,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    marginRight: SPACING.x2,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: SPACING.x1,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    marginBottom: SPACING.x2,
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
    gap: SPACING.x2,
    marginBottom: SPACING.x3,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.x2,
    paddingHorizontal: SPACING.x1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.x3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.x2,
  },
  progressCard: {
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  seeAll: {
    fontSize: 14,
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
    marginTop: SPACING.x2,
  },
  progressText: {
    fontSize: 14,
  },
  progressHighlight: {
    fontWeight: '600' as const,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.x2,
    height: 80,
    borderRadius: 16,
    width: '100%',
    paddingHorizontal: SPACING.x2,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: SPACING.x2,
    justifyContent: 'center',
    minWidth: 0,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.x1,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  categoryName: {
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: '700' as const,
  },
  categoryProgress: {
    fontSize: 13,
    marginTop: 2,
    flexShrink: 1,
  },
});
