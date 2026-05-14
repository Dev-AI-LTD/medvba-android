import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Appbar, Text, Card, useTheme } from 'react-native-paper';
import type { LoginMethodParams } from '@kinde/js-utils';
import { UIButton } from '@/ui';
import { useAuth, AUTH_SIGN_IN_CANCELLED } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SPACING } from '@/theme/paperTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { log } from '@/lib/log';
import { AuthError } from '@supabase/supabase-js';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

function LoginScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const [isLoading, setIsLoading] = useState(false);
  const {
    signInWithKindeHosted,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    isFacebookLoginEnabled,
  } = useAuth();
  const { t } = useLanguage();

  const emailParam = useMemo(() => {
    const raw = params.email;
    const fromParam =
      typeof raw === 'string' ? raw : Array.isArray(raw) && raw.length > 0 ? String(raw[0]) : '';
    return fromParam.trim().toLowerCase();
  }, [params.email]);

  const hostedCreateAccountHint = useMemo((): LoginMethodParams => {
    if (emailParam.includes('@')) {
      return { authUrlParams: { prompt: 'create', login_hint: emailParam } } as LoginMethodParams;
    }
    return { authUrlParams: { prompt: 'create' } } as LoginMethodParams;
  }, [emailParam]);

  const replaceAfterAuth = useCallback(async () => {
    const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    const isOnboardingCompleted = completed === 'true';
    router.replace(isOnboardingCompleted ? '/(tabs)' : '/(auth)/onboarding');
  }, []);

  const handleCreateAccountWithEmail = useCallback(async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.loginFailed'), t('auth.supabaseNotConfigured'));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signInWithKindeHosted(hostedCreateAccountHint);
      if (error) {
        if (error.message === AUTH_SIGN_IN_CANCELLED) return;
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert(t('auth.loginFailed'), error.message || t('auth.unexpectedError'));
        return;
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await replaceAfterAuth();
    } catch (error) {
      log.error('[Login] Hosted email sign-in:', error);
      Alert.alert(t('common.error'), t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }, [hostedCreateAccountHint, replaceAfterAuth, signInWithKindeHosted, t]);

  const handleForgotPassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/forgot-password');
  }, []);

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'facebook' | 'apple') => {
      if (!isSupabaseConfigured) {
        Alert.alert(t('auth.loginFailed'), t('auth.supabaseNotConfigured'));
        return;
      }

      setIsLoading(true);

      try {
        let result: { error: AuthError | null };
        switch (provider) {
          case 'google':
            result = await signInWithGoogle();
            break;
          case 'facebook':
            result = await signInWithFacebook();
            break;
          case 'apple':
            result = await signInWithApple();
            break;
        }

        if (result.error) {
          if (result.error.message === AUTH_SIGN_IN_CANCELLED) {
            return;
          }
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          Alert.alert(t('auth.loginFailed'), result.error.message);
        } else {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          await replaceAfterAuth();
        }
      } catch (error) {
        log.error('[Login] Social login error:', error);
        Alert.alert(t('common.error'), t('auth.unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    },
    [replaceAfterAuth, signInWithGoogle, signInWithFacebook, signInWithApple, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Appbar.Header
          style={[styles.appbar, { backgroundColor: theme.colors.background }]}
          statusBarHeight={0}
        >
          <View style={styles.appbarContent} />
        </Appbar.Header>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: SPACING.x3, paddingTop: SPACING.x3, paddingBottom: SPACING.x3 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.header, { marginBottom: SPACING.x5 }]}>
              <View style={{ marginBottom: SPACING.x3 }}>
                <Image
                  source={{
                    uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8m00xerxk064za3jpist0',
                  }}
                  style={styles.logoImage}
                />
              </View>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                {t('auth.welcomeUnifiedTitle')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {t('auth.welcomeUnifiedSubtitle')}
              </Text>
            </View>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Content style={styles.cardContent}>
                {Platform.OS !== 'web' ? (
                  <>
                    <View style={styles.socialButtonsRow}>
                      <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={() => handleSocialLogin('google')}
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel={t('auth.signInWithGoogle')}
                      >
                        <Text style={[styles.socialButtonText, { color: theme.colors.onSurface }]}>G</Text>
                      </TouchableOpacity>
                      {isFacebookLoginEnabled ? (
                        <TouchableOpacity
                          testID="loginFacebookButton"
                          style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                          onPress={() => handleSocialLogin('facebook')}
                          disabled={isLoading}
                          accessibilityRole="button"
                          accessibilityLabel={t('auth.signInWithFacebook')}
                        >
                          <Text style={[styles.socialButtonText, { color: theme.colors.onSurface }]}>f</Text>
                        </TouchableOpacity>
                      ) : null}
                      {Platform.OS === 'ios' ? (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                          onPress={() => handleSocialLogin('apple')}
                          disabled={isLoading}
                          accessibilityRole="button"
                          accessibilityLabel={t('auth.signInWithApple')}
                        >
                          <Text style={[styles.socialButtonText, { color: theme.colors.onSurface }]}>Apple</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                ) : null}

                {!isSupabaseConfigured && (
                  <Text variant="bodySmall" style={[styles.notConfiguredText, { color: theme.colors.error }]}>
                    {t('auth.supabaseNotConfigured')}
                  </Text>
                )}
                <View style={[styles.primaryButton, { marginTop: SPACING.x1 }]}>
                  <UIButton
                    variant="borderedProminent"
                    onPress={handleCreateAccountWithEmail}
                    disabled={isLoading || !isSupabaseConfigured}
                    color={theme.colors.primary}
                    testID="loginHostedEmail"
                  >
                    {isLoading ? t('auth.loading') : t('auth.createAccountWithEmail')}
                  </UIButton>
                </View>

                <View style={{ alignSelf: 'center', marginTop: SPACING.x2 }}>
                  <UIButton variant="borderless" onPress={handleForgotPassword} disabled={isLoading}>
                    {t('auth.forgotPassword')}
                  </UIButton>
                </View>
              </Card.Content>
            </Card>

            <Text
              variant="bodySmall"
              style={[styles.termsText, { color: theme.colors.onSurfaceVariant, marginTop: SPACING.x2 }]}
            >
              {t('auth.agreeToTerms')}{' '}
              <Text style={{ color: theme.colors.primary }} onPress={() => router.push('/legal/terms-of-service')}>
                {t('auth.termsOfService')}
              </Text>{' '}
              {t('auth.and')}{' '}
              <Text style={{ color: theme.colors.primary }} onPress={() => router.push('/legal/privacy-policy')}>
                {t('auth.privacyPolicy')}
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  appbar: {
    elevation: 0,
    shadowOpacity: 0,
  },
  appbarContent: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  title: {
    marginBottom: SPACING.x1,
  },
  card: {
    borderRadius: 16,
    marginBottom: SPACING.x4,
  },
  cardContent: {
    paddingHorizontal: SPACING.x2,
    paddingTop: SPACING.x2,
    paddingBottom: SPACING.x3,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.x3,
    marginBottom: SPACING.x3,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    marginBottom: SPACING.x1,
  },
  notConfiguredText: {
    marginTop: SPACING.x2,
    marginBottom: SPACING.x1,
    textAlign: 'center',
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
