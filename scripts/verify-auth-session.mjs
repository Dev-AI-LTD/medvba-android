/**
 * Verifică că backend-ul răspunde la POST /api/auth/session cu JSON { email, password }
 * (același contract ca app-ul — fără browser, fără M2M).
 *
 * Rulează din rădăcina proiectului:
 *   bun run verify:auth-session
 *   node scripts/verify-auth-session.mjs [BASE_URL] [email]
 * (parola se citește din env VERIFY_AUTH_PASSWORD sau .env)
 *
 * Variabile în .env (sau export în shell):
 *   EXPO_PUBLIC_API_BASE_URL sau EXPO_PUBLIC_RORK_API_BASE_URL — baza API (Railway)
 *   VERIFY_AUTH_EMAIL, VERIFY_AUTH_PASSWORD — cont de test (nu comita parola în git)
 *
 * Pe server (Railway): KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET și în Kinde
 * trebuie activat password grant pentru acel client (Applications → app → Authentication).
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const envPath = join(root, '.env');

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

function normalizeBase(s) {
  return String(s || '')
    .trim()
    .replace(/^https:\/(?!\/)/, 'https://')
    .replace(/^http:\/(?!\/)/, 'http://')
    .replace(/\/+$/, '');
}

function loadDotEnv() {
  if (!existsSync(envPath)) return {};
  return parseEnv(readFileSync(envPath, 'utf8'));
}

const fileEnv = loadDotEnv();
const pick = (k) => {
  const v = process.env[k] ?? fileEnv[k];
  return typeof v === 'string' ? v.trim() : '';
};

const argvBase = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : '';
const argvEmail = process.argv[3] && !process.argv[3].startsWith('-') ? process.argv[3] : '';

const base = normalizeBase(
  argvBase ||
    pick('EXPO_PUBLIC_API_BASE_URL') ||
    pick('EXPO_PUBLIC_RORK_API_BASE_URL') ||
    pick('API_BASE_URL'),
);

const email = (argvEmail || pick('VERIFY_AUTH_EMAIL')).trim().toLowerCase();
const password = pick('VERIFY_AUTH_PASSWORD');

console.log('--- verify-auth-session ---');
console.log('Kinde / Railway (server): password grant = KINDE_ISSUER_URL + KINDE_CLIENT_ID + KINDE_CLIENT_SECRET');
console.log('M2M (KINDE_M2M_*): doar pentru POST /api/auth/register, NU pentru login email.\n');

if (!base) {
  console.error('Lipsește baza API. Setează EXPO_PUBLIC_API_BASE_URL în .env sau:');
  console.error('  node scripts/verify-auth-session.mjs https://your-host.up.railway.app\n');
  process.exit(1);
}

if (!email || !password) {
  console.error('Lipsește email sau parolă de test.');
  console.error('Adaugă în .env (local, necomis):');
  console.error('  VERIFY_AUTH_EMAIL=you@example.com');
  console.error('  VERIFY_AUTH_PASSWORD=********');
  console.error('sau: node scripts/verify-auth-session.mjs', base, 'you@example.com');
  console.error('și export VERIFY_AUTH_PASSWORD în terminal.\n');
  process.exit(1);
}

const url = `${base}/api/auth/session`;
try {
  const u = new URL(base.startsWith('http') ? base : `https://${base}`);
  console.log('POST', `${u.origin}/api/auth/session`);
} catch {
  console.log('POST', `${base}/api/auth/session`);
}
console.log('email:', email, '(parola nu e afișată)\n');

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const text = await res.text();
let snippet = text.slice(0, 400);
try {
  const j = JSON.parse(text);
  snippet = JSON.stringify(j, null, 0).slice(0, 400);
} catch {
  /* raw */
}

console.log('HTTP', res.status);
console.log('body (truncated):', snippet + (text.length > 400 ? '…' : ''));

if (!res.ok) {
  if (res.status === 401 && /password grant|Email\/password login failed/i.test(text)) {
    console.error('\n→ Verifică în Kinde: Applications → aplicația cu acel client_id → Authentication:');
    console.error('   activează password / resource owner flow pentru acest client (vezi docs Kinde).');
    console.error('→ Pe Railway: KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET aliniate cu acel client.\n');
  }
  process.exit(1);
}

if (!/access_token/.test(text) || !/profile_id/.test(text)) {
  console.error('\nRăspuns 2xx dar fără access_token/profile_id — verifică contractul backend.\n');
  process.exit(1);
}

console.log('\nOK: password grant + session endpoint răspund cum trebuie.\n');
process.exit(0);
