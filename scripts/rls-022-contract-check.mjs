/**
 * RLS 022 metadata probes + A/B contract (anon + Bearer JWT A).
 *
 * Env (never logged):
 *   RLS_CONTRACT_JWT_A       — Medvba/Supabase JWT for QA user A
 *   RLS_CONTRACT_PROFILE_B   — profiles.id of QA user B
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY — only for marker before-check / emergency cleanup
 *
 * Usage: bun run rls:022-contract
 * Exit 0 only if all PASS. Evidence written without PII.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { resolveDatabaseUrlCandidates, loadEnv } from './lib/supabase-db-url.mjs';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const MARKER = 'rls_contract_probe_do_not_use';

function hydrateProcessEnv() {
  const fileEnv = loadEnv();
  for (const [k, v] of Object.entries(fileEnv)) {
    if (typeof v !== 'string' || !v.trim()) continue;
    const cur = process.env[k];
    if (cur === undefined || String(cur).trim() === '') {
      process.env[k] = v.trim();
    }
  }
}

function reqEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function runMetadataProbes() {
  const urls = resolveDatabaseUrlCandidates();
  if (!urls.length) throw new Error('No DATABASE_URL / SUPABASE_DB_* candidates');
  const sql = readFileSync(join(__dirname, 'rls-022-metadata-probes.sql'), 'utf8');
  let lastErr;
  for (const databaseUrl of urls) {
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 25_000,
    });
    try {
      await client.connect();
      const { rows } = await client.query(sql);
      await client.end();
      const map = Object.fromEntries(rows.map((r) => [r.probe, r.ok === true]));
      const needed = [
        'profiles_select_own',
        'profiles_no_open_select',
        'profiles_no_open_all',
        'public_profiles',
        'get_my_ai_credit_balance',
        'legacy_rpc_no_authenticated_execute',
      ];
      for (const k of needed) {
        if (!map[k]) {
          throw new Error(`Metadata probe failed: ${k}`);
        }
      }
      return true;
    } catch (e) {
      lastErr = e;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw lastErr ?? new Error('Metadata probes failed');
}

function legacyDenied(legacy) {
  if (legacy.error) return true;
  // PostgREST may return null data with no error for some cases — only PASS if not a numeric balance
  if (typeof legacy.data === 'number') return false;
  // Function missing / not exposed often surfaces as error; if data is null with error absent,
  // treat as denied only when status-like message exists — conservative: null without error = FAIL
  if (legacy.data === null || legacy.data === undefined) {
    return Boolean(legacy.error);
  }
  return false;
}

async function runContract() {
  const jwtA = reqEnv('RLS_CONTRACT_JWT_A');
  const profileB = reqEnv('RLS_CONTRACT_PROFILE_B');
  const url = reqEnv('EXPO_PUBLIC_SUPABASE_URL');
  const anon = reqEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const clientA = createClient(url, anon, {
    accessToken: async () => jwtA,
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results = {
    profilesCrossUser: false,
    ownCreditRpc: false,
    legacyCreditRpcDenied: false,
    achievementInsertDenied: false,
  };

  // Profiles: no email column
  {
    const { data, error } = await clientA
      .from('profiles')
      .select('id')
      .eq('id', profileB);
    if (error) throw new Error(`profiles query error: ${error.code || error.message}`);
    if ((data?.length ?? 0) !== 0) {
      throw new Error('Profiles cross-user read returned rows (FAIL)');
    }
    results.profilesCrossUser = true;
  }

  // Own credit RPC
  {
    const { data, error } = await clientA.rpc('get_my_ai_credit_balance');
    if (error) throw new Error(`get_my_ai_credit_balance failed: ${error.message}`);
    if (!(typeof data === 'number' || data === null)) {
      throw new Error('get_my_ai_credit_balance returned unexpected type');
    }
    results.ownCreditRpc = true;
  }

  // Legacy RPC — must not expose numeric balance
  {
    const legacy = await clientA.rpc('get_ai_credit_balance', {
      p_user_id: profileB,
    });
    if (!legacyDenied(legacy)) {
      throw new Error(
        'Legacy get_ai_credit_balance exposed a numeric balance or succeeded without denial (FAIL)',
      );
    }
    results.legacyCreditRpcDenied = true;
  }

  // Achievement insert safety
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for marker before-check / cleanup');
  }
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  {
    const { data: before, error: beforeErr } = await admin
      .from('user_achievements')
      .select('id')
      .eq('user_id', profileB)
      .eq('achievement_type', MARKER)
      .limit(1);
    if (beforeErr) throw new Error(`marker before-check failed: ${beforeErr.message}`);
    if (before?.length) {
      throw new Error('Reserved RLS marker already exists; refuse to run');
    }

    const { error: insertErr } = await clientA.from('user_achievements').insert({
      user_id: profileB,
      achievement_type: MARKER,
    });

    if (!insertErr) {
      // Critical: RLS failed — cleanup then exit failure
      await admin
        .from('user_achievements')
        .delete()
        .eq('user_id', profileB)
        .eq('achievement_type', MARKER);
      throw new Error('Cross-user achievement insert succeeded (RLS FAIL); cleaned up');
    }
    results.achievementInsertDenied = true;
  }

  return results;
}

function writeEvidence(ok) {
  const dir = join(root, 'docs', 'audits', 'evidence');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = join(dir, `rls-022-contract-${stamp.slice(0, 10)}.md`);
  const body = `# RLS 022 Contract Evidence

- Timestamp: ${new Date().toISOString()}
- Environment: Production-controlled verification
- Schema metadata: ${ok ? 'PASS' : 'FAIL'}
- Profiles cross-user read: ${ok ? 'PASS' : 'FAIL'}
- Own credit RPC works: ${ok ? 'PASS' : 'FAIL'}
- Legacy credit RPC denied: ${ok ? 'PASS' : 'FAIL'}
- Cross-user achievement insert denied: ${ok ? 'PASS' : 'FAIL'}
- PII/logging policy: No identifiers, JWTs, emails, or payloads recorded
`;
  writeFileSync(path, body, 'utf8');
  return path;
}

async function pickQaPairAndMintJwtA() {
  const url = reqEnv('EXPO_PUBLIC_SUPABASE_URL');
  const serviceKey = reqEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await admin
    .from('profiles')
    .select('id, kinde_sub')
    .not('kinde_sub', 'is', null)
    .order('created_at', { ascending: true })
    .limit(2);

  if (error || !rows || rows.length < 2) {
    throw new Error(
      'Need at least 2 profiles with kinde_sub for auto QA pair (or set RLS_CONTRACT_* env)',
    );
  }

  const profileA = rows[0].id;
  const kindeA = rows[0].kinde_sub;
  const profileB = rows[1].id;

  const secret =
    process.env.SUPABASE_JWT_SIGNING_SECRET?.trim() ||
    process.env.KINDE_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'Missing SUPABASE_JWT_SIGNING_SECRET (or KINDE_CLIENT_SECRET fallback) for auto-mint',
    );
  }

  const { SignJWT } = await import('jose');
  const jwtA = await new SignJWT({
    role: 'authenticated',
    profile_id: String(profileA),
    kinde_sub: String(kindeA),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(profileA))
    .setIssuedAt()
    .setExpirationTime('15m')
    .setAudience('authenticated')
    .sign(new TextEncoder().encode(secret));

  process.env.RLS_CONTRACT_JWT_A = jwtA;
  process.env.RLS_CONTRACT_PROFILE_B = profileB;
}

async function main() {
  hydrateProcessEnv();
  console.log('RLS 022: metadata probes…');
  await runMetadataProbes();
  console.log('Schema metadata: PASS');

  if (!process.env.RLS_CONTRACT_JWT_A?.trim() || !process.env.RLS_CONTRACT_PROFILE_B?.trim()) {
    console.log('Auto-selecting QA pair and minting JWT A (ids not logged)…');
    await pickQaPairAndMintJwtA();
  }

  console.log('RLS 022: contract A/B…');
  await runContract();
  writeEvidence(true);
  console.log('Contract A/B: PASS');
  console.log('Evidence written (PASS/FAIL only, no PII).');
}

main().catch((err) => {
  console.error('RLS 022 contract FAILED:', err instanceof Error ? err.message : String(err));
  try {
    writeEvidence(false);
  } catch {
    /* ignore */
  }
  process.exit(1);
});
