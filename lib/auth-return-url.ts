import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';

export const AUTH_RETURN_TO_KEY = 'medvba_auth_return_to_v1';

/** Serialize expo-router segments into an app-internal path (no leading slash). */
export function serializeAuthReturnPath(segments: readonly string[]): string | null {
  if (segments.length === 0 || segments[0] === undefined) {
    return null;
  }
  const path = segments.filter(Boolean).join('/');
  return isSafeAuthReturnPath(path) ? path : null;
}

export function isSafeAuthReturnPath(path: string): boolean {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes('..')) {
    return false;
  }
  if (trimmed.startsWith('(auth)') || trimmed.startsWith('legal')) {
    return false;
  }
  if (trimmed === 'login' || trimmed === 'index') {
    return false;
  }
  return true;
}

export async function saveAuthReturnTo(segments: readonly string[]): Promise<void> {
  const path = serializeAuthReturnPath(segments);
  if (!path) return;
  try {
    await AsyncStorage.setItem(AUTH_RETURN_TO_KEY, path);
  } catch {
    /* non-fatal */
  }
}

export async function saveAuthReturnToPath(path: string): Promise<void> {
  const normalized = path.replace(/^\/+/, '').trim();
  if (!isSafeAuthReturnPath(normalized)) return;
  try {
    await AsyncStorage.setItem(AUTH_RETURN_TO_KEY, normalized);
  } catch {
    /* non-fatal */
  }
}

/** Clears queued post-login deep-link target (call on sign-out). */
export async function clearAuthReturnDestination(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_RETURN_TO_KEY);
  } catch {
    /* non-fatal */
  }
}

/** Consumes stored return path and returns an expo-router href. */
export async function resolvePostAuthHref(hasCompletedOnboarding: boolean): Promise<Href> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_RETURN_TO_KEY);
    await AsyncStorage.removeItem(AUTH_RETURN_TO_KEY);
    if (raw && isSafeAuthReturnPath(raw)) {
      return `/${raw}` as Href;
    }
  } catch {
    /* non-fatal */
  }
  return (hasCompletedOnboarding ? '/(tabs)' : '/(auth)/onboarding') as Href;
}
