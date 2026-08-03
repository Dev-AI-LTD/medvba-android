/**
 * Exercises the real useLeaderboard queryFn.
 * jest.setup.js mocks @/lib/supabase-hooks globally — unmock for this file only.
 * Unmocking pulls the full hooks module; stub expo-file-system used by unrelated exports.
 */
jest.unmock('@/lib/supabase-hooks');

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useLeaderboard } from '@/lib/supabase-hooks';

const rpcMock = jest.fn();

describe('useLeaderboard', () => {
  let queryClient: QueryClient;

  function createWrapper() {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Hook sets retry: 1; keep tests deterministic with no delay between attempts.
          retryDelay: 0,
        },
      },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase as unknown as { rpc: jest.Mock }).rpc = rpcMock;
  });

  afterEach(async () => {
    if (queryClient) {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
  });

  it('treats successful empty RPC data as isSuccess with []', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useLeaderboard('weekly'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(rpcMock).toHaveBeenCalledWith('get_leaderboard', {
      p_period: 'weekly',
      p_limit: 20,
    });
  });

  it('enters isError when RPC returns an error (does not coerce to [])', async () => {
    const rpcError = { message: 'rpc failed', code: 'PGRST301' };
    rpcMock.mockResolvedValue({ data: null, error: rpcError });

    const { result } = renderHook(() => useLeaderboard('weekly'), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(rpcError);
  });

  it('preserves points and rank mapping for normal rows', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'u1',
          name: 'Ada Lovelace',
          avatar: 'https://example.com/a.png',
          points: 1250,
          streak: 4,
          rank: 1,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useLeaderboard('allTime', 10), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      {
        id: 'u1',
        name: 'Ada Lovelace',
        avatar: 'https://example.com/a.png',
        points: 1250,
        streak: 4,
        rank: 1,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith('get_leaderboard', {
      p_period: 'allTime',
      p_limit: 10,
    });
  });
});
