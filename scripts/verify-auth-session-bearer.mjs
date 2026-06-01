/**
 * Verifică POST /api/auth/session cu Authorization: Bearer (flux OAuth după Apple/Google).
 *
 *   node scripts/verify-auth-session-bearer.mjs [BASE_URL]
 *
 * Token: VERIFY_KINDE_ACCESS_TOKEN în .env sau primul argument după BASE_URL.
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const pick = (k) => {
  const v = process.env[k] ?? fileEnv[k];
  return typeof v === 'string' ? v.trim() : '';
};

const argvBase = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : '';
const argvToken = process.argv[3] && !process.argv[3].startsWith('-') ? process.argv[3] : '';

const base = normalizeBase(
  argvBase || pick('EXPO_PUBLIC_API_BASE_URL') || pick('EXPO_PUBLIC_RORK_API_BASE_URL'),
);
const token = argvToken || pick('VERIFY_KINDE_ACCESS_TOKEN');

console.log('--- verify-auth-session-bearer (OAuth path) ---\n');

if (!base) {
  console.error('Set EXPO_PUBLIC_API_BASE_URL in .env or pass BASE_URL as argv[2].\n');
  process.exit(1);
}

if (!token) {
  console.error('Missing VERIFY_KINDE_ACCESS_TOKEN in .env (Kinde access_token after hosted login).\n');
  process.exit(1);
}

const url = `${base}/api/auth/session`;
console.log('POST', url, '\n');

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  },
});

const text = await res.text();
console.log('HTTP', res.status);
console.log('body (truncated):', text.slice(0, 500) + (text.length > 500 ? '…' : ''));

if (!res.ok) {
  process.exit(1);
}

if (!/access_token/.test(text) || !/profile_id/.test(text)) {
  console.error('\n2xx but missing access_token/profile_id.\n');
  process.exit(1);
}

console.log('\nOK: Bearer session exchange works.\n');
