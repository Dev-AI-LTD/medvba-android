/**
 * Verifică că .env conține variabilele necesare pentru Google Play.
 * Rulează: node scripts/check-env.js
 * Nu afișează valorile, doar dacă cheile există și nu sunt goale.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID',
  'EXPO_PUBLIC_PAYWALL_ENABLED',
  'EXPO_PUBLIC_KINDE_ISSUER_URL',
  'EXPO_PUBLIC_KINDE_CLIENT_ID',
];

const optional = [
  'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_RORK_API_BASE_URL',
  'EXPO_PUBLIC_SENTRY_DSN',
];

function hasApiBaseUrl(env) {
  const a = env.EXPO_PUBLIC_API_BASE_URL;
  const b = env.EXPO_PUBLIC_RORK_API_BASE_URL;
  return (a !== undefined && a !== '') || (b !== undefined && b !== '');
}

function parseEnv(content) {
  const out = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  });
  return out;
}

if (!existsSync(envPath)) {
  console.error('❌ Fișierul .env nu există. Copiază .env.example în .env și completează valorile.');
  process.exit(1);
}

const content = readFileSync(envPath, 'utf8');
const env = parseEnv(content);

let failed = false;

required.forEach((key) => {
  const value = env[key];
  if (value === undefined || value === '') {
    console.error('❌ Lipsește sau e gol:', key);
    failed = true;
  } else {
    console.log('✅', key);
  }
});

optional.forEach((key) => {
  const value = env[key];
  if (value === undefined || value === '') {
    console.log('⚪ (opțional) lipsă:', key);
  } else {
    console.log('✅', key);
  }
});

if (!hasApiBaseUrl(env)) {
  console.error('❌ Lipsește EXPO_PUBLIC_API_BASE_URL sau EXPO_PUBLIC_RORK_API_BASE_URL (obligatoriu la runtime pentru tRPC și login email).');
  failed = true;
} else {
  console.log('✅ EXPO_PUBLIC_API_BASE_URL sau EXPO_PUBLIC_RORK_API_BASE_URL');
  console.log('   → trebuie să fie același host ca backend-ul Railway (Hono); verifică cu: bun run verify:auth-session');
}

if (failed) {
  console.error('\nCompletează variabilele obligatorii în .env (vezi .env.example).');
  process.exit(1);
}

console.log('\n✅ Toate variabilele obligatorii sunt setate în .env');
if (!env.EXPO_PUBLIC_PAYWALL_ENABLED || env.EXPO_PUBLIC_PAYWALL_ENABLED !== 'true') {
  console.log('💡 EXPO_PUBLIC_PAYWALL_ENABLED nu e "true" – paywall-ul va fi dezactivat.');
}
