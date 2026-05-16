/* eslint-disable */
import '@testing-library/jest-native/extend-expect';

const shouldKeepConsole =
  process.env.JEST_VERBOSE_CONSOLE === '1' ||
  process.env.JEST_VERBOSE_CONSOLE === 'true';

if (!shouldKeepConsole) {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

jest.mock('expo-router', () => {
  const React = require('react');
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };
  const Redirect = ({ href }) => {
    React.useEffect(() => {
      router.replace(href);
    }, [href]);
    return null;
  };
  return {
    router,
    Redirect,
    useRouter: () => router,
    useSegments: () => [],
    useLocalSearchParams: () => ({}),
  };
});

jest.mock('expo-splash-screen', () => ({
  // Match Expo: both return Promises (default jest.fn() is undefined → breaks .catch / await chains).
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { 
    extra: { 
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:3000',
      EXPO_PUBLIC_KINDE_ISSUER_URL: 'https://test.kinde.com',
      EXPO_PUBLIC_KINDE_CLIENT_ID: 'test-client',
      EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN: 'true',
    } 
  },
  executionEnvironment: 'storeClient',
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: () => React.createElement(View),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' },
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiRemove: jest.fn(),
  };
  return {
    __esModule: true,
    default: storage,
    ...storage,
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: jest.fn(({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, props, children);
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  const defaultInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  const defaultFrame = { x: 0, y: 0, width: 390, height: 844 };

  const SafeAreaInsetsContext = React.createContext(defaultInsets);
  const SafeAreaFrameContext = React.createContext(defaultFrame);

  function SafeAreaProvider({ children, initialMetrics }) {
    const insets = initialMetrics?.insets ?? defaultInsets;
    const frame = initialMetrics?.frame ?? defaultFrame;
    return React.createElement(
      SafeAreaInsetsContext.Provider,
      { value: insets },
      React.createElement(SafeAreaFrameContext.Provider, { value: frame }, children),
    );
  }

  return {
    __esModule: true,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaProvider,
    SafeAreaView: View,
    initialWindowMetrics: null,
    useSafeAreaInsets: () => defaultInsets,
    useSafeAreaFrame: () => defaultFrame,
  };
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: jest.fn().mockResolvedValue({
      customerInfo: { entitlements: { active: {} } },
    }),
    logOut: jest.fn().mockResolvedValue(undefined),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
    }),
  },
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      signInWithIdToken: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

jest.mock('@/lib/trpc', () => ({
  trpc: {
    subscription: {
      validateAiQuestion: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn().mockResolvedValue({ allowed: true, remaining: 5, isPremium: false }),
        })),
      },
    },
  },
}));

jest.mock('@/lib/supabase-hooks', () => ({
  useUserProfile: jest.fn(() => ({ data: null })),
  useUserProgress: jest.fn(() => ({ data: null, isLoading: false })),
  useWeeklyProgress: jest.fn(() => ({ data: [], isLoading: false })),
  useUpsertUserProgress: jest.fn(() => ({ mutateAsync: jest.fn().mockResolvedValue({}) })),
  useUpsertDailyProgress: jest.fn(() => ({ mutateAsync: jest.fn().mockResolvedValue({}) })),
  useCheckAchievements: jest.fn(() => ({ data: { earned: [], progress: {} }, isLoading: false })),
  useGrantAchievement: jest.fn(() => ({ mutateAsync: jest.fn().mockResolvedValue({}) })),
  useUpdateSubscription: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('@/lib/monitoring', () => ({
  monitoring: {
    init: jest.fn(),
    logError: jest.fn(),
    logEvent: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
  },
}));

const kindeHostedAuthSuccess = {
  success: true,
  accessToken: 'mock-kinde-access',
  idToken: 'mock-kinde-id',
};

/** @type {{ login: jest.Mock; register: jest.Mock }} */
global.__kindeAuthMocks = {
  login: jest.fn().mockResolvedValue(kindeHostedAuthSuccess),
  register: jest.fn().mockResolvedValue(kindeHostedAuthSuccess),
};

jest.mock('@kinde/expo', () => {
  const React = require('react');
  return {
    KindeAuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useKindeAuth: () => ({
      isAuthenticated: false,
      isLoading: false,
      login: global.__kindeAuthMocks.login,
      register: global.__kindeAuthMocks.register,
      logout: jest.fn().mockResolvedValue({ success: true }),
      getAccessToken: jest.fn().mockResolvedValue(null),
      getIdToken: jest.fn().mockResolvedValue(null),
      getUserProfile: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
      refreshToken: jest.fn().mockResolvedValue({
        success: true,
        refreshToken: 'mock-kinde-refresh',
      }),
    }),
  };
});

// RN's default rAF uses jest.now(); deferred callbacks can run after Jest env teardown.
// Microtask avoids leaving active timers (Jest worker "force exited" warnings).
global.requestAnimationFrame = (callback) => {
  queueMicrotask(() => callback(Date.now()));
  return -1;
};
global.cancelAnimationFrame = jest.fn();

function buildMedvbaTestAccessJwt(): string {
  const payload = Buffer.from(
    JSON.stringify({
      profile_id: '11111111-1111-1111-1111-111111111111',
      exp: Math.floor(Date.now() / 1000) + 86_400,
    }),
  ).toString('base64url');
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  return `${header}.${payload}.x`;
}

global.fetch = jest.fn().mockImplementation((url) => {
  const u = String(url);
  if (u.includes('/api/auth/session') || u.includes('/api/auth/register')) {
    const body = JSON.stringify({
      access_token: buildMedvbaTestAccessJwt(),
      profile_id: '11111111-1111-1111-1111-111111111111',
    });
    return Promise.resolve({
      ok: true,
      status: 200,
      text: async () => body,
      json: async () => JSON.parse(body),
    });
  }
  if (u.includes('/api/auth/request-password-reset')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
      json: async () => ({ ok: true }),
    });
  }
  const empty = JSON.stringify({});
  return Promise.resolve({ ok: true, status: 200, text: async () => empty, json: async () => ({}) });
});
