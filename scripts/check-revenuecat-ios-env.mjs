/**
 * Verifică cheia RevenueCat pentru iOS înainte de build TestFlight.
 * - prefix corect: appl_ (production) sau test_ (doar dev local)
 * - NU goog_ (e cheia Android)
 * - apel REST offerings (cheie recunoscută + pachete App Store)
 *
 * Rulează: npm run check:revenuecat-ios
 * Cu variabile EAS (după eas env:list): set CHECK_SOURCE=eas și exportă cheile, sau copiază în .env
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const RC_OFFERINGS_URL = 'https://api.revenuecat.com/v1/subscribers/medvba_preflight_check/offerings';

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

function maskKey(key) {
  const k = String(key ?? '').trim();
  if (k.length <= 12) return '(gol sau prea scurt)';
  return `${k.slice(0, 8)}…${k.slice(-4)}`;
}

function classifyIosKey(key) {
  const k = key.trim().toLowerCase();
  if (!k) return { ok: false, reason: 'lipsă' };
  if (k.startsWith('test_')) {
    return { ok: false, reason: 'test_ — RevenueCat închide app-ul pe TestFlight/App Store' };
  }
  if (k.startsWith('goog_')) {
    return { ok: false, reason: 'goog_ — aceasta e cheia ANDROID; iOS necesită appl_' };
  }
  if (k.startsWith('appl_')) return { ok: true, reason: 'appl_ (production iOS)' };
  return { ok: false, reason: `prefix necunoscut (${k.slice(0, 5)}…)` };
}

async function fetchOfferings(apiKey) {
  const res = await fetch(RC_OFFERINGS_URL, {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
  });
  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }
  return { status: res.status, body, bodyText };
}

const pick = (env, k) => (process.env[k] ?? env[k] ?? '').trim();

let env = {};
if (existsSync(envPath)) {
  env = parseEnv(readFileSync(envPath, 'utf8'));
}

const iosKey = pick(env, 'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
const paywall = pick(env, 'EXPO_PUBLIC_PAYWALL_ENABLED') || 'true';
let failed = false;

console.log('--- check-revenuecat-ios (înainte de TestFlight) ---\n');
console.log('EXPO_PUBLIC_PAYWALL_ENABLED =', paywall);
console.log('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS =', maskKey(iosKey));

const classification = classifyIosKey(iosKey);
if (classification.ok) {
  console.log('✅ Prefix cheie:', classification.reason);
} else {
  console.error('❌ Cheie iOS invalidă:', classification.reason);
  console.error('   RevenueCat → Project → API keys → app iOS (App Store) → Public key (appl_…)\n');
  failed = true;
}

if (!failed && iosKey) {
  console.log('\n→ Verificare API RevenueCat (offerings)…');
  try {
    const { status, body, bodyText } = await fetchOfferings(iosKey);
    if (status === 401 || status === 403) {
      console.error('❌ API respins (', status, ') — cheie necunoscută sau revocată');
      failed = true;
    } else if (status >= 400) {
      console.error('❌ API eroare HTTP', status, bodyText.slice(0, 200));
      failed = true;
    } else {
      const offerings = body?.offerings ?? [];
      const currentId = body?.current_offering_id;
      const current = offerings.find((o) => o.identifier === currentId) ?? offerings[0];
      const packages = current?.packages ?? [];
      console.log('✅ API RevenueCat OK (HTTP', status + ')');
      console.log('   Offering curent:', currentId ?? '(niciunul)');
      console.log('   Pachete în offering:', packages.length);
      if (packages.length === 0) {
        console.warn(
          '⚠️  0 pachete — paywall-ul poate fi gol pe iOS până configurezi produse în App Store Connect + RevenueCat (iOS app, nu doar Google Play).',
        );
      } else {
        for (const pkg of packages.slice(0, 5)) {
          console.log('   -', pkg.identifier, pkg.platform_product_identifier ?? '');
        }
      }
      if (iosKey.startsWith('goog_')) {
        console.error('❌ Cheia goog_ returnează offerings Android; SDK iOS nu va funcționa corect.');
        failed = true;
      }
    }
  } catch (err) {
    console.error('❌ Nu s-a putut contacta RevenueCat:', err?.message ?? err);
    failed = true;
  }
}

console.log('\n--- EAS production (verifică manual) ---');
console.log('eas env:list --environment production');
console.log('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS trebuie să fie appl_… (același tip ca în .env după fix)\n');

if (paywall === 'true' && !iosKey) {
  console.error('❌ Paywall activ dar lipsește EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
  failed = true;
}

process.exitCode = failed ? 1 : 0;
if (!failed) {
  console.log('✅ Preflight RevenueCat iOS: OK pentru build (rebuild după orice schimbare în EAS).');
}
