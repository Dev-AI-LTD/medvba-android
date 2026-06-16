/**
 * Verifică contul App Review: Kinde user + Supabase profile + premium.
 *   npm run verify:review-user
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { findKindeUserIdByEmail } from './lib/kinde-find-user-by-email.mjs';
import { resolveSupabaseProfileId } from './lib/grant-review-premium-supabase.mjs';

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

async function kindeGetUser(issuer, m2mToken, userId) {
  const res = await fetch(`${issuer.replace(/\/+$/, '')}/api/v1/user?id=${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${m2mToken}`, Accept: 'application/json' },
  });
  const raw = await res.text().catch(() => '');
  if (!res.ok) return { ok: false, status: res.status, raw: raw.slice(0, 500) };
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, status: res.status, raw };
  }
}

async function getM2mToken(env) {
  const issuer = pick(env, 'KINDE_ISSUER_URL') || pick(env, 'EXPO_PUBLIC_KINDE_ISSUER_URL');
  const m2mId = pick(env, 'KINDE_M2M_CLIENT_ID');
  const m2mSecret = pick(env, 'KINDE_M2M_CLIENT_SECRET');
  const audience =
    pick(env, 'KINDE_MANAGEMENT_AUDIENCE') || pick(env, 'KINDE_AUDIENCE') || `${issuer.replace(/\/+$/, '')}/api`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: m2mId,
    client_secret: m2mSecret,
    audience,
    scope: pick(env, 'KINDE_M2M_TOKEN_SCOPE') || 'read:users update:users',
  });
  const res = await fetch(`${issuer.replace(/\/+$/, '')}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`M2M token HTTP ${res.status}`);
  const json = await res.json();
  return { token: json.access_token, issuer };
}

async function main() {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const email = pick(fileEnv, 'VERIFY_AUTH_EMAIL').toLowerCase();

  console.log('--- verify-review-user ---\n');
  if (!email) {
    console.error('❌ VERIFY_AUTH_EMAIL lipsește din .env');
    return 1;
  }
  console.log(`Email review: ${email}\n`);

  let ok = 0;
  let warn = 0;
  let fail = 0;

  const issuer = pick(fileEnv, 'EXPO_PUBLIC_KINDE_ISSUER_URL');
  const emailConn = pick(fileEnv, 'EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID');
  const hint = pick(fileEnv, 'EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL');
  const reviewEmails = pick(fileEnv, 'EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS');

  if (issuer) {
    console.log('✅ EXPO_PUBLIC_KINDE_ISSUER_URL');
    ok++;
  } else {
    console.log('❌ EXPO_PUBLIC_KINDE_ISSUER_URL');
    fail++;
  }
  if (emailConn) {
    console.log('✅ EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID (Sign in with email în app)');
    ok++;
  } else {
    console.log('❌ EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID');
    fail++;
  }
  if (hint === email || !hint) {
    console.log(hint ? '✅ LOGIN_HINT aliniat cu email review' : '⚠️  LOGIN_HINT gol (OK — opțional)');
    hint ? ok++ : warn++;
  } else {
    console.log(`⚠️  LOGIN_HINT (${hint}) ≠ VERIFY_AUTH_EMAIL`);
    warn++;
  }
  if (!reviewEmails || reviewEmails.toLowerCase().includes(email)) {
    console.log('✅ Premium allowlist în app (implicit sau EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS)');
    ok++;
  } else {
    console.log(`⚠️  APP_REVIEW_PREMIUM_EMAILS nu include ${email}`);
    warn++;
  }

  const supabaseUrl = pick(fileEnv, 'SUPABASE_URL') || pick(fileEnv, 'EXPO_PUBLIC_SUPABASE_URL');
  const serviceKey = pick(fileEnv, 'SUPABASE_SERVICE_ROLE_KEY');
  const m2mId = pick(fileEnv, 'KINDE_M2M_CLIENT_ID');
  const m2mSecret = pick(fileEnv, 'KINDE_M2M_CLIENT_SECRET');

  if (!m2mId || !m2mSecret) {
    console.log('❌ KINDE_M2M_* — nu pot verifica user Kinde');
    fail++;
  } else {
    try {
      const kindeId = await findKindeUserIdByEmail({
        issuer: issuer || pick(fileEnv, 'KINDE_ISSUER_URL'),
        m2mId,
        m2mSecret,
        email,
      });
      if (kindeId) {
        console.log(`✅ User Kinde găsit: ${kindeId}`);
        ok++;

        try {
          const { token, issuer: iss } = await getM2mToken(fileEnv);
          const detail = await kindeGetUser(iss, token, kindeId);
          if (detail.ok) {
            const u = detail.data;
            const identities = u.identities || u.user?.identities || [];
            const emailId = Array.isArray(identities)
              ? identities.find((i) => i.type === 'email' || i.details?.email)
              : null;
            const verified =
              u.is_email_verified ??
              u.email_verified ??
              u.is_verified ??
              u.verified ??
              emailId?.is_verified ??
              emailId?.verified ??
              (Array.isArray(identities) &&
              identities.some(
                (i) =>
                  i.is_verified === true ||
                  i.verified === true ||
                  String(i.details?.email_verified ?? '').toLowerCase() === 'true',
              )
                ? true
                : null);
            const signIns = u.sign_ins ?? u.total_sign_ins ?? null;
            if (verified === true) {
              console.log('✅ Kinde: email marcat verified (API)');
              ok++;
            } else if (verified === false) {
              console.log('⚠️  Kinde: email încă unverified (API) — testează login în app; Reset password dacă cere OTP');
              warn++;
            } else {
              console.log('⚠️  Kinde: status verified necunoscut în API — verifică manual în UI');
              warn++;
            }
            if (signIns === 0 || signIns === '0') {
              console.log('⚠️  Kinde: 0 sign-ins — normal până la primul login din app');
              warn++;
            } else if (signIns != null) {
              console.log(`✅ Kinde: sign-ins: ${signIns}`);
              ok++;
            }
          } else {
            console.log(`⚠️  Detalii user Kinde: HTTP ${detail.status}`);
            warn++;
          }
        } catch (e) {
          console.log('⚠️  Detalii user Kinde:', e instanceof Error ? e.message : e);
          warn++;
        }
      } else {
        console.log('❌ User Kinde negăsit pentru email');
        fail++;
      }
    } catch (e) {
      console.log('❌ Kinde M2M:', e instanceof Error ? e.message : e);
      fail++;
    }
  }

  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const kindeId = await findKindeUserIdByEmail({
      issuer: issuer || pick(fileEnv, 'KINDE_ISSUER_URL'),
      m2mId,
      m2mSecret,
      email,
    }).catch(() => null);

    const profileId = await resolveSupabaseProfileId(admin, { kindeUserId: kindeId ?? '', email });
    if (profileId) {
      console.log(`✅ Supabase profiles.id: ${profileId}`);
      ok++;

      const { data: sub } = await admin
        .from('subscriptions')
        .select('status, type, expires_at')
        .eq('user_id', profileId)
        .maybeSingle();
      const { data: prof } = await admin
        .from('profiles')
        .select('is_premium, subscription_status, kinde_sub')
        .eq('id', profileId)
        .maybeSingle();

      const premium =
        sub?.status === 'premium' ||
        sub?.status === 'trial' ||
        prof?.is_premium === true ||
        prof?.subscription_status === 'premium';
      if (premium) {
        console.log(`✅ Supabase Premium: subscriptions=${sub?.status ?? 'n/a'}, profiles.is_premium=${prof?.is_premium}`);
        ok++;
      } else {
        console.log('❌ Supabase: nu e Premium — rulează npm run grant-review-premium');
        fail++;
      }
    } else {
      console.log('❌ Supabase: profil lipsă — grant-review-premium sau login în app');
      fail++;
    }
  } else {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY — skip verificare DB');
    warn++;
  }

  console.log(`\n--- Rezumat: ${ok} OK, ${warn} avertismente, ${fail} erori ---`);
  if (fail > 0) {
    console.log('\nUrmător: Kinde parolă + test app; npm run grant-review-premium dacă lipsește Premium.');
    return 1;
  }
  if (warn > 0) {
    console.log('\nProbabil gata pentru test manual în app (Sign in with email).');
  }
  return 0;
}

const code = await main().catch((e) => {
  console.error(e);
  return 1;
});
process.exitCode = code;
