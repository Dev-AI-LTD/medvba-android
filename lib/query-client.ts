import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Query roots persisted for offline revisit (profile, quiz progress, etc.). */
const PERSISTED_QUERY_ROOTS = new Set([
  'userProfile',
  'userProgress',
  'weeklyProgress',
  'dailyProgress',
  'userAchievements',
  'subscription',
]);

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@medvba_react_query_cache',
  throttleTime: 2000,
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: ONE_WEEK_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: {
      queryKey: readonly unknown[];
      state: { status: string; dataUpdatedAt: number };
    }) => {
      // Skip in-flight queries — restoring them causes CancelledError on hydration in dev.
      if (query.state.status === 'pending') return false;
      const root = query.queryKey[0];
      return typeof root === 'string' && PERSISTED_QUERY_ROOTS.has(root);
    },
  },
} as const;
