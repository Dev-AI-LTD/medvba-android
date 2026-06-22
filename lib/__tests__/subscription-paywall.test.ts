import { findPaywallPackage } from '@/lib/subscription-paywall';

describe('findPaywallPackage', () => {
  const packages = [
    { identifier: '$rc_monthly', product: { priceString: '$4.99' } },
    { identifier: '$rc_annual', product: { priceString: '$39.99' } },
  ];

  it('finds monthly and yearly RevenueCat packages', () => {
    expect(findPaywallPackage(packages, 'monthly')?.identifier).toBe('$rc_monthly');
    expect(findPaywallPackage(packages, 'yearly')?.identifier).toBe('$rc_annual');
  });
});
