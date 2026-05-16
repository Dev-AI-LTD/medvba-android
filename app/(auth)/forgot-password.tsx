import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Appbar,
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SPACING } from '@/theme/paperTheme';
import { isApiBaseUrlConfigured } from '@/lib/api-base-url';
import { log } from '@/lib/log';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { resetPassword } = useAuth();

  const validateEmail = useCallback(() => {
    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.emailInvalid'));
      return false;
    }
    setError(undefined);
    return true;
  }, [email, t]);

  const handleResetPassword = useCallback(async () => {
    if (!isApiBaseUrlConfigured()) {
      Alert.alert(t('auth.error'), t('auth.backendNotConfigured'));
      return;
    }
    if (!validateEmail()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await resetPassword(email.trim().toLowerCase());

      if (resetError) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        const detail = resetError.message?.trim();
        Alert.alert(
          t('auth.error'),
          detail ? `${t('auth.resetFailed')}\n\n${detail}` : t('auth.resetFailed')
        );
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setIsSuccess(true);
      }
    } catch (err) {
      log.error('[ForgotPassword] Unexpected error:', err);
      Alert.alert(t('auth.error'), t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }, [email, resetPassword, validateEmail, t]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, []);

  const handleBackToLogin = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(auth)/login');
  }, []);

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Appbar.Header
            style={[styles.appbar, { backgroundColor: theme.colors.background }]}
            statusBarHeight={0}
          >
            <Appbar.Content title="" />
          </Appbar.Header>
          <View style={styles.successContainer}>
            <Card style={[styles.successCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Card.Content style={styles.successCardContent}>
                <Text variant="headlineMedium" style={[styles.successTitle, { color: theme.colors.onPrimaryContainer }]}>
                  {t('auth.passwordResetOpenedTitle')}
                </Text>
                <Text variant="bodyLarge" style={[styles.successText, { color: theme.colors.onSurfaceVariant }]}>
                  {t('auth.passwordResetOpenedBody')}
                </Text>
                <Text variant="bodyMedium" style={[styles.successText, { color: theme.colors.onSurfaceVariant }]}>
                  <Text style={{ fontWeight: '600' }}>{email}</Text>
                </Text>
                <Text variant="bodySmall" style={[styles.successHint, { color: theme.colors.outline }]}>
                  {t('auth.passwordResetOpenedHint')}
                </Text>
                <Button
                  mode="contained"
                  onPress={handleBackToLogin}
                  style={{ marginTop: SPACING.x4 }}
                >
                  {t('auth.backToLogin')}
                </Button>
              </Card.Content>
            </Card>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
            <View style={[styles.header, { marginBottom: SPACING.x5 }]}>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                {t('auth.forgotPassword')}
              </Text>
              <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('auth.forgotPasswordSubtitle')}
              </Text>
            </View>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <TextInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(undefined);
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                  error={!!error}
                  mode="outlined"
                  style={[styles.input, { marginBottom: error ? 0 : SPACING.x2 }]}
                  left={<TextInput.Icon icon="email-outline" />}
                />
                {error ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleResetPassword}
                  loading={isLoading}
                  disabled={isLoading || !isApiBaseUrlConfigured()}
                  style={{ marginTop: SPACING.x3 }}
                >
                  {t('auth.sendPasswordResetEmail')}
                </Button>
              </Card.Content>
            </Card>

            <View style={[styles.footer, { marginTop: SPACING.x4, gap: SPACING.x1 }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('auth.rememberPassword')}
              </Text>
              <Button mode="text" onPress={handleBackToLogin} disabled={isLoading} compact>
                {t('auth.signIn')}
              </Button>
            </View>
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
  title: {
    marginBottom: SPACING.x2,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
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
  input: {
    backgroundColor: 'transparent',
  },
  errorText: {
    marginTop: SPACING.x1,
    marginLeft: SPACING.x1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.x3,
  },
  successCard: {
    borderRadius: 16,
  },
  successCardContent: {
    padding: SPACING.x4,
    alignItems: 'center',
  },
  successTitle: {
    marginBottom: SPACING.x2,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: SPACING.x2,
  },
  successHint: {
    textAlign: 'center',
  },
});
