import { useState, useCallback } from 'react';
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Appbar, Text, Card, useTheme } from 'react-native-paper';
import { UIButton, UITextField } from '@/ui';
import { useAuth, AUTH_SIGN_IN_CANCELLED } from '@/providers/AuthProvider';
import { AuthError } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/providers/LanguageProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isCognitoConfigured } from '@/lib/cognito';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPACING } from '@/theme/paperTheme';
import { log } from '@/lib/log';
import { validateSignUpForm, clearError, hasErrors, type FormErrors } from '@/lib/validation';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const _get = (key: string) =>
  (process.env as Record<string, string | undefined>)[key] || (extra as Record<string, string | undefined>)[key] || '';

const isAuthConfigured = isSupabaseConfigured || isCognitoConfigured();
const isGoogleConfigured = Boolean(_get('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID') || _get('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'));
const isFacebookConfigured = Boolean(_get('EXPO_PUBLIC_FACEBOOK_APP_ID'));
const isAppleConfigured = Platform.OS === 'ios';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

export default function SignUpScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { signUp, signInWithGoogle, signInWithFacebook, signInWithApple } = useAuth();
  const { t } = useLanguage();

  const validateForm = useCallback((): boolean => {
    const validationErrors = validateSignUpForm({ name, email, password, confirmPassword });
    const translatedErrors: FormErrors = {};
    
    Object.entries(validationErrors).forEach(([key, errorKey]) => {
      if (errorKey) {
        translatedErrors[key] = t(errorKey);
      }
    });

    setErrors(translatedErrors);
    return !hasErrors(translatedErrors);
  }, [name, email, password, confirmPassword, t]);

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    if (!isAuthConfigured) {
      Alert.alert(t('auth.signUpFailed'), t('auth.supabaseNotConfigured'));
      return;
    }

    setIsLoading(true);

    try {
      const { error, session } = await signUp(email.trim().toLowerCase(), password, name.trim());

      if (error) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        let errorMessage = t('auth.signUpFailed');
        const msg = error.message || '';
        const errCode = (error as { code?: string }).code;
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          errCode === 'user_already_exists'
        ) {
          errorMessage = t('auth.emailAlreadyRegistered');
        } else if (msg.includes('Password')) {
          errorMessage = msg;
        } else if (msg) {
          errorMessage = `${t('auth.signUpFailed')}\n\n${msg}`;
        }

        Alert.alert(t('auth.signUpFailed'), errorMessage);
      } else if (session) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        const isOnboardingCompleted = completed === 'true';
        router.replace(isOnboardingCompleted ? '/(tabs)' : '/(auth)/onboarding');
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          t('auth.accountCreated'),
          t('auth.verifyEmailMessage'),
          [{ text: t('auth.ok'), onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      log.error('[SignUp] Unexpected error:', error);
      Alert.alert('Error', t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, signUp, validateForm, t]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, []);

  const handleSignIn = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(auth)/login');
  }, []);

  const handleSocialSignUp = useCallback(
    async (provider: 'google' | 'facebook' | 'apple') => {
      if (!isAuthConfigured) {
        Alert.alert(t('auth.signUpFailed'), t('auth.supabaseNotConfigured'));
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
          if (result.error.message === AUTH_SIGN_IN_CANCELLED) return; // finally resets loading
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          Alert.alert(t('auth.signUpFailed'), result.error.message);
        } else {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
          const isOnboardingCompleted = completed === 'true';
          router.replace(isOnboardingCompleted ? '/(tabs)' : '/(auth)/onboarding');
        }
      } catch (error) {
        log.error('[SignUp] Social sign-up error:', error);
        Alert.alert('Error', t('auth.unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    },
    [signInWithGoogle, signInWithFacebook, signInWithApple, t]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Appbar.Header
          style={[styles.appbar, { backgroundColor: theme.colors.background }]}
          statusBarHeight={0}
        >
          <Appbar.BackAction onPress={handleBack} />
          <Appbar.Content title="" />
        </Appbar.Header>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: SPACING.x3,
                paddingTop: SPACING.x2,
                paddingBottom: SPACING.x4,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.header, { marginBottom: SPACING.x4 }]}>
              <View style={{ marginBottom: SPACING.x3 }}>
                <Image
                  source={{
                    uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8m00xerxk064za3jpist0',
                  }}
                  style={styles.logoImage}
                />
              </View>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                {t('auth.createAccount')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {t('auth.joinStudents')}
              </Text>
            </View>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Content style={styles.cardContent}>
                {Platform.OS !== 'web' && (isGoogleConfigured || isFacebookConfigured || isAppleConfigured) ? (
                  <>
                    <View style={styles.socialButtonsRow}>
                      {isGoogleConfigured ? (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                          onPress={() => handleSocialSignUp('google')}
                          disabled={isLoading}
                          accessibilityRole="button"
                          accessibilityLabel={t('auth.signInWithGoogle')}
                        >
                          <Ionicons name="logo-google" size={24} color={theme.colors.onSurface} />
                        </TouchableOpacity>
                      ) : null}
                      {isFacebookConfigured ? (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                          onPress={() => handleSocialSignUp('facebook')}
                          disabled={isLoading}
                          accessibilityRole="button"
                          accessibilityLabel={t('auth.signInWithFacebook')}
                        >
                          <Ionicons name="logo-facebook" size={24} color={theme.colors.onSurface} />
                        </TouchableOpacity>
                      ) : null}
                      {isAppleConfigured ? (
                        <TouchableOpacity
                          style={[styles.socialButton, { backgroundColor: theme.colors.surfaceVariant }]}
                          onPress={() => handleSocialSignUp('apple')}
                          disabled={isLoading}
                          accessibilityRole="button"
                          accessibilityLabel={t('auth.signInWithApple')}
                        >
                          <Ionicons name="logo-apple" size={24} color={theme.colors.onSurface} />
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
                    {t('auth.fullName')}
                  </Text>
                  <UITextField
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                    }}
                    placeholder={t('auth.namePlaceholder')}
                    style={styles.input}
                  />
                </View>
                {errors.name ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>{errors.name}</Text>
                ) : null}

                <View style={[styles.inputWrap, { marginTop: SPACING.x2, marginBottom: SPACING.x2 }]}>
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
                  />
                </View>
                {errors.email ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>{errors.email}</Text>
                ) : null}

                <View style={[styles.inputWrap, { marginBottom: SPACING.x2 }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.x1 }}>
                    {t('auth.password')}
                  </Text>
                  <UITextField
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    placeholder={t('auth.createPasswordPlaceholder')}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                  />
                </View>
                {errors.password ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>{errors.password}</Text>
                ) : null}

                <View style={[styles.inputWrap, { marginBottom: SPACING.x2 }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.x1 }}>
                    {t('auth.confirmPassword')}
                  </Text>
                  <UITextField
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
                    }}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                  />
                </View>
                {errors.confirmPassword ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.confirmPassword}
                  </Text>
                ) : null}

                {!isAuthConfigured && (
                  <Text variant="bodySmall" style={[styles.notConfiguredText, { color: theme.colors.error }]}>
                    {t('auth.supabaseNotConfigured')}
                  </Text>
                )}
                <View style={[styles.primaryButton, { marginTop: SPACING.x2 }]}>
                  <UIButton
                    variant="borderedProminent"
                    onPress={handleSignUp}
                    disabled={isLoading || !isAuthConfigured}
                    color={theme.colors.primary}
                  >
                    {isLoading ? (t('auth.loading') ?? '...') : t('auth.createAccount')}
                  </UIButton>
                </View>
              </Card.Content>
            </Card>

            <View style={[styles.footer, { marginTop: SPACING.x3, gap: SPACING.x1 }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('auth.alreadyHaveAccount')}
              </Text>
              <UIButton variant="borderless" onPress={handleSignIn} disabled={isLoading}>
                {t('auth.signIn')}
              </UIButton>
            </View>

            <Text
              variant="bodySmall"
              style={[
                styles.termsText,
                { color: theme.colors.onSurfaceVariant, marginTop: SPACING.x3 },
              ]}
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
  header: {
    alignItems: 'center',
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },
  title: {
    marginBottom: SPACING.x1,
  },
  card: {
    borderRadius: 16,
    marginBottom: SPACING.x3,
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
    backgroundColor: 'transparent',
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
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  notConfiguredText: {
    marginBottom: SPACING.x2,
    textAlign: 'center',
  },
});
