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
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolvePostAuthHref } from '@/lib/auth-return-url';
import { resolvePostAuthOnboardingDone } from '@/lib/onboarding-storage';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Appbar, Text, Card, useTheme } from 'react-native-paper';
import { UIButton } from '@/ui';
import { buildKindeRegisterHint, buildKindeSignInHint } from '@/lib/kinde-hosted-hints';
import { getMergedExpoExtra } from '@/lib/expo-public-extra';
import { useAuth, AUTH_SIGN_IN_CANCELLED } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SPACING, TOUCH_TARGET_MIN } from '@/theme/paperTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isApiBaseUrlConfigured } from '@/lib/api-base-url';
import { log } from '@/lib/log';
import { isLikelyAuthConnectivityFailure } from '@/lib/auth-connectivity-errors';
import { useBlockingAuthOffline } from '@/lib/use-network-auth-offline';
import { AuthError } from '@supabase/supabase-js';

function LoginScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const [isLoading, setIsLoading] = useState(false);
  const isWeb = Platform.OS === 'web';
  const hostedAuthConfigured = isSupabaseConfigured && isApiBaseUrlConfigured();
  const canUseHostedAuth = !isWeb && hostedAuthConfigured;
  const blockingOffline = useBlockingAuthOffline();
  const {
    signInWithKindeHosted,
    signUpWithKindeHosted,
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

  const emailConnectionId = useMemo(() => {
    const extra = getMergedExpoExtra() as Record<string, unknown>;
    return String(extra.EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID ?? '').trim();
  }, []);

  const hostedRegisterHint = useMemo(
    () =>
      buildKindeRegisterHint({
        email: emailParam,
        emailConnectionId: emailConnectionId || undefined,
      }),
    [emailParam, emailConnectionId],
  );

  const hostedSignInHint = useMemo(
    () =>
      buildKindeSignInHint({
        email: emailParam,
        emailConnectionId: emailConnectionId || undefined,
      }),
    [emailParam, emailConnectionId],
  );

  const replaceAfterAuth = useCallback(async () => {
    const onboarded = await resolvePostAuthOnboardingDone();
    const href = await resolvePostAuthHref(onboarded);
    router.replace(href);
  }, []);

  const handleHostedAuthResult = useCallback(
    async (result: { error: AuthError | null }) => {
      if (isWeb) return;
      if (result.error) {
        if (result.error.message === AUTH_SIGN_IN_CANCELLED) return;
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        const detail = result.error.message?.trim() ?? '';
        const connectivity = isLikelyAuthConnectivityFailure(detail);
        Alert.alert(
          connectivity ? t('offline.needsInternetTitle') : t('auth.loginFailed'),
          connectivity ? t('offline.needsInternetMessage') : detail || t('auth.unexpectedError'),
        );
        return;
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await replaceAfterAuth();
    },
    [replaceAfterAuth, t, isWeb],
  );

  const handleCreateAccountWithEmail = useCallback(async () => {
    if (isWeb) return;
    if (!isApiBaseUrlConfigured()) {
      Alert.alert(t('auth.loginFailed'), t('auth.backendNotConfigured'));
      return;
    }
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.loginFailed'), t('auth.supabaseNotConfigured'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUpWithKindeHosted(hostedRegisterHint);
      await handleHostedAuthResult(result);
    } catch (error) {
      log.error('[Login] Hosted email sign-up:', error);
      const connectivity = isLikelyAuthConnectivityFailure(error);
      Alert.alert(
        connectivity ? t('offline.needsInternetTitle') : t('common.error'),
        connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleHostedAuthResult, hostedRegisterHint, signUpWithKindeHosted, t, isWeb]);

  const handleSignInWithEmail = useCallback(async () => {
    if (isWeb) return;
    if (!isApiBaseUrlConfigured()) {
      Alert.alert(t('auth.loginFailed'), t('auth.backendNotConfigured'));
      return;
    }
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.loginFailed'), t('auth.supabaseNotConfigured'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithKindeHosted(hostedSignInHint);
      await handleHostedAuthResult(result);
    } catch (error) {
      log.error('[Login] Hosted email sign-in:', error);
      const connectivity = isLikelyAuthConnectivityFailure(error);
      Alert.alert(
        connectivity ? t('offline.needsInternetTitle') : t('common.error'),
        connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleHostedAuthResult, hostedSignInHint, signInWithKindeHosted, t, isWeb]);

  const handleForgotPassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/forgot-password');
  }, []);

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'facebook' | 'apple') => {
      if (isWeb) return;
      if (!isApiBaseUrlConfigured()) {
        Alert.alert(t('auth.loginFailed'), t('auth.backendNotConfigured'));
        return;
      }
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
          const detail = result.error.message?.trim() ?? '';
          const connectivity = isLikelyAuthConnectivityFailure(detail);
          Alert.alert(
            connectivity ? t('offline.needsInternetTitle') : t('auth.loginFailed'),
            connectivity ? t('offline.needsInternetMessage') : detail || t('auth.unexpectedError'),
          );
        } else {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          await replaceAfterAuth();
        }
      } catch (error) {
        log.error('[Login] Social login error:', error);
        const connectivity = isLikelyAuthConnectivityFailure(error);
        Alert.alert(
          connectivity ? t('offline.needsInternetTitle') : t('common.error'),
          connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [replaceAfterAuth, signInWithGoogle, signInWithFacebook, signInWithApple, t, isWeb],
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
              {isWeb ? (
                <Text
                  variant="bodyMedium"
                  style={[styles.webNativeHint, { color: theme.colors.tertiary, marginTop: SPACING.x2 }]}
                  accessibilityRole="text"
                >
                  {t('auth.webProductionNativeHint')}
                </Text>
              ) : null}
            </View>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Content style={styles.cardContent}>
                {Platform.OS !== 'web' ? (
                  <>
                    <View style={styles.socialButtonsRow}>
                      <TouchableOpacity
                        testID="loginGoogleButton"
                        style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={() => handleSocialLogin('google')}
                        disabled={isLoading || !canUseHostedAuth || blockingOffline}
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
                          disabled={isLoading || !canUseHostedAuth || blockingOffline}
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
                          disabled={isLoading || !canUseHostedAuth || blockingOffline}
                          accessibilityRole="button"
                          accessibilityLabel={t('auth.signInWithApple')}
                        >
                          <Text style={[styles.socialButtonText, { color: theme.colors.onSurface }]}>Apple</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                ) : null}

                {!isWeb && !hostedAuthConfigured && (
                  <Text variant="bodySmall" style={[styles.notConfiguredText, { color: theme.colors.error }]}>
                    {!isApiBaseUrlConfigured()
                      ? t('auth.backendNotConfigured')
                      : t('auth.supabaseNotConfigured')}
                  </Text>
                )}
                <View style={[styles.primaryButton, { marginTop: SPACING.x1 }]}>
                  <UIButton
                    variant="borderedProminent"
                    onPress={handleCreateAccountWithEmail}
                    disabled={isLoading || !canUseHostedAuth || blockingOffline}
                    color={theme.colors.primary}
                    testID="loginHostedEmail"
                  >
                    {isLoading ? t('auth.loading') : t('auth.createAccountWithEmail')}
                  </UIButton>
                </View>

                <View style={[styles.secondaryButton, { marginTop: SPACING.x2 }]}>
                  <UIButton
                    variant="bordered"
                    onPress={handleSignInWithEmail}
                    disabled={isLoading || !canUseHostedAuth || blockingOffline}
                    testID="loginHostedEmailSignIn"
                  >
                    {isLoading ? t('auth.loading') : t('auth.signInWithEmail')}
                  </UIButton>
                  <Text
                    variant="bodySmall"
                    style={[styles.emailHint, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {t('auth.continueWithEmailHint')}
                  </Text>
                </View>

                <View style={{ alignSelf: 'center', marginTop: SPACING.x2 }}>
                  <UIButton
                    variant="borderless"
                    onPress={handleForgotPassword}
                    disabled={isLoading || !isApiBaseUrlConfigured() || blockingOffline}
                  >
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
  webNativeHint: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
    alignSelf: 'center',
    paddingHorizontal: SPACING.x2,
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
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
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
  secondaryButton: {
    marginBottom: SPACING.x1,
  },
  emailHint: {
    marginTop: SPACING.x2,
    textAlign: 'center',
    lineHeight: 18,
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
