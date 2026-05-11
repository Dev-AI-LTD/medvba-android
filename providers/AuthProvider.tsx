import { useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/lib/supabase-hooks';
import { AppState, Platform, Linking } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useKindeAuth } from '@kinde/expo';
import {
  authenticateWithBiometric,
  getBiometricCapabilities,
  type BiometricCapabilities,
} from '@/lib/biometric';
import Constants from 'expo-constants';
import { log } from '@/lib/log';
import type { UserProfile } from '@/types/user';
import {
  exchangeEmailPasswordSession,
  exchangeKindeAccessToken,
} from '@/lib/exchange-medvba-session';
import { setMedvbaAccessToken, getMedvbaAccessToken } from '@/lib/medvba-access-token';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

export const AUTH_SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED';

const extraConfig = Constants.expoConfig?.extra ?? {};

function buildSyntheticSession(accessToken: string, profileId: string, email?: string | null): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 900,
    expires_at: now + 900,
    refresh_token: '',
    user: {
      id: profileId,
      aud: 'authenticated',
      role: 'authenticated',
      email: email ?? undefined,
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    } as User,
  } as Session;
}

const isAbortError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('signal is aborted') || error.message.includes('abort')
    );
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message);
    return msg.includes('signal is aborted') || msg.includes('abort');
  }
  return false;
};

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
    name: string,
  ) => Promise<{ error: AuthError | null; session: Session | null }>;
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
}

type AuthContextValue = AuthState & AuthActions;

const BIOMETRIC_ENABLED_KEY = '@medvba_biometric_enabled';

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const queryClient = useQueryClient();
  const kinde = useKindeAuth();
  const kindeRef = useRef(kinde);
  kindeRef.current = kinde;
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

  const applyMedvbaSession = useCallback(
    async (accessToken: string, profileId: string, email?: string | null) => {
      setMedvbaAccessToken(accessToken);
      const syn = buildSyntheticSession(accessToken, profileId, email);
      setSession(syn);
      setUser(syn.user as User);
    },
    [],
  );

  const clearMedvbaSession = useCallback(() => {
    setMedvbaAccessToken(null);
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const ensureUserExists = useCallback(
    async (userId: string, email: string | undefined, name: string | undefined, mounted?: { current: boolean }) => {
      try {
        if (mounted && !mounted.current) return;
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();

        if (mounted && !mounted.current) return;
        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: userId,
            name: name || 'Student',
            avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`,
            profile_photo_url: `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`,
          });
        }
      } catch (error) {
        if (isAbortError(error)) return;
        if (mounted && !mounted.current) return;
        log.error('[Auth] Error ensuring profile exists:', error);
      }
    },
    [],
  );

  const fetchProfile = useCallback(
    async (userId: string, email: string | undefined, mounted: { current: boolean }) => {
      await ensureUserExists(userId, email, undefined, mounted);

      try {
        if (!mounted.current) return;
        const { data: result, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

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
            result.profile_photo_url ||
            result.avatar ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`;
          const userProfileRow: UserProfile = {
            id: result.id,
            name: result.name || 'Student',
            avatar: displayAvatar,
            profile_photo_url: result.profile_photo_url ?? undefined,
            rank: 0,
            points: progressData?.total_questions_answered || 0,
            streak: progressData?.current_streak || 0,
            questionsAnswered: progressData?.total_questions_answered || 0,
            accuracy:
              progressData?.correct_answers && progressData?.total_questions_answered
                ? (progressData.correct_answers / progressData.total_questions_answered) * 100
                : 0,
            studyHours: progressData?.study_time_seconds
              ? Number((progressData.study_time_seconds / 3600).toFixed(1))
              : 0,
            badges: [],
            joinedAt: result.created_at || new Date().toISOString(),
            isPublic: result.is_public ?? true,
            email: email ?? result.email ?? undefined,
          };
          setProfile(userProfileRow);
        }
      } catch (error) {
        if (isAbortError(error)) return;
        if (!mounted.current) return;
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
          email: email ?? undefined,
        });
      }
    },
    [ensureUserExists],
  );

  const syncFromKinde = useCallback(async () => {
    const k = kindeRef.current;
    if (!k.isAuthenticated) {
      clearMedvbaSession();
      return;
    }
    const kt = await k.getAccessToken();
    if (!kt) {
      clearMedvbaSession();
      return;
    }
    const ex = await exchangeKindeAccessToken(kt);
    if (!ex.ok) {
      log.error('[Auth] Kinde exchange failed:', ex.error);
      clearMedvbaSession();
      return;
    }
    const up = await k.getUserProfile();
    await applyMedvbaSession(ex.access_token, ex.profile_id, up?.email);
    const mountedRef = { current: true };
    await fetchProfile(ex.profile_id, up?.email ?? undefined, mountedRef);
  }, [applyMedvbaSession, clearMedvbaSession, fetchProfile]);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      setHasCompletedOnboarding(completed === 'true');
    } catch (error) {
      if (isAbortError(error)) return;
      log.error('[Auth] Error checking onboarding status:', error);
    }
  }, []);

  useEffect(() => {
    const mountedRef = { current: true };
    const init = async () => {
      try {
        await checkOnboardingStatus();
        if (Platform.OS !== 'web') {
          const capabilities = await getBiometricCapabilities();
          if (mountedRef.current) setBiometricCapabilities(capabilities);
          const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
          if (mountedRef.current) {
            setIsBiometricEnabled(
              biometricEnabled === 'true' && capabilities.hasHardware && capabilities.isEnrolled,
            );
          }
        }

        if (!kinde.isLoading && kinde.isAuthenticated) {
          await syncFromKinde();
        } else if (!kinde.isLoading) {
          clearMedvbaSession();
        }
      } catch (e) {
        log.error('[Auth] init error:', e);
      } finally {
        if (mountedRef.current) setIsLoading(false);
        // Native splash can stay white until first navigation; hide as soon as auth init finishes.
        void SplashScreen.hideAsync?.()?.catch(() => {});
      }
    };
    init();
    return () => {
      mountedRef.current = false;
    };
  }, [kinde.isLoading, kinde.isAuthenticated, checkOnboardingStatus, syncFromKinde, clearMedvbaSession]);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const res = await kinde.register({ login_hint: email } as Record<string, unknown>);
        if (!res.success) {
          return {
            error: { message: res.errorMessage || 'Registration failed' } as AuthError,
            session: null,
          };
        }
        const ex = await exchangeKindeAccessToken(res.accessToken);
        if (!ex.ok) {
          return { error: { message: ex.error } as AuthError, session: null };
        }
        await applyMedvbaSession(ex.access_token, ex.profile_id, email);
        const mountedRef = { current: true };
        await ensureUserExists(ex.profile_id, email, name, mountedRef);
        await fetchProfile(ex.profile_id, email, mountedRef);
        const syn = buildSyntheticSession(ex.access_token, ex.profile_id, email);
        return { error: null, session: syn };
      } catch (error) {
        log.error('[Auth] signUp:', error);
        return { error: error as AuthError, session: null };
      }
    },
    [kinde, applyMedvbaSession, ensureUserExists, fetchProfile],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const ex = await exchangeEmailPasswordSession(email, password);
        if (!ex.ok) {
          return { error: { message: ex.error } as AuthError };
        }
        await applyMedvbaSession(ex.access_token, ex.profile_id, email);
        const mountedRef = { current: true };
        await fetchProfile(ex.profile_id, email, mountedRef);
        return { error: null };
      } catch (error) {
        return { error: error as AuthError };
      }
    },
    [applyMedvbaSession, fetchProfile],
  );

  const signInWithKindeHosted = useCallback(async () => {
    try {
      const res = await kinde.login();
      if (!res.success) {
        if (/cancel|dismiss|closed/i.test(res.errorMessage || '')) {
          return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
        }
        return { error: { message: res.errorMessage || 'Login failed' } as AuthError };
      }
      const ex = await exchangeKindeAccessToken(res.accessToken);
      if (!ex.ok) {
        return { error: { message: ex.error } as AuthError };
      }
      const up = await kinde.getUserProfile();
      await applyMedvbaSession(ex.access_token, ex.profile_id, up?.email);
      const mountedRef = { current: true };
      await fetchProfile(ex.profile_id, up?.email ?? undefined, mountedRef);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, [kinde, applyMedvbaSession, fetchProfile]);

  const signInWithGoogle = signInWithKindeHosted;
  const signInWithFacebook = signInWithKindeHosted;
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return { error: { message: 'Apple Sign-In is not available on this device' } as AuthError };
    }
    return signInWithKindeHosted();
  }, [signInWithKindeHosted]);

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
        if (result.error === 'user_fallback') {
          return { error: null, requiresPassword: true };
        }
        return { error: { message: result.error } as AuthError };
      }
      return { error: null };
    } catch (error) {
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
    try {
      await kinde.logout({ revokeToken: true });
    } catch (e) {
      log.warn('[Auth] Kinde logout:', e);
    }
    clearMedvbaSession();
    queryClient.clear();
  }, [kinde, clearMedvbaSession, queryClient]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const issuer = (
        process.env.EXPO_PUBLIC_KINDE_ISSUER_URL ||
        (extraConfig as { EXPO_PUBLIC_KINDE_ISSUER_URL?: string }).EXPO_PUBLIC_KINDE_ISSUER_URL ||
        ''
      )
        .trim()
        .replace(/\/+$/, '');
      if (!issuer) {
        return { error: { message: 'Password reset is not configured.' } as AuthError };
      }
      const q = new URLSearchParams({ email: email.trim() }).toString();
      await Linking.openURL(`${issuer}/password_reset#/?${q}`);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

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
    [],
  );

  useEffect(() => {
    if (!user?.id) return;
    const shouldPublishPresence = userProfile?.is_public !== false;
    const PRESENCE_THROTTLE_MS = 5 * 60 * 1000;

    const updatePresence = async (force = false) => {
      if (!shouldPublishPresence) return;
      const now = Date.now();
      if (!force && now - lastPresenceAtRef.current < PRESENCE_THROTTLE_MS) return;
      try {
        await supabase
          .from('user_presence')
          .upsert({ user_id: user.id, last_seen: new Date().toISOString() }, { onConflict: 'user_id' });
        lastPresenceAtRef.current = now;
      } catch (error) {
        log.error('[Auth] Error updating presence:', error);
      }
    };

    const wasPublic = lastIsPublicRef.current;
    lastIsPublicRef.current = shouldPublishPresence;
    if (shouldPublishPresence && wasPublic === false) {
      updatePresence(true);
    } else if (shouldPublishPresence && wasPublic === null) {
      updatePresence(true);
    } else {
      updatePresence();
    }

    const presenceInterval = setInterval(updatePresence, PRESENCE_THROTTLE_MS);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updatePresence(true);
      }
    });

    return () => {
      clearInterval(presenceInterval);
      subscription.remove();
    };
  }, [user?.id, userProfile?.is_public]);

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!getMedvbaAccessToken() && !!session,
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
  };
});

export { isBiometricAvailable, getBiometricCapabilities, getBiometricTypeName } from '@/lib/biometric';
export type { BiometricCapabilities } from '@/lib/biometric';
