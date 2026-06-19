/**
 * Mark App Review demo user as free / expired subscription (purchase-flow testing).
 *
 *   npm run expire-review-subscription -- review-expired@devaieood.com
 *   node scripts/expire-review-subscription.mjs <email>
 *
 * .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, KINDE_M2M_* (optional, to resolve profile)
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  expireReviewSubscriptionInSupabase,
  ensureSupabaseProfileForKinde,
  resolveSupabaseProfileId,
} from './lib/grant-review-premium-supabase.mjs';
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

async function resolveProfileIdForEmail(env, email) {
  const issuer = pick(env, 'KINDE_ISSUER_URL') || pick(env, 'EXPO_PUBLIC_KINDE_ISSUER_URL');
  const m2mId = pick(env, 'KINDE_M2M_CLIENT_ID');
  const m2mSecret = pick(env, 'KINDE_M2M_CLIENT_SECRET');

  if (issuer && m2mId && m2mSecret) {
    const kindeId = await findKindeUserIdByEmail({ issuer, m2mId, m2mSecret, email });
    if (kindeId) {
      const supabaseUrl = pick(env, 'SUPABASE_URL') || pick(env, 'EXPO_PUBLIC_SUPABASE_URL');
      const serviceRoleKey = pick(env, 'SUPABASE_SERVICE_ROLE_KEY');
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const profileId = await resolveSupabaseProfileId(admin, { kindeUserId: kindeId, email });
      if (profileId) return profileId;
      const ensured = await ensureSupabaseProfileForKinde(admin, {
        kindeUserId: kindeId,
        email,
        name: 'App Review Expired',
      });
      if (ensured?.profileId) {
        console.log(
          ensured.created
            ? `✅ Created missing Supabase profile: ${ensured.profileId}`
            : `✅ Resolved Supabase profile: ${ensured.profileId}`,
        );
        return ensured.profileId;
      }
    }
  }

  const supabaseUrl = pick(env, 'SUPABASE_URL') || pick(env, 'EXPO_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = pick(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return resolveSupabaseProfileId(admin, { email });
}

async function main() {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const emailArg = process.argv[2]?.trim().toLowerCase() || 'review-expired@devaieood.com';

  const supabaseUrl = pick(fileEnv, 'SUPABASE_URL') || pick(fileEnv, 'EXPO_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = pick(fileEnv, 'SUPABASE_SERVICE_ROLE_KEY');

  console.log('--- expire-review-subscription ---\n');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Lipsește SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY în .env');
    return 1;
  }

  if (!emailArg.includes('@')) {
    console.error('Furnizează email: npm run expire-review-subscription -- review-expired@devaieood.com');
    return 1;
  }

  console.log(`Email: ${emailArg}`);
  const profileId = await resolveProfileIdForEmail(fileEnv, emailArg);
  if (!profileId) {
    console.error('❌ Nu am găsit profiles.id. Creează userul în Kinde, apoi loghează-l o dată în app.');
    return 1;
  }

  console.log(`profiles.id: ${profileId}\n`);

  try {
    const result = await expireReviewSubscriptionInSupabase({
      supabaseUrl,
      serviceRoleKey,
      userId: profileId,
    });
    console.log(`✅ Subscription set to ${result.status} (expires_at ${result.expiresAt}).`);
    console.log('   Do not add this email to EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS.');
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
