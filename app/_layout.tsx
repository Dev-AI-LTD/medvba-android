import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Platform, StyleSheet, Text } from "react-native";
import Constants from "expo-constants";

import { PaperProvider } from "react-native-paper";
import { QuizProgressProvider } from "@/providers/QuizProgressProvider";
import { LanguageProvider, useLanguage } from "@/providers/LanguageProvider";
import { KindeAuthContext, KindeAuthProvider } from "@kinde/expo";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { getPaperTheme } from "@/theme/paperTheme";
import { monitoring } from "@/lib/monitoring";
import { log } from "@/lib/log";
import { trpc, createMedvbaTrpcClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BootstrapLoadingOverlay } from "@/components/BootstrapLoadingOverlay";
import { isSupabaseConfigured } from "@/lib/supabase";
import { PUBLIC_APP_NAME } from "@/lib/public-brand";

let splashScreenAvailable = true;
try {
  SplashScreen.preventAutoHideAsync();
} catch {
  splashScreenAvailable = false;
}
WebBrowser.maybeCompleteAuthSession();
monitoring.init();

const extraConfig = Constants.expoConfig?.extra ?? {};
const kindeIssuerUrl = process.env.EXPO_PUBLIC_KINDE_ISSUER_URL || extraConfig.EXPO_PUBLIC_KINDE_ISSUER_URL || '';
const kindeClientId = process.env.EXPO_PUBLIC_KINDE_CLIENT_ID || extraConfig.EXPO_PUBLIC_KINDE_CLIENT_ID || '';
/** @kinde/expo default; override with EXPO_PUBLIC_KINDE_SCOPES if your Kinde app uses different API scopes. */
const kindeScopes = String(
  process.env.EXPO_PUBLIC_KINDE_SCOPES ||
    (extraConfig as { EXPO_PUBLIC_KINDE_SCOPES?: string }).EXPO_PUBLIC_KINDE_SCOPES ||
    'openid profile email offline',
).trim();

const isAbortSignalError = (args: unknown[]): boolean => {
  return args.some(arg => {
    if (typeof arg === 'string') {
      return arg.includes('signal is aborted') || arg.includes('abort');
    }
    if (arg instanceof Error) {
      return arg.message.includes('signal is aborted') || arg.message.includes('abort');
    }
    return false;
  });
};

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value
      .replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[redacted-email]"
      )
      .replace(/(eyJ[a-zA-Z0-9_-]+?\.[a-zA-Z0-9_-]+?\.[a-zA-Z0-9_-]+?)/g, "[redacted-jwt]")
      .replace(/(sb_publishable_[a-zA-Z0-9._-]+)/g, "[redacted-supabase-key]");
  }
  if (value && typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value);
      if (serialized) {
        return sanitizeValue(serialized);
      }
    } catch {
      return "[redacted-object]";
    }
  }
  return value;
};

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

console.error = (...args: unknown[]) => {
  if (isAbortSignalError(args)) return;
  if (__DEV__) {
    originalConsoleError(...args);
  } else {
    originalConsoleError(...args.map(sanitizeValue));
  }
};

console.warn = (...args: unknown[]) => {
  if (isAbortSignalError(args)) return;
  if (!__DEV__) originalConsoleWarn(...args.map(sanitizeValue));
};

console.info = (...args: unknown[]) => {
  if (isAbortSignalError(args)) return;
  if (!__DEV__) originalConsoleInfo(...args.map(sanitizeValue));
};

console.debug = (...args: unknown[]) => {
  if (isAbortSignalError(args)) return;
  if (!__DEV__) originalConsoleDebug(...args.map(sanitizeValue));
};

if (!__DEV__) {
  console.log = () => {};
}

/**
 * The Expo auth SDK renders `null` until SecureStore + token bootstrap finish.
 * While null, no child (AuthProvider, etc.) mounts — so nothing calls `SplashScreen.hideAsync()`
 * and the native splash can stay forever. This failsafe always runs alongside the auth provider.
 */
function NativeSplashFailsafe() {
  React.useEffect(() => {
    const ms = __DEV__ ? 5500 : 8500;
    const id = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
    }, ms);
    return () => clearTimeout(id);
  }, []);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function useProtectedRoute(splashAvailable: boolean, languageBootstrap: boolean) {
  const { isAuthenticated, isLoading, isAuthBusy, hasCompletedOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashHidden, setSplashHidden] = React.useState(false);

  useEffect(() => {
    if (isLoading || isAuthBusy || languageBootstrap) return;

    const segs = segments as readonly string[];
    if (segs.length === 0 || segs[0] === undefined) {
      return;
    }

    const inAuthGroup = segs[0] === '(auth)';
    const isOnboarding = inAuthGroup && segs[1] === 'onboarding';

    if (!splashHidden && splashAvailable) {
      setSplashHidden(true);
      setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch {
          // Ignore - splash screen not available or already hidden
        }
      }, 100);
    }

    if (!hasCompletedOnboarding) {
      if (!isOnboarding) {
        log.info('[Auth] Redirecting to onboarding');
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      log.info('[Auth] Redirecting to login');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      log.info('[Auth] Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [
    isAuthenticated,
    isLoading,
    isAuthBusy,
    hasCompletedOnboarding,
    segments,
    router,
    splashHidden,
    splashAvailable,
    languageBootstrap,
  ]);

  return isLoading || isAuthBusy || languageBootstrap;
}

function RootLayoutNav({ splashAvailable }: { splashAvailable: boolean }) {
  const { isLoading: isLanguageBootstrapping } = useLanguage();
  /** Auth bootstrap overlay — Stack stays mounted so `Redirect` / `router.replace` to `(auth)` always has a navigator. */
  const showAuthBootstrapOverlay = useProtectedRoute(splashAvailable, isLanguageBootstrapping);
  const segments = useSegments();
  const { colors, colorScheme } = useTheme();
  const inAuthGroup = segments[0] === "(auth)";

  const envSource = Constants.executionEnvironment ? ` (${Constants.executionEnvironment})` : "";
  const showEnvBanner = !isSupabaseConfigured && __DEV__ && !inAuthGroup;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {showEnvBanner && (
        <View style={[styles.envBanner, { backgroundColor: colors.error }]}>
          <Text style={styles.envBannerText} numberOfLines={1}>
            Missing Supabase: set EXPO_PUBLIC_SUPABASE_URL & ANON_KEY in .env{envSource}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
      <Stack
        key={colorScheme}
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="quiz-session" 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen 
        name="quiz-chapters" 
        options={{ 
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
      <Stack.Screen 
        name="delete-account" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen 
        name="paywall" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
      {showAuthBootstrapOverlay && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.loadingContainer,
            { backgroundColor: colors.background, zIndex: 100 },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  envBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  envBannerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

const paperIconFallbacks: Record<string, string> = {
  "arrow-left": "<",
  "chevron-left": "<",
  "content-save": "OK",
  "eye": "show",
  "eye-off": "hide",
  "email-outline": "@",
  "magnify": "?",
  "cog-outline": "*",
  "close": "x",
};

function PaperIconFallback({
  color,
  name,
  size,
}: {
  color?: string;
  name: string;
  size: number;
}) {
  const label = paperIconFallbacks[name] ?? name.slice(0, 1).toUpperCase();
  return (
    <Text
      style={{
        color: color ?? "#64748b",
        fontSize: Math.max(11, Math.round(size * 0.55)),
        fontWeight: "700",
      }}
    >
      {label}
    </Text>
  );
}

function PaperProviderWrapper({ children }: { children: React.ReactNode }) {
  const { colors, colorScheme } = useTheme();
  const paperTheme = React.useMemo(
    () => getPaperTheme(colors, colorScheme === "dark"),
    [colors, colorScheme]
  );
  return (
    <PaperProvider
      theme={paperTheme}
      settings={{
        // Avoid vector-icon font asset downloads in dev clients; missing font URLs crash ExpoAsset.
        icon: PaperIconFallback,
      }}
    >
      {children}
    </PaperProvider>
  );
}

function AppProvidersTree() {
  const trpcClient = React.useMemo(() => createMedvbaTrpcClient(), []);
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PaperProviderWrapper>
              <AuthProvider>
                <LanguageProvider>
                  <SubscriptionProvider>
                    <QuizProgressProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <RootLayoutNav splashAvailable={splashScreenAvailable} />
                      </GestureHandlerRootView>
                    </QuizProgressProvider>
                  </SubscriptionProvider>
                </LanguageProvider>
              </AuthProvider>
            </PaperProviderWrapper>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

function ExternalAuthSdkBoundary({ children }: { children: React.ReactNode }) {
  const webAuthStub = React.useMemo(
    () => ({
      login: async () => ({
        success: false,
        errorMessage: `${PUBLIC_APP_NAME} web login is disabled in this dev setup.`,
      }),
      register: async () => ({
        success: false,
        errorMessage: `${PUBLIC_APP_NAME} web registration is disabled in this dev setup.`,
      }),
      logout: async () => ({ success: true }),
      portal: async () => {},
      getAccessToken: async () => null,
      getIdToken: async () => null,
      getDecodedToken: async () => null,
      getPermission: async () => ({ isGranted: false, permissionKey: "", orgCode: null }),
      getPermissions: async () => ({ permissions: [], orgCode: null }),
      getClaims: async () => null,
      getClaim: async () => null,
      getCurrentOrganization: async () => null,
      getUserOrganizations: async () => null,
      getUserProfile: async () => null,
      getRoles: async () => [],
      getFlag: async () => null,
      refreshToken: async () => ({
        success: false,
        error: `${PUBLIC_APP_NAME} web session refresh is disabled in this dev setup.`,
      }),
      isAuthenticated: false,
      isLoading: false,
    }),
    [],
  );

  if (Platform.OS === "web") {
    return (
      <KindeAuthContext.Provider value={webAuthStub as React.ContextType<typeof KindeAuthContext>}>
        {children}
      </KindeAuthContext.Provider>
    );
  }

  return (
    <KindeAuthProvider
      config={{
        domain: (kindeIssuerUrl || 'https://__configure_kinde__.kinde.com').replace(/\/+$/, ''),
        clientId: kindeClientId || '__configure_kinde__',
        scopes: kindeScopes,
      }}
      callbacks={{
        onError: ({ error, errorDescription }) => {
          if (__DEV__) {
            log.warn('[Kinde]', error, errorDescription);
          }
        },
      }}
    >
      {children}
    </KindeAuthProvider>
  );
}

export default function RootLayout() {
  if (!kindeIssuerUrl?.trim() || !kindeClientId?.trim()) {
    console.warn(
      `[${PUBLIC_APP_NAME}] Set EXPO_PUBLIC_KINDE_ISSUER_URL and EXPO_PUBLIC_KINDE_CLIENT_ID (see .env.example). Using placeholders until configured.`,
    );
  }
  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <NativeSplashFailsafe />
        <ExternalAuthSdkBoundary>
          <AppProvidersTree />
        </ExternalAuthSdkBoundary>
        <BootstrapLoadingOverlay />
      </View>
    </ErrorBoundary>
  );
}
