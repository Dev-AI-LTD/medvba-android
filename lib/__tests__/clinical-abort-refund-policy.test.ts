/**
 * Refund / abort policy unit contracts for Clinical Muse Phase 1.
 */

describe('clinical credit abort/timeout/provider policy', () => {
  type Cause = 'client' | 'timeout' | 'provider_error' | 'ok';

  function decide(cause: Cause): { refund: boolean; usageStatus: string } {
    switch (cause) {
      case 'client':
        return { refund: false, usageStatus: 'aborted' };
      case 'timeout':
        return { refund: true, usageStatus: 'timeout' };
      case 'provider_error':
        return { refund: true, usageStatus: 'provider_error' };
      case 'ok':
        return { refund: false, usageStatus: 'ok' };
    }
  }

  it('client abort: charge kept, usage aborted', () => {
    expect(decide('client')).toEqual({ refund: false, usageStatus: 'aborted' });
  });

  it('timeout: refund once, usage timeout', () => {
    expect(decide('timeout')).toEqual({ refund: true, usageStatus: 'timeout' });
  });

  it('provider failure: refund once, usage provider_error', () => {
    expect(decide('provider_error')).toEqual({
      refund: true,
      usageStatus: 'provider_error',
    });
  });

  it('success: no refund, usage ok', () => {
    expect(decide('ok')).toEqual({ refund: false, usageStatus: 'ok' });
  });

  it('refundOnce is idempotent', async () => {
    let chargedAmount = 4;
    let refunded = false;
    let calls = 0;
    async function refundOnce() {
      if (chargedAmount <= 0 || refunded) return;
      refunded = true;
      calls += 1;
    }
    await refundOnce();
    await refundOnce();
    await refundOnce();
    expect(calls).toBe(1);
  });
});
