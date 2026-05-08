/**
 * providers/AuthProvider.tsx
 *
 * Cognito-only auth provider.
 *
 * All auth operations (email/password, social login) route through AWS Cognito.
 * Social login uses the Hosted UI PKCE flow (expo-web-browser), which opens a
 * browser tab and redirects back via the `medvba://auth/cognito-callback` deep link.
 *
 * Supabase is kept only for database access (profiles, progress, etc.).
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/lib/supabase-hooks';
import { AppState, Platform } from 'react-native';

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

import type { AuthUser, AuthSession, AuthError } from '@/types/auth';
import type { UserProfile } from '@/types/user';
import { log } from '@/lib/log';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

/** Return in `AuthError.message` when user closes OAuth; callers should not alert or treat as success. */
export const AUTH_SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED';

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

// ---------------------------------------------------------------------------
// Cognito session → app session helpers
// ---------------------------------------------------------------------------

function cognitoSessionToAuthSession(cs: CognitoSession): AuthSession {
  return {
    accessToken: cs.tokens.idToken,
    refreshToken: cs.tokens.refreshToken,
    expiresAt: cs.tokens.expiresAt,
    user: {
      id: cs.user.sub,
      email: cs.user.email ?? '',
      name: cs.user.name,
    },
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
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
  ) => Promise<{ error: AuthError | null; session: AuthSession | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithBiometric: () => Promise<{ error: AuthError | null; requiresPassword?: boolean }>;
  enableBiometric: (enable: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  applyServerProfilePatch: (row: {
    profile_photo_url?: string | null;
    avatar?: string | null;
    name?: string | null;
  }) => void;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const { data: userProfile } = useUserProfile(user?.id);
  const lastPresenceAtRef = useRef(0);
  const lastIsPublicRef = useRef<boolean | null>(null);

  // -------------------------------------------------------------------------
  // Profile helpers
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
    async (newSession: AuthSession | null, mounted: { current: boolean }) => {
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

        const cogSession = await Promise.race([
          getCognitoSession(),
          new Promise<null>((resolve) => {
            authInitTimeout = setTimeout(() => resolve(null), AUTH_INIT_TIMEOUT_MS);
          }),
        ]);

        if (authInitTimeout) {
          clearTimeout(authInitTimeout);
          authInitTimeout = null;
        }

        const resolvedSession = cogSession ? cognitoSessionToAuthSession(cogSession) : null;
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

    return () => {
      mountedRef.current = false;
      if (authInitTimeout) clearTimeout(authInitTimeout);
    };
  }, [applySession, checkOnboardingStatus]);

  // -------------------------------------------------------------------------
  // Auth actions — email / password
  // -------------------------------------------------------------------------

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        log.info('[Auth] Signing up user:', email);
        await cognitoSignUp(email, password, name);
        // After sign-up the user must confirm their email before they can sign in.
        return { error: null, session: null };
      } catch (error) {
        log.error('[Auth] Unexpected sign up error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError, session: null };
        }
        return { error: error as AuthError, session: null };
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const cogSession = await cognitoSignIn(email, password);
        const authSession = cognitoSessionToAuthSession(cogSession);
        const mountedRef = { current: true };
        await applySession(authSession, mountedRef);
        return { error: null };
      } catch (error) {
        log.error('[Auth] Unexpected sign in error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError };
        }
        return { error: error as AuthError };
      }
    },
    [applySession]
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
    await cognitoSignOut().catch((e) => log.error('[Auth] Cognito sign-out error:', e));

    setSession(null);
    setUser(null);
    setProfile(null);
    queryClient.clear();
    log.info('[Auth] Signed out (session cleared)');
  }, [queryClient]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        log.info('[Auth] Sending password reset to:', email);
        await cognitoForgotPassword(email);
        return { error: null };
      } catch (error) {
        log.error('[Auth] Unexpected password reset error:', error);
        if (error instanceof CognitoError) {
          return { error: { message: error.message } as AuthError };
        }
        return { error: error as AuthError };
      }
    },
    []
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
  // Social sign-in — all via Cognito Hosted UI PKCE flow
  // -------------------------------------------------------------------------

  const _handleCognitoSocialSuccess = useCallback(
    async (cogSession: CognitoSession) => {
      const authSession = cognitoSessionToAuthSession(cogSession);
      const mountedRef = { current: true };
      await ensureUserExists(cogSession.user.sub, cogSession.user.email, cogSession.user.name, mountedRef);
      await applySession(authSession, mountedRef);
    },
    [ensureUserExists, applySession]
  );

  const signInWithGoogle = useCallback(async () => {
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
  }, [_handleCognitoSocialSuccess]);

  const signInWithFacebook = useCallback(async () => {
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
  }, [_handleCognitoSocialSuccess]);

  const signInWithApple = useCallback(async () => {
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
  }, [_handleCognitoSocialSuccess]);

  // Social account linking — Cognito manages provider linking centrally via Hosted UI
  const linkGoogleAccount = useCallback(async () => ({ error: null }), []);
  const linkFacebookAccount = useCallback(async () => ({ error: null }), []);
  const linkAppleAccount = useCallback(async () => ({ error: null }), []);
  const unlinkGoogleAccount = useCallback(async () => ({ error: null }), []);
  const unlinkFacebookAccount = useCallback(async () => ({ error: null }), []);
  const unlinkAppleAccount = useCallback(async () => ({ error: null }), []);

  // -------------------------------------------------------------------------
  // Presence heartbeat
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
