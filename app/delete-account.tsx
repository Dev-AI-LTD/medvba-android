import React, { useState, useCallback } from 'react';
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
import { useRouter, Link } from 'expo-router';
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
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { trpc } from '@/lib/trpc';
import {
  useLanguage,
  APP_LANGUAGE_STORAGE_KEY,
  LEGACY_APP_LANGUAGE_STORAGE_KEY,
} from '@/providers/LanguageProvider';

const STORAGE_KEYS_TO_CLEAR = [
  'quiz_daily_progress',
  'quiz_session_state',
  'quiz_all_time_stats',
  'quiz_streak_data',
  'quiz_weekly_history',
  '@medvba_blocked_users',
  '@medvba_user_reports',
  APP_LANGUAGE_STORAGE_KEY,
  LEGACY_APP_LANGUAGE_STORAGE_KEY,
];

type DeletionStep = 'confirm' | 'deleting' | 'success';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<DeletionStep>('confirm');
  const deleteAccountMutation = trpc.account.deleteSelf.useMutation();

  const clearLocalData = async () => {
    console.log('[DeleteAccount] Clearing local data...');
    try {
      await AsyncStorage.multiRemove(STORAGE_KEYS_TO_CLEAR);
      console.log('[DeleteAccount] Local data cleared successfully');
    } catch (error) {
      console.error('[DeleteAccount] Error clearing local data:', error);
    }
  };

  const handleDeleteAccount = useCallback(async () => {
    console.log('[DeleteAccount] handleDeleteAccount called');
    console.log('[DeleteAccount] User:', user?.id ? 'Logged in' : 'Not logged in');
    console.log('[DeleteAccount] Confirm text:', confirmText);

    if (confirmText.toUpperCase() !== 'DELETE') {
      console.log('[DeleteAccount] Confirmation text does not match DELETE');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('deleteAccount.alertConfirmTitle'), t('deleteAccount.alertConfirmMessage'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStep('deleting');

    console.log('[DeleteAccount] Initiating account deletion...');
    if (!user?.id) {
      console.error('[DeleteAccount] No user ID found');
      Alert.alert(t('deleteAccount.alertErrorTitle'), t('deleteAccount.alertMustBeLoggedIn'), [
        { text: t('common.ok') },
      ]);
      setStep('confirm');
      return;
    }

    try {
      console.log('[DeleteAccount] Calling deleteAccountMutation...');
      console.log('[DeleteAccount] Backend URL:', process.env.EXPO_PUBLIC_API_BASE_URL);

      const result = await deleteAccountMutation.mutateAsync();
      console.log('[DeleteAccount] Backend deletion result:', result);

      await clearLocalData();
      console.log('[DeleteAccount] Local data cleared');

      await signOut();
      console.log('[DeleteAccount] Session cleared via AuthProvider');

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
          console.log('[DeleteAccount] Cleared additional keys:', keysToRemove);
        }
      } catch (e) {
        console.error('[DeleteAccount] Error clearing additional keys:', e);
      }

      setStep('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[DeleteAccount] Account deletion process completed');
    } catch (error: unknown) {
      console.error('[DeleteAccount] Deletion failed:', error);
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
  }, [confirmText, user?.id, deleteAccountMutation, signOut, t]);

  const handleFinish = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/login');
  }, [router]);

  const isDeleteEnabled = confirmText.toUpperCase() === 'DELETE';

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, '#0D1F35', Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.successContainer}>
            <View style={styles.successIconWrapper}>
              <CheckCircle color={Colors.success} size={64} />
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
          colors={[Colors.background, '#0D1F35', Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.error} />
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
        colors={[Colors.background, '#0D1F35', Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
            <X color={Colors.text} size={24} />
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
              <AlertTriangle color={Colors.error} size={32} />
            </View>
            <Text style={styles.warningTitle}>{t('deleteAccount.warningTitle')}</Text>
            <Text style={styles.warningText}>{t('deleteAccount.warningBody')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('deleteAccount.sectionWhatDeleted')}</Text>
            <View style={styles.deletionList}>
              <View style={styles.deletionItem}>
                <View style={styles.deletionIconWrapper}>
                  <User color={Colors.textSecondary} size={20} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemProfile')}</Text>
              </View>
              <View style={styles.deletionItem}>
                <View style={styles.deletionIconWrapper}>
                  <BarChart3 color={Colors.textSecondary} size={20} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemQuizStats')}</Text>
              </View>
              <View style={styles.deletionItem}>
                <View style={styles.deletionIconWrapper}>
                  <Users color={Colors.textSecondary} size={20} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemStudyRooms')}</Text>
              </View>
              <View style={[styles.deletionItem, styles.deletionItemLast]}>
                <View style={styles.deletionIconWrapper}>
                  <Flag color={Colors.textSecondary} size={20} />
                </View>
                <Text style={styles.deletionItemText}>{t('deleteAccount.itemReports')}</Text>
              </View>
            </View>
            <Text style={styles.retentionNote}>
              {t('deleteAccount.retentionNoteBeforeLink')}
              <Link href="/legal/privacy-policy" asChild>
                <Text style={styles.retentionNoteLink}>{t('auth.privacyPolicy')}</Text>
              </Link>
              {t('deleteAccount.retentionNoteAfterLink')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('deleteAccount.confirmSectionTitle')}</Text>
            <Text style={styles.confirmInstructions}>{t('deleteAccount.confirmInstructions')}</Text>
            <TextInput
              style={styles.confirmInput}
              placeholder={t('deleteAccount.confirmPlaceholder')}
              placeholderTextColor={Colors.textMuted}
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
            <Trash2 color="#FFFFFF" size={20} />
            <Text style={styles.deleteButtonText}>{t('deleteAccount.deleteButton')}</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>{t('deleteAccount.footerNote')}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.glassBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  warningCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  warningIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  deletionList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  deletionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  deletionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deletionItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  deletionItemLast: {
    borderBottomWidth: 0,
  },
  retentionNote: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 12,
    marginHorizontal: 4,
  },
  retentionNoteLink: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline' as const,
  },
  confirmInstructions: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  confirmInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
    letterSpacing: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    borderRadius: 14,
    padding: 18,
    gap: 10,
    marginBottom: 16,
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(255, 71, 87, 0.3)',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 24,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  finishButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
