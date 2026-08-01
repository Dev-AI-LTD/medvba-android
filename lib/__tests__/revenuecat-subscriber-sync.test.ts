/**
 * Regression: null RC REST payload must not revoke Pro / skip grant silently.
 */

import { syncSubscriberPayloadToSupabase } from '@/backend/lib/revenuecat-subscriber-sync';

describe('syncSubscriberPayloadToSupabase', () => {
  it('fails closed when RevenueCat subscriber body is null (no free revoke)', async () => {
    const from = jest.fn();
    const supabase = { from } as never;

    const result = await syncSubscriberPayloadToSupabase(
      supabase,
      '11111111-1111-1111-1111-111111111111',
      null,
      { grantMonthlyCredits: true },
    );

    expect(result.ok).toBe(false);
    expect(result.source).toBe('noop');
    expect(result.error).toMatch(/unavailable/i);
    expect(from).not.toHaveBeenCalled();
  });
});
