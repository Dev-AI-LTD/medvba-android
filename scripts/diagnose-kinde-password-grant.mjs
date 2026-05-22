/**
 * Testează password grant DIRECT la Kinde (fără Railway).
 * Compară cu npm run create:review-user (trece prin Railway).
 *
 * Adaugă în .env (local, necomis):
 *   KINDE_ISSUER_URL=https://devaieoodltd.kinde.com
 *   KINDE_CLIENT_ID=... (același ca EXPO_PUBLIC_KINDE_CLIENT_ID)
 *   KINDE_CLIENT_SECRET=... (secretul app native din Kinde — NU M2M)
 *   VERIFY_AUTH_EMAIL=...
 *   VERIFY_AUTH_PASSWORD=...
 *
 *   npm run diagnose:kinde-password
 */

import { readFileSync, existsSync } from 'fs';
import https from 'https';
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
    let k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  });
  return out;
}

function pick(env, k) {
  const v = process.env[k] ?? env[k];
  return typeof v === 'string' ? v.trim() : '';
}

function postForm(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body.toString();
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const issuer = pick(fileEnv, 'KINDE_ISSUER_URL') || pick(fileEnv, 'EXPO_PUBLIC_KINDE_ISSUER_URL');
const clientId = pick(fileEnv, 'KINDE_CLIENT_ID') || pick(fileEnv, 'EXPO_PUBLIC_KINDE_CLIENT_ID');
const clientSecret = pick(fileEnv, 'KINDE_CLIENT_SECRET');
const email = pick(fileEnv, 'VERIFY_AUTH_EMAIL').toLowerCase();
const password = pick(fileEnv, 'VERIFY_AUTH_PASSWORD');
const audience = pick(fileEnv, 'KINDE_AUDIENCE');

console.log('--- diagnose-kinde-password-grant (direct la Kinde) ---\n');

if (!issuer || !clientId || !clientSecret) {
  console.error('Lipsește în .env: KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET');
  console.error('(KINDE_CLIENT_SECRET = secret app native din Kinde Dashboard, NU M2M)\n');
  process.exitCode = 1;
} else if (!email || !password) {
  console.error('Lipsește VERIFY_AUTH_EMAIL sau VERIFY_AUTH_PASSWORD\n');
  process.exitCode = 1;
} else {
  const tokenUrl = `${issuer.replace(/\/+$/, '')}/oauth2/token`;
  const params = new URLSearchParams({
    grant_type: 'password',
    username: email,
    password,
    client_id: clientId,
    client_secret: clientSecret,
  });
  if (audience) params.set('audience', audience);

  console.log('POST', tokenUrl);
  console.log('email:', email, '(parola nu e afișată)\n');

  try {
    const { status, body } = await postForm(tokenUrl, params);
    const snippet = body.slice(0, 600);
    console.log('HTTP', status);
    console.log('body:', snippet + (body.length > 600 ? '…' : ''));

    if (status >= 200 && status < 300 && /access_token/.test(body)) {
      console.log('\n✅ Password grant OK direct la Kinde.');
      console.log('→ Problema e pe Railway (KINDE_CLIENT_SECRET greșit/lipsă sau redeploy necesar).\n');
      process.exitCode = 0;
    } else if (status === 502 || status === 503 || status === 504) {
      console.error('\n❌ Kinde 5xx la password grant.');
      console.error('   Kinde confirmă: ROPC (grant_type=password) NU e suportat — 502 e așteptat.');
      console.error('   Vezi: docs/KINDE_ROPC_NOT_SUPPORTED.md');
      console.error('   App Review: Apple + Google (npm run review-notes:mode)\n');
      const m2mId = pick(fileEnv, 'KINDE_M2M_CLIENT_ID');
      const m2mSecret = pick(fileEnv, 'KINDE_M2M_CLIENT_SECRET');
      if (m2mId && m2mSecret) {
        const cc = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: m2mId,
          client_secret: m2mSecret,
        });
        const ccRes = await postForm(tokenUrl, cc);
        console.log(
          'Comparație client_credentials:',
          ccRes.status >= 200 && ccRes.status < 300 ? 'HTTP 200 (M2M OK)' : `HTTP ${ccRes.status}`,
        );
        if (ccRes.status >= 200 && ccRes.status < 300) {
          console.log('→ Include în ticket: password=502, client_credentials=200 pe același /oauth2/token\n');
        }
      }
      process.exitCode = 1;
    } else if (status === 400 || status === 401) {
      console.error('\n→ Kinde răspunde dar refuză login (parolă, grant dezactivat, email neverified).');
      console.error('   Dashboard: Applications → Password grant ON; Users → verified; reset parolă.\n');
      process.exitCode = 1;
    } else {
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Eroare rețea:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
}
