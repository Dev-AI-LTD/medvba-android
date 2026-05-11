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
import { log } from '@/lib/log';
import type { UserProfile } from '@/types/user';
import {
  exchangeEmailPasswordSession,
  exchangeKindeAccessToken,
} from '@/lib/exchange-medvba-session';
import { setMedvbaAccessToken, getMedvbaAccessToken } from '@/lib/medvba-access-token';
import { loadMedvbaAccessToken, persistMedvbaAccessToken } from '@/lib/medvba-session-storage';
import { withTimeout } from '@/lib/with-timeout';
import { getMergedExpoExtra } from '@/lib/expo-public-extra';
import { PUBLIC_APP_NAME } from '@/lib/public-brand';
import { isFacebookLoginEnabledForBuild } from '@/lib/auth-facebook-visibility';

const ONBOARDING_COMPLETE_KEY = '@medvba_onboarding_complete';

export const AUTH_SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED';

const extraConfig = getMergedExpoExtra();

/** High-resolution auth timings for Metro / Flipper (dev only). */
type AuthPerfMark = (step: string) => void;

function authPerfStep(flow: string): AuthPerfMark {
  if (!__DEV__) {
    return () => {};
  }
  const t0 = globalThis.performance?.now?.() ?? Date.now();
  let last = t0;
  return (step: string) => {
    const now = globalThis.performance?.now?.() ?? Date.now();
    const totalMs = (now - t0).toFixed(1);
    const deltaMs = (now - last).toFixed(1);
    last = now;
    log.debug(
      `[AuthPerf] ${flow} wall=${new Date().toISOString()} total=${totalMs}ms Δ=${deltaMs}ms → ${step}`,
    );
  };
}

/** True when the in-memory MEDVBA JWT exists and expires after the given buffer (seconds). */
function medvbaJwtHasMinTtlSeconds(minSeconds: number): boolean {
  const t = getMedvbaAccessToken();
  if (!t) return false;
  try {
    const claims = decodeJwtClaims(t);
    const exp = claims.exp;
    return typeof exp === 'number' && exp * 1000 > Date.now() + minSeconds * 1000;
  } catch {
    return false;
  }
}

function decodeJwtClaims(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('Invalid JWT');
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary =
    typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('binary');
  const json = decodeURIComponent(
    Array.from(binary)
      .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

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
  /** False when Facebook login is hidden (e.g. email-only builds). */
  isFacebookLoginEnabled: boolean;
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

const AUTH_READY_GLOBAL = '__MEDVBA_AUTH_READY__';

/** Skip redundant background fetch after the same profile was loaded (e.g. hosted login + syncFromKinde). */
const RECENT_PROFILE_FETCH_SKIP_MS = 10_000;

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
  const authInitSeqRef = useRef(0);
  /** After first cold bootstrap, only reconcile Kinde ↔ MEDVBA (skip slow onboarding/bio/restore on every Kinde state flip). */
  const coldStartAuthBootstrapDoneRef = useRef(false);
  /** Last successful `fetchProfile` completion by `profile_id` (for deduping `syncFromKinde` background fetch). */
  const recentProfileFetchRef = useRef<{ profileId: string; at: number } | null>(null);

  const applyMedvbaSession = useCallback(
    async (accessToken: string, profileId: string, email?: string | null) => {
      setMedvbaAccessToken(accessToken);
      await persistMedvbaAccessToken(accessToken);
      const syn = buildSyntheticSession(accessToken, profileId, email);
      setSession(syn);
      setUser(syn.user as User);
    },
    [],
  );

  const clearMedvbaSession = useCallback(() => {
    setMedvbaAccessToken(null);
    void persistMedvbaAccessToken(null);
    setSession(null);
    setUser(null);
    setProfile(null);
    recentProfileFetchRef.current = null;
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
    async (
      userId: string,
      email: string | undefined,
      mounted: { current: boolean },
      perfFlowId?: string,
    ) => {
      const perf = authPerfStep(perfFlowId ? `fetchProfile:${perfFlowId}` : 'fetchProfile');
      perf('start');
      await ensureUserExists(userId, email, undefined, mounted);
      perf('after_ensureUserExists');

      try {
        if (!mounted.current) return;
        const [{ data: result, error: profileError }, { data: progressData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('user_progress').select('*').eq('user_id', userId).single(),
        ]);

        if (!mounted.current) return;
        if (profileError) throw profileError;
        perf('after_profiles_user_progress');

        if (result) {
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
          recentProfileFetchRef.current = { profileId: userId, at: Date.now() };
        }
        perf('done');
      } catch (error) {
        if (isAbortError(error)) return;
        if (!mounted.current) return;
        perf('catch_fallback_profile');
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
        recentProfileFetchRef.current = { profileId: userId, at: Date.now() };
      }
    },
    [ensureUserExists],
  );

  const syncFromKinde = useCallback(async () => {
    const perf = authPerfStep('syncFromKinde');
    perf('enter');
    const k = kindeRef.current;
    if (!k.isAuthenticated) {
      clearMedvbaSession();
      return;
    }
    const kt = await k.getAccessToken();
    perf('after_getAccessToken');
    if (!kt) {
      clearMedvbaSession();
      return;
    }
    const [ex, up] = await Promise.all([exchangeKindeAccessToken(kt), k.getUserProfile()]);
    perf('after_exchange_parallel_getUserProfile');
    if (!ex.ok) {
      log.error('[Auth] Session exchange failed:', ex.error);
      clearMedvbaSession();
      return;
    }
    await applyMedvbaSession(ex.access_token, ex.profile_id, up?.email);
    perf('after_applyMedvbaSession');
    const mountedRef = { current: true };
    const recent = recentProfileFetchRef.current;
    const skipBgFetch =
      recent?.profileId === ex.profile_id &&
      Date.now() - recent.at < RECENT_PROFILE_FETCH_SKIP_MS;
    if (skipBgFetch) {
      perf('skip_background_fetchProfile_recent');
    } else {
      void fetchProfile(ex.profile_id, up?.email ?? undefined, mountedRef, 'kindeSync').catch((err) => {
        if (!isAbortError(err)) log.warn('[Auth] Background fetchProfile after Kinde sync:', err);
      });
      perf('scheduled_background_fetchProfile');
    }
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
    const initSeq = ++authInitSeqRef.current;
    const init = async () => {
      try {
        await withTimeout(
          (async () => {
            const boot = authPerfStep('authBootstrap');
            boot('inner_start');
            let restoredMedvba = false;

            if (!coldStartAuthBootstrapDoneRef.current) {
              try {
                await withTimeout(checkOnboardingStatus(), 6000, 'Onboarding check');
              } catch (obErr) {
                log.warn('[Auth] Onboarding check slow or failed; continuing:', obErr);
              }

              if (Platform.OS !== 'web') {
                let capabilities: BiometricCapabilities;
                try {
                  capabilities = await withTimeout(
                    getBiometricCapabilities(),
                    8000,
                    'Biometric capabilities',
                  );
                } catch (bioErr) {
                  log.warn('[Auth] Biometric capabilities slow or failed; continuing:', bioErr);
                  capabilities = { hasHardware: false, isEnrolled: false, supportedTypes: [] };
                }
                if (mountedRef.current) setBiometricCapabilities(capabilities);

                let biometricEnabled = 'false';
                try {
                  const raw = await withTimeout(
                    AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
                    4000,
                    'Biometric preference read',
                  );
                  biometricEnabled = raw ?? 'false';
                } catch (beErr) {
                  log.warn('[Auth] Biometric preference read failed; continuing:', beErr);
                }

                if (mountedRef.current) {
                  setIsBiometricEnabled(
                    biometricEnabled === 'true' && capabilities.hasHardware && capabilities.isEnrolled,
                  );
                }
              }

              try {
                const stored = await withTimeout(loadMedvbaAccessToken(), 5000, 'Load stored MEDVBA session');
                if (stored) {
                  try {
                    const claims = decodeJwtClaims(stored);
                    const exp = claims.exp;
                    const profileId = typeof claims.profile_id === 'string' ? claims.profile_id : '';
                    const okExp = typeof exp === 'number' && exp * 1000 > Date.now() + 30_000;
                    if (okExp && profileId) {
                      const emailClaim = typeof claims.email === 'string' ? claims.email : null;
                      setMedvbaAccessToken(stored);
                      const syn = buildSyntheticSession(stored, profileId, emailClaim);
                      setSession(syn);
                      setUser(syn.user as User);
                      await withTimeout(
                        fetchProfile(profileId, emailClaim ?? undefined, mountedRef, 'coldRestore'),
                        20000,
                        'Restore profile fetch',
                      );
                      restoredMedvba = true;
                    } else {
                      await persistMedvbaAccessToken(null);
                    }
                  } catch (restoreErr) {
                    log.warn('[Auth] Stored MEDVBA session invalid; clearing:', restoreErr);
                    await persistMedvbaAccessToken(null);
                    clearMedvbaSession();
                  }
                }
              } catch (loadErr) {
                log.warn('[Auth] Could not load stored session:', loadErr);
              }

              coldStartAuthBootstrapDoneRef.current = true;
              boot('after_cold_start_path');
            } else {
              try {
                const stored = await loadMedvbaAccessToken();
                if (stored) {
                  try {
                    const claims = decodeJwtClaims(stored);
                    const exp = claims.exp;
                    const profileId = typeof claims.profile_id === 'string' ? claims.profile_id : '';
                    const okExp = typeof exp === 'number' && exp * 1000 > Date.now() + 30_000;
                    if (okExp && profileId) restoredMedvba = true;
                  } catch {
                    /* ignore */
                  }
                }
              } catch {
                /* ignore */
              }
              boot('after_warm_start_path');
            }

            if (!kinde.isLoading && kinde.isAuthenticated) {
              // After hosted login we already exchanged in signInWithKindeHosted; awaiting sync again
              // duplicates ~1–4s of backend + Kinde work. Defer when MEDVBA JWT is still fresh.
              const deferSync = medvbaJwtHasMinTtlSeconds(60);
              boot(`kinde_authenticated deferSync=${deferSync}`);
              try {
                if (deferSync) {
                  void syncFromKinde().catch((syncErr) => {
                    log.warn('[Auth] Background session sync failed:', syncErr);
                  });
                  boot('after_schedule_background_sync');
                } else {
                  await withTimeout(syncFromKinde(), 25000, `${PUBLIC_APP_NAME} session sync`);
                  boot('after_await_syncFromKinde');
                }
              } catch (syncErr) {
                log.warn('[Auth] session sync failed or timed out:', syncErr);
                clearMedvbaSession();
              }
            } else if (!kinde.isLoading && !restoredMedvba && !getMedvbaAccessToken()) {
              // Do not clear an in-flight or just-applied MEDVBA session (e.g. email/password or
              // post-hosted-login) when SecureStore restore hasn't run yet but memory already has the JWT.
              clearMedvbaSession();
            }
            boot('inner_end');
          })(),
          45000,
          'Auth bootstrap',
        );
      } catch (e) {
        log.error('[Auth] init error:', e);
        clearMedvbaSession();
      } finally {
        if (initSeq !== authInitSeqRef.current) {
          return;
        }
        // Only the latest auth init may mark the app ready; stale inits can finish after auth SDK deps change.
        setIsLoading(false);
        (globalThis as Record<string, unknown>)[AUTH_READY_GLOBAL] = true;
        void SplashScreen.hideAsync()?.catch(() => {});
      }
    };
    init();
    return () => {
      mountedRef.current = false;
    };
  }, [
    kinde.isLoading,
    kinde.isAuthenticated,
    checkOnboardingStatus,
    syncFromKinde,
    clearMedvbaSession,
    fetchProfile,
  ]);

  useEffect(() => {
    return () => {
      delete (globalThis as Record<string, unknown>)[AUTH_READY_GLOBAL];
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const res = await kinde.register({ loginHint: email.trim().toLowerCase() } as never);
        if (!res.success) {
          return {
            error: { message: res.errorMessage || 'Registration failed' } as AuthError,
            session: null,
          };
        }
        const [ex, up] = await Promise.all([
          exchangeKindeAccessToken(res.accessToken),
          kinde.getUserProfile(),
        ]);
        if (!ex.ok) {
          return { error: { message: ex.error } as AuthError, session: null };
        }
        const sessionEmail = up?.email ?? email;
        await applyMedvbaSession(ex.access_token, ex.profile_id, sessionEmail);
        const mountedRef = { current: true };
        await ensureUserExists(ex.profile_id, sessionEmail ?? undefined, name, mountedRef);
        await fetchProfile(ex.profile_id, sessionEmail ?? undefined, mountedRef, 'signUp');
        const syn = buildSyntheticSession(ex.access_token, ex.profile_id, sessionEmail);
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
        const sessionEmail = email.trim().toLowerCase();
        await applyMedvbaSession(ex.access_token, ex.profile_id, sessionEmail);
        const mountedRef = { current: true };
        await fetchProfile(ex.profile_id, sessionEmail, mountedRef, 'emailPassword');
        return { error: null };
      } catch (error) {
        return { error: error as AuthError };
      }
    },
    [applyMedvbaSession, fetchProfile],
  );

  const signInWithKindeHosted = useCallback(
    async (loginHint?: Record<string, unknown>) => {
      const perf = authPerfStep('signInWithKindeHosted');
      try {
        perf('before_kinde.login');
        const res = await kinde.login(loginHint as never);
        perf('after_kinde.login');
        if (!res.success) {
          if (/cancel|dismiss|closed/i.test(res.errorMessage || '')) {
            return { error: { message: AUTH_SIGN_IN_CANCELLED } as AuthError };
          }
          return { error: { message: res.errorMessage || 'Login failed' } as AuthError };
        }
        const [ex, up] = await Promise.all([
          exchangeKindeAccessToken(res.accessToken),
          kinde.getUserProfile(),
        ]);
        perf('after_exchange_parallel_getUserProfile');
        if (!ex.ok) {
          return { error: { message: ex.error } as AuthError };
        }
        await applyMedvbaSession(ex.access_token, ex.profile_id, up?.email);
        perf('after_applyMedvbaSession');
        const mountedRef = { current: true };
        await fetchProfile(ex.profile_id, up?.email ?? undefined, mountedRef, 'hosted');
        perf('after_await_fetchProfile');
        return { error: null };
      } catch (error) {
        return { error: error as AuthError };
      }
    },
    [kinde, applyMedvbaSession, fetchProfile],
  );

  const facebookConnectionId = String(
    (extraConfig as Record<string, unknown>).EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID ?? '',
  ).trim();

  const googleConnectionId = String(
    (extraConfig as Record<string, unknown>).EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID ?? '',
  ).trim();

  const isFacebookLoginEnabled = isFacebookLoginEnabledForBuild(extraConfig);

  const signInWithGoogle = useCallback(async () => {
    const hint = googleConnectionId ? { connectionId: googleConnectionId } : undefined;
    return signInWithKindeHosted(hint);
  }, [googleConnectionId, signInWithKindeHosted]);

  const signInWithFacebook = useCallback(async () => {
    if (!isFacebookLoginEnabled) {
      return {
        error: { message: 'Facebook sign-in is not enabled for this app.' } as AuthError,
      };
    }
    const hint = facebookConnectionId
      ? { connectionId: facebookConnectionId }
      : undefined;
    return signInWithKindeHosted(hint);
  }, [facebookConnectionId, isFacebookLoginEnabled, signInWithKindeHosted]);
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return { error: { message: 'Apple Sign-In is not available on this device' } as AuthError };
    }
    return signInWithKindeHosted(undefined);
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
      log.warn('[Auth] Logout:', e);
    }
    coldStartAuthBootstrapDoneRef.current = false;
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
      await fetchProfile(user.id, user.email, mountedRef, 'refreshProfile');
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
    isFacebookLoginEnabled,
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
