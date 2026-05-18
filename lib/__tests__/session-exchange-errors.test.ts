import {
  classifySessionExchangeFailure,
  isConnectivityExchangeFailure,
} from '@/lib/session-exchange-errors';

describe('session-exchange-errors', () => {
  it('classifies fetch failures as connectivity', () => {
    expect(classifySessionExchangeFailure('Network request failed')).toBe('connectivity');
    expect(isConnectivityExchangeFailure('Network request failed')).toBe(true);
  });

  it('classifies 401 as auth', () => {
    expect(classifySessionExchangeFailure('Unauthorized', 401)).toBe('auth');
    expect(isConnectivityExchangeFailure('Unauthorized', 401)).toBe(false);
  });

  it('classifies 503 as connectivity', () => {
    expect(classifySessionExchangeFailure('Service unavailable', 503)).toBe('connectivity');
  });

  it('respects explicit kind', () => {
    expect(isConnectivityExchangeFailure('anything', undefined, 'connectivity')).toBe(true);
    expect(isConnectivityExchangeFailure('network', undefined, 'auth')).toBe(false);
  });
});
