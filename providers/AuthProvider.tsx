/**
 * providers/AuthProvider.tsx
 *
 * Single-entry-point auth provider.
 *
 * When EXPO_PUBLIC_COGNITO_USER_POOL_ID is set, all auth operations
 * (email/password, social login) route through AWS Cognito.
 * Otherwise, the existing Supabase Auth flows are used unchanged.
 *
 * Social login via Cognito uses the Hosted UI PKCE flow (expo-web-browser),
 * which means Google, Facebook, and Apple each open a browser tab and redirect
 * back via the `medvba://auth/cognito-callback` deep link.
 *
 * NOTE — DB migration required for Cognito users:
 *   The `profiles.id` column is currently a FK to `auth.users.id` in Supabase.
 *   For Cognito-managed users, that FK must be dropped so Cognito `sub` values
 *   can be stored as profile IDs. Run:
 *     ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
 *   before enabling Cognito in production.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/lib/supabase-hooks';
import { AppState, Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { appleAuth } from '@/lib/appleAuth';
import * as WebBrowser from 'expo-web-browser';
import {
  authenticateWithBiometric,
  isBiometricAvailable,
  getBiometricCapabilities,
  getBiometricTypeName,
  type BiometricCapabilities,
} from '@/lib/biometric';

import {
  isCognitoConfigured,
  cognitoSignIn,
  cognitoSignUp,
  cognitoSignOut,
  cognitoForgotPassword,
  cognitoSocialSignIn,
  getCognitoSession,
  CognitoError,
  type CognitoSession,
} from '@/lib/cognito';

let fbsdk: any = null;
if (Platform.OS !== 'web') {
  try {
    // @ts-ignore
    const fb = require('react-native-fbsdk-next');
    fbsdk = { LoginManager: fb.LoginManager, AccessToken: fb.AccessToken };
  } catch {}
}
import Constants from 'expo-constants';
import { log } from '@/lib/log';

import type { UserProfile } from '@/types/user';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

/** Return in `AuthError.message` when user closes OAuth; callers should not alert or treat as success. */
export const AUTH_SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED';

/** Shown when Google returns no ID token (wrong Web client ID or Android OAuth SHA-1 mismatch). */
const GOOGLE_NO_ID_TOKEN_MESSAGE =
  'Google Sign-In failed. Please try again or use email login.';

const extraConfig = Constants.expoConfig?.extra ?? {};
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extraConfig.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extraConfig.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || googleIosClientId || '';
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || extraConfig.EXPO_PUBLIC_FACEBOOK_APP_ID || '';
const appleClientId = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || extraConfig.EXPO_PUBLIC_APPLE_CLIENT_ID || '';
const passwordResetRedirectUri = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URI || extraConfig.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URI || 'medvba://reset-password';

const isAbortError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('signal is aborted') ||
           error.message.includes('abort');
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message);
    return msg.includes('signal is aborted') || msg.includes('abort');
  }
  return false;
};

/** Deep link return for Supabase OAuth (Facebook login + link) — add to Supabase Auth redirect URLs. */
const SUPABASE_OAUTH_REDIRECT = 'medvba://auth/callback';

function getQueryParam(url: string, key: string): string | null {
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  const start = qIndex >= 0 ? qIndex + 1 : hIndex >= 0 ? hIndex + 1 : -1;
  if (start < 0) return null;
  const end = hIndex >= 0 && hIndex > start ? hIndex : url.length;
  const qs = url.slice(start, end);
  for (const part of qs.split('&')) {
    if (!part) continue;
    const [k, v = ''] = part.split('=');
    if (decodeURIComponent(k) === key) return decodeURIComponent(v);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cognito session → Supabase-compatible shape helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Supabase-like `User` object from a Cognito session so that
 * the rest of the app can use `user.id` and `user.email` unchanged.
 */
function cognitoUserToSupabaseUser(session: CognitoSession): User {
  return {
    id: session.user.sub,
    email: session.user.email,
    user_metadata: { name: session.user.name ?? '' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
  } as unknown as User;
}

/**
 * Build a minimal Supabase-like `Session` from a Cognito session.
 * The `access_token` field carries the Cognito ID token so that `lib/trpc.ts`
 * can fall through to the supabase.auth.getSession() path unchanged during
 * the transition, while the dedicated `getCognitoIdToken()` path takes priority.
 */
function cognitoSessionToSupabaseSession(cs: CognitoSession): Session {
  return {
    access_token: cs.tokens.idToken,
    refresh_token: cs.tokens.refreshToken,
    expires_at: cs.tokens.expiresAt,
    token_type: 'bearer',
    user: cognitoUserToSupabaseUser(cs),
  } as unknown as Session;
}

// ---------------------------------------------------------------------------
// Types (unchanged public interface)
// ---------------------------------------------------------------------------

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  biometricCapabilities: BiometricCapabilities | null;
  isBiometricEnabled: boolean;
}

interface AuthActions {
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: AuthError | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithBiometric: () => Promise<{ error: AuthError | null; requiresPassword?: boolean }>;
  enableBiometric: (enable: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  completeOnboarding: () => Promise<void>;
  /** Clears onboarding flag so intro slides show again on next launch / navigation. */
  resetOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Merge fields from a profiles row (e.g. Supabase update response) so UI matches DB without waiting on a second fetch. */
  applyServerProfilePatch: (row: {
    profile_photo_url?: string | null;
    avatar?: string | null;
    name?: string | null;
  }) => void;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
  // Social account linking
  linkGoogleAccount: () => Promise<{ error: AuthError | null }>;
  linkFacebookAccount: () => Promise<{ error: AuthError | null }>;
  linkAppleAccount: () => Promise<{ error: AuthError | null }>;
  unlinkGoogleAccount: () => Promise<{ error: AuthError | null }>;
  unlinkFacebookAccount: () => Promise<{ error: AuthError | null }>;
  unlinkAppleAccount: () => Promise<{ error: AuthError | null }>;
}

type AuthContextValue = AuthState & AuthActions;

const BIOMETRIC_ENABLED_KEY = '@medvba_biometric_enabled';

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const { data: userProfile } = useUserProfile(user?.id);
  const lastPresenceAtRef = useRef(0);
  const lastIsPublicRef = useRef<boolean | null>(null);
  /** Prevents overlapping @react-native-google-signin calls ("Sign-in in progress" / promise overwrite). */
  const googleNativeSignInBusyRef = useRef(false);

  const useCognito = isCognitoConfigured();

  // -------------------------------------------------------------------------
  // Profile helpers (shared by both Supabase and Cognito paths)
  // -------------------------------------------------------------------------

  const ensureUserExists = useCallback(async (userId: string, email: string | undefined, name: string | undefined, mounted?: { current: boolean }) => {
    try {
      if (mounted && !mounted.current) return;
      log.info('[Auth] Checking if profile exists for user:', userId);
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (mounted && !mounted.current) return;
      if (!existingProfile) {
        log.info('[Auth] Profile not found, creating...');
        await supabase.from('profiles').insert({
          id: userId,
          name: name || 'Student',
          avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`,
          profile_photo_url: `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`,
        });
        if (!mounted || mounted.current) {
          log.info('[Auth] Profile created');
        }
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if (mounted && !mounted.current) return;
      log.error('[Auth] Error ensuring profile exists:', error);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, email: string | undefined, mounted: { current: boolean }) => {
    await ensureUserExists(userId, email, undefined, mounted);

    try {
      if (!mounted.current) return;
      log.info('[Auth] Fetching profile for user:', userId);
      const { data: result, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!mounted.current) return;
      if (error) throw error;

        if (result) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!mounted.current) return;

        const displayAvatar =
          result.profile_photo_url || result.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`;
        const userProfile: UserProfile = {
          id: result.id,
          name: result.name || 'Student',
          avatar: displayAvatar,
          profile_photo_url: result.profile_photo_url ?? undefined,
          rank: 0,
          points: progressData?.total_questions_answered || 0,
          streak: progressData?.current_streak || 0,
          questionsAnswered: progressData?.total_questions_answered || 0,
          accuracy: progressData?.correct_answers && progressData?.total_questions_answered
            ? (progressData.correct_answers / progressData.total_questions_answered) * 100
            : 0,
          studyHours: progressData?.study_time_seconds
            ? Number((progressData.study_time_seconds / 3600).toFixed(1))
            : 0,
          badges: [],
          joinedAt: result.created_at || new Date().toISOString(),
          isPublic: result.is_public ?? true,
        };
        setProfile(userProfile);
        log.info('[Auth] Profile fetched successfully:', userProfile.name);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if (!mounted.current) return;
      log.info('[Auth] Using default profile for user:', userId);

      setProfile({
        id: userId,
        name: 'Student',
        avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`,
        rank: 0,
        points: 0,
        streak: 0,
        questionsAnswered: 0,
        accuracy: 0,
        studyHours: 0,
        badges: [],
        joinedAt: new Date().toISOString(),
        isPublic: true,
      });
    }
  }, [ensureUserExists]);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      setHasCompletedOnboarding(completed === 'true');
      log.info('[Auth] Onboarding status:', completed === 'true');
    } catch (error) {
      if (isAbortError(error)) return;
      log.error('[Auth] Error checking onboarding status:', error);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Session helpers
  // -------------------------------------------------------------------------

  const applySession = useCallback(
    async (newSession: Session | null, mounted: { current: boolean }) => {
      if (!mounted.current) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email, mounted);
      } else {
        setProfile(null);
      }
    },
    [fetchProfile]
  );

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  useEffect(() => {
    const mountedRef = { current: true };
    const AUTH_INIT_TIMEOUT_MS = 15000;
    let authInitTimeout: ReturnType<typeof setTimeout> | null = null;

    const initializeAuth = async () => {
      try {
        await checkOnboardingStatus();
        if (!mountedRef.current) return;

        if (Platform.OS !== 'web') {
          const capabilities = await getBiometricCapabilities();
          if (mountedRef.current) setBiometricCapabilities(capabilities);
          const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
          if (mountedRef.current) {
            setIsBiometricEnabled(
              biometricEnabled === 'true' && capabilities.hasHardware && capabilities.isEnrolled
            );
          }
        }

        let resolvedSession: Session | null = null;

        if (useCognito) {
          // --- Cognito path ---
          const cogSession = await Promise.race([
            getCognitoSession(),
            new Promise<null>((resolve) => {
              authInitTimeout = setTimeout(() => resolve(null), AUTH_INIT_TIMEOUT_MS);
            }),
          ]);
          if (cogSession) {
            resolvedSession = cognitoSessionToSupabaseSession(cogSession);
          }
        } else {
          // --- Supabase path ---
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) => {
            authInitTimeout = setTimeout(
              () => resolve({ data: { session: null } }),
              AUTH_INIT_TIMEOUT_MS
            );
          });
          const { data: { session: currentSession } } = await Promise.race([
            sessionPromise,
            timeoutPromise,
          ]);
          resolvedSession = currentSession;
        }

        if (authInitTimeout) {
          clearTimeout(authInitTimeout);
          authInitTimeout = null;
        }

        await applySession(resolvedSession, mountedRef);

        if (mountedRef.current) {
          setIsLoading(false);
          log.info('[Auth] Auth initialized, session:', !!resolvedSession);
        }
      } catch (error) {
        if (isAbortError(error)) return;
        if (!mountedRef.current) return;
        log.error('[Auth] Error initializing auth:', error);
        if (mountedRef.current) setIsLoading(false);
      }
    };

    initializeAuth();

    // Supabase-path: subscribe to auth state changes
    let supabaseUnsubscribe: (() => void) | null = null;
    if (!useCognito) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          log.info('[Auth] Auth state changed:', event);
          if (!mountedRef.current) return;
          await applySession(newSession, mountedRef);
        }
      );
      supabaseUnsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      mountedRef.current = false;
      if (authInitTimeout) clearTimeout(authInitTimeout);
      supabaseUnsubscribe?.();
    };
  }, [applySession, checkOnboardingStatus, useCognito]);

  // -------------------------------------------------------------------------
  // Auth actions — email / password
  // -------------------------------------------------------------------------

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        log.info('[Auth] Signing up user:', email);

        if (useCognito) {
          await cognitoSignUp(email, password, name);
          // After sign-up the user must confirm their email before they can sign in.
          // Return an empty session — the caller (signup screen) should show the
          // "check your email for a verification code" step.
          return { error: null, session: null };
        }

        // --- Supabase path ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });

        if (error) {
          log.error('[Auth] Sign up error:', error.message);
          return { error, session: null };
        }

        log.info('[Auth] User created in auth.users:', data?.user?.id);

        if (data?.user) {
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.user.id)
              .single();

            if (!existingProfile) {
              const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                name: name || 'Student',
                avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${data.user.id}`,
                profile_photo_url: `https://api.dicebear.com/7.x/avataaars/png?seed=${data.user.id}`,
              });
              if (profileError) {
                log.error('[Auth] Fallback profile creation failed:', profileError.message);
              }
            }
          } catch (profileCheckError) {
            log.error('[Auth] Error checking/creating profile:', profileCheckError);
          }
        }

        return { error: null, session: data.session ?? null };
      } catch (error) {
        log.error('[Auth] Unexpected sign up error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError, session: null };
        }
        return { error: error as AuthError, session: null };
      }
    },
    [useCognito]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        if (useCognito) {
          const cogSession = await cognitoSignIn(email, password);
          const supabaseSession = cognitoSessionToSupabaseSession(cogSession);
          const mountedRef = { current: true };
          await applySession(supabaseSession, mountedRef);
          return { error: null };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) log.error('[Auth] Sign in error:', error.message);
        return { error };
      } catch (error) {
        log.error('[Auth] Unexpected sign in error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError };
        }
        return { error: error as AuthError };
      }
    },
    [useCognito, applySession]
  );

  const signInWithBiometric = useCallback(async () => {
    if (Platform.OS === 'web') {
      return { error: { message: 'Biometric authentication not available on web' } as AuthError };
    }
    if (!biometricCapabilities?.hasHardware || !biometricCapabilities?.isEnrolled) {
      return { error: { message: 'Biometric authentication not available' } as AuthError };
    }
    try {
      const result = await authenticateWithBiometric('Authenticate to access MEDVBA');
      if (!result.success) {
        if (result.error === 'user_fallback') return { error: null, requiresPassword: true };
        return { error: { message: result.error } as AuthError };
      }
      log.info('[Auth] Biometric authentication successful');
      return { error: null };
    } catch (error) {
      log.error('[Auth] Biometric authentication error:', error);
      return { error: error as AuthError };
    }
  }, [biometricCapabilities]);

  const enableBiometric = useCallback(async (enable: boolean) => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enable ? 'true' : 'false');
      setIsBiometricEnabled(enable);
    } catch (error) {
      log.error('[Auth] Error setting biometric preference:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (useCognito) {
      await cognitoSignOut().catch((e) => log.error('[Auth] Cognito sign-out error:', e));
    } else {
      try {
        const { error: globalErr } = await supabase.auth.signOut({ scope: 'global' });
        if (globalErr) {
          log.warn('[Auth] Global sign-out failed, trying local:', globalErr.message);
          await supabase.auth.signOut({ scope: 'local' }).catch((e) =>
            log.error('[Auth] Local sign-out failed:', e)
          );
        }
      } catch (error) {
        log.error('[Auth] Sign out error:', error);
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
    }

    if (Platform.OS !== 'web') {
      try { await GoogleSignin.signOut(); } catch {}
      try { fbsdk?.LoginManager?.logOut?.(); } catch {}
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    queryClient.clear();
    log.info('[Auth] Signed out (session cleared)');
  }, [useCognito, queryClient]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        log.info('[Auth] Sending password reset to:', email);

        if (useCognito) {
          await cognitoForgotPassword(email);
          return { error: null };
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: passwordResetRedirectUri,
        });
        if (error) log.error('[Auth] Password reset error:', error);
        return { error };
      } catch (error) {
        log.error('[Auth] Unexpected password reset error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError };
        }
        return { error: error as AuthError };
      }
    },
    [useCognito]
  );

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      log.error('[Auth] Error completing onboarding:', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      setHasCompletedOnboarding(false);
    } catch (error) {
      log.error('[Auth] Error resetting onboarding:', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const mountedRef = { current: true };
      await fetchProfile(user.id, user.email, mountedRef);
    }
  }, [user, fetchProfile]);

  const applyServerProfilePatch = useCallback(
    (row: { profile_photo_url?: string | null; avatar?: string | null; name?: string | null }) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const hasPhotoKey = 'profile_photo_url' in row;
        const nextPhoto = hasPhotoKey
          ? row.profile_photo_url && row.profile_photo_url.length > 0
            ? row.profile_photo_url
            : undefined
          : prev.profile_photo_url;
        const displayAvatar = (nextPhoto || row.avatar || prev.avatar) as string;
        return {
          ...prev,
          ...(typeof row.name === 'string' && row.name.length > 0 ? { name: row.name } : {}),
          avatar: displayAvatar || prev.avatar,
          profile_photo_url: nextPhoto,
        };
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Social sign-in
  // -------------------------------------------------------------------------

  /**
   * Handle post-authentication for Cognito social flows:
   * ensure the profile exists and update session state.
   */
  const _handleCognitoSocialSuccess = useCallback(
    async (cogSession: CognitoSession) => {
      const supabaseSession = cognitoSessionToSupabaseSession(cogSession);
      const mountedRef = { current: true };
      await ensureUserExists(cogSession.user.sub, cogSession.user.email, cogSession.user.name, mountedRef);
      await applySession(supabaseSession, mountedRef);
    },
    [ensureUserExists, applySession]
  );

  const signInWithGoogle = useCallback(async () => {
    if (useCognito) {
      // Cognito Hosted UI handles Google OAuth — all platforms, no native SDK required.
      try {
        const cogSession = await cognitoSocialSignIn('Google');
        if (!cogSession) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
        await _handleCognitoSocialSuccess(cogSession);
        return { error: null };
      } catch (error) {
        log.error('[Auth] Cognito Google sign-in error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError };
        }
        return { error: error as AuthError };
      }
    }

    // --- Supabase + native Google SDK path ---
    if (Platform.OS === 'web') {
      return { error: { message: 'Google Sign-In is not available on web. Please use email login.' } as AuthError };
    }
    if (!googleWebClientId?.trim()) {
      return {
        error: {
          message: 'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env or EAS secrets.',
        } as AuthError,
      };
    }
    if (googleNativeSignInBusyRef.current) {
      return { error: { message: 'Another Google sign-in is already in progress. Please wait a moment.' } as AuthError };
    }
    googleNativeSignInBusyRef.current = true;
    try {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        ...(Platform.OS === 'ios' && googleIosClientId ? { iosClientId: googleIosClientId } : {}),
      });
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        if (!hasPlayServices) return { error: { message: 'Google Play Services not available' } as AuthError };
      }
      const result = await GoogleSignin.signIn();
      if ((result as any).type === 'cancelled') return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };

      const userInfo = (result as any).data ?? result;
      let idToken: string | null | undefined = userInfo.idToken ?? (result as any).idToken;
      if (!idToken && Platform.OS === 'android') {
        try { const tokens = await GoogleSignin.getTokens(); idToken = tokens.idToken ?? null; } catch {}
      }
      if (!idToken) return { error: { message: GOOGLE_NO_ID_TOKEN_MESSAGE } as AuthError };

      const googleUser = userInfo.user ?? (result as any).user;
      const { data: { user: supabaseUser }, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) return { error };
      if (!supabaseUser) return { error: { message: 'Google Sign-In succeeded but Supabase did not return a user.' } as AuthError };

      await ensureUserExists(supabaseUser.id, supabaseUser.email ?? googleUser?.email, supabaseUser.user_metadata?.name ?? googleUser?.name ?? 'User');
      await supabase.from('profiles').update({ googleId: googleUser?.id }).eq('id', supabaseUser.id);
      return { error: null };
    } catch (error: any) {
      const code = error?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED || code === '12501' || /cancel/i.test(error?.message ?? '')) {
        return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      }
      const msg = String(error?.message ?? error ?? '');
      if (/sign-?in in progress|previous promise did not settle/i.test(msg)) {
        return { error: { message: 'Please finish or cancel the Google sign-in window before trying again.' } as AuthError };
      }
      log.error('[Auth] Google Sign-In error:', error?.message || error);
      return { error: { message: msg || 'Google Sign-In failed' } as AuthError };
    } finally {
      googleNativeSignInBusyRef.current = false;
    }
  }, [useCognito, ensureUserExists, _handleCognitoSocialSuccess, googleWebClientId, googleIosClientId]);

  const signInWithFacebook = useCallback(async () => {
    if (useCognito) {
      // Cognito Hosted UI handles Facebook OAuth.
      try {
        const cogSession = await cognitoSocialSignIn('Facebook');
        if (!cogSession) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
        await _handleCognitoSocialSuccess(cogSession);
        return { error: null };
      } catch (error) {
        log.error('[Auth] Cognito Facebook sign-in error:', error);
        if (error instanceof CognitoError) return { error: { message: error.message } as AuthError };
        return { error: error as AuthError };
      }
    }

    // --- Supabase OAuth redirect path ---
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: SUPABASE_OAUTH_REDIRECT },
      });
      if (error) return { error };
      const authUrl = data?.url;
      if (!authUrl) return { error: { message: 'Facebook OAuth did not return an authorization URL' } as AuthError };

      const res = await WebBrowser.openAuthSessionAsync(authUrl, SUPABASE_OAUTH_REDIRECT);
      if (res.type !== 'success' || !res.url) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };

      const code = getQueryParam(res.url, 'code');
      if (!code) {
        const errDesc = getQueryParam(res.url, 'error_description') || getQueryParam(res.url, 'error');
        return { error: { message: errDesc || 'Facebook OAuth did not return a code' } as AuthError };
      }

      const exchanged = await supabase.auth.exchangeCodeForSession(code);
      if (exchanged.error) return { error: exchanged.error as AuthError };

      const sessionUser = exchanged.data.session?.user;
      if (!sessionUser) return { error: { message: 'Facebook login succeeded but no user session was created.' } as AuthError };

      const fbIdentity = sessionUser.identities?.find((i) => i.provider === 'facebook');
      const idData = fbIdentity?.identity_data as Record<string, unknown> | undefined;
      const facebookUserId =
        (typeof idData?.sub === 'string' && idData.sub) ||
        (typeof idData?.provider_id === 'string' && idData.provider_id) ||
        null;

      await ensureUserExists(sessionUser.id, sessionUser.email ?? undefined, (sessionUser.user_metadata?.name as string | undefined) ?? 'User');
      if (facebookUserId) {
        await supabase.auth.updateUser({ data: { facebookId: facebookUserId } });
        await supabase.from('profiles').update({ facebookId: facebookUserId }).eq('id', sessionUser.id);
      }
      return { error: null };
    } catch (error) {
      log.error('[Auth] Facebook sign in error:', error);
      return { error: error as AuthError };
    }
  }, [useCognito, ensureUserExists, _handleCognitoSocialSuccess]);

  const signInWithApple = useCallback(async () => {
    if (useCognito) {
      // Cognito Hosted UI handles Apple Sign-In on all platforms.
      try {
        const cogSession = await cognitoSocialSignIn('SignInWithApple');
        if (!cogSession) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
        await _handleCognitoSocialSuccess(cogSession);
        return { error: null };
      } catch (error) {
        log.error('[Auth] Cognito Apple sign-in error:', error);
        if (error instanceof CognitoError) return { error: { message: error.message } as AuthError };
        return { error: error as AuthError };
      }
    }

    // --- Native Apple Sign-In path (Supabase) ---
    try {
      if (!appleAuth || !appleAuth.isSupported) {
        return { error: { message: 'Apple Sign-In is not available on this device' } as AuthError };
      }
      const response = await appleAuth.performRequest({
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      if (!response.identityToken) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };

      const { data: { user: supabaseUser }, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: response.identityToken,
        nonce: response.nonce,
      });
      if (error) return { error };
      if (!supabaseUser) return { error: { message: 'Apple Sign-In succeeded but Supabase did not return a user.' } as AuthError };

      const nameFromMetadata = supabaseUser.user_metadata?.name;
      const nameFromResponse = `${response.fullName?.givenName ?? ''} ${response.fullName?.familyName ?? ''}`.trim();
      const safeName = (nameFromMetadata ?? nameFromResponse) || 'User';
      await ensureUserExists(supabaseUser.id, supabaseUser.email ?? response.email, safeName);
      await supabase.from('profiles').update({ appleId: response.user }).eq('id', supabaseUser.id);
      return { error: null };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error ?? '');
      if (/cancel/i.test(msg)) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      log.error('[Auth] Apple Sign-In error:', error);
      return { error: error as AuthError };
    }
  }, [useCognito, ensureUserExists, _handleCognitoSocialSuccess]);

  // -------------------------------------------------------------------------
  // Social account linking (Supabase only — Cognito manages provider linking
  // centrally in the User Pool; no client-side action required)
  // -------------------------------------------------------------------------

  const linkGoogleAccount = useCallback(async () => {
    if (useCognito) return { error: null }; // Cognito links automatically via Hosted UI
    if (!user) return { error: { message: 'No authenticated user' } as AuthError };
    if (!googleWebClientId?.trim()) {
      return { error: { message: 'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env or EAS secrets.' } as AuthError };
    }
    if (googleNativeSignInBusyRef.current) {
      return { error: { message: 'Another Google sign-in is already in progress.' } as AuthError };
    }
    googleNativeSignInBusyRef.current = true;
    try {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        ...(Platform.OS === 'ios' && googleIosClientId ? { iosClientId: googleIosClientId } : {}),
      });
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        if (!hasPlayServices) return { error: { message: 'Google Play Services not available' } as AuthError };
      }
      const result = await GoogleSignin.signIn();
      if ((result as any).type === 'cancelled') return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      const userInfo = (result as any).data ?? result;
      const googleUser = userInfo.user ?? (result as any).user;
      if (!googleUser?.id) return { error: { message: 'Google Sign-In did not return a user ID' } as AuthError };
      const { error } = await supabase.auth.updateUser({ data: { googleId: googleUser.id } });
      if (error) return { error };
      await supabase.from('profiles').update({ googleId: googleUser.id }).eq('id', user.id);
      await refreshProfile();
      return { error: null };
    } catch (error: any) {
      if (error?.code === '12501' || /cancel/i.test(error?.message ?? '')) {
        return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      }
      return { error: { message: error?.message || 'Failed to link Google account' } as AuthError };
    } finally {
      googleNativeSignInBusyRef.current = false;
    }
  }, [useCognito, user, refreshProfile, googleWebClientId, googleIosClientId]);

  const linkFacebookAccount = useCallback(async () => {
    if (useCognito) return { error: null };
    if (!user) return { error: { message: 'No authenticated user' } as AuthError };
    if (!fbsdk) return { error: { message: 'Facebook Sign-In is not available on this platform' } as AuthError };
    try {
      const { LoginManager, AccessToken } = fbsdk;
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      const data = await AccessToken.getCurrentAccessToken();
      const accessToken = data?.accessToken;
      if (!accessToken) return { error: { message: 'Failed to get Facebook access token' } as AuthError };
      const facebookResponse = await fetch('https://graph.facebook.com/me?fields=id,name,email', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      if (!facebookResponse.ok) return { error: { message: 'Failed to verify Facebook account' } as AuthError };
      const facebookUser = await facebookResponse.json();
      if (!facebookUser.id) return { error: { message: 'Facebook Sign-In did not return a user ID' } as AuthError };
      const { error } = await supabase.auth.updateUser({ data: { facebookId: facebookUser.id } });
      if (error) return { error };
      await supabase.from('profiles').update({ facebookId: facebookUser.id }).eq('id', user.id);
      await refreshProfile();
      return { error: null };
    } catch (error) {
      log.error('[Auth] Link Facebook account error:', error);
      return { error: error as AuthError };
    }
  }, [useCognito, user, refreshProfile]);

  const linkAppleAccount = useCallback(async () => {
    if (useCognito) return { error: null };
    if (!user) return { error: { message: 'No authenticated user' } as AuthError };
    if (!appleAuth || !appleAuth.isSupported) return { error: { message: 'Apple Sign-In is not available on this device' } as AuthError };
    try {
      const response = await appleAuth.performRequest({
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      if (!response.identityToken || !response.user) return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      const { error } = await supabase.auth.updateUser({ data: { appleId: response.user } });
      if (error) return { error };
      await supabase.from('profiles').update({ appleId: response.user }).eq('id', user.id);
      await refreshProfile();
      return { error: null };
    } catch (error) {
      if (error instanceof Error && /cancel/i.test(error.message)) {
        return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
      }
      return { error: error as AuthError };
    }
  }, [useCognito, user, refreshProfile]);

  const unlinkGoogleAccount = useCallback(async () => {
    if (useCognito) return { error: null };
    if (!user) return { error: { message: 'No authenticated user' } as AuthError };
    try {
      const { error } = await supabase.auth.updateUser({ data: { googleId: null } });
      if (error) return { error };
      await supabase.from('profiles').update({ googleId: null }).eq('id', user.id);
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, [useCognito, user, refreshProfile]);

  const unlinkFacebookAccount = useCallback(async () => {
    if (useCognito) return { error: null };
    if (!user) return { error: { message: 'No authenticated user' } as AuthError };
    try {
      const { error } = await supabase.auth.updateUser({ data: { facebookId: null } });
      if (error) return { error };
      await supabase.from('profiles').update({ facebookId: null }).eq('id', user.id);
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, [useCognito, user, refreshProfile]);

  const unlinkAppleAccount = useCallback(async () => {
    if (useCognito) return { error: null };
    if (!user) return { error: { message: 'No authenticated user' } as AuthError };
    try {
      const { error } = await supabase.auth.updateUser({ data: { appleId: null } });
      if (error) return { error };
      await supabase.from('profiles').update({ appleId: null }).eq('id', user.id);
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, [useCognito, user, refreshProfile]);

  // -------------------------------------------------------------------------
  // Presence heartbeat (unchanged)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!user?.id) return;
    const shouldPublishPresence = userProfile?.is_public !== false;
    const PRESENCE_THROTTLE_MS = 5 * 60 * 1000;

    const updatePresence = async (force = false) => {
      if (!shouldPublishPresence) return;
      const now = Date.now();
      if (!force && now - lastPresenceAtRef.current < PRESENCE_THROTTLE_MS) return;
      try {
        await supabase.from('user_presence').upsert(
          { user_id: user.id, last_seen: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        lastPresenceAtRef.current = now;
      } catch (error) {
        log.error('[Auth] Error updating presence:', error);
      }
    };

    const wasPublic = lastIsPublicRef.current;
    lastIsPublicRef.current = shouldPublishPresence;
    if (shouldPublishPresence && (wasPublic === false || wasPublic === null)) {
      updatePresence(true);
    } else {
      updatePresence();
    }

    const presenceInterval = setInterval(updatePresence, PRESENCE_THROTTLE_MS);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') updatePresence(true);
    });

    return () => {
      clearInterval(presenceInterval);
      subscription.remove();
    };
  }, [user?.id, userProfile?.is_public]);

  // -------------------------------------------------------------------------
  // Return context value
  // -------------------------------------------------------------------------

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    hasCompletedOnboarding,
    biometricCapabilities,
    isBiometricEnabled,
    signUp,
    signIn,
    signInWithBiometric,
    enableBiometric,
    signOut,
    resetPassword,
    completeOnboarding,
    resetOnboarding,
    refreshProfile,
    applyServerProfilePatch,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    linkGoogleAccount,
    linkFacebookAccount,
    linkAppleAccount,
    unlinkGoogleAccount,
    unlinkFacebookAccount,
    unlinkAppleAccount,
  };
});
