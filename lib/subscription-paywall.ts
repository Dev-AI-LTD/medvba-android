import { PACKAGE_MONTHLY, PACKAGE_YEARLY, PREMIUM_FEATURE_KEYS } from '@/constants/subscription';

export type PaywallPackage = {
  identifier: string;
  product: {
    priceString: string;
    title?: string;
  };
};

export function findPaywallPackage(
  packages: PaywallPackage[] | undefined,
  kind: 'monthly' | 'yearly',
): PaywallPackage | undefined {
  if (!packages?.length) return undefined;
  const wantYearly = kind === 'yearly';
  return packages.find((pkg) => {
    const id = pkg.identifier.toLowerCase();
    if (wantYearly) {
      return (
        id === PACKAGE_YEARLY ||
        id === '$rc_annual' ||
        id.includes('annual') ||
        id.includes('year')
      );
    }
    return id === PACKAGE_MONTHLY || id === '$rc_monthly' || id.includes('month');
  });
}

export { PREMIUM_FEATURE_KEYS };

export const SUBSCRIPTION_LEGAL_URLS = {
  privacyPolicy: 'https://medvba.app/privacy',
  termsOfUse: 'https://medvba.app/terms',
  appleStandardEula: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
} as const;
