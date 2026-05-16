/**
 * Lists quiz-session questions without full Romanian:
 * întrebare, toate variantele (răspunsurile), și explicația dacă există în EN.
 *
 * Run from repo root: bun scripts/audit-quiz-missing-ro.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { allQuestions } from '../lib/quizSessionQuestionPool';
import { hasFullRomanianQuizContent, romanianTranslationIssue } from '../lib/quizRomanianCompleteness';
import type { Question } from '../mocks/questions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'quiz-missing-ro-report.txt');

const hasFullRomanian = hasFullRomanianQuizContent;

const byCategory = new Map<string, Question[]>();
const duplicateIds = new Map<string, number>();
const seen = new Map<string, number>();

for (const q of allQuestions) {
  seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
  const cat = q.category || '(no-category)';
  if (!hasFullRomanian(q)) {
    const arr = byCategory.get(cat) ?? [];
    arr.push(q);
    byCategory.set(cat, arr);
  }
}

for (const [id, c] of seen) {
  if (c > 1) duplicateIds.set(id, c);
}

const lines: string[] = [];
lines.push('=== MEDVBA — audit traduceri RO (întrebări quiz-session) ===');
lines.push(`Total întrebări în pool: ${allQuestions.length}`);
lines.push(`Unice după id: ${seen.size}`);
lines.push(
  `Cu traducere RO completă (întrebare + variante + explicație când există EN): ${allQuestions.filter(hasFullRomanian).length}`,
);
const missingCount = Array.from(byCategory.values()).reduce((a, qs) => a + qs.length, 0);
lines.push(`Fără traducere RO completă: ${missingCount}`);
lines.push('');

if (duplicateIds.size) {
  lines.push(`=== ID-uri duplicate în pool (${duplicateIds.size}) — primul exemplu păstrat în mapa canonică ===`);
  for (const [id, c] of [...duplicateIds.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${id}  (${c}x)`);
  }
  lines.push('');
}

const partial: { id: string; issue: string }[] = [];
for (const q of allQuestions) {
  const p = romanianTranslationIssue(q);
  if (p) partial.push({ id: q.id, issue: p });
}
if (partial.length) {
  lines.push(`=== Traduceri parțiale / variante sau explicație incomplete (${partial.length}) ===`);
  for (const { id, issue } of partial.slice(0, 200)) {
    lines.push(`  ${id}: ${issue}`);
  }
  if (partial.length > 200) lines.push(`  ... +${partial.length - 200} more`);
  lines.push('');
}

lines.push('=== Lipsă RO complet — grupat după category (Question.category) ===');
const cats = [...byCategory.keys()].sort((a, b) => (byCategory.get(b)!.length - byCategory.get(a)!.length));
for (const cat of cats) {
  const qs = byCategory.get(cat)!;
  lines.push('');
  lines.push(`--- ${cat} (${qs.length} întrebări) ---`);
  for (const q of qs) {
    lines.push(q.id);
  }
}

const body = lines.join('\n');
fs.writeFileSync(outPath, body, 'utf8');

console.log(body.slice(0, 8000));
if (body.length > 8000) {
  console.log(`\n... (truncat în consolă; raport complet: ${outPath})`);
} else {
  console.log(`\nRaport scris: ${outPath}`);
}
