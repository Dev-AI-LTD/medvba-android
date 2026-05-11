import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'medvba_access_token_v1';

/**
 * Persist MEDVBA JWT (Supabase-compatible HS256 from backend) for cold starts
 * when the user is not signed in via the hosted auth SDK (native email/password).
 */
export async function persistMedvbaAccessToken(token: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }
    if (token) {
      await SecureStore.setItemAsync(STORAGE_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch {
    // Non-fatal: session still works until process restart.
  }
}

export async function loadMedvbaAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}
