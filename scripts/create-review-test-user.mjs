/**
 * Creează (sau verifică login pentru) contul App Review — email + parolă.
 *
 *   npm run create:review-user
 *   node scripts/create-review-test-user.mjs
 *
 * .env: VERIFY_AUTH_EMAIL, VERIFY_AUTH_PASSWORD, EXPO_PUBLIC_API_BASE_URL
 */

import { readFileSync, existsSync } from 'fs';
import http from 'http';
import https from 'https';
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

/** Node http(s) — avoids Windows libuv crash on exit after fetch(). */
function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = JSON.stringify(body);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: `${u.pathname}${u.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json = {};
          try {
            json = raw ? JSON.parse(raw) : {};
          } catch {
            json = { raw: raw.slice(0, 400) };
          }
          resolve({
            res: { ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode },
            json,
            raw,
          });
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function printLoginFailure(login) {
  const { res, json, raw } = login;
  console.error('❌ Login eșuat:', res.status, json.error ?? '(no error field)');
  if (json.detail) {
    console.error('   detail:', String(json.detail).slice(0, 500));
  }
  if (json.hint) {
    console.error('   hint:', json.hint);
  }

  const blob = raw || JSON.stringify(json);
  const kindeToken5xx =
    /\/oauth2\/token[^\n]*HTTP 5\d\d/i.test(blob) ||
    /HTTP 5\d\d[^\n]*kinde\.com\/oauth2\/token/i.test(blob) ||
    /502 Bad Gateway/i.test(blob);

  if (kindeToken5xx) {
    console.error(
      '\n→ Kinde returnează 5xx la /oauth2/token (502). Nu e parolă greșită — serverul Kinde e indisponibil.',
    );
    console.error('   Reîncearcă: npm run create:review-user');
    console.error('   Status: https://status.kinde.com/\n');
    return;
  }

  if (/verif/i.test(blob)) {
    console.error(
      '\n→ În Kinde: user Verified sau dezactivează verificarea obligatorie la login.\n',
    );
    return;
  }

  if (res.status === 401) {
    console.error(
      '\n→ Verifică parola în Kinde = VERIFY_AUTH_PASSWORD din .env',
    );
    console.error('   Railway: KINDE_* + password grant activ.\n');
  }
}

async function main() {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const pick = (k) => {
    const v = process.env[k] ?? fileEnv[k];
    return typeof v === 'string' ? v.trim() : '';
  };

  const base = normalizeBase(pick('EXPO_PUBLIC_API_BASE_URL') || pick('EXPO_PUBLIC_RORK_API_BASE_URL'));
  const email = pick('VERIFY_AUTH_EMAIL').toLowerCase();
  const password = pick('VERIFY_AUTH_PASSWORD');
  const name = pick('VERIFY_AUTH_NAME') || 'App Review';

  console.log('--- create-review-test-user ---\n');

  if (!base) {
    console.error('Lipsește EXPO_PUBLIC_API_BASE_URL în .env');
    return 1;
  }
  if (!email || !password) {
    console.error('Setează VERIFY_AUTH_EMAIL și VERIFY_AUTH_PASSWORD în .env');
    return 1;
  }
  if (password.length < 8) {
    console.error('Parola trebuie să aibă minim 8 caractere.');
    return 1;
  }

  console.log(`API: ${base}`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}\n`);

  const reg = await postJson(`${base}/api/auth/register`, { email, password, name });
  if (reg.res.ok) {
    console.log('✅ Cont creat și sesiune OK (register).');
    console.log('   profile_id:', reg.json.profile_id ?? '(see response)');
    console.log('\nApp Store Connect → App Review Information:');
    console.log(`   Username: ${email}`);
    console.log('   Password: (din VERIFY_AUTH_PASSWORD în .env)');
    return 0;
  }

  if (reg.res.status === 409) {
    console.log('ℹ️  Email deja înregistrat — testez login (session)...');
    const login = await postJson(`${base}/api/auth/session`, { email, password });
    if (login.res.ok) {
      console.log('✅ Login email+parolă OK.');
      console.log('\nApp Store Connect → App Review Information:');
      console.log(`   Username: ${email}`);
      console.log('   Password: (din VERIFY_AUTH_PASSWORD în .env)');
      return 0;
    }
    printLoginFailure(login);
    return 1;
  }

  console.error('❌ Register eșuat:', reg.res.status, reg.json.error ?? reg.json);
  if (reg.json.detail) console.error('   detail:', reg.json.detail);
  return 1;
}

const code = await main().catch((e) => {
  console.error(e);
  return 1;
});
process.exitCode = code;
