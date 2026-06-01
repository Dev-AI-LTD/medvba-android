/**
 * Verifică variabilele Kinde necesare pentru iOS + Expo (fără a afișa secrete).
 * Rulează: npm run check:kinde-ios
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

  const checks = [
    ['EXPO_PUBLIC_KINDE_ISSUER_URL', true],
    ['EXPO_PUBLIC_KINDE_CLIENT_ID', true],
    ['EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID', true],
    ['EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID', true],
    ['EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID', false],
    ['EXPO_PUBLIC_API_BASE_URL', false],
    ['EXPO_PUBLIC_RORK_API_BASE_URL', false],
    ['KINDE_CLIENT_SECRET', false],
  ];

  console.log('--- check-kinde-ios (Expo / iOS auth) ---');
  console.log('Pentru email+parolă: npm run check:kinde-auth\n');
  console.log('Kinde Dashboard: Framework = React Native/Expo, callbacks medvba://*');
  console.log('Apple: Return URL pe Services ID = Kinde Callback; S2S Notification = gol');
  console.log('Ghid: docs/APPLE_SIGN_IN_KINDE_SETUP.md');
  console.log('Nu crea app Kinde separată pentru iOS.\n');

  for (const [key, required] of checks) {
    const v = pick(env, key);
    if (v) {
      console.log('✅', key);
    } else if (required) {
      console.error('❌ Lipsește (obligatoriu iOS/social):', key);
      failed = true;
    } else {
      console.log('⚪', key, '(opțional sau alternativ)');
    }
  }

  const api = pick(env, 'EXPO_PUBLIC_API_BASE_URL') || pick(env, 'EXPO_PUBLIC_RORK_API_BASE_URL');
  if (!api) {
    console.error('❌ Lipsește EXPO_PUBLIC_API_BASE_URL sau EXPO_PUBLIC_RORK_API_BASE_URL');
    failed = true;
  }

  const issuer = pick(env, 'EXPO_PUBLIC_KINDE_ISSUER_URL');
  const clientId = pick(env, 'EXPO_PUBLIC_KINDE_CLIENT_ID');
  if (issuer && clientId) {
    console.log('\n→ În Kinde Applications: un singur app native cu acest client_id.');
    console.log('  Callback URLs: medvba://*');
    console.log('  Framework: Expo / React Native (nu Android-only)\n');
  }

  const apple = pick(env, 'EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID');
  if (!apple) {
    console.error('→ Sign in with Apple: copiază Connection ID din Kinde → Authentication → Apple');
    console.error('  în EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID\n');
  } else {
    console.log('\n⚠️  Dacă Kinde arată „Connection not enabled”:');
    console.log('   Applications → app native MEDVBA → Authentication → ON la Apple');
    console.log('   + Apple configurat în Settings → Environment → Authentication\n');
  }

  const emailConn = pick(env, 'EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID');
  if (!emailConn) {
    console.warn('\n⚠️  App Store review: lipsește EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID');
    console.warn('   Reviewerii folosesc „Sign in with email” (browser Kinde), nu parola în app.');
    console.warn('   Setează în EAS production + .env local, apoi rebuild TestFlight.\n');
  } else {
    console.log('✅ EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID (hosted email pentru review)\n');
  }

  process.exitCode = failed ? 1 : 0;
}
