/**
 * RevenueCat client helpers for MEDVBA.
 * Public SDK keys only — never put webhook/secret keys in the app.
 * Profile UUID is the RC appUserID (matches webhook app_user_id).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import {
  LEGACY_PRO_ENTITLEMENT_ID,
  PRO_AI_ENTITLEMENT_ID,
  getProAiEntitlementIds,
  hasProAiEntitlement,
} from '@/constants/clinical-copilot';
import { PACKAGE_MONTHLY, PACKAGE_YEARLY } from '@/constants/subscription';
import { log } from '@/lib/log';

let configured = false;
let lastAppUserId: string | null = null;

function getExtra(): Record<string, string | undefined> {
  return (
    (Constants.expoConfig?.extra as Record<string, string | undefined> | undefined) ??
    ((Constants as { manifest?: { extra?: Record<string, string | undefined> } }).manifest
      ?.extra ??
      {})
  );
}

export function getRevenueCatPublicApiKey(): string {
  const extra = getExtra();
  const ios = extra.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '';
  const android = extra.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '';
  return (Platform.OS === 'ios' ? ios : android) || '';
}

/** Entitlement ids accepted for Premium / Pro AI (legacy `pro` + `medvba_pro_ai`). */
export function getClientProAiEntitlementIds(): string[] {
  const extra = getExtra();
  const fromExtra = extra.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim();
  const ids = new Set(getProAiEntitlementIds());
  if (fromExtra) ids.add(fromExtra);
  ids.add(PRO_AI_ENTITLEMENT_ID);
  ids.add(LEGACY_PRO_ENTITLEMENT_ID);
  return Array.from(ids);
}

export function hasProAi(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo?.entitlements?.active) return false;
  return hasProAiEntitlement(
    customerInfo.entitlements.active as Record<string, unknown>,
  );
}

export async function configureRevenueCat(profileId?: string | null): Promise<void> {
  const apiKey = getRevenueCatPublicApiKey();
  if (!apiKey) {
    log.debug('[RevenueCat] No public API key — skip configure');
    return;
  }
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  if (!configured) {
    Purchases.configure({ apiKey });
    configured = true;
  }

  if (profileId && lastAppUserId !== profileId) {
    await Purchases.logIn(profileId);
    lastAppUserId = profileId;
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!configured || !lastAppUserId) return;
  try {
    await Purchases.logOut();
  } catch {
    /* already anonymous */
  }
  lastAppUserId = null;
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

function findPackageByKind(
  packages: PurchasesPackage[],
  kind: 'monthly' | 'yearly',
): PurchasesPackage | undefined {
  const wantYearly = kind === 'yearly';
  return packages.find((pkg) => {
    const id = `${pkg.identifier} ${pkg.product?.identifier ?? ''}`.toLowerCase();
    if (wantYearly) {
      return (
        pkg.identifier === PACKAGE_YEARLY ||
        pkg.identifier === '$rc_annual' ||
        id.includes('annual') ||
        id.includes('year') ||
        id.includes('medvba_pro_ai_annual')
      );
    }
    return (
      pkg.identifier === PACKAGE_MONTHLY ||
      pkg.identifier === '$rc_monthly' ||
      id.includes('month') ||
      id.includes('medvba_pro_ai_monthly')
    );
  });
}

async function getCurrentPackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function buyProAiMonthly(): Promise<CustomerInfo | null> {
  const packages = await getCurrentPackages();
  const pkg = findPackageByKind(packages, 'monthly');
  if (!pkg) {
    log.warn('[RevenueCat] No monthly Pro AI package in offerings');
    return null;
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function buyProAiAnnual(): Promise<CustomerInfo | null> {
  const packages = await getCurrentPackages();
  const pkg = findPackageByKind(packages, 'yearly');
  if (!pkg) {
    log.warn('[RevenueCat] No annual Pro AI package in offerings');
    return null;
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

function isLikelyCreditTopupId(id: string): boolean {
  const s = id.toLowerCase();
  return s.includes('credit') || s.includes('topup') || s.includes('top_up');
}

/**
 * Purchase a consumable credit top-up by product / package id.
 * Does NOT grant credits locally — caller must syncEntitlement afterward.
 * Exact package/product match only (never fuzzy-match subscription packages).
 */
export async function purchaseCreditTopup(
  productId: string,
): Promise<{ customerInfo: CustomerInfo | null; purchased: boolean; userCancelled?: boolean }> {
  const needle = productId.toLowerCase().trim();
  if (!needle || !isLikelyCreditTopupId(needle)) {
    log.warn('[RevenueCat] Refusing non-top-up product id:', productId);
    return { customerInfo: null, purchased: false };
  }

  const packages = await getCurrentPackages();
  const pkg =
    packages.find((p) => p.identifier.toLowerCase() === needle) ||
    packages.find((p) => String(p.product?.identifier ?? '').toLowerCase() === needle);

  try {
    if (pkg && isLikelyCreditTopupId(`${pkg.identifier} ${pkg.product?.identifier ?? ''}`)) {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { customerInfo, purchased: true };
    }

    // Consumables may live outside the current subscription offering.
    const products = await Purchases.getProducts([productId]);
    const product =
      products.find((p) => p.identifier.toLowerCase() === needle) ?? products[0];
    if (!product || !isLikelyCreditTopupId(product.identifier)) {
      log.warn('[RevenueCat] Top-up product not found:', productId);
      return { customerInfo: null, purchased: false };
    }
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    return { customerInfo, purchased: true };
  } catch (error: unknown) {
    const cancelled = Boolean((error as { userCancelled?: boolean })?.userCancelled);
    if (!cancelled) {
      log.error('[RevenueCat] Top-up purchase failed:', error);
    }
    return { customerInfo: null, purchased: false, userCancelled: cancelled };
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** Opens RevenueCat Customer Center (manage subscription / billing support). */
export async function presentCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter();
}

export { Purchases };
