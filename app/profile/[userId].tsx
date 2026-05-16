import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  MapPin,
  School,
  BookOpen,
  MessageCircle,
  Calendar,
  Award,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import GlassCard from '@/components/GlassCard';
import { useUserProfile, useGetOrCreateDirectChat, useUserProgress } from '@/lib/supabase-hooks';
import { TOUCH_TARGET_MIN } from '@/theme/paperTheme';
import { safeAvatarUri } from '@/lib/safe-image-uri';

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, currentLanguage } = useLanguage();

  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(userId);
  const { data: progress } = useUserProgress(userId);
  const createOrGetChatMutation = useGetOrCreateDirectChat();

  const isOwnProfile = user?.id === userId;

  const dateLocale = currentLanguage === 'ro' ? 'ro-RO' : 'en-US';

  const handleStartChat = async () => {
    if (!user?.id || !userId || isOwnProfile) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await createOrGetChatMutation.mutateAsync({
        currentUserId: user.id,
        otherUserId: userId,
      });

      router.push(`/direct-chat?chatId=${result.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(t('userProfile.startChatErrorTitle'), t('userProfile.startChatErrorMessage'), [
        { text: t('common.ok') },
      ]);
    }
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/edit-profile');
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.background, colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile')}</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('editProfile.loadingProfile')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.background, colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile')}</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('userProfile.notFound')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const accuracy = progress
    ? progress.totalQuestionsAnswered > 0
      ? (progress.correctAnswers / progress.totalQuestionsAnswered) * 100
      : 0
    : 0;
  const studyHours = progress ? progress.studyTimeSeconds / 3600 : 0;

  const joinedDateStr = new Intl.DateTimeFormat(dateLocale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.created_at));
  const joinedText = t('userProfile.joined').replace('{date}', joinedDateStr);

  const universityLine =
    profile.university &&
    `${profile.university}${
      profile.year_of_study
        ? t('userProfile.yearOfStudySuffix').replace('{year}', String(profile.year_of_study))
        : ''
    }`;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.background, colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile')}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Image
                source={{
                  uri: safeAvatarUri(
                    profile.profile_photo_url ?? profile.avatar,
                    profile.id,
                  ),
                }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{profile.name}</Text>

              {profile.city && (
                <View style={styles.locationRow}>
                  <MapPin color={colors.accent} size={16} />
                  <Text style={styles.locationText}>{profile.city}</Text>
                </View>
              )}

              {profile.university && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <School color={colors.secondary} size={18} />
                  </View>
                  <Text style={styles.infoText}>{universityLine}</Text>
                </View>
              )}

              {profile.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              )}

              <View style={styles.joinedRow}>
                <Calendar color={colors.textMuted} size={14} />
                <Text style={styles.joinedText}>{joinedText}</Text>
              </View>
            </View>
          </GlassCard>

          {progress && (
            <GlassCard style={styles.statsCard}>
              <Text style={styles.sectionTitle}>{t('userProfile.studyStatistics')}</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Target color={colors.primary} size={20} />
                  </View>
                  <Text style={styles.statValue}>{progress.totalQuestionsAnswered}</Text>
                  <Text style={styles.statLabel}>{t('profile.questions')}</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                    <TrendingUp color={colors.success} size={20} />
                  </View>
                  <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>{t('profile.accuracy')}</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Award color={colors.accent} size={20} />
                  </View>
                  <Text style={styles.statValue}>{progress.currentStreak}</Text>
                  <Text style={styles.statLabel}>{t('profile.dayStreak')}</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <Clock color={colors.secondary} size={20} />
                  </View>
                  <Text style={styles.statValue}>{studyHours.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>{t('userProfile.studyHours')}</Text>
                </View>
              </View>
            </GlassCard>
          )}

          {!isOwnProfile && (
            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleStartChat}
              disabled={createOrGetChatMutation.isPending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              {createOrGetChatMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <MessageCircle color={colors.text} size={20} />
                  <Text style={styles.messageButtonText}>{t('userProfile.sendMessage')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isOwnProfile && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile} activeOpacity={0.8}>
              <View style={styles.editButtonContent}>
                <BookOpen color={colors.primary} size={20} />
                <Text style={styles.editButtonText}>{t('editProfile.title')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    backButton: {
      width: TOUCH_TARGET_MIN,
      height: TOUCH_TARGET_MIN,
      borderRadius: TOUCH_TARGET_MIN / 2,
      backgroundColor: colors.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    profileCard: {
      marginBottom: 16,
    },
    profileHeader: {
      alignItems: 'center',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: colors.primary,
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    locationText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '600' as const,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.cardBgLight,
      borderRadius: 12,
      marginBottom: 12,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600' as const,
    },
    bioSection: {
      width: '100%',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.glassBorder,
      marginVertical: 12,
    },
    bioText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
    },
    joinedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    joinedText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    statsCard: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.cardBgLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    statIcon: {
      width: TOUCH_TARGET_MIN,
      height: TOUCH_TARGET_MIN,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600' as const,
    },
    messageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 16,
      gap: 10,
      overflow: 'hidden',
      marginBottom: 16,
    },
    messageButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
    },
    editButton: {
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.primary,
      overflow: 'hidden',
      marginBottom: 16,
    },
    editButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 10,
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.primary,
    },
  });
