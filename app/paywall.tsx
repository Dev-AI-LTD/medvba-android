import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Stack, router } from 'expo-router';
import { useThemeSafe } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { log } from '@/lib/log';
import { useLanguage } from '@/providers/LanguageProvider';
import { FREE_FEATURE_KEYS, getFreeFeatureLines } from '@/constants/subscription';
import {
  findPaywallPackage,
  PREMIUM_FEATURE_KEYS,
  SUBSCRIPTION_LEGAL_URLS,
} from '@/lib/subscription-paywall';
import {
  buttonHeight,
  fieldGap,
  radiusMd,
  screenPaddingX,
  sectionGap,
  space,
  typeScale,
} from '@/theme/iosDesign';

const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

function openLegalUrl(url: string, fallbackRoute: '/legal/terms-of-service' | '/legal/privacy-policy') {
  Linking.openURL(url).catch(() => {
    router.push(fallbackRoute);
  });
}

export default function PaywallScreen() {
  const { colors } = useThemeSafe();
  const {
    isPaywallEnabled,
    isLoading,
    offerings,
    purchasePackage,
    restorePurchases,
  } = useSubscription();
  const { t } = useLanguage();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const headerOptions = useMemo(
    () => ({
      title: t('paywall.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
    }),
    [colors.background, colors.text, t],
  );

  const monthlyPkg = useMemo(
    () => findPaywallPackage(offerings?.availablePackages, 'monthly'),
    [offerings],
  );
  const yearlyPkg = useMemo(
    () => findPaywallPackage(offerings?.availablePackages, 'yearly'),
    [offerings],
  );

  const storeReady = Boolean(monthlyPkg || yearlyPkg);

  const handlePurchase = useCallback(
    async (packageId: string) => {
      if (!IS_NATIVE || IS_EXPO_GO || purchasingId) return;
      setPurchasingId(packageId);
      try {
        const ok = await purchasePackage(packageId);
        if (ok) {
          Alert.alert(t('paywall.successTitle'), t('paywall.successMessage'), [
            { text: t('paywall.ok'), onPress: () => router.back() },
          ]);
        }
      } catch (error) {
        log.error('[Paywall] purchase failed', error);
        Alert.alert(t('paywall.errorTitle'), t('paywall.errorPayment'));
      } finally {
        setPurchasingId(null);
      }
    },
    [purchasePackage, purchasingId, t],
  );

  const handleRestorePurchases = useCallback(async () => {
    if (!IS_NATIVE || IS_EXPO_GO || isRestoring) return;
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(t('paywall.restoreSuccessTitle'), t('paywall.restoreSuccessMessage'), [
          { text: t('paywall.ok'), onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('paywall.infoTitle'), t('paywall.noPurchasesFound'));
      }
    } catch {
      Alert.alert(t('paywall.errorTitle'), t('paywall.errorRestore'));
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, restorePurchases, t]);

  if (!isPaywallEnabled) {
    return null;
  }

  const renderPlan = (
    pkg: NonNullable<typeof monthlyPkg>,
    planKind: 'monthly' | 'yearly',
  ) => {
    const titleKey = planKind === 'monthly' ? 'paywall.monthlyTitle' : 'paywall.yearlyTitle';
    const periodKey = planKind === 'monthly' ? 'paywall.monthlyPeriod' : 'paywall.yearlyPeriod';
    const ctaKey = planKind === 'monthly' ? 'paywall.subscribeMonthly' : 'paywall.subscribeYearly';
    const price =
      pkg.product.priceString?.trim() || t('paywall.priceUnavailable');
    const busy = purchasingId === pkg.identifier;

    return (
      <View
        key={pkg.identifier}
        style={[styles.planCard, { backgroundColor: colors.cardBg, borderColor: colors.glassBorder }]}
      >
        <Text style={[styles.planTitle, { color: colors.text }]} accessibilityRole="header">
          {pkg.product.title?.trim() || t(titleKey)}
        </Text>
        <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{t(periodKey)}</Text>
        <Text style={[styles.planPrice, { color: colors.primary }]} accessibilityLabel={price}>
          {price}
        </Text>
        <Text style={[styles.planIncludes, { color: colors.textSecondary }]}>
          {t('paywall.includesLabel')}
        </Text>
        {PREMIUM_FEATURE_KEYS.slice(0, 4).map((key) => (
          <Text key={key} style={[styles.planBullet, { color: colors.textSecondary }]}>
            {'\u2022 '}
            {t(key)}
          </Text>
        ))}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { backgroundColor: colors.primary },
            (busy || !storeReady) && styles.buttonDisabled,
          ]}
          onPress={() => handlePurchase(pkg.identifier)}
          disabled={busy || !storeReady}
          accessibilityRole="button"
          accessibilityLabel={t(ctaKey)}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.subscribeButtonText, { color: colors.background }]}>{t(ctaKey)}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const showNativePurchase = IS_NATIVE && !IS_EXPO_GO;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={headerOptions} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.serviceTitle, { color: colors.text }]} accessibilityRole="header">
            {t('paywall.serviceTitle')}
          </Text>
          <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>
            {t('paywall.serviceDescription')}
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : null}

          {!isLoading && !storeReady && showNativePurchase ? (
            <Text style={[styles.notice, { color: colors.textSecondary }]}>
              {t('paywall.storeNotReadyMessage')}
            </Text>
          ) : null}

          {!IS_NATIVE || IS_EXPO_GO ? (
            <Text style={[styles.notice, { color: colors.textSecondary }]}>
              {IS_EXPO_GO ? t('paywall.expoGoMessage') : t('paywall.webMessage')}
            </Text>
          ) : null}

          {monthlyPkg ? renderPlan(monthlyPkg, 'monthly') : null}
          {yearlyPkg ? renderPlan(yearlyPkg, 'yearly') : null}

          <Text style={[styles.autoRenew, { color: colors.textSecondary }]}>
            {t('paywall.autoRenewDetail')}
          </Text>

          <View style={styles.legalRow}>
            <Text
              style={[styles.legalLink, { color: colors.primary }]}
              onPress={() => openLegalUrl(SUBSCRIPTION_LEGAL_URLS.termsOfUse, '/legal/terms-of-service')}
              accessibilityRole="link"
            >
              {t('paywall.termsOfUse')}
            </Text>
            <Text style={[styles.legalSeparator, { color: colors.textSecondary }]}>
              {t('paywall.legalSeparator')}
            </Text>
            <Text
              style={[styles.legalLink, { color: colors.primary }]}
              onPress={() =>
                openLegalUrl(SUBSCRIPTION_LEGAL_URLS.privacyPolicy, '/legal/privacy-policy')
              }
              accessibilityRole="link"
            >
              {t('paywall.privacyPolicyLink')}
            </Text>
          </View>
          <Text
            style={[styles.legalInline, { color: colors.primary }]}
            onPress={() => openLegalUrl(SUBSCRIPTION_LEGAL_URLS.appleStandardEula, '/legal/terms-of-service')}
            accessibilityRole="link"
          >
            {t('paywall.appleEulaLink')}
          </Text>

          {showNativePurchase ? (
            <TouchableOpacity
              style={[styles.restoreButton, { borderColor: colors.primary }]}
              onPress={handleRestorePurchases}
              disabled={isRestoring}
              accessibilityRole="button"
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

          <Text style={[styles.freeTierHeading, { color: colors.text }]} accessibilityRole="header">
            {t('paywall.freeTierHeading')}
          </Text>
          {getFreeFeatureLines(t).map((line, i) => (
            <Text key={FREE_FEATURE_KEYS[i]} style={[styles.freeTierBullet, { color: colors.textSecondary }]}>
              {'\u2022 '}
              {line}
            </Text>
          ))}

          <TouchableOpacity
            style={[styles.goBackButton, { borderColor: colors.glassBorder }]}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={[styles.goBackButtonText, { color: colors.text }]}>
              {t('paywall.continueFree')}
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: screenPaddingX,
    paddingBottom: sectionGap,
  },
  serviceTitle: {
    ...typeScale.title2,
    fontWeight: '700',
    marginTop: space.space2,
  },
  serviceDescription: {
    ...typeScale.subhead,
    marginTop: space.space2,
    marginBottom: sectionGap,
  },
  loader: {
    marginVertical: fieldGap,
  },
  notice: {
    ...typeScale.subhead,
    marginBottom: fieldGap,
    textAlign: 'center',
  },
  planCard: {
    borderWidth: 1,
    borderRadius: radiusMd,
    padding: space.space4,
    marginBottom: fieldGap,
  },
  planTitle: {
    ...typeScale.headline,
    fontWeight: '600',
  },
  planPeriod: {
    ...typeScale.subhead,
    marginTop: space.space1,
  },
  planPrice: {
    ...typeScale.title2,
    fontWeight: '700',
    marginTop: space.space3,
  },
  planIncludes: {
    ...typeScale.subhead,
    fontWeight: '600',
    marginTop: space.space4,
  },
  planBullet: {
    ...typeScale.subhead,
    marginTop: space.space1,
  },
  subscribeButton: {
    marginTop: space.space4,
    minHeight: buttonHeight,
    borderRadius: radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    ...typeScale.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  autoRenew: {
    ...typeScale.caption,
    marginTop: space.space2,
    lineHeight: 18,
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: space.space4,
  },
  legalLink: {
    ...typeScale.subhead,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    ...typeScale.subhead,
    marginHorizontal: space.space1,
  },
  legalInline: {
    ...typeScale.caption,
    marginTop: space.space2,
    textDecorationLine: 'underline',
  },
  restoreButton: {
    marginTop: space.space4,
    minHeight: buttonHeight,
    borderRadius: radiusMd,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    ...typeScale.body,
    fontWeight: '600',
  },
  freeTierHeading: {
    marginTop: sectionGap,
    ...typeScale.body,
    fontWeight: '600',
  },
  freeTierBullet: {
    ...typeScale.subhead,
    marginTop: space.space2,
  },
  goBackButton: {
    marginTop: sectionGap,
    minHeight: buttonHeight,
    borderRadius: radiusMd,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackButtonText: {
    ...typeScale.body,
    fontWeight: '600',
  },
});
