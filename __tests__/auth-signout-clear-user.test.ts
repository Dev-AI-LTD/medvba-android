/**
 * signOut must clear Sentry user context even when later cleanup throws.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { monitoring } from '@/lib/monitoring';

jest.mock('@/lib/query-client', () => ({
  clearPersistedQueryCache: jest.fn(() =>
    Promise.reject(new Error('simulated cache clear failure')),
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(AuthProvider, null, children),
    );
  };
}

describe('AuthProvider signOut monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls monitoring.clearUser when clearPersistedQueryCache throws', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 15_000 },
    );

    await act(async () => {
      await expect(result.current.signOut()).rejects.toThrow('simulated cache clear failure');
    });

    expect(monitoring.clearUser).toHaveBeenCalledTimes(1);
  });
});
