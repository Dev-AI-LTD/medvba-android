import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extraConfig = Constants.expoConfig?.extra ?? (Constants as any)?.manifest?.extra ?? {};
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extraConfig.EXPO_PUBLIC_SUPABASE_URL ||
  extraConfig.supabaseUrl ||
  '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extraConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extraConfig.supabaseAnonKey ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and set values. Data access will not work.'
  );
}

// Use placeholder values when env is missing so createClient() doesn't throw and the app can load
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Supabase is used for database/storage only — auth sessions are managed by Cognito.
export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
