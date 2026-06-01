import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Stack, router } from 'expo-router';
import { useThemeSafe } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { presentPaywall, PAYWALL_RESULT } from '@/lib/revenuecat';
import { log } from '@/lib/log';
import { useLanguage } from '@/providers/LanguageProvider';
import { FREE_FEATURE_KEYS, getFreeFeatureLines } from '@/constants/subscription';
import {
  buttonHeight,
  fieldGap,
  radiusMd,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';
// Expo Go = storeClient; real builds = standalone
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

/**
 * Paywall screen: Presents RevenueCat Paywall in dev/production builds.
 * In Expo Go or web: Shows fallback message (RevenueCat paywall requires a development build).
 */
export default function PaywallScreen() {
  const { colors } = useThemeSafe();
  const { isPaywallEnabled, restorePurchases } = useSubscription();
  const { t } = useLanguage();
  const [isRestoring, setIsRestoring] = useState(false);
  const [status, setStatus] = useState<
    'loading' | 'fallback' | 'store_not_ready' | 'error' | 'cancelled' | 'purchased' | 'restored'
  >('loading');

  // Memoize to prevent update loop - new object ref each render was causing Stack to re-update
  const headerOptions = useMemo(
    () => ({
      title: t('paywall.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
    }),
    [colors.background, colors.text, t]
  );

  useEffect(() => {
    if (!isPaywallEnabled) {
      router.replace('/(tabs)/index' as any);
      return;
    }

    // Web or Expo Go: RevenueCat paywall doesn't work (needs browser DOM or native modules)
    if (!IS_NATIVE || IS_EXPO_GO) {
      setStatus('fallback');
      return;
    }

    let mounted = true;

    const showPaywall = async () => {
      try {
        const result = await presentPaywall();
        if (!mounted) return;

        if (result === PAYWALL_RESULT.PURCHASED) {
          setStatus('purchased');
          router.back();
          return;
        }
        if (result === PAYWALL_RESULT.RESTORED) {
          setStatus('restored');
          router.back();
          return;
        }
        if (result === PAYWALL_RESULT.CANCELLED) {
          setStatus('cancelled');
          router.back();
          return;
        }

        if (result === PAYWALL_RESULT.NOT_PRESENTED) {
          setStatus('store_not_ready');
          return;
        }
        setStatus('error');
      } catch (error) {
        log.error('[Paywall] presentPaywall failed', error);
        if (mounted) {
          setStatus('error');
        }
      }
    };

    showPaywall();
    return () => {
      mounted = false;
    };
  }, [isPaywallEnabled]);

  const handleRestorePurchases = async () => {
    if (!IS_NATIVE || IS_EXPO_GO || isRestoring) return;
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(
          t('paywall.restoreSuccessTitle'),
          t('paywall.restoreSuccessMessage'),
          [{ text: t('paywall.ok'), onPress: () => router.back() }],
        );
      } else {
        Alert.alert(t('paywall.infoTitle'), t('paywall.noPurchasesFound'));
      }
    } catch {
      Alert.alert(t('paywall.errorTitle'), t('paywall.errorRestore'));
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isPaywallEnabled) {
    return null;
  }

  const showRestoreOnFallback = IS_NATIVE && !IS_EXPO_GO;

  if (status === 'fallback' || status === 'store_not_ready' || status === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={headerOptions} />
        <SafeAreaView style={styles.content} edges={['bottom']}>
          <Text style={[styles.webMessage, { color: colors.text }]}>
            {status === 'error'
              ? t('paywall.errorMessage')
              : status === 'store_not_ready'
                ? t('paywall.storeNotReadyMessage')
                : IS_EXPO_GO
                  ? t('paywall.expoGoMessage')
                  : t('paywall.webMessage')}
          </Text>
          <Text style={[styles.webSubtext, { color: colors.textSecondary }]}>
            {t('paywall.webSubtext')}
          </Text>
          <Text style={[styles.freeTierHeading, { color: colors.text }]} accessibilityRole="header">
            {t('paywall.freeTierHeading')}
          </Text>
          <View style={styles.freeTierList} accessibilityRole="list">
            {getFreeFeatureLines(t).map((line, i) => (
              <Text
                key={FREE_FEATURE_KEYS[i]}
                style={[styles.freeTierBullet, { color: colors.textSecondary }]}
                accessibilityRole="text"
              >
                {'\u2022 '}
                {line}
              </Text>
            ))}
          </View>
          {showRestoreOnFallback ? (
            <TouchableOpacity
              style={[
                styles.restoreButton,
                { borderColor: colors.primary },
                isRestoring && styles.restoreButtonDisabled,
              ]}
              onPress={handleRestorePurchases}
              disabled={isRestoring}
              accessibilityRole="button"
              accessibilityLabel={t('paywall.restoreButton')}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
                  {t('paywall.restoreButton')}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.goBackButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('paywall.goBack')}
          >
            <Text style={[styles.goBackButtonText, { color: colors.background }]}>
              {t('paywall.goBack')}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={headerOptions} />
      <SafeAreaView style={styles.content} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('paywall.loading')}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sectionGap,
  },
  loadingText: {
    marginTop: fieldGap,
    ...typeScale.subhead,
  },
  webMessage: {
    ...typeScale.body,
    textAlign: 'center',
    marginBottom: space.space3,
  },
  webSubtext: {
    ...typeScale.subhead,
    textAlign: 'center',
  },
  freeTierList: {
    alignSelf: 'stretch',
    maxWidth: 420,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  freeTierHeading: {
    alignSelf: 'stretch',
    maxWidth: 420,
    marginTop: sectionGap,
    paddingHorizontal: space.space2,
    ...typeScale.body,
    fontWeight: '600' as const,
    textAlign: 'left',
  },
  freeTierBullet: {
    ...typeScale.subhead,
    marginBottom: space.space2,
    textAlign: 'left',
  },
  restoreButton: {
    marginTop: 28,
    paddingHorizontal: space.space7,
    minHeight: buttonHeight,
    paddingVertical: space.space3,
    borderRadius: radiusMd,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    maxWidth: 420,
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
  goBackButton: {
    marginTop: 12,
    paddingHorizontal: space.space7,
    minHeight: buttonHeight,
    paddingVertical: space.space3,
    borderRadius: radiusMd,
  },
  goBackButtonText: {
    ...typeScale.body,
    fontWeight: '600' as const,
  },
});
