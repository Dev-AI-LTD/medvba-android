import { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { LoginMethodParams } from '@kinde/js-utils';
import * as Haptics from 'expo-haptics';
import { Appbar, Text, Card, useTheme } from 'react-native-paper';
import { useAuth, AUTH_SIGN_IN_CANCELLED } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SPACING } from '@/theme/paperTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isApiBaseUrlConfigured } from '@/lib/api-base-url';
import { log } from '@/lib/log';
import { resolvePostAuthHref } from '@/lib/auth-return-url';
import { resolvePostAuthOnboardingDone } from '@/lib/onboarding-storage';
import { isLikelyAuthConnectivityFailure } from '@/lib/auth-connectivity-errors';
import { useBlockingAuthOffline } from '@/lib/use-network-auth-offline';

async function replaceWithPostAuthHome() {
  const onboarded = await resolvePostAuthOnboardingDone();
  const href = await resolvePostAuthHref(onboarded);
  router.replace(href);
}

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const { signInWithKindeHosted } = useAuth();
  const [hostedLoading, setHostedLoading] = useState(false);
  const hostedAuthConfigured = isSupabaseConfigured && isApiBaseUrlConfigured();
  const blockingOffline = useBlockingAuthOffline();

  const emailParam = useMemo(() => {
    const raw = params.email;
    const fromParam =
      typeof raw === 'string' ? raw : Array.isArray(raw) && raw.length > 0 ? String(raw[0]) : '';
    return fromParam.trim().toLowerCase();
  }, [params.email]);

  /** Pre-fill email on Kinde hosted page (see Kinde `login_hint` / authUrlParams). */
  const hostedLoginHint = useMemo((): LoginMethodParams | undefined => {
    if (!emailParam.includes('@')) return undefined;
    return { authUrlParams: { login_hint: emailParam } } as LoginMethodParams;
  }, [emailParam]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, []);

  const handleContinueInBrowser = useCallback(async () => {
    if (blockingOffline) {
      Alert.alert(t('offline.needsInternetTitle'), t('offline.needsInternetMessage'));
      return;
    }
    if (!isApiBaseUrlConfigured()) {
      Alert.alert(t('auth.signUpFailed'), t('auth.backendNotConfigured'));
      return;
    }
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.signUpFailed'), t('auth.supabaseNotConfigured'));
      return;
    }
    setHostedLoading(true);
    try {
      const { error } = await signInWithKindeHosted(hostedLoginHint);
      if (error) {
        if (error.message === AUTH_SIGN_IN_CANCELLED) return;
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        const detail = error.message?.trim() ?? '';
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
      await replaceWithPostAuthHome();
    } catch (e) {
      log.error('[VerifyEmail] hosted auth:', e);
      const connectivity = isLikelyAuthConnectivityFailure(e);
      Alert.alert(
        connectivity ? t('offline.needsInternetTitle') : t('common.error'),
        connectivity ? t('offline.needsInternetMessage') : t('auth.unexpectedError'),
      );
    } finally {
      setHostedLoading(false);
    }
  }, [blockingOffline, hostedLoginHint, signInWithKindeHosted, t]);

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
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              {t('auth.verifyEmail.title')}
            </Text>
          </View>

          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('auth.verifyEmail.body')}
              </Text>

              <Pressable
                accessibilityRole="link"
                disabled={hostedLoading || !hostedAuthConfigured || blockingOffline}
                onPress={handleContinueInBrowser}
                style={({ pressed }) => [
                  styles.linkRow,
                  pressed && !hostedLoading ? { opacity: 0.7 } : null,
                  hostedLoading ? { opacity: 0.6 } : null,
                ]}
              >
                {hostedLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : null}
                <Text
                  style={[
                    styles.linkText,
                    {
                      color: theme.colors.primary,
                      marginLeft: hostedLoading ? SPACING.x2 : 0,
                    },
                  ]}
                >
                  {t('auth.verifyEmail.continueAuthLink')}
                </Text>
              </Pressable>
            </Card.Content>
          </Card>
        </ScrollView>
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
  appbar: {
    elevation: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    gap: SPACING.x3,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.x1,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
