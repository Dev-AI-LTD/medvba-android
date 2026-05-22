/**
 * Spune ce bloc Review Notes să folosești în App Store Connect.
 * Rulează: npm run review-notes:mode
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnv(content) {
  const out = {};
  content.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  });
  return out;
}

const envPath = join(root, '.env');
const env = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const email = (process.env.VERIFY_AUTH_EMAIL ?? env.VERIFY_AUTH_EMAIL ?? '').trim();

console.log('--- App Store Review Notes mode ---\n');

const diag = spawnSync('node', ['scripts/diagnose-kinde-password-grant.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});

const ok = diag.status === 0;

if (ok) {
  console.log('✅ Password grant OK — folosește blocul **Alternate** din docs/app-store-metadata-en.md');
  console.log('   Completează Username/Password în App Review Information:');
  if (email) console.log('   Email:', email);
  console.log('   Password: (din VERIFY_AUTH_PASSWORD în .env)\n');
} else {
  console.log('❌ Password grant încă eșuează — folosește blocul **Primary** (Apple + Google)');
  console.log('   Lasă Username/Password goale în ASC.');
  console.log('   Ticket Kinde: docs/KINDE_SUPPORT_TICKET_PASSWORD_GRANT.md\n');
}

process.exitCode = ok ? 0 : 1;
