import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  Crown,
  Award,
  Target,
  Clock,
  TrendingUp,
  ChevronRight,
  Star,
  Zap,
  Calendar,
  Flame,
  Trophy,
  Lock,
  ChevronUp,
  ChevronDown,
  Minus,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  EyeOff,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import ProgressRing from '@/components/ProgressRing';
import { useQuizProgress } from '@/providers/QuizProgressProvider';
import { useAuth } from '@/providers/AuthProvider';
import { safeAvatarUri } from '@/lib/safe-image-uri';
import { useLeaderboard, useZoomRequests } from '@/lib/supabase-hooks';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { TOUCH_TARGET_MIN } from '@/theme/paperTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



interface Achievement {
  id: string;
  name: string;
  icon: React.ComponentType<{ color: string; size: number; fill?: string }>;
  description: string;
  requirement: number;
  currentProgress: number;
  type: 'questions' | 'streak' | 'accuracy' | 'time';
  gradient: readonly [string, string];
  iconColor: string;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

function getDayName(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function getLast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { isPremium, isPaywallEnabled } = useSubscription();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  const {
    allTimeStats,
    streakData,
    weeklyHistory,
    accuracy,
    formattedQuestionsCount,
    formattedStudyTime,
    weeklyQuestionsTotal,
    weeklyStudyTimeSeconds,
    weeklyGoalProgress,
  } = useQuizProgress();

  const { data: zoomRequests = [] } = useZoomRequests(user?.id);
  const { data: leaderboard = [] } = useLeaderboard(selectedPeriod);



  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'question_master',
      name: t('achievement.questionMaster'),
      icon: Target,
      description: t('achievement.questionMasterDesc'),
      requirement: 1000,
      currentProgress: allTimeStats.totalQuestionsAnswered,
      type: 'questions',
      gradient: ['#FF6B6B', '#FF8E53'],
      iconColor: '#FF6B6B',
    },
    {
      id: 'streak_champion',
      name: t('achievement.streakChampion'),
      icon: Flame,
      description: t('achievement.streakChampionDesc'),
      requirement: 30,
      currentProgress: streakData.currentStreak,
      type: 'streak',
      gradient: ['#F093FB', '#F5576C'],
      iconColor: '#F093FB',
    },
    {
      id: 'accuracy_ace',
      name: t('achievement.accuracyAce'),
      icon: Zap,
      description: t('achievement.accuracyAceDesc'),
      requirement: 80,
      currentProgress: Math.round(accuracy),
      type: 'accuracy',
      gradient: ['#4FACFE', '#00F2FE'],
      iconColor: '#4FACFE',
    },
    {
      id: 'study_warrior',
      name: t('achievement.studyWarrior'),
      icon: Award,
      description: t('achievement.studyWarriorDesc'),
      requirement: 50,
      currentProgress: Math.floor(allTimeStats.totalStudyTimeSeconds / 3600),
      type: 'time',
      gradient: ['#43E97B', '#38F9D7'],
      iconColor: '#43E97B',
    },
    {
      id: 'anatomy_expert',
      name: t('achievement.anatomyExpert'),
      icon: Trophy,
      description: t('achievement.anatomyExpertDesc'),
      requirement: 5000,
      currentProgress: allTimeStats.totalQuestionsAnswered,
      type: 'questions',
      gradient: ['#FA709A', '#FEE140'],
      iconColor: '#FA709A',
    },
    {
      id: 'dedication',
      name: t('achievement.dedication'),
      icon: Crown,
      description: t('achievement.dedicationDesc'),
      requirement: 100,
      currentProgress: streakData.longestStreak,
      type: 'streak',
      gradient: ['#667EEA', '#764BA2'],
      iconColor: '#667EEA',
    },
  ], [allTimeStats.totalQuestionsAnswered, allTimeStats.totalStudyTimeSeconds, streakData.currentStreak, streakData.longestStreak, accuracy, t]);

  const unlockedCount = useMemo(() => {
    return achievements.filter(a => a.currentProgress >= a.requirement).length;
  }, [achievements]);

  const getAchievementProgress = useCallback((achievement: Achievement) => {
    return Math.min((achievement.currentProgress / achievement.requirement) * 100, 100);
  }, []);

  const handleAchievementPress = useCallback((id: string) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    Animated.sequence([
      Animated.timing(scaleAnims[id], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[id], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnims]);

  const getScaleAnim = useCallback((id: string) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    return scaleAnims[id];
  }, [scaleAnims]);

  const weeklyData = useMemo(() => {
    const last7Days = getLast7Days();
    return last7Days.map(date => {
      const entry = weeklyHistory.find(h => h.date === date);
      return {
        date,
        day: getDayName(date),
        questions: entry?.questionsAnswered || 0,
        studyTime: entry?.studyTimeSeconds || 0,
      };
    });
  }, [weeklyHistory]);

  const maxQuestions = useMemo(() => {
    return Math.max(...weeklyData.map(d => d.questions), 1);
  }, [weeklyData]);

  const formattedWeeklyStudyTime = useMemo(() => {
    const hours = Math.floor(weeklyStudyTimeSeconds / 3600);
    const minutes = Math.floor((weeklyStudyTimeSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [weeklyStudyTimeSeconds]);

  const getMotivationalMessage = useCallback(() => {
    if (weeklyGoalProgress >= 100) return t('profile.motivational.goalAchieved');
    if (weeklyGoalProgress >= 75) return t('profile.motivational.almostThere');
    if (weeklyGoalProgress >= 50) return t('profile.motivational.greatProgress');
    if (weeklyGoalProgress >= 25) return t('profile.motivational.goodStart');
    return t('profile.motivational.getStarted');
  }, [weeklyGoalProgress, t]);

  const periods: { key: LeaderboardPeriod; label: string }[] = [
    { key: 'daily', label: t('profile.daily') },
    { key: 'weekly', label: t('profile.weekly') },
    { key: 'monthly', label: t('profile.monthly') },
    { key: 'allTime', label: t('profile.allTime') },
  ];

  const getRankChangeIcon = useCallback((index: number) => {
    const changes = [0, 1, -1, 2, 0, -2, 1];
    const change = changes[index] || 0;
    if (change > 0) return <ChevronUp color={colors.success} size={14} />;
    if (change < 0) return <ChevronDown color={colors.error} size={14} />;
    return <Minus color={colors.textMuted} size={14} />;
  }, [colors]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight, colors.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.titleRow}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <Text style={styles.title}>{t('profile')}</Text>
              {profile?.isPublic === false && (
                <View style={[styles.privacyBadge, { backgroundColor: colors.textMuted + '20' }]}>
                  <EyeOff size={12} color={colors.textMuted} />
                  <Text style={[styles.privacyBadgeText, { color: colors.textMuted }]}>Private</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              activeOpacity={0.7}
              onPress={() => router.push('/settings')}
              testID="profileOpenSettings"
              accessibilityLabel="Open settings"
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Settings color={colors.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(0, 180, 216, 0.2)', 'rgba(2, 62, 138, 0.15)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.glassOverlay} />
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.avatarBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    key={`avatar:${profile?.id ?? 'anon'}:${profile?.profile_photo_url ?? profile?.avatar ?? 'default'}`}
                    source={{
                      uri: profile?.profile_photo_url || profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=default',
                    }}
                    style={styles.avatar}
                  />
                </LinearGradient>
                <View style={styles.rankBadge}>
                  <LinearGradient
                    colors={[colors.secondary, colors.primaryDark]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.rankText}>#{profile?.rank || 0}</Text>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile?.name || t('common.student')}</Text>
                <View style={styles.profileStats}>
                  <View style={styles.streakBadgeSmall}>
                    <Flame color={colors.streakOrange} size={14} fill={colors.streakOrange} />
                    <Text style={styles.streakTextSmall}>{streakData.currentStreak}</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Star color={colors.warning} size={14} fill={colors.warning} />
                    <Text style={styles.pointsText}>{(profile?.points || 0).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>
            {isPaywallEnabled && isPremium ? (
              <View style={styles.premiumBadge}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 149, 0, 0.15)']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Crown color={colors.warning} size={18} fill={colors.warning} />
                <Text style={styles.premiumBadgeText}>{t('profile.premiumMember')}</Text>
              </View>
            ) : null}
          </View>



          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(0, 180, 216, 0.15)', 'rgba(0, 180, 216, 0.05)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.glassOverlay} />
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(0, 180, 216, 0.2)' }]}>
                <Target color={colors.primary} size={22} />
              </View>
              <Text style={styles.statValue}>{formattedQuestionsCount}</Text>
              <Text style={styles.statLabel}>{t('profile.questions')}</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(0, 196, 140, 0.15)', 'rgba(0, 196, 140, 0.05)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.glassOverlay} />
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(0, 196, 140, 0.2)' }]}>
                <TrendingUp color={colors.success} size={22} />
              </View>
              <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>{t('profile.accuracy')}</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255, 107, 157, 0.15)', 'rgba(255, 107, 157, 0.05)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.glassOverlay} />
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 157, 0.2)' }]}>
                <Clock color={colors.accentPink} size={22} />
              </View>
              <Text style={styles.statValue}>{formattedStudyTime}</Text>
              <Text style={styles.statLabel}>{t('profile.studyTime')}</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255, 149, 0, 0.15)', 'rgba(255, 149, 0, 0.05)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.glassOverlay} />
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.2)' }]}>
                <Flame color={colors.streakOrange} size={22} />
              </View>
              <Text style={styles.statValue}>{streakData.currentStreak}</Text>
              <Text style={styles.statLabel}>{t('profile.dayStreak')}</Text>
            </View>
          </View>

          {isPaywallEnabled && !isPremium && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/paywall')}
              style={styles.upgradeBannerSection}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.upgradeBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.upgradeBannerLeft}>
                  <View style={styles.upgradeBannerIconWrap}>
                    <Crown color="#FFF" size={24} strokeWidth={2.5} />
                  </View>
                  <View style={styles.upgradeBannerTextWrap}>
                    <Text style={styles.upgradeBannerTitle}>{t('profile.upgradeBannerTitle')}</Text>
                    <Text style={styles.upgradeBannerSubtitle}>{t('profile.upgradeBannerSubtitle')}</Text>
                  </View>
                </View>
                <View style={styles.upgradeBannerCta}>
                  <Text style={styles.upgradeBannerCtaText}>{t('profile.upgradeBannerCta')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
           )}

           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Award color={colors.primary} size={22} />
               <Text style={styles.sectionTitleInline}>{t('profile.achievements')}</Text>
              <View style={styles.achievementCounter}>
                <Text style={styles.achievementCounterText}>{unlockedCount}/{achievements.length}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {achievements.map((achievement) => {
                const isUnlocked = achievement.currentProgress >= achievement.requirement;
                const progress = getAchievementProgress(achievement);
                const AchievementIcon = achievement.icon;

                return (
                  <TouchableOpacity
                    key={achievement.id}
                    activeOpacity={0.8}
                    onPress={() => handleAchievementPress(achievement.id)}
                  >
                    <Animated.View
                      style={[
                        styles.achievementCard,
                        { transform: [{ scale: getScaleAnim(achievement.id) }] },
                      ]}
                    >
                      <LinearGradient
                        colors={isUnlocked ? achievement.gradient : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20, opacity: isUnlocked ? 0.3 : 1 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <View style={styles.glassOverlay} />
                      {!isUnlocked && (
                        <View style={styles.lockedOverlay}>
                          <Lock color={colors.textMuted} size={16} />
                        </View>
                      )}
                      <View style={[styles.achievementIconContainer, { backgroundColor: isUnlocked ? `${achievement.iconColor}30` : 'rgba(255,255,255,0.08)' }]}>
                        <AchievementIcon
                          color={isUnlocked ? achievement.iconColor : colors.textMuted}
                          size={28}
                          fill={isUnlocked && achievement.id.includes('streak') ? achievement.iconColor : undefined}
                        />
                      </View>
                      <Text style={[styles.achievementName, !isUnlocked && styles.achievementNameLocked]}>
                        {achievement.name}
                      </Text>
                      <View style={styles.achievementProgressContainer}>
                        <View style={styles.achievementProgressBg}>
                          <LinearGradient
                            colors={isUnlocked ? achievement.gradient : [colors.primary, colors.primaryDark]}
                            style={[styles.achievementProgressFill, { width: `${progress}%` }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          />
                        </View>
                        <Text style={styles.achievementProgressText}>
                          {achievement.currentProgress}/{achievement.requirement}
                        </Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy color={colors.warning} size={22} />
              <Text style={styles.sectionTitleInline}>{t('profile.leaderboard')}</Text>
              <TouchableOpacity 
                style={styles.seeAllButton} 
                onPress={() => router.push('/leaderboard')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>{t('profile.seeAll')}</Text>
                <ChevronRight color={colors.primary} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                  activeOpacity={0.7}
                >
                  {selectedPeriod === period.key && (
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.periodButtonTextActive,
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.leaderboardCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.glassOverlay} />

              <View style={styles.podium}>
                {[1, 0, 2].map((index) => {
                  const user = leaderboard[index];
                  const heights = [90, 70, 60];
                  const medalColors: readonly [string, string][] = [
                    ['#FFD700', '#FFA500'],
                    ['#C0C0C0', '#A8A8A8'],
                    ['#CD7F32', '#8B4513'],
                  ];
                  const podiumIndex = [1, 0, 2].indexOf(index);

                  return (
                    <View key={user?.id ?? `podium-${index}`} style={styles.podiumItem}>
                      <View style={styles.podiumAvatarContainer}>
                        <LinearGradient
                          colors={medalColors[podiumIndex]}
                          style={styles.podiumAvatarBorder}
                        >
                          <Image
                            source={{ uri: user?.avatar ?? 'https://api.dicebear.com/7.x/avataaars/png?seed=placeholder' }}
                            style={styles.podiumAvatar}
                          />
                        </LinearGradient>
                        <View style={[styles.podiumBadge, { backgroundColor: medalColors[podiumIndex][0] }]}>
                          <Text style={styles.podiumBadgeText}>{user?.rank ?? index + 1}</Text>
                        </View>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {user ? user.name.split(' ')[0] : '—'}
                      </Text>
                      <Text style={styles.podiumPoints}>
                        {user ? (user.points >= 1000 ? `${(user.points / 1000).toFixed(1)}k` : String(user.points)) : '0'}
                      </Text>
                      <View style={[styles.podiumBar, { height: heights[podiumIndex] }]}>
                        <LinearGradient
                          colors={medalColors[podiumIndex]}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {leaderboard.slice(3, 7).map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.leaderboardItem,
                    index < 3 && styles.leaderboardItemBorder,
                    user.id === profile?.id && styles.leaderboardItemHighlight,
                  ]}
                >
                  <Text style={styles.leaderboardRank}>#{user.rank}</Text>
                  <View style={styles.rankChange}>
                    {getRankChangeIcon(index + 3)}
                  </View>
                  <Image
                    source={{ uri: safeAvatarUri(user.avatar, user.id) }}
                    style={styles.leaderboardAvatar}
                  />
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{user.name}</Text>
                    <View style={styles.leaderboardStats}>
                      <Zap color={colors.warning} size={12} />
                      <Text style={styles.leaderboardPoints}>{user.points.toLocaleString()} {t('profile.pts')}</Text>
                    </View>
                  </View>
                  <View style={styles.leaderboardStreak}>
                    <Text style={styles.streakNumber}>{user.streak}</Text>
                    <Text style={styles.streakEmoji}>⚡</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {zoomRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Video color={colors.accent} size={22} />
                <Text style={styles.sectionTitleInline}>Zoom Session Requests</Text>
              </View>
              <View style={styles.zoomRequestsContainer}>
                {zoomRequests.map((request) => {
                  const statusColors = {
                    pending: { bg: 'rgba(255, 184, 0, 0.15)', color: colors.warning, icon: AlertCircle },
                    approved: { bg: 'rgba(0, 196, 140, 0.15)', color: colors.success, icon: CheckCircle },
                    rejected: { bg: 'rgba(255, 59, 48, 0.15)', color: colors.error, icon: XCircle },
                  };
                  const statusConfig = statusColors[request.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <View key={request.id} style={styles.zoomRequestCard}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                      />
                      <View style={styles.glassOverlay} />
                      <View style={styles.zoomRequestHeader}>
                        <Text style={styles.zoomRequestTopic} numberOfLines={1}>{request.studyTopic}</Text>
                        <View style={[styles.zoomRequestStatus, { backgroundColor: statusConfig.bg }]}>
                          <StatusIcon color={statusConfig.color} size={14} />
                          <Text style={[styles.zoomRequestStatusText, { color: statusConfig.color }]}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.zoomRequestDetails}>
                        <View style={styles.zoomRequestDetail}>
                          <Calendar color={colors.textSecondary} size={14} />
                          <Text style={styles.zoomRequestDetailText}>
                            {new Date(request.preferredDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View style={styles.zoomRequestDetail}>
                          <Clock color={colors.textSecondary} size={14} />
                          <Text style={styles.zoomRequestDetailText}>
                            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar color={colors.accent} size={22} />
              <Text style={styles.sectionTitleInline}>{t('profile.weeklyProgress')}</Text>
            </View>
            <View style={styles.weeklyCard}>
              <LinearGradient
                colors={['rgba(0, 245, 212, 0.15)', 'rgba(0, 180, 216, 0.08)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.glassOverlay} />

              <View style={styles.weeklyHeader}>
                <ProgressRing
                  progress={weeklyGoalProgress}
                  size={100}
                  strokeWidth={10}
                  color={colors.accent}
                  label="goal"
                />
                <View style={styles.weeklyInfo}>
                  <Text style={styles.weeklyTitle}>{getMotivationalMessage()}</Text>
                  <Text style={styles.weeklySubtitle}>
                    {weeklyQuestionsTotal}/350 {t('profile.questionsThisWeek')}
                  </Text>
                  <View style={styles.weeklyStats}>
                    <View style={styles.weeklyStat}>
                      <Text style={styles.weeklyStatValue}>{weeklyQuestionsTotal}</Text>
                      <Text style={styles.weeklyStatLabel}>{t('profile.questions')}</Text>
                    </View>
                    <View style={styles.weeklyStat}>
                      <Text style={styles.weeklyStatValue}>{formattedWeeklyStudyTime}</Text>
                      <Text style={styles.weeklyStatLabel}>{t('profile.studyTime')}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <View style={styles.chartBars}>
                  {weeklyData.map((day, index) => {
                    const barHeight = day.questions > 0 ? (day.questions / maxQuestions) * 80 : 4;
                    const isToday = index === 6;

                    return (
                      <View key={day.date} style={styles.chartBarContainer}>
                        <View style={styles.chartBarWrapper}>
                          <View style={[styles.chartBarBg, { height: 80 }]} />
                          <View style={[styles.chartBar, { height: barHeight }]}>
                            <LinearGradient
                              colors={isToday ? [colors.accent, colors.primary] : [colors.primary, colors.primaryDark]}
                              style={StyleSheet.absoluteFill}
                            />
                          </View>
                        </View>
                        <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                          {day.day}
                        </Text>
                        <Text style={styles.chartValue}>{day.questions}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },

  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  settingsButton: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.background,
    overflow: 'hidden',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  streakTextSmall: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.streakOrange,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  premiumButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.background,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
  },
  premiumBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.warning,
  },

  upgradeBannerSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  upgradeBannerGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  upgradeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  upgradeBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  upgradeBannerTextWrap: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  upgradeBannerCta: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeBannerCtaText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  statIconContainer: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  achievementCounter: {
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  achievementCounterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  achievementsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementCard: {
    width: 140,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  achievementNameLocked: {
    color: colors.textMuted,
  },
  achievementProgressContainer: {
    width: '100%',
  },
  achievementProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  periodButtonActive: {},
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.text,
    fontWeight: '700' as const,
  },
  leaderboardCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    overflow: 'hidden',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingTop: 10,
  },
  podiumItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 72) / 3,
  },
  podiumAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatarBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  podiumBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  podiumBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.background,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  podiumBar: {
    width: 50,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  leaderboardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leaderboardItemHighlight: {
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  leaderboardRank: {
    width: 32,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  rankChange: {
    width: 20,
    alignItems: 'center',
  },
  leaderboardAvatar: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    marginLeft: 4,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  leaderboardPoints: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  leaderboardStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.streakOrange,
  },
  streakEmoji: {
    fontSize: 14,
  },
  weeklyCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
    overflow: 'hidden',
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyInfo: {
    flex: 1,
    marginLeft: 20,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  weeklySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  weeklyStats: {
    flexDirection: 'row',
    gap: 24,
  },
  weeklyStat: {},
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    height: 80,
    width: 24,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  chartBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  chartLabelToday: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  chartValue: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  zoomRequestsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  zoomRequestCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    overflow: 'hidden',
  },
  zoomRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoomRequestTopic: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  zoomRequestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  zoomRequestStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  zoomRequestDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  zoomRequestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomRequestDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

