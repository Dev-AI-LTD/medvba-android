import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '@/components/layout';
import {
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useLeaderboard, type LeaderboardUser } from '@/lib/supabase-hooks';
import { useAuth } from '@/providers/AuthProvider';
import { safeAvatarUri } from '@/lib/safe-image-uri';
import {
  iconSm,
  radiusLg,
  radiusMd,
  radiusSm,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

const MEDAL_BY_RANK: Record<number, readonly [string, string]> = {
  1: ['#FFD700', '#FFA500'],
  2: ['#C0C0C0', '#A8A8A8'],
  3: ['#CD7F32', '#8B4513'],
};

function medalColorsForRank(rank: number): readonly [string, string] {
  return MEDAL_BY_RANK[rank] ?? MEDAL_BY_RANK[2];
}

function barHeightForRank(rank: number): number {
  if (rank === 1) return 120;
  if (rank === 2) return 90;
  if (rank === 3) return 70;
  return 70;
}

/** Classic podium visual order (2nd, 1st, 3rd) using only real RPC rows. */
function podiumSlots(users: LeaderboardUser[]): LeaderboardUser[] {
  const top = users.slice(0, 3);
  return [1, 0, 2]
    .map((i) => top[i])
    .filter((user): user is LeaderboardUser => user != null);
}

function formatPodiumPoints(points: number): string {
  return points >= 1000 ? `${(points / 1000).toFixed(1)}k` : String(points);
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');

  const {
    data,
    isPending,
    isError,
    refetch,
  } = useLeaderboard(selectedPeriod);

  const leaderboard = data ?? [];
  const showInitialLoading = isPending;
  const showError = isError && !isPending;
  const showEmpty = !isPending && !isError && leaderboard.length === 0;
  const showSuccess = !isPending && !isError && leaderboard.length > 0;

  const podiumUsers = useMemo(
    () => (showSuccess ? podiumSlots(leaderboard) : []),
    [leaderboard, showSuccess],
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const periods: { key: LeaderboardPeriod; label: string }[] = [
    { key: 'daily', label: t('profile.daily') },
    { key: 'weekly', label: t('profile.weekly') },
    { key: 'monthly', label: t('profile.monthly') },
    { key: 'allTime', label: t('profile.allTime') },
  ];

  return (
    <Screen withGradient edges={['top', 'bottom']} padded={false}>
      <ScreenHeader
        layout="stack-centered"
        onBack={() => router.back()}
        title={t('profile.leaderboard')}
      />

        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
                selectedPeriod === period.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedPeriod(period.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
                { color: selectedPeriod === period.key ? colors.text : colors.textSecondary },
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {showInitialLoading ? (
            <View style={styles.podium} accessibilityState={{ busy: true }}>
              {[120, 90, 70].map((height, index) => (
                <View key={`skeleton-${index}`} style={styles.podiumItem}>
                  <View style={[styles.skeletonCircle, { backgroundColor: colors.glassBorder }]} />
                  <View style={[styles.skeletonBar, { height, backgroundColor: colors.glassBorder }]} />
                </View>
              ))}
            </View>
          ) : null}

          {showError ? (
            <View style={[styles.statePanel, { borderColor: colors.glassBorder }]}>
              <Text style={[styles.stateTitle, { color: colors.text }]}>
                {t('leaderboard.errorTitle')}
              </Text>
              <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
                {t('leaderboard.errorMessage')}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={handleRetry}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('leaderboard.retry')}
              >
                <Text style={styles.retryButtonText}>{t('leaderboard.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showEmpty ? (
            <View style={[styles.statePanel, { borderColor: colors.glassBorder }]}>
              <Text style={[styles.stateTitle, { color: colors.text }]}>
                {t('leaderboard.emptyTitle')}
              </Text>
              <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
                {t('leaderboard.emptyMessage')}
              </Text>
            </View>
          ) : null}

          {showSuccess ? (
            <>
              <View style={styles.podium}>
                {podiumUsers.map((user) => {
                  const medalColors = medalColorsForRank(user.rank);
                  return (
                    <View key={user.id} style={styles.podiumItem}>
                      <View style={styles.podiumAvatarContainer}>
                        <LinearGradient
                          colors={medalColors}
                          style={styles.podiumAvatarBorder}
                        >
                          <Image
                            source={{ uri: safeAvatarUri(user.avatar, user.id) }}
                            style={styles.podiumAvatar}
                          />
                        </LinearGradient>
                        <View style={[styles.podiumBadge, { backgroundColor: medalColors[0] }]}>
                          <Text style={styles.podiumBadgeText}>{user.rank}</Text>
                        </View>
                      </View>
                      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                        {user.name.split(' ')[0]}
                      </Text>
                      <Text style={[styles.podiumPoints, { color: colors.textSecondary }]}>
                        {formatPodiumPoints(user.points)}
                      </Text>
                      <View style={[styles.podiumBar, { height: barHeightForRank(user.rank) }]}>
                        <LinearGradient
                          colors={medalColors}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {leaderboard.length > 3 ? (
                <View style={[styles.leaderboardList, { borderColor: colors.glassBorder }]}>
                  {leaderboard.slice(3).map((user, index, rows) => (
                    <View
                      key={user.id}
                      style={[
                        styles.leaderboardItem,
                        index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
                        user.id === profile?.id && styles.leaderboardItemHighlight,
                      ]}
                    >
                      <Text style={[styles.leaderboardRank, { color: colors.textSecondary }]}>
                        #{user.rank}
                      </Text>
                      <Image
                        source={{ uri: safeAvatarUri(user.avatar, user.id) }}
                        style={styles.leaderboardAvatar}
                      />
                      <View style={styles.leaderboardInfo}>
                        <Text style={[styles.leaderboardName, { color: colors.text }]}>{user.name}</Text>
                        <View style={styles.leaderboardStats}>
                          <Zap color={colors.warning} size={iconSm} />
                          <Text style={[styles.leaderboardPoints, { color: colors.textSecondary }]}>
                            {user.points.toLocaleString()} {t('profile.pts')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.leaderboardStreak}>
                        <Text style={[styles.streakNumber, { color: colors.text }]}>{user.streak}</Text>
                        <Text style={styles.streakEmoji}>⚡</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: screenPaddingX,
    marginBottom: screenPaddingX,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radiusMd,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radiusSm,
    alignItems: 'center',
    minHeight: touchTargetMin,
  },
  periodButtonActive: {},
  periodButtonText: {
    ...typeScale.caption,
    fontWeight: '600' as const,
  },
  periodButtonTextActive: {},
  scrollContent: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: space.space5,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: sectionGap,
    paddingTop: 10,
    minHeight: 200,
  },
  podiumItem: {
    alignItems: 'center',
    width: '33%',
  },
  podiumAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  podiumBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  podiumBadgeText: {
    ...typeScale.subhead,
    fontWeight: '700' as const,
    color: '#fff',
  },
  podiumName: {
    ...typeScale.subhead,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  podiumPoints: {
    ...typeScale.caption,
    marginBottom: space.space2,
  },
  podiumBar: {
    width: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  skeletonCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 12,
    opacity: 0.45,
  },
  skeletonBar: {
    width: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.35,
  },
  statePanel: {
    borderWidth: 1,
    borderRadius: radiusLg,
    padding: space.space5,
    alignItems: 'center',
    marginTop: space.space3,
  },
  stateTitle: {
    ...typeScale.headline,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: space.space2,
  },
  stateMessage: {
    ...typeScale.body,
    textAlign: 'center',
    marginBottom: space.space4,
  },
  retryButton: {
    minHeight: touchTargetMin,
    paddingHorizontal: space.space5,
    paddingVertical: space.space3,
    borderRadius: radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    ...typeScale.subhead,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  leaderboardList: {
    borderRadius: radiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.space3,
    paddingHorizontal: screenPaddingX,
  },
  leaderboardItemHighlight: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
  },
  leaderboardRank: {
    width: 36,
    ...typeScale.subhead,
    fontWeight: '600' as const,
  },
  leaderboardAvatar: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    marginLeft: 4,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: space.space3,
  },
  leaderboardName: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  leaderboardPoints: {
    ...typeScale.footnote,
  },
  leaderboardStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakNumber: {
    ...typeScale.headline,
    fontWeight: '700' as const,
  },
  streakEmoji: {
    ...typeScale.subhead,
  },
});
