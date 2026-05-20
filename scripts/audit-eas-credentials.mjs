#!/usr/bin/env node
/**
 * One-off audit: print EAS Android credentials (keystore fingerprints, submit GSA).
 * Uses the globally installed eas-cli GraphQL client + local Expo session.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const easCliRoot = path.join(
  process.env.APPDATA || path.join(process.env.HOME || '', '.config'),
  'npm',
  'node_modules',
  'eas-cli',
);

const require = createRequire(import.meta.url);

const { createGraphqlClient } = require(path.join(
  easCliRoot,
  'build/commandUtils/context/contextUtils/createGraphqlClient.js',
));
import fs from 'node:fs';

const {
  getAndroidAppCredentialsWithCommonFieldsAsync,
} = require(path.join(easCliRoot, 'build/credentials/android/api/GraphqlClient.js'));

const STATE_PATH = path.join(process.env.USERPROFILE || process.env.HOME || '', '.expo', 'state.json');

const PACKAGE = 'com.devaieood.medvba';
const PROJECT_FULL_NAME = '@devaieood79/medvba';

function formatFingerprint(fingerprint) {
  if (!fingerprint) return 'unavailable';
  const upper = fingerprint.toUpperCase();
  const bytes = [];
  for (let i = 0; i < upper.length; i++) {
    if (i % 2 === 0) bytes.push(upper.charAt(i));
    else bytes[bytes.length - 1] += upper.charAt(i);
  }
  return bytes.join(':');
}

async function main() {
  const accessToken = process.env.EXPO_TOKEN?.trim() || null;
  let sessionSecret = null;
  if (!accessToken) {
    try {
      const auth = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))?.auth;
      sessionSecret = auth?.sessionSecret ?? null;
    } catch {
      sessionSecret = null;
    }
  }
  if (!accessToken && !sessionSecret) {
    console.error('Not logged in. Run: npx eas-cli login');
    process.exit(1);
  }

  const graphqlClient = createGraphqlClient({ accessToken, sessionSecret });

  const appCredentials = await getAndroidAppCredentialsWithCommonFieldsAsync(graphqlClient, {
    account: { name: 'devaieood79' },
    projectName: 'medvba',
    androidApplicationIdentifier: PACKAGE,
  });

  console.log('=== EAS Android Credentials Audit ===');
  console.log(`Project: ${PROJECT_FULL_NAME}`);
  console.log(`Package: ${PACKAGE}`);
  console.log('');

  if (!appCredentials) {
    console.log('NO credentials configured.');
    process.exit(1);
  }

  const gsa = appCredentials.googleServiceAccountKeyForSubmissions;
  console.log('--- Play Store Submit (Google Service Account) ---');
  if (!gsa) {
    console.log('Status: NOT CONFIGURED');
    console.log('Action: attach JSON at first eas submit or via eas credentials');
  } else {
    console.log('Status: CONFIGURED');
    console.log(`Project ID: ${gsa.projectIdentifier}`);
    console.log(`Client Email: ${gsa.clientEmail}`);
    console.log(`Client ID: ${gsa.clientIdentifier}`);
    console.log(`Private Key ID: ${gsa.privateKeyIdentifier}`);
    console.log(`Updated: ${gsa.updatedAt}`);
  }
  console.log('');

  const buildCredsList = appCredentials.androidAppBuildCredentialsList ?? [];
  console.log(`--- Build Keystores (${buildCredsList.length}) ---`);
  for (const bc of buildCredsList) {
    const ks = bc.androidKeystore;
    console.log(`Config: ${bc.name}${bc.isDefault ? ' (default)' : ''}`);
    if (!ks) {
      console.log('  Keystore: NONE');
      continue;
    }
    console.log(`  Type: ${ks.type}`);
    console.log(`  Key Alias: ${ks.keyAlias}`);
    console.log(`  SHA-1: ${formatFingerprint(ks.sha1CertificateFingerprint)}`);
    console.log(`  SHA-256: ${formatFingerprint(ks.sha256CertificateFingerprint)}`);
    console.log(`  Updated: ${ks.updatedAt}`);
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
