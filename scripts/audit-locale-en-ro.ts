/**
 * Verify app UI strings (locales/en vs ro): same keys, no Romanian diacritics in EN values,
 * no suspicious identical long EN/RO pairs. Also spot-check chapter titles.
 *
 * Run: bun run audit:locales-en-ro
 */
import { en } from '../locales/en';
import { ro } from '../locales/ro';
import { chapterTranslations } from '../locales/chapterTranslations';

const RO_DIACRITICS = /[\u0103\u0219\u021B\u0102\u0218\u021A\u00EE\u00E2\u00C2\u00CE]/;

function main() {
  const enKeys = Object.keys(en).sort();
  const roKeys = Object.keys(ro).sort();
  const enSet = new Set(enKeys);
  const roSet = new Set(roKeys);
  const onlyEn = enKeys.filter((k) => !roSet.has(k));
  const onlyRo = roKeys.filter((k) => !enSet.has(k));

  const enWithRoChars: string[] = [];
  for (const k of enKeys) {
    if (RO_DIACRITICS.test(en[k])) enWithRoChars.push(k);
  }

  const identicalLong: string[] = [];
  for (const k of enKeys) {
    const v = en[k];
    if (ro[k] === v && v.length > 40) identicalLong.push(k);
  }

  let chapterEnBad = 0;
  let chapterMissing = 0;
  for (const [, o] of Object.entries(chapterTranslations)) {
    if (!o.en || !o.ro) {
      chapterMissing++;
      continue;
    }
    if (RO_DIACRITICS.test(o.en)) chapterEnBad++;
  }

  console.log('=== audit:locales-en-ro ===\n');
  console.log(`UI keys: en=${enKeys.length} ro=${roKeys.length}`);
  console.log(`Only in en.ts: ${onlyEn.length}`);
  if (onlyEn.length) console.log(onlyEn.join('\n'));
  console.log(`\nOnly in ro.ts: ${onlyRo.length}`);
  if (onlyRo.length) console.log(onlyRo.join('\n'));
  console.log(`\nen.ts values with Romanian diacritics: ${enWithRoChars.length}`);
  if (enWithRoChars.length) console.log(enWithRoChars.join('\n'));
  console.log(`\nIdentical en/ro (>40 chars): ${identicalLong.length}`);
  if (identicalLong.length) console.log(identicalLong.slice(0, 20).join('\n'));
  console.log(`\nchapterTranslations: entries missing en/ro: ${chapterMissing}`);
  console.log(`chapterTranslations: en titles with RO diacritics: ${chapterEnBad}`);

  const ok =
    onlyEn.length === 0 &&
    onlyRo.length === 0 &&
    enWithRoChars.length === 0 &&
    chapterEnBad === 0 &&
    chapterMissing === 0;

  if (!ok) {
    console.error('\nFAILED: fix mismatches above.');
    process.exit(1);
  }
  console.log('\nOK: en/ro locale parity and no obvious language mix in EN.');
}

main();
