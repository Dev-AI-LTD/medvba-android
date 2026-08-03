/**
 * Verify Batch 1 UI strings (auth.*, onboarding.*, offline.*) for en ↔ es:
 * same keys, no empty values, no extra Batch 1 keys in es.
 * Also reports full-catalog gaps (informational; later localization batches).
 *
 * Run: bun run audit:locales-en-es
 */
import { en } from '../locales/en';
import { es } from '../locales/es';

const BATCH1_PREFIXES = ['auth.', 'onboarding.', 'offline.'] as const;

function isBatch1Key(key: string): boolean {
  return BATCH1_PREFIXES.some((p) => key.startsWith(p));
}

function main() {
  const enKeys = Object.keys(en).sort();
  const esKeys = Object.keys(es).sort();
  const enSet = new Set(enKeys);
  const esSet = new Set(esKeys);

  const batch1En = enKeys.filter(isBatch1Key);
  const batch1Es = esKeys.filter(isBatch1Key);
  const batch1EnSet = new Set(batch1En);
  const batch1EsSet = new Set(batch1Es);

  const missingInEs = batch1En.filter((k) => !batch1EsSet.has(k));
  const extraInEs = batch1Es.filter((k) => !batch1EnSet.has(k));
  const emptyInEs = batch1En.filter((k) => {
    if (!batch1EsSet.has(k)) return false;
    return String(es[k] ?? '').trim() === '';
  });
  const emptyInEn = batch1En.filter((k) => String(en[k] ?? '').trim() === '');

  const catalogOnlyEn = enKeys.filter((k) => !esSet.has(k));
  const catalogOnlyEs = esKeys.filter((k) => !enSet.has(k));

  console.log('=== audit:locales-en-es (Batch 1: auth/onboarding/offline) ===\n');
  console.log(`Batch 1 keys: en=${batch1En.length} es=${batch1Es.length}`);
  console.log(`Missing in es.ts: ${missingInEs.length}`);
  if (missingInEs.length) console.log(missingInEs.join('\n'));
  console.log(`\nExtra in es.ts (Batch 1): ${extraInEs.length}`);
  if (extraInEs.length) console.log(extraInEs.join('\n'));
  console.log(`\nEmpty values in es.ts (Batch 1): ${emptyInEs.length}`);
  if (emptyInEs.length) console.log(emptyInEs.join('\n'));
  console.log(`\nEmpty values in en.ts (Batch 1): ${emptyInEn.length}`);
  if (emptyInEn.length) console.log(emptyInEn.join('\n'));

  console.log('\n--- Full catalog (informational; not a Batch 1 failure) ---');
  console.log(`UI keys: en=${enKeys.length} es=${esKeys.length}`);
  console.log(`Only in en.ts (full catalog): ${catalogOnlyEn.length}`);
  console.log(`Only in es.ts (full catalog): ${catalogOnlyEs.length}`);

  const ok =
    missingInEs.length === 0 &&
    extraInEs.length === 0 &&
    emptyInEs.length === 0 &&
    emptyInEn.length === 0;

  if (!ok) {
    console.error('\nFAILED: fix Batch 1 en/es mismatches above.');
    process.exit(1);
  }
  console.log('\nOK: Batch 1 en/es locale parity (auth/onboarding/offline).');
}

main();
