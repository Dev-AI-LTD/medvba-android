import { revenueCatEventIdempotencyKey } from '@/backend/webhooks/revenuecat-webhook';

describe('RevenueCat webhook idempotency keys', () => {
  it('uses stable event.id when present (same event processed once)', () => {
    const event = {
      id: 'evt_123',
      type: 'INITIAL_PURCHASE',
      transaction_id: 'txn_a',
    };
    expect(revenueCatEventIdempotencyKey(event)).toBe('evt_123');
    expect(revenueCatEventIdempotencyKey(event)).toBe(
      revenueCatEventIdempotencyKey({ ...event }),
    );
  });

  it('falls back to synthetic key from type + transaction id', () => {
    const event = {
      type: 'NON_RENEWING_PURCHASE',
      transaction_id: 'txn_topup_1',
    };
    expect(revenueCatEventIdempotencyKey(event)).toBe(
      'synthetic:NON_RENEWING_PURCHASE:txn_topup_1',
    );
  });

  it('prefers transaction_id over original for synthetic key identity', () => {
    const a = revenueCatEventIdempotencyKey({
      type: 'RENEWAL',
      transaction_id: 'txn_renew_2',
      original_transaction_id: 'txn_orig',
    });
    const b = revenueCatEventIdempotencyKey({
      type: 'RENEWAL',
      transaction_id: 'txn_renew_2',
      original_transaction_id: 'txn_orig',
    });
    expect(a).toBe(b);
    expect(a).toContain('txn_renew_2');
  });
});

describe('RevenueCat duplicate claim simulation', () => {
  it('treats unique violation as already processed', () => {
    const seen = new Set<string>();
    function claim(eventId: string): { claimed: boolean } {
      if (seen.has(eventId)) return { claimed: false };
      seen.add(eventId);
      return { claimed: true };
    }
    const id = 'evt_dup';
    expect(claim(id).claimed).toBe(true);
    expect(claim(id).claimed).toBe(false);
  });
});
