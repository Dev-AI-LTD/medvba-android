/**
 * Export chapter inventory from mocks/chapters.ts (moduleChaptersMap).
 *
 * Run: bun run list:chapters
 * Writes: scripts/output/chapters-inventory.json, scripts/output/chapters-inventory.csv
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { moduleChaptersMap } from '../mocks/chapters';
import { chapterTranslations } from '../locales/chapterTranslations';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'output');

const MODULE_UI: Record<string, { en: string; ro: string; chapterPickerInApp: boolean }> = {
  'upper-lower-limbs': {
    en: 'Upper/Lower Limbs',
    ro: 'Membre Superioare și Inferioare',
    chapterPickerInApp: false,
  },
  'internal-organs': {
    en: 'Internal Organs',
    ro: 'Organe Interne',
    chapterPickerInApp: false,
  },
  'head-neck': {
    en: 'Head & Neck',
    ro: 'Cap și Gât',
    chapterPickerInApp: false,
  },
  neuroanatomy: {
    en: 'Neuroanatomy',
    ro: 'Neuroanatomie',
    chapterPickerInApp: false,
  },
  'med-admission-barrons': {
    en: 'Medical School Entrance Exam',
    ro: 'Admitere Medicină',
    chapterPickerInApp: true,
  },
};

type ChapterRow = {
  moduleId: string;
  moduleNameEn: string;
  moduleNameRo: string;
  chapterPickerInApp: boolean;
  chapterIndex: number;
  chapterId: string;
  nameInCode: string;
  titleEn: string;
  titleRo: string;
  questionCount: number;
};

function titleFor(chapterId: string, lang: 'en' | 'ro', fallback: string): string {
  const t = chapterTranslations[chapterId];
  if (!t) return fallback;
  return t[lang] ?? t.en ?? fallback;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const rows: ChapterRow[] = [];
const modulesSummary: {
  moduleId: string;
  moduleNameEn: string;
  moduleNameRo: string;
  chapterPickerInApp: boolean;
  chapterCount: number;
  questionCount: number;
}[] = [];

for (const [moduleId, mod] of Object.entries(moduleChaptersMap)) {
  const meta = MODULE_UI[moduleId] ?? {
    en: mod.moduleName || moduleId,
    ro: mod.moduleName || moduleId,
    chapterPickerInApp: false,
  };
  let moduleQuestions = 0;

  mod.chapters.forEach((ch, index) => {
    const count = ch.questions?.length ?? 0;
    moduleQuestions += count;
    rows.push({
      moduleId,
      moduleNameEn: meta.en,
      moduleNameRo: meta.ro,
      chapterPickerInApp: meta.chapterPickerInApp,
      chapterIndex: index + 1,
      chapterId: ch.id,
      nameInCode: ch.name,
      titleEn: titleFor(ch.id, 'en', ch.name),
      titleRo: titleFor(ch.id, 'ro', ch.name),
      questionCount: count,
    });
  });

  modulesSummary.push({
    moduleId,
    moduleNameEn: meta.en,
    moduleNameRo: meta.ro,
    chapterPickerInApp: meta.chapterPickerInApp,
    chapterCount: mod.chapters.length,
    questionCount: moduleQuestions,
  });
}

const inventory = {
  generatedAt: new Date().toISOString(),
  source: 'mocks/chapters.ts → moduleChaptersMap',
  totalModules: modulesSummary.length,
  totalChapters: rows.length,
  totalQuestions: rows.reduce((s, r) => s + r.questionCount, 0),
  note: 'Only med-admission-barrons shows the chapter picker screen (quiz-chapters.tsx).',
  modules: modulesSummary,
  chapters: rows,
};

fs.mkdirSync(outDir, { recursive: true });

const jsonPath = path.join(outDir, 'chapters-inventory.json');
fs.writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');

const csvHeader =
  'moduleId,moduleNameEn,moduleNameRo,chapterPickerInApp,chapterIndex,chapterId,nameInCode,titleEn,titleRo,questionCount';
const csvLines = [
  csvHeader,
  ...rows.map((r) =>
    [
      r.moduleId,
      escapeCsv(r.moduleNameEn),
      escapeCsv(r.moduleNameRo),
      r.chapterPickerInApp ? 'yes' : 'no',
      String(r.chapterIndex),
      r.chapterId,
      escapeCsv(r.nameInCode),
      escapeCsv(r.titleEn),
      escapeCsv(r.titleRo),
      String(r.questionCount),
    ].join(','),
  ),
];
const csvPath = path.join(outDir, 'chapters-inventory.csv');
fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`, 'utf8');

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${csvPath}`);
console.log(
  `Modules: ${inventory.totalModules}, chapters: ${inventory.totalChapters}, questions: ${inventory.totalQuestions}`,
);
for (const m of modulesSummary) {
  console.log(
    `  - ${m.moduleId}: ${m.chapterCount} chapters, ${m.questionCount} questions${m.chapterPickerInApp ? ' (chapter picker UI)' : ''}`,
  );
}
