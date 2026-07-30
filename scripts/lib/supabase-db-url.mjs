/**
 * Build Supabase Postgres connection URL for CLI / pg scripts.
 * Prefers DATABASE_URL, else SUPABASE_DB_PASSWORD + linked project ref.
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const envPath = join(root, '.env');
const projectRefPath = join(root, 'supabase', '.temp', 'project-ref');
const poolerUrlPath = join(root, 'supabase', '.temp', 'pooler-url');

const DEFAULT_PROJECT_REF = 'utbcxdtcznitejbhhquh';
const DEFAULT_POOLER_HOST = 'aws-1-eu-west-1.pooler.supabase.com';
/** Session pooler — preferred for DDL (functions/triggers). */
const DEFAULT_POOLER_PORT_SESSION = '5432';
/** Transaction pooler — fallback. */
const DEFAULT_POOLER_PORT_TX = '6543';

export function parseEnv(content) {
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

export function loadEnv() {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const merged = { ...fileEnv };
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string' && value.trim()) merged[key] = value.trim();
  }
  return merged;
}

export function pick(env, key) {
  const v = env[key];
  return typeof v === 'string' ? v.trim() : '';
}

function readProjectRef() {
  if (existsSync(projectRefPath)) {
    const ref = readFileSync(projectRefPath, 'utf8').trim();
    if (ref) return ref;
  }
  return DEFAULT_PROJECT_REF;
}

function readPoolerHost() {
  if (existsSync(poolerUrlPath)) {
    try {
      const url = new URL(readFileSync(poolerUrlPath, 'utf8').trim());
      return { host: url.hostname, port: url.port || DEFAULT_POOLER_PORT_SESSION };
    } catch {
      /* fall through */
    }
  }
  return { host: DEFAULT_POOLER_HOST, port: DEFAULT_POOLER_PORT_SESSION };
}

function buildPoolerUrl({ ref, password, host, port }) {
  const user = `postgres.${ref}`;
  const encoded = encodeURIComponent(password);
  return `postgresql://${user}:${encoded}@${host}:${port}/postgres`;
}

const PLACEHOLDER_PASSWORDS = new Set([
  '',
  'REPLACE_WITH_DATABASE_PASSWORD',
  'your_database_password_here',
  'PAROLA_TA',
]);

export function resolveDatabaseUrlCandidates(env = loadEnv()) {
  const direct =
    pick(env, 'DATABASE_URL') || pick(env, 'SUPABASE_DB_URL') || pick(env, 'POSTGRES_URL');
  if (direct && !direct.includes('REPLACE_WITH_')) return [direct];

  const password = pick(env, 'SUPABASE_DB_PASSWORD');
  if (!password || PLACEHOLDER_PASSWORDS.has(password)) return [];

  const ref = pick(env, 'SUPABASE_PROJECT_REF') || readProjectRef();
  const { host } = readPoolerHost();
  const preferredPort = pick(env, 'SUPABASE_DB_PORT');
  const ports = preferredPort
    ? [preferredPort, DEFAULT_POOLER_PORT_SESSION, DEFAULT_POOLER_PORT_TX]
    : [DEFAULT_POOLER_PORT_TX, DEFAULT_POOLER_PORT_SESSION];

  return [...new Set(ports)].map((port) => buildPoolerUrl({ ref, password, host, port }));
}

export function resolveDatabaseUrl(env = loadEnv()) {
  return resolveDatabaseUrlCandidates(env)[0] ?? null;
}

export function requireDatabaseUrl(env = loadEnv()) {
  const url = resolveDatabaseUrl(env);
  if (!url) {
    throw new Error(
      'Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env (or shell env). ' +
        'Dashboard → DEV.AI.EOOD → Medix Study Hub → Database → password. ' +
        'Use pooler port 5432 (session) or 6543 (transaction).',
    );
  }
  return url;
}
