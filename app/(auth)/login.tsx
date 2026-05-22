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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar, Text, Card, TextInput, Button, useTheme } from 'react-native-paper';
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
const MIN_PASSWORD_LENGTH = 8;
const LOGIN_LOGO_SOURCE = require('../../assets/images/icon.png');

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
  if (/at least 8|password must be at least 8/.test(m)) {
    return t('auth.passwordTooShort');
  }
  if (/502|bad gateway|oauth2\/token|kinde returned a server error|5xx at the token url/i.test(m)) {
    return t('auth.kindePasswordGrantUnavailable');
  }
  if (/connection.*not enabled|connection is not enabled/i.test(m)) {
    return t('auth.kindeSocialConnectionNotEnabled');
  }
  return message.trim();
}

function LoginScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const isWeb = Platform.OS === 'web';
  const authConfigured = isSupabaseConfigured && isApiBaseUrlConfigured();
  const canUseNativeAuth = !isWeb && authConfigured;
  const blockingOffline = useBlockingAuthOffline();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signInWithEmailHosted,
    signUpWithEmailHosted,
    isEmailHostedAuthEnabled,
  } = useAuth();
  const { t } = useLanguage();

  const emailParam = useMemo(() => {
    const raw = params.email;
    const fromParam =
      typeof raw === 'string' ? raw : Array.isArray(raw) && raw.length > 0 ? String(raw[0]) : '';
    return fromParam.trim().toLowerCase();
  }, [params.email]);

  const replaceAfterAuth = useCallback(async () => {
    const onboarded = await resolvePostAuthOnboardingDone();
    const href = await resolvePostAuthHref(onboarded);
    router.replace(href);
  }, []);

  const validateEmailPassword = useCallback(() => {
    const e = (emailParam || email).trim().toLowerCase();
    if (!e) {
      setFieldError(t('auth.emailRequired'));
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setFieldError(t('auth.emailInvalid'));
      return null;
    }
    if (!password) {
      setFieldError(t('auth.passwordRequired'));
      return null;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(t('auth.passwordTooShort'));
      return null;
    }
    if (isSignUpMode) {
      const n = name.trim();
      if (!n) {
        setFieldError(t('auth.nameRequired'));
        return null;
      }
      if (n.length < 2) {
        setFieldError(t('auth.nameTooShort'));
        return null;
      }
    }
    setFieldError(undefined);
    return { email: e, password, name: name.trim() };
  }, [email, emailParam, isSignUpMode, name, password, t]);

  const handleEmailAuth = useCallback(async () => {
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

    const validated = validateEmailPassword();
    if (!validated) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUpMode) {
        const { error } = await signUp(validated.email, validated.password, validated.name);
        if (error) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          const detail = mapAuthScreenError(error.message ?? '', t);
          Alert.alert(t('auth.signUpFailed'), detail);
          return;
        }
      } else {
        const { error } = await signIn(validated.email, validated.password);
        if (error) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          const detail = mapAuthScreenError(error.message ?? '', t);
          Alert.alert(t('auth.loginFailed'), detail);
          return;
        }
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await replaceAfterAuth();
    } catch (error) {
      log.error('[Login] Email auth error:', error);
      const connectivity = isLikelyAuthConnectivityFailure(error);
      Alert.alert(
        connectivity ? t('offline.needsInternetTitle') : t('common.error'),
        connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    blockingOffline,
    isSignUpMode,
    replaceAfterAuth,
    signIn,
    signUp,
    t,
    validateEmailPassword,
    isWeb,
  ]);

  const handleForgotPassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/forgot-password');
  }, []);

  const handleEmailHostedAuth = useCallback(async () => {
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
    if (!isEmailHostedAuthEnabled) {
      Alert.alert(t('auth.loginFailed'), t('auth.emailHostedNotConfigured'));
      return;
    }

    const e = (emailParam || email).trim().toLowerCase();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setFieldError(t('auth.emailInvalid'));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = isSignUpMode
        ? await signUpWithEmailHosted(e || undefined)
        : await signInWithEmailHosted(e || undefined);

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
      log.error('[Login] Email hosted auth error:', error);
      const connectivity = isLikelyAuthConnectivityFailure(error);
      Alert.alert(
        connectivity ? t('offline.needsInternetTitle') : t('common.error'),
        connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    blockingOffline,
    email,
    emailParam,
    isEmailHostedAuthEnabled,
    isSignUpMode,
    isWeb,
    replaceAfterAuth,
    signInWithEmailHosted,
    signUpWithEmailHosted,
    t,
  ]);

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'apple') => {
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
        const result =
          provider === 'google' ? await signInWithGoogle() : await signInWithApple();

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
    [replaceAfterAuth, signInWithGoogle, signInWithApple, t, isWeb],
  );

  const toggleSignUpMode = useCallback(() => {
    setIsSignUpMode((v) => !v);
    setFieldError(undefined);
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
                  </View>
                ) : null}

                {Platform.OS !== 'web' && canUseNativeAuth && isEmailHostedAuthEnabled ? (
                  <>
                    <Text
                      variant="labelMedium"
                      style={[styles.orEmailLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {t('auth.orContinueWithEmail')}
                    </Text>
                    <TextInput
                      testID="loginEmailHintInput"
                      label={t('auth.email')}
                      value={emailParam ? emailParam : email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (fieldError) setFieldError(undefined);
                      }}
                      placeholder={t('auth.emailPlaceholder')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!emailParam}
                      disabled={isLoading || !!emailParam}
                      error={!!fieldError}
                      mode="outlined"
                      style={styles.input}
                      left={<TextInput.Icon icon="email-outline" />}
                    />
                    {fieldError ? (
                      <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                        {fieldError}
                      </Text>
                    ) : null}
                    <UIButton
                      testID="loginEmailHostedButton"
                      variant="outlined"
                      icon="email-outline"
                      onPress={handleEmailHostedAuth}
                      disabled={isLoading || blockingOffline}
                      style={{ marginTop: SPACING.x2 }}
                    >
                      {isSignUpMode ? t('auth.createAccountWithEmail') : t('auth.signInWithEmail')}
                    </UIButton>
                    <View style={styles.modeToggleRow}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {isSignUpMode ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                      </Text>
                      <Button
                        mode="text"
                        compact
                        onPress={toggleSignUpMode}
                        disabled={isLoading}
                        testID="loginToggleSignUpHosted"
                      >
                        {isSignUpMode ? t('auth.signIn') : t('auth.signUp')}
                      </Button>
                    </View>
                  </>
                ) : null}

                {Platform.OS !== 'web' && canUseNativeAuth && !isEmailHostedAuthEnabled ? (
                  <Text
                    variant="labelMedium"
                    style={[styles.orEmailLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {t('auth.orContinueWithEmail')}
                  </Text>
                ) : null}

                {!isWeb && !authConfigured && (
                  <Text variant="bodySmall" style={[styles.notConfiguredText, { color: theme.colors.error }]}>
                    {!isApiBaseUrlConfigured()
                      ? t('auth.backendNotConfigured')
                      : t('auth.supabaseNotConfigured')}
                  </Text>
                )}

                {Platform.OS !== 'web' && canUseNativeAuth && !isEmailHostedAuthEnabled ? (
                  <>
                    {isSignUpMode ? (
                      <TextInput
                        testID="loginNameInput"
                        label={t('auth.fullName')}
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          if (fieldError) setFieldError(undefined);
                        }}
                        placeholder={t('auth.namePlaceholder')}
                        autoCapitalize="words"
                        autoComplete="name"
                        disabled={isLoading}
                        error={!!fieldError}
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="account-outline" />}
                      />
                    ) : null}

                    <TextInput
                      testID="loginEmailInput"
                      label={t('auth.email')}
                      value={emailParam ? emailParam : email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (fieldError) setFieldError(undefined);
                      }}
                      placeholder={t('auth.emailPlaceholder')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!emailParam}
                      disabled={isLoading || !!emailParam}
                      error={!!fieldError}
                      mode="outlined"
                      style={styles.input}
                      left={<TextInput.Icon icon="email-outline" />}
                    />

                    <TextInput
                      testID="loginPasswordInput"
                      label={t('auth.password')}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (fieldError) setFieldError(undefined);
                      }}
                      placeholder={
                        isSignUpMode ? t('auth.createPasswordPlaceholder') : t('auth.passwordPlaceholder')
                      }
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete={isSignUpMode ? 'password-new' : 'password'}
                      disabled={isLoading}
                      error={!!fieldError}
                      mode="outlined"
                      style={[styles.input, { marginBottom: fieldError ? 0 : SPACING.x2 }]}
                      left={<TextInput.Icon icon="lock-outline" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          onPress={() => setShowPassword((v) => !v)}
                          accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        />
                      }
                    />
                    {fieldError ? (
                      <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                        {fieldError}
                      </Text>
                    ) : null}

                    <Button
                      testID="loginEmailSubmit"
                      mode="contained"
                      onPress={handleEmailAuth}
                      loading={isLoading}
                      disabled={isLoading || !canUseNativeAuth || blockingOffline}
                      style={{ marginTop: SPACING.x3 }}
                    >
                      {isLoading
                        ? t('auth.loading')
                        : isSignUpMode
                          ? t('auth.signUp')
                          : t('auth.signIn')}
                    </Button>

                    <View style={styles.modeToggleRow}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {isSignUpMode ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                      </Text>
                      <Button
                        mode="text"
                        compact
                        onPress={toggleSignUpMode}
                        disabled={isLoading}
                        testID="loginToggleSignUp"
                      >
                        {isSignUpMode ? t('auth.signIn') : t('auth.signUp')}
                      </Button>
                    </View>
                  </>
                ) : null}

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
    marginBottom: SPACING.x3,
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
  orEmailLabel: {
    textAlign: 'center',
    marginBottom: SPACING.x2,
  },
  input: {
    marginBottom: SPACING.x2,
  },
  errorText: {
    marginBottom: SPACING.x2,
  },
  modeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.x2,
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
