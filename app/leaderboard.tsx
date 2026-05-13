import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Minus,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useLeaderboard } from '@/lib/supabase-hooks';
import { useAuth } from '@/providers/AuthProvider';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');

  const { data: leaderboard = [] } = useLeaderboard(selectedPeriod);

  const periods: { key: LeaderboardPeriod; label: string }[] = [
    { key: 'daily', label: t('profile.daily') },
    { key: 'weekly', label: t('profile.weekly') },
    { key: 'monthly', label: t('profile.monthly') },
    { key: 'allTime', label: t('profile.allTime') },
  ];

  const getRankChangeIcon = (rank: number) => {
    const changes = [0, 1, -1, 2, 0, -2, 1, 0, -1, 1];
    const change = changes[rank % 10] || 0;
    if (change > 0) return <ChevronUp color={colors.success} size={14} />;
    if (change < 0) return <ChevronDown color={colors.error} size={14} />;
    return <Minus color={colors.textMuted} size={14} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile.leaderboard')}</Text>
          <View style={styles.placeholder} />
        </View>

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
          <View style={styles.podium}>
            {[1, 0, 2].map((index) => {
              const user = leaderboard[index];
              const heights = [120, 90, 70];
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

          <View style={[styles.leaderboardList, { borderColor: colors.glassBorder }]}>
            {leaderboard.slice(3).map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.leaderboardItem,
                  index < leaderboard.slice(3).length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
                  user.id === profile?.id && styles.leaderboardItemHighlight,
                ]}
              >
                <Text style={styles.leaderboardRank}>#{user.rank}</Text>
                <View style={styles.rankChange}>
                  {getRankChangeIcon(index + 3)}
                </View>
                <Image source={{ uri: user.avatar }} style={styles.leaderboardAvatar} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {},
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  periodButtonTextActive: {},
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingTop: 10,
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
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 12,
    marginBottom: 8,
  },
  podiumBar: {
    width: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  leaderboardList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  leaderboardItemHighlight: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
  },
  leaderboardRank: {
    width: 36,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  rankChange: {
    width: 20,
    alignItems: 'center',
  },
  leaderboardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 4,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  leaderboardPoints: {
    fontSize: 13,
  },
  leaderboardStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  streakEmoji: {
    fontSize: 14,
  },
});
