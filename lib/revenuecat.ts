/**
 * RevenueCat UI helpers for Paywall and Customer Center.
 * Uses react-native-purchases-ui for native paywalls and subscription management.
 */
import { Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { ENTITLEMENT_ID } from '@/constants/subscription';
import { log } from '@/lib/log';

const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';

function isRevenueCatConfigurationError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error ?? '');
  const code = (error as { code?: number | string })?.code;
  const readable = String(
    (error as { userInfo?: { readable_error_code?: string } })?.userInfo?.readable_error_code ?? '',
  );
  return (
    code === 23 ||
    code === '23' ||
    readable === 'CONFIGURATION_ERROR' ||
    message.includes('CONFIGURATION_ERROR') ||
    message.includes('problem with your configuration') ||
    message.includes('could not be fetched from the App Store') ||
    message.includes('could be fetched from the Play Store')
  );
}

/** StoreKit / Play must return product details — RC API alone is not enough. */
async function offeringHasStoreProducts(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const packages = current?.availablePackages ?? [];
    return packages.length > 0 && packages.every((pkg) => Boolean(pkg.product?.identifier));
  } catch (error) {
    if (isRevenueCatConfigurationError(error)) return false;
    throw error;
  }
}

/**
 * Present the RevenueCat Paywall modal.
 * Only works on native (iOS/Android). On web, returns NOT_PRESENTED.
 */
export async function presentPaywall(): Promise<PAYWALL_RESULT> {
  if (!IS_NATIVE) {
    return PAYWALL_RESULT.NOT_PRESENTED;
  }
  try {
    const ready = await offeringHasStoreProducts();
    if (!ready) {
      log.warn(
        '[RevenueCat] Store products not loaded (ASC metadata / sandbox). Skipping paywall UI.',
      );
      return PAYWALL_RESULT.NOT_PRESENTED;
    }
    return await RevenueCatUI.presentPaywall({ displayCloseButton: true });
  } catch (error) {
    if (isRevenueCatConfigurationError(error)) {
      log.warn('[RevenueCat] presentPaywall configuration error:', error);
      return PAYWALL_RESULT.NOT_PRESENTED;
    }
    log.error('[RevenueCat] presentPaywall error:', error);
    return PAYWALL_RESULT.ERROR;
  }
}

/**
 * Present the paywall only if the user does not have the required entitlement.
 * Useful for access-gating (e.g. before starting a premium feature).
 */
export async function presentPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  if (!IS_NATIVE) {
    return PAYWALL_RESULT.NOT_PRESENTED;
  }
  try {
    const ready = await offeringHasStoreProducts();
    if (!ready) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }
    return await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
      displayCloseButton: true,
    });
  } catch (error) {
    if (isRevenueCatConfigurationError(error)) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }
    log.error('[RevenueCat] presentPaywallIfNeeded error:', error);
    return PAYWALL_RESULT.ERROR;
  }
}

/**
 * Present the RevenueCat Customer Center for subscription management.
 * Allows users to view subscription, change plans, cancel, restore, request refunds (iOS).
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!IS_NATIVE) {
    log.warn('[RevenueCat] Customer Center is not available on web');
    return;
  }
  try {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo }) => {
          log.debug('[RevenueCat] Restore completed:', customerInfo.originalAppUserId);
        },
        onRestoreFailed: ({ error }) => {
          log.error('[RevenueCat] Restore failed:', error.message);
        },
      },
    });
  } catch (error) {
    log.error('[RevenueCat] presentCustomerCenter error:', error);
  }
}

/**
 * Check if the current customer has the Pro entitlement.
 */
export async function checkEntitlement(): Promise<boolean> {
  if (!IS_NATIVE) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  } catch (error) {
    log.error('[RevenueCat] checkEntitlement error:', error);
    return false;
  }
}

export { PAYWALL_RESULT };
