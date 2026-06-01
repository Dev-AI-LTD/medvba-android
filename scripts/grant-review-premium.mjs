/**
 * Grant Premium in Supabase for App Review demo user.
 *
 *   npm run grant-review-premium
 *   node scripts/grant-review-premium.mjs <profile_id>
 *
 * .env:
 *   SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GRANT_REVIEW_PROFILE_ID (optional if arg passed)
 *   VERIFY_AUTH_EMAIL + VERIFY_AUTH_PASSWORD + EXPO_PUBLIC_API_BASE_URL (optional: resolve profile_id via login)
 */

import { readFileSync, existsSync } from 'fs';
import http from 'http';
import https from 'https';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  grantReviewPremiumInSupabase,
  resolveSupabaseProfileId,
  ensureSupabaseProfileForKinde,
} from './lib/grant-review-premium-supabase.mjs';
import { createClient } from '@supabase/supabase-js';
import { findKindeUserIdByEmail } from './lib/kinde-find-user-by-email.mjs';

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

function pick(env, key) {
  const v = process.env[key] ?? env[key];
  return typeof v === 'string' ? v.trim() : '';
}

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
          });
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function resolveProfileId(env, cliProfileId) {
  if (cliProfileId) return cliProfileId;

  const fromEnv = pick(env, 'GRANT_REVIEW_PROFILE_ID');
  if (fromEnv) return fromEnv;

  const email = pick(env, 'VERIFY_AUTH_EMAIL').toLowerCase();
  const issuer =
    pick(env, 'KINDE_ISSUER_URL') || pick(env, 'EXPO_PUBLIC_KINDE_ISSUER_URL');
  const m2mId = pick(env, 'KINDE_M2M_CLIENT_ID');
  const m2mSecret = pick(env, 'KINDE_M2M_CLIENT_SECRET');

  if (email && issuer && m2mId && m2mSecret) {
    try {
      console.log(`Caut user Kinde după email: ${email} …`);
      const kindeId = await findKindeUserIdByEmail({ issuer, m2mId, m2mSecret, email });
      if (kindeId) {
        console.log(`✅ profile_id (Kinde user id): ${kindeId}`);
        return kindeId;
      }
      console.warn(`⚠️  Niciun user Kinde cu email ${email}`);
    } catch (e) {
      console.warn('⚠️  Căutare Kinde M2M:', e instanceof Error ? e.message : e);
    }
  } else {
    console.warn(
      '⚠️  Pentru căutare automată: VERIFY_AUTH_EMAIL + KINDE_ISSUER_URL + KINDE_M2M_* în .env',
    );
  }

  const base = pick(env, 'EXPO_PUBLIC_API_BASE_URL') || pick(env, 'EXPO_PUBLIC_RORK_API_BASE_URL');
  const password = pick(env, 'VERIFY_AUTH_PASSWORD');

  if (!base || !email || !password) {
    return null;
  }

  console.log('Încerc login session (poate eșua 502 — ROPC indisponibil la Kinde)…');
  const login = await postJson(`${base.replace(/\/+$/, '')}/api/auth/session`, { email, password });
  if (!login.res.ok) {
    console.warn('⚠️  Login session eșuat:', login.res.status, login.json.error ?? '');
    return null;
  }
  const id = login.json.profile_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

async function main() {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const cliProfileId = process.argv[2]?.trim() || '';

  const supabaseUrl = pick(fileEnv, 'SUPABASE_URL') || pick(fileEnv, 'EXPO_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = pick(fileEnv, 'SUPABASE_SERVICE_ROLE_KEY');

  console.log('--- grant-review-premium ---\n');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Lipsește SUPABASE_URL (sau EXPO_PUBLIC_SUPABASE_URL) și SUPABASE_SERVICE_ROLE_KEY în .env');
    console.error('Supabase → Settings → API → service_role (secret, nu în app).');
    return 1;
  }

  const profileId = await resolveProfileId(fileEnv, cliProfileId);
  if (!profileId) {
    console.error('Furnizează profile_id:');
    console.error('  node scripts/grant-review-premium.mjs <profile_id>');
    console.error('  sau GRANT_REVIEW_PROFILE_ID / VERIFY_AUTH_EMAIL+PASSWORD în .env');
    return 1;
  }

  console.log(`Kinde user id: ${profileId}`);
  console.log(`Supabase: ${supabaseUrl}\n`);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = pick(fileEnv, 'VERIFY_AUTH_EMAIL').toLowerCase();
  let supabaseProfileId = profileId;

  if (profileId.startsWith('kp_') || !/^[0-9a-f-]{36}$/i.test(profileId)) {
    const resolved = await resolveSupabaseProfileId(admin, {
      kindeUserId: profileId,
      email,
    });
    if (!resolved) {
      if (!email) {
        console.error('❌ Lipsește VERIFY_AUTH_EMAIL în .env.');
        return 1;
      }
      console.log('Creez rând profiles (user Kinde există, dar nu s-a logat încă în app)…');
      const created = await ensureSupabaseProfileForKinde(admin, {
        kindeUserId: profileId,
        email,
        name: pick(fileEnv, 'VERIFY_AUTH_NAME') || 'App Review',
      });
      supabaseProfileId = created.profileId;
      console.log(
        created.created
          ? `✅ profiles.id creat: ${supabaseProfileId}`
          : `✅ profiles.id: ${supabaseProfileId}`,
      );
    } else {
      supabaseProfileId = resolved;
      console.log(`✅ profiles.id (UUID): ${supabaseProfileId}`);
    }
  }

  try {
    await grantReviewPremiumInSupabase({
      supabaseUrl,
      serviceRoleKey,
      userId: supabaseProfileId,
    });
    console.log('✅ Premium activ în Supabase (subscriptions + profiles).');
    console.log('   App: allowlist email demo + study/AI pe server deblocate.');
    return 0;
  } catch (e) {
    console.error('❌', e instanceof Error ? e.message : e);
    return 1;
  }
}

const code = await main().catch((e) => {
  console.error(e);
  return 1;
});
process.exitCode = code;
