import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  X,
  AlertTriangle,
  User,
  BarChart3,
  Users,
  Flag,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import { TRPCClientError } from '@trpc/client';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpc } from '@/lib/trpc';
import {
  useLanguage,
  APP_LANGUAGE_STORAGE_KEY,
  LEGACY_APP_LANGUAGE_STORAGE_KEY,
} from '@/providers/LanguageProvider';
import {
  buttonHeight,
  cardPadding,
  fieldGap,
  iconSm,
  iconMd,
  radiusLg,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  touchTargetMin,
  typeScale,
} from '@/theme/iosDesign';
import { BLOCKED_USERS_STORAGE_KEY } from '@/lib/blocked-users-storage';
import { USER_REPORTS_STORAGE_KEY } from '@/lib/user-reports-storage';
import { log } from '@/lib/log';

const STORAGE_KEYS_TO_CLEAR = [
  'quiz_daily_progress',
  'quiz_session_state',
  'quiz_all_time_stats',
  'quiz_streak_data',
  'quiz_weekly_history',
  BLOCKED_USERS_STORAGE_KEY,
  USER_REPORTS_STORAGE_KEY,
  APP_LANGUAGE_STORAGE_KEY,
  LEGACY_APP_LANGUAGE_STORAGE_KEY,
];

type DeletionStep = 'confirm' | 'deleting' | 'success';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, signOut, refreshMedvbaSession } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<DeletionStep>('confirm');
  const deleteAccountMutation = trpc.account.deleteSelf.useMutation();

  const clearLocalData = async () => {
    log.debug('[DeleteAccount] Clearing local data...');
    try {
      await AsyncStorage.multiRemove(STORAGE_KEYS_TO_CLEAR);
      log.debug('[DeleteAccount] Local data cleared successfully');
    } catch (error) {
      log.error('[DeleteAccount] Error clearing local data', error);
    }
  };

  const handleDeleteAccount = useCallback(async () => {
    log.debug('[DeleteAccount] handleDeleteAccount called');

    if (confirmText.toUpperCase() !== 'DELETE') {
      log.debug('[DeleteAccount] Confirmation text does not match DELETE');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('deleteAccount.alertConfirmTitle'), t('deleteAccount.alertConfirmMessage'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStep('deleting');

    log.debug('[DeleteAccount] Initiating account deletion...');
    if (!user?.id) {
      log.error('[DeleteAccount] No user ID found');
      Alert.alert(t('deleteAccount.alertErrorTitle'), t('deleteAccount.alertMustBeLoggedIn'), [
        { text: t('common.ok') },
      ]);
      setStep('confirm');
      return;
    }

    try {
      log.debug('[DeleteAccount] Calling deleteAccountMutation...');

      await refreshMedvbaSession();

      const result = await deleteAccountMutation.mutateAsync();
      log.debug('[DeleteAccount] Backend deletion result:', result);

      await clearLocalData();
      log.debug('[DeleteAccount] Local data cleared');

      await signOut();
      log.debug('[DeleteAccount] Session cleared via AuthProvider');

      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter(
          (key) =>
            key.includes('supabase') ||
            key.includes('auth') ||
            key.includes('session') ||
            key.includes('quiz') ||
            key.includes('medvba'),
        );
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          log.debug('[DeleteAccount] Cleared additional keys:', keysToRemove);
        }
      } catch (e) {
        log.error('[DeleteAccount] Error clearing additional keys', e);
      }

      setStep('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      log.debug('[DeleteAccount] Account deletion process completed');
    } catch (error: unknown) {
      log.error('[DeleteAccount] Deletion failed', error);
      setStep('confirm');
      let message = t('deleteAccount.alertDeletionFailedGeneric');
      if (error instanceof TRPCClientError) {
        const m = error.message?.trim();
        if (m) message = m;
      } else if (error instanceof Error && error.message?.trim()) {
        message = error.message.trim();
      }
      Alert.alert(t('deleteAccount.alertDeletionFailed'), message, [{ text: t('common.ok') }]);
    }
  }, [confirmText, user?.id, deleteAccountMutation, signOut, refreshMedvbaSession, t]);

  const handleFinish = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/login');
  }, [router]);

  const isDeleteEnabled = confirmText.toUpperCase() === 'DELETE';

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.successContainer}>
            <View style={styles.successIconWrapper}>
              <CheckCircle color={colors.success} size={iconMd * 3} />
            </View>
            <Text style={styles.successTitle}>{t('deleteAccount.successTitle')}</Text>
            <Text style={styles.successText}>{t('deleteAccount.successBody')}</Text>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.8}>
              <Text style={styles.finishButtonText}>{t('deleteAccount.continue')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'deleting') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundLight, colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.error} />
            <Text style={styles.loadingText}>{t('deleteAccount.deletingTitle')}</Text>
            <Text style={styles.loadingSubtext}>{t('deleteAccount.deletingSubtext')}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
            <X color={colors.text} size={iconMd} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('deleteAccount.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.warningCard}>
            <LinearGradient
              colors={['rgba(255, 71, 87, 0.15)', 'rgba(255, 71, 87, 0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.warningIconWrapper}>
              <AlertTriangle color={colors.error} size={iconMd + space.space2} />
            </View>
            <Text style={styles.warningTitle}>{t('deleteAccount.warningTitle')}</Text>
            <Text style={styles.warningText}>{t('deleteAccount.warningBody')}</Text>
          </View>

          <View style={styles.subscriptionNoteCard}>
            <Text style={styles.subscriptionNoteText}>{t('deleteAccount.subscriptionNote')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('deleteAccount.sectionWhatDeleted')}</Text>
            <View style={styles.deletionList}>
              <View style={styles.deletionItem}>
                <View style={styles.deletionIconWrapper}>
                  <User color={colors.textSecondary} size={iconSm} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemProfile')}</Text>
              </View>
              <View style={styles.deletionItem}>
                <View style={styles.deletionIconWrapper}>
                  <BarChart3 color={colors.textSecondary} size={iconSm} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemQuizStats')}</Text>
              </View>
              <View style={styles.deletionItem}>
                <View style={styles.deletionIconWrapper}>
                  <Users color={colors.textSecondary} size={iconSm} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemStudyRooms')}</Text>
              </View>
              <View style={[styles.deletionItem, styles.deletionItemLast]}>
                <View style={styles.deletionIconWrapper}>
                  <Flag color={colors.textSecondary} size={iconSm} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemReports')}</Text>
              </View>
            </View>
            <Text style={styles.retentionNote}>
              {t('deleteAccount.retentionNoteBeforeLink')}
              <Text
                style={styles.retentionNoteLink}
                accessibilityRole="link"
                onPress={() => router.push('/legal/privacy-policy')}
              >
                {t('auth.privacyPolicy')}
              </Text>
              {t('deleteAccount.retentionNoteAfterLink')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('deleteAccount.confirmSectionTitle')}</Text>
            <Text style={styles.confirmInstructions}>{t('deleteAccount.confirmInstructions')}</Text>
            <TextInput
              style={styles.confirmInput}
              placeholder={t('deleteAccount.confirmPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, !isDeleteEnabled && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={!isDeleteEnabled}
            activeOpacity={0.8}
          >
            <Trash2 color="#FFFFFF" size={iconSm} />
            <Text style={styles.deleteButtonText}>{t('deleteAccount.deleteButton')}</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>{t('deleteAccount.footerNote')}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: {
  background: string;
  backgroundLight: string;
  cardBg: string;
  glassBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  error: string;
  primary: string;
  success: string;
}) {
  return StyleSheet.create({
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
      paddingHorizontal: screenPaddingX,
      paddingVertical: fieldGap,
      minHeight: touchTargetMin,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.glassBorder,
    },
    closeButton: {
      width: touchTargetMin,
      height: touchTargetMin,
      borderRadius: touchTargetMin / 2,
      backgroundColor: colors.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    title: {
      ...typeScale.title3,
      color: colors.text,
    },
    headerSpacer: {
      width: touchTargetMin,
    },
    scrollContent: {
      padding: screenPaddingX,
      paddingBottom: space.space8,
    },
    warningCard: {
      borderRadius: radiusLg,
      borderWidth: 1,
      borderColor: 'rgba(255, 71, 87, 0.3)',
      padding: cardPadding,
      alignItems: 'center',
      marginBottom: sectionGap,
      overflow: 'hidden',
    },
    warningIconWrapper: {
      width: touchTargetMin + space.space5,
      height: touchTargetMin + space.space5,
      borderRadius: (touchTargetMin + space.space5) / 2,
      backgroundColor: 'rgba(255, 71, 87, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: fieldGap,
    },
    warningTitle: {
      ...typeScale.title3,
      color: colors.error,
      marginBottom: space.space3,
      textAlign: 'center',
    },
    warningText: {
      ...typeScale.subhead,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    subscriptionNoteCard: {
      backgroundColor: 'rgba(0, 180, 216, 0.08)',
      borderRadius: radiusMd,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: cardPadding,
      marginBottom: fieldGap,
    },
    subscriptionNoteText: {
      ...typeScale.footnote,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: sectionGap,
    },
    sectionTitle: {
      ...typeScale.captionMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: space.space3,
      marginLeft: space.space1,
    },
    deletionList: {
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: radiusLg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
    },
    deletionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: touchTargetMin,
      padding: cardPadding,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.glassBorder,
    },
    deletionIconWrapper: {
      width: touchTargetMin - space.space2,
      height: touchTargetMin - space.space2,
      borderRadius: radiusMd,
      backgroundColor: 'rgba(255,255,255,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: space.space3,
    },
    deletionItemText: {
      flex: 1,
      ...typeScale.subhead,
      color: colors.text,
    },
    deletionItemLast: {
      borderBottomWidth: 0,
    },
    retentionNote: {
      ...typeScale.caption,
      color: colors.textMuted,
      marginTop: space.space3,
      marginHorizontal: space.space1,
    },
    retentionNoteLink: {
      ...typeScale.caption,
      color: colors.textMuted,
      textDecorationLine: 'underline',
    },
    confirmInstructions: {
      ...typeScale.subhead,
      color: colors.textSecondary,
      marginBottom: space.space3,
    },
    confirmInput: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: radiusMd,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: cardPadding,
      minHeight: buttonHeight,
      ...typeScale.body,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 2,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error,
      borderRadius: radiusMd,
      minHeight: buttonHeight,
      paddingHorizontal: cardPadding,
      gap: space.space2,
      marginBottom: fieldGap,
    },
    deleteButtonDisabled: {
      backgroundColor: 'rgba(255, 71, 87, 0.3)',
    },
    deleteButtonText: {
      ...typeScale.headline,
      color: '#FFFFFF',
    },
    footerNote: {
      ...typeScale.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space.space8,
    },
    loadingText: {
      ...typeScale.title3,
      color: colors.text,
      marginTop: sectionGap,
    },
    loadingSubtext: {
      ...typeScale.subhead,
      color: colors.textSecondary,
      marginTop: space.space2,
    },
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space.space8,
    },
    successIconWrapper: {
      width: touchTargetMin + space.space7,
      height: touchTargetMin + space.space7,
      borderRadius: (touchTargetMin + space.space7) / 2,
      backgroundColor: 'rgba(46, 213, 115, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sectionGap,
    },
    successTitle: {
      ...typeScale.title2,
      color: colors.text,
      marginBottom: space.space3,
    },
    successText: {
      ...typeScale.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: space.space7,
    },
    finishButton: {
      backgroundColor: colors.primary,
      borderRadius: radiusMd,
      minHeight: buttonHeight,
      paddingVertical: fieldGap,
      paddingHorizontal: space.space8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    finishButtonText: {
      ...typeScale.headline,
      color: '#FFFFFF',
    },
  });
}
