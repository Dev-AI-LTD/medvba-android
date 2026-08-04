import {
  classifySessionExchangeFailure,
  isConnectivityExchangeFailure,
  isRateLimitExchangeFailure,
} from '@/lib/session-exchange-errors';

describe('classifySessionExchangeFailure rate_limit', () => {
  it('classifies HTTP 429 as rate_limit', () => {
    expect(classifySessionExchangeFailure('Too many authentication attempts', 429)).toBe(
      'rate_limit',
    );
  });

  it('classifies known rate-limit message without status', () => {
    expect(
      classifySessionExchangeFailure(
        'Too many authentication attempts. Please try again shortly.',
      ),
    ).toBe('rate_limit');
  });

  it('isRateLimitExchangeFailure respects explicit kind', () => {
    expect(isRateLimitExchangeFailure('anything', undefined, 'rate_limit')).toBe(true);
    expect(isConnectivityExchangeFailure('anything', undefined, 'rate_limit')).toBe(false);
  });
});
