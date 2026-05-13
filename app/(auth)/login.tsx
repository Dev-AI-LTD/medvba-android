import React, { useState, useCallback, useEffect } from 'react';
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
import { Appbar, Text, Card, useTheme, IconButton } from 'react-native-paper';
import { UIButton, UITextField } from '@/ui';
import { useAuth, AUTH_SIGN_IN_CANCELLED } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SPACING } from '@/theme/paperTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { log } from '@/lib/log';
import { AuthError } from '@supabase/supabase-js';
import { validateLoginForm, clearError, hasErrors, type FormErrors } from '@/lib/validation';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

function LoginScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const {
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    isFacebookLoginEnabled,
  } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const raw = params.email;
    const fromParam =
      typeof raw === 'string' ? raw : Array.isArray(raw) && raw.length > 0 ? String(raw[0]) : '';
    const trimmed = fromParam.trim().toLowerCase();
    if (trimmed.includes('@')) {
      setEmail(trimmed);
    }
  }, [params.email]);

  const validateForm = useCallback((): boolean => {
    const validationErrors = validateLoginForm({ email, password });
    const translatedErrors: FormErrors = {};
    
    Object.entries(validationErrors).forEach(([key, errorKey]) => {
      if (errorKey) {
        translatedErrors[key] = t(errorKey);
      }
    });

    setErrors(translatedErrors);
    return !hasErrors(translatedErrors);
  }, [email, password, t]);

  const handleLogin = useCallback(async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.loginFailed'), t('auth.supabaseNotConfigured'));
      return;
    }
    if (!validateForm()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);

      if (error) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        let errorMessage = t('auth.loginFailed');
        const code = (error as { code?: string }).code;
        if (code === 'email_not_confirmed') {
          errorMessage = t('auth.emailNotConfirmed');
        } else if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('Invalid email or password') ||
          code === 'invalid_credentials'
        ) {
          errorMessage = t('auth.invalidCredentials');
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert(t('auth.loginFailed'), errorMessage);
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        const isOnboardingCompleted = completed === 'true';
        router.replace(isOnboardingCompleted ? '/(tabs)' : '/(auth)/onboarding');
      }
    } catch (error) {
      log.error('[Login] Unexpected error:', error);
      Alert.alert(t('common.error'), t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, validateForm, t]);

  const handleForgotPassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/forgot-password');
  }, []);

  const handleSignUp = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/signup');
  }, []);

  const handleSocialLogin = useCallback(async (provider: 'google' | 'facebook' | 'apple') => {
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
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        const isOnboardingCompleted = completed === 'true';
        router.replace(isOnboardingCompleted ? '/(tabs)' : '/(auth)/onboarding');
      }
    } catch (error) {
      log.error('[Login] Social login error:', error);
      Alert.alert(t('common.error'), t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }, [signInWithGoogle, signInWithFacebook, signInWithApple, t]);

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
                {t('auth.welcomeBack')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {t('auth.signInSubtitle')}
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

                    <View style={styles.dividerRow}>
                      <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
                      <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
                        {t('auth.orContinueWithEmail')}
                      </Text>
                      <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
                    </View>
                  </>
                ) : null}

                <View style={[styles.inputWrap, { marginBottom: SPACING.x2 }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.x1 }}>
                    {t('auth.email')}
                  </Text>
                  <UITextField
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                    keyboardType="email-address"
                    style={styles.input}
                    testID="loginEmail"
                  />
                </View>
                {errors.email ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.email}
                  </Text>
                ) : null}

                <View style={[styles.inputWrap, { marginTop: SPACING.x2, marginBottom: SPACING.x2 }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.x1 }}>
                    {t('auth.password')}
                  </Text>
                  <UITextField
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    testID="loginPassword"
                    right={
                      <IconButton
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                        accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      />
                    }
                  />
                </View>
                {errors.password ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.password}
                  </Text>
                ) : null}

                <View style={{ alignSelf: 'flex-end', marginBottom: SPACING.x2 }}>
                  <UIButton variant="borderless" onPress={handleForgotPassword} disabled={isLoading}>
                    {t('auth.forgotPassword')}
                  </UIButton>
                </View>

                {!isSupabaseConfigured && (
                  <Text variant="bodySmall" style={[styles.notConfiguredText, { color: theme.colors.error }]}>
                    {t('auth.supabaseNotConfigured')}
                  </Text>
                )}
                <View style={[styles.primaryButton, { marginTop: SPACING.x1 }]}>
                  <UIButton
                    variant="borderedProminent"
                    onPress={handleLogin}
                    disabled={isLoading || !isSupabaseConfigured}
                    color={theme.colors.primary}
                    testID="loginSubmit"
                  >
                    {isLoading ? t('auth.loading') : t('auth.signIn')}
                  </UIButton>
                </View>
              </Card.Content>
            </Card>

            <View style={[styles.footer, { marginTop: SPACING.x4, gap: SPACING.x1 }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('auth.dontHaveAccount')}
              </Text>
              <UIButton variant="borderless" onPress={handleSignUp} disabled={isLoading}>
                {t('auth.signUp')}
              </UIButton>
            </View>
            {__DEV__ && (
              <Text variant="labelSmall" style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}>
                [DEBUG] Supabase: {isSupabaseConfigured ? 'configured' : 'not configured'}
              </Text>
            )}
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.x3,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: SPACING.x2,
  },
  inputWrap: {},
  input: {
    minHeight: 48,
  },
  errorText: {
    marginTop: SPACING.x1,
    marginLeft: SPACING.x1,
  },
  primaryButton: {
    marginBottom: SPACING.x1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notConfiguredText: {
    marginTop: SPACING.x2,
    marginBottom: SPACING.x1,
    textAlign: 'center',
  },
  debugText: {
    marginTop: SPACING.x4,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default LoginScreen;
