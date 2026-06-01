import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getMedvbaAccessToken } from '@/lib/medvba-access-token';
import { getMergedExpoExtra } from '@/lib/expo-public-extra';
import { ensureMedvbaSessionBeforeQuery } from '@/lib/ensure-medvba-session';

const extraConfig = getMergedExpoExtra();

const envStr = (v: unknown): string =>
  v === undefined || v === null ? '' : String(v).trim();

const supabaseUrl =
  envStr(process.env.EXPO_PUBLIC_SUPABASE_URL) ||
  envStr(extraConfig.EXPO_PUBLIC_SUPABASE_URL) ||
  envStr(extraConfig.supabaseUrl) ||
  '';
const supabaseAnonKey =
  envStr(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  envStr(extraConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  envStr(extraConfig.supabaseAnonKey) ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and set values. Auth and data will not work.'
  );
}

const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

const storage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

const authFetch: typeof fetch = async (input, init) => {
  const perform = async () => {
    const headers = new Headers(init?.headers ?? undefined);
    const t = getMedvbaAccessToken();
    if (t) {
      headers.set('Authorization', `Bearer ${t}`);
    }
    return fetch(input, { ...init, headers });
  };

  await ensureMedvbaSessionBeforeQuery();
  let response = await perform();
  if (response.status === 401) {
    await ensureMedvbaSessionBeforeQuery();
    response = await perform();
  }
  return response;
};

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    storage,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: { fetch: authFetch },
});

export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
};
