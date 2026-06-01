import React, { useState, useCallback } from 'react';
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar, Text, Card, useTheme } from 'react-native-paper';
import { UIButton } from '@/ui';
import { useAuth, AUTH_SIGN_IN_CANCELLED } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  SPACING,
  radiusLg,
  sectionGap,
  touchTargetMin,
} from '@/theme/iosDesign';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isApiBaseUrlConfigured } from '@/lib/api-base-url';
import { log } from '@/lib/log';
import { isLikelyAuthConnectivityFailure } from '@/lib/auth-connectivity-errors';
import { useBlockingAuthOffline } from '@/lib/use-network-auth-offline';

const LOGIN_LOGO_SOURCE = require('../../assets/images/icon-auth.png');

function mapAuthScreenError(message: string, t: (key: string) => string): string {
  const m = message.trim().toLowerCase();
  if (!m) return t('auth.unexpectedError');
  if (/already exists|already registered|409/.test(m)) {
    return t('auth.emailAlreadyRegistered');
  }
  if (/verif|confirm.*email|email.*not.*confirm|unverified/.test(m)) {
    return t('auth.emailNotConfirmed');
  }
  if (/invalid.*(email|password|credential)|invalid_grant|401|wrong password/.test(m)) {
    return t('auth.invalidCredentials');
  }
  if (
    /session exchange|exchange failed|could not complete sign-in|profile_id|oauth2\/token|502|bad gateway|503|504|5xx|temporarily unavailable|identity provider/i.test(
      m,
    )
  ) {
    return t('auth.sessionExchangeFailed');
  }
  if (/connection.*not enabled|connection is not enabled/i.test(m)) {
    return t('auth.kindeSocialConnectionNotEnabled');
  }
  return message.trim();
}

function LoginScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const isWeb = Platform.OS === 'web';
  const authConfigured = isSupabaseConfigured && isApiBaseUrlConfigured();
  const canUseNativeAuth = !isWeb && authConfigured;
  const blockingOffline = useBlockingAuthOffline();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmailHosted,
    signUpWithEmailHosted,
    isEmailHostedAuthEnabled,
  } = useAuth();
  const { t } = useLanguage();

  const replaceAfterAuth = useCallback(async () => {
    const onboarded = await resolvePostAuthOnboardingDone();
    const href = await resolvePostAuthHref(onboarded);
    router.replace(href);
  }, []);

  const runKindeAuth = useCallback(
    async (action: () => Promise<{ error: { message?: string } | null }>) => {
      if (isWeb) return;
      if (blockingOffline) {
        Alert.alert(t('offline.needsInternetTitle'), t('offline.needsInternetMessage'));
        return;
      }
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
        const result = await action();
        if (result.error) {
          if (result.error.message === AUTH_SIGN_IN_CANCELLED) {
            return;
          }
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          const detail = mapAuthScreenError(result.error.message?.trim() ?? '', t);
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
        log.error('[Login] Kinde auth error:', error);
        const connectivity = isLikelyAuthConnectivityFailure(error);
        Alert.alert(
          connectivity ? t('offline.needsInternetTitle') : t('common.error'),
          connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [blockingOffline, isWeb, replaceAfterAuth, t],
  );

  const handleSocialLogin = useCallback(
    (provider: 'google' | 'apple') => {
      void runKindeAuth(() =>
        provider === 'google' ? signInWithGoogle() : signInWithApple(),
      );
    },
    [runKindeAuth, signInWithGoogle, signInWithApple],
  );

  const handleEmailSignIn = useCallback(() => {
    if (!isEmailHostedAuthEnabled) {
      Alert.alert(t('auth.loginFailed'), t('auth.emailHostedNotConfigured'));
      return;
    }
    void runKindeAuth(() => signInWithEmailHosted());
  }, [isEmailHostedAuthEnabled, runKindeAuth, signInWithEmailHosted, t]);

  const handleEmailSignUp = useCallback(() => {
    if (!isEmailHostedAuthEnabled) {
      Alert.alert(t('auth.loginFailed'), t('auth.emailHostedNotConfigured'));
      return;
    }
    void runKindeAuth(() => signUpWithEmailHosted());
  }, [isEmailHostedAuthEnabled, runKindeAuth, signUpWithEmailHosted, t]);

  const handleForgotPassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/forgot-password');
  }, []);

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
              { paddingHorizontal: sectionGap, paddingTop: sectionGap, paddingBottom: sectionGap },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.header, { marginBottom: SPACING.x5 }]}>
              <View style={{ marginBottom: SPACING.x3 }}>
                <Image source={LOGIN_LOGO_SOURCE} style={styles.logoImage} />
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
                  <View style={styles.socialButtonsRow}>
                    <TouchableOpacity
                      testID="loginGoogleButton"
                      style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                      onPress={() => handleSocialLogin('google')}
                      disabled={isLoading || !canUseNativeAuth || blockingOffline}
                      accessibilityRole="button"
                      accessibilityLabel={t('auth.signInWithGoogle')}
                    >
                      <Text style={[styles.socialButtonText, { color: theme.colors.onSurface }]}>G</Text>
                    </TouchableOpacity>
                    {Platform.OS === 'ios' ? (
                      <TouchableOpacity
                        testID="loginAppleButton"
                        style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={() => handleSocialLogin('apple')}
                        disabled={isLoading || !canUseNativeAuth || blockingOffline}
                        accessibilityRole="button"
                        accessibilityLabel={t('auth.signInWithApple')}
                      >
                        <MaterialCommunityIcons
                          name="apple"
                          size={26}
                          color={theme.colors.onSurface}
                        />
                      </TouchableOpacity>
                    ) : null}
                    {isEmailHostedAuthEnabled ? (
                      <TouchableOpacity
                        testID="loginEmailHostedButton"
                        style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={handleEmailSignIn}
                        disabled={isLoading || !canUseNativeAuth || blockingOffline}
                        accessibilityRole="button"
                        accessibilityLabel={t('auth.signInWithEmail')}
                      >
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={24}
                          color={theme.colors.onSurface}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                {!isWeb && !authConfigured && (
                  <Text variant="bodySmall" style={[styles.notConfiguredText, { color: theme.colors.error }]}>
                    {!isApiBaseUrlConfigured()
                      ? t('auth.backendNotConfigured')
                      : t('auth.supabaseNotConfigured')}
                  </Text>
                )}

                {Platform.OS !== 'web' && isEmailHostedAuthEnabled ? (
                  <View style={styles.modeToggleRow}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('auth.dontHaveAccount')}
                    </Text>
                    <UIButton
                      variant="borderless"
                      onPress={handleEmailSignUp}
                      disabled={isLoading || !canUseNativeAuth || blockingOffline}
                      testID="loginCreateAccountHosted"
                    >
                      {t('auth.signUp')}
                    </UIButton>
                  </View>
                ) : null}

                <View style={{ alignSelf: 'center', marginTop: SPACING.x3 }}>
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
    borderRadius: radiusLg,
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
    marginBottom: SPACING.x2,
  },
  socialButton: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: touchTargetMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.x3,
    gap: SPACING.x1,
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
