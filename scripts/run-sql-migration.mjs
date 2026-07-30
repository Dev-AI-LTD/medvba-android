/**

 * Run a SQL migration file against Supabase Postgres (no dashboard required).

 *

 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD in .env — NOT the anon/service_role API keys.

 *

 *   npm run db:run-sql -- supabase/migrations/018_profiles_premium_server_only.sql

 */



import { readFileSync, existsSync } from 'fs';

import { dirname, join, resolve } from 'path';

import { fileURLToPath } from 'url';

import pg from 'pg';

import { resolveDatabaseUrlCandidates } from './lib/supabase-db-url.mjs';



const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const root = join(__dirname, '..');



function maskUrl(url) {

  try {

    const u = new URL(url);

    if (u.password) u.password = '***';

    return u.toString();

  } catch {

    return '(invalid url)';

  }

}



async function runMigration(databaseUrl, sql) {

  const client = new Client({

    connectionString: databaseUrl,

    ssl: { rejectUnauthorized: false },

    connectionTimeoutMillis: 25_000,

    query_timeout: 60_000,

  });



  try {

    await client.connect();

    await client.query('BEGIN');

    await client.query(sql);

    await client.query('COMMIT');

    return null;

  } catch (e) {

    try {

      await client.query('ROLLBACK');

    } catch {

      /* ignore */

    }

    return e;

  } finally {

    await client.end().catch(() => {});

  }

}



async function main() {

  const relPath = process.argv[2]?.trim();

  if (!relPath) {

    console.error('Usage: npm run db:run-sql -- supabase/migrations/018_profiles_premium_server_only.sql');

    return 1;

  }



  const sqlPath = resolve(root, relPath);

  if (!existsSync(sqlPath)) {

    console.error(`File not found: ${sqlPath}`);

    return 1;

  }



  const candidates = resolveDatabaseUrlCandidates();

  if (candidates.length === 0) {

    console.error(

      'Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.\n' +

        'Dashboard → DEV.AI.EOOD → Medix Study Hub → Database → password.',

    );

    return 1;

  }



  const sql = readFileSync(sqlPath, 'utf8').trim();

  if (!sql) {

    console.error('SQL file is empty.');

    return 1;

  }



  console.log(`--- run-sql-migration ---`);

  console.log(`File: ${relPath}`);

  console.log(`Bytes: ${Buffer.byteLength(sql, 'utf8')}\n`);



  let lastError = null;

  for (let i = 0; i < candidates.length; i += 1) {

    const url = candidates[i];

    console.log(`Trying ${maskUrl(url)} …`);

    lastError = await runMigration(url, sql);

    if (!lastError) {

      console.log('✅ Migration applied successfully.');

      return 0;

    }

    console.warn(`⚠️  ${lastError instanceof Error ? lastError.message : lastError}`);

    if (i < candidates.length - 1) console.log('Retrying alternate pooler port…\n');

  }



  console.error('❌ Migration failed on all connection URLs.');

  if (lastError instanceof Error) console.error(lastError.message);

  return 1;

}



const code = await main().catch((e) => {

  console.error(e);

  return 1;

});

process.exitCode = code;


