/**
 * Verifică env pentru auth Kinde: social + email/parolă (fără OTP în app).
 * Rulează: npm run check:kinde-auth
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

function parseEnv(content) {
  const out = {};
  content.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  });
  return out;
}

const pick = (env, k) => (process.env[k] ?? env[k] ?? '').trim();

if (!existsSync(envPath)) {
  console.error('❌ Lipsește .env');
  process.exitCode = 1;
} else {
  const env = parseEnv(readFileSync(envPath, 'utf8'));
  let failed = false;

  console.log('--- check-kinde-auth (email+parolă, social, Railway) ---\n');

  const required = [
    'EXPO_PUBLIC_KINDE_ISSUER_URL',
    'EXPO_PUBLIC_KINDE_CLIENT_ID',
    'EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID',
    'EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID',
  ];

  for (const key of required) {
    if (pick(env, key)) {
      console.log('✅', key);
    } else {
      console.error('❌', key);
      failed = true;
    }
  }

  const api = pick(env, 'EXPO_PUBLIC_API_BASE_URL') || pick(env, 'EXPO_PUBLIC_RORK_API_BASE_URL');
  if (api) {
    console.log('✅ API base URL');
  } else {
    console.error('❌ EXPO_PUBLIC_API_BASE_URL sau EXPO_PUBLIC_RORK_API_BASE_URL');
    failed = true;
  }

  const localSecret = pick(env, 'KINDE_CLIENT_SECRET');
  if (localSecret) {
    console.log('✅ KINDE_CLIENT_SECRET (local — pentru diagnose / create:review-user)');
  } else {
    console.log('⚪ KINDE_CLIENT_SECRET (lipsește local; obligatoriu pe Railway)');
  }

  const reviewEmail = pick(env, 'VERIFY_AUTH_EMAIL');
  const reviewPass = pick(env, 'VERIFY_AUTH_PASSWORD');
  if (reviewEmail && reviewPass) {
    console.log('✅ VERIFY_AUTH_EMAIL + VERIFY_AUTH_PASSWORD');
  } else {
    console.log('⚪ VERIFY_AUTH_* (opțional — pentru create:review-user / diagnose)');
  }

  const emailConn = pick(env, 'EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID');
  if (emailConn) {
    console.log('✅ EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID (Sign in with email → browser PKCE)');
  } else {
    console.error('❌ Lipsește EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID — butonul „Sign in with email” nu apare');
    failed = true;
  }

  console.log('\n--- Kinde Dashboard (manual) ---');
  console.log('1. Environment → Authentication → Email + password (NU Email + code)');
  console.log('2. Applications → app native → Authentication → email/password ON');
  console.log('3. Users → cont review → Verified');
  console.log('   Ghid: docs/KINDE_EMAIL_PASSWORD.md\n');

  console.log('--- Railway (manual) ---');
  console.log('KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET (native, nu M2M) + Redeploy');
  console.log('   Ghid: docs/RAILWAY_KINDE_AUTH.md\n');

  console.log('--- Următorul pas ---');
  console.log('npm run diagnose:kinde-password');
  console.log('npm run create:review-user');
  console.log('npm run verify:auth-session\n');

  process.exitCode = failed ? 1 : 0;
}
