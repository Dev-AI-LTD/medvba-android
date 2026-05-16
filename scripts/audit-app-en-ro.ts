/**
 * Audit locale doar EN + RO (fără ES/PT):
 * - UI: en.ts vs ro.ts (chei lipsă)
 * - chapterTranslations: en + ro obligatorii (ignoră es/pt)
 * - Quiz pool: traducere RO completă (întrebare + variante + explicație când există EN)
 *
 * Run: bun run audit:app-en-ro
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { allQuestions } from '../lib/quizSessionQuestionPool';
import { hasFullRomanianQuizContent } from '../lib/quizRomanianCompleteness';
import { en } from '../locales/en';
import { ro } from '../locales/ro';
import { chapterTranslations } from '../locales/chapterTranslations';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'app-en-ro-audit-report.txt');

function diffKeys(
  base: Record<string, string>,
  other: Record<string, string>,
): { onlyBase: string[]; onlyOther: string[] } {
  const b = new Set(Object.keys(base));
  const o = new Set(Object.keys(other));
  return {
    onlyBase: [...b].filter((k) => !o.has(k)).sort(),
    onlyOther: [...o].filter((k) => !b.has(k)).sort(),
  };
}

function main() {
  const lines: string[] = [];
  lines.push('=== MEDVBA — audit EN + RO (fără ES/PT) ===\n');

  lines.push('--- UI: en.ts vs ro.ts ---\n');
  const { onlyBase: missingInRo, onlyOther: onlyInRoNotInEn } = diffKeys(en, ro);
  lines.push(`Chei în en, lipsă în ro: ${missingInRo.length}`);
  if (missingInRo.length) lines.push(...missingInRo.map((k) => `  ${k}`));
  lines.push(`\nChei în ro, lipsă în en: ${onlyInRoNotInEn.length}`);
  if (onlyInRoNotInEn.length) {
    lines.push(...onlyInRoNotInEn.slice(0, 300).map((k) => `  ${k}`));
  }
  if (onlyInRoNotInEn.length > 300) {
    lines.push(`  ... +${onlyInRoNotInEn.length - 300} more`);
  }
  lines.push('');

  lines.push('--- chapterTranslations: doar en + ro ---\n');
  const chProblems: string[] = [];
  for (const [id, o] of Object.entries(chapterTranslations)) {
    if (!o.en?.trim() || !o.ro?.trim()) {
      chProblems.push(`${id}: lipsă ${!o.en?.trim() ? 'en ' : ''}${!o.ro?.trim() ? 'ro' : ''}`.trim());
    }
  }
  lines.push(
    `Capitole fără en sau ro: ${chProblems.length} / ${Object.keys(chapterTranslations).length}`,
  );
  if (chProblems.length) lines.push(...chProblems);
  lines.push('');

  lines.push('--- Quiz pool: RO complet (întrebare + variante + explicație dacă EN are) ---\n');
  const byCat = new Map<string, string[]>();
  for (const q of allQuestions) {
    if (hasFullRomanianQuizContent(q)) continue;
    const cat = q.category || '(no-category)';
    const arr = byCat.get(cat) ?? [];
    arr.push(q.id);
    byCat.set(cat, arr);
  }
  const missing = [...byCat.values()].reduce((a, ids) => a + ids.length, 0);
  lines.push(`Fără RO complet: ${missing} (inclusiv duplicate în pool)`);
  const cats = [...byCat.keys()].sort((a, b) => (byCat.get(b)!.length - byCat.get(a)!.length));
  for (const cat of cats) {
    lines.push(`\n--- ${cat} (${byCat.get(cat)!.length}) ---`);
    for (const id of byCat.get(cat)!) lines.push(id);
  }

  const body = lines.join('\n');
  fs.writeFileSync(outPath, body, 'utf8');
  console.log(body.slice(0, 10000));
  if (body.length > 10000) console.log(`\n... (truncat) Raport: ${outPath}`);
  else console.log(`\nRaport: ${outPath}`);
}

main();
