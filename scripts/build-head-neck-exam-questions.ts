/**
 * Parse Head & Neck exam simulation bank (100 RO questions + EN mirror)
 * → mocks/questions_head_neck_exam.ts
 *
 *   bun run scripts/build-head-neck-exam-questions.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RO_SOURCE = path.join(ROOT, 'content/head-neck/sources/head-neck-intro-home.author-ro.txt');
const EN_SOURCE = path.join(ROOT, 'content/head-neck/sources/head-neck-intro-home.en.txt');
const OUT = path.join(ROOT, 'mocks/questions_head_neck_exam.ts');

type RoEntry = {
  question: string;
  options: string[];
  explanation: string;
};

type ParsedEn = {
  num: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

function escapeTs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n');
}

function mapRoDifficulty(value: string): 'easy' | 'medium' | 'hard' {
  if (/dificil/i.test(value)) return 'hard';
  if (/mediu/i.test(value)) return 'medium';
  return 'easy';
}

function parseRomanian(raw: string): Array<
  RoEntry & { num: number; difficulty: 'easy' | 'medium' | 'hard'; correctAnswer: number }
> {
  const blocks = raw.trim().replace(/\r\n/g, '\n').split(/(?=Întrebarea \d+ — Nivel: )/i);
  const out: Array<
    RoEntry & { num: number; difficulty: 'easy' | 'medium' | 'hard'; correctAnswer: number }
  > = [];

  for (const block of blocks) {
    const header = block.match(/^Întrebarea (\d+) — Nivel: (Ușor|Mediu|Dificil)\n([\s\S]*)/i);
    if (!header) continue;

    const num = parseInt(header[1], 10);
    const difficulty = mapRoDifficulty(header[2]);
    const body = header[3].trim();
    const correctMatch = body.match(/\nRăspuns corect:\s*([A-E])\s*\n/i);
    if (!correctMatch) {
      console.warn(`Q${num}: missing correct answer`);
      continue;
    }

    const correctAnswer = correctMatch[1].toUpperCase().charCodeAt(0) - 65;
    const explIdx = body.search(/\nExplicație:\s*/i);
    const beforeCorrect = body.slice(0, correctMatch.index!).trim();
    const explanation = body.slice(explIdx).replace(/^\nExplicație:\s*/i, '').trim();
    const optionLines = beforeCorrect.split(/\n(?=[A-E]\)\s)/);
    const question = optionLines[0].trim();
    const options = optionLines.slice(1).map((line) => line.replace(/^[A-E]\)\s*/, '').trim());

    if (options.length !== 5) {
      console.warn(`Q${num}: expected 5 options, got ${options.length}`);
    }

    out.push({ num, difficulty, question, options, explanation, correctAnswer });
  }

  out.sort((a, b) => a.num - b.num);
  return out;
}

function parseEnglish(raw: string): ParsedEn[] {
  let text = raw.trim().replace(/\r\n/g, '\n');
  if (text.startsWith('HEAD AND NECK')) {
    const idx = text.indexOf('Question 1');
    if (idx >= 0) text = text.slice(idx);
  }

  const blocks = text.split(/(?=Question \d+ — Level: )/);
  const out: ParsedEn[] = [];

  for (const block of blocks) {
    const header = block.match(/^Question (\d+) — Level: (Easy|Medium|Hard)\n([\s\S]*)/);
    if (!header) continue;

    const num = parseInt(header[1], 10);
    const difficulty = header[2].toLowerCase() as ParsedEn['difficulty'];
    const body = header[3].trim();
    const correctMatch = body.match(/\nCorrect answer:\s*([A-E])\s*\n/i);
    if (!correctMatch) continue;

    const letter = correctMatch[1].toUpperCase();
    const correctAnswer = letter.charCodeAt(0) - 65;
    const explIdx = body.search(/\nExplanation:\s*/i);
    const beforeCorrect = body.slice(0, correctMatch.index!).trim();
    const explanation = body.slice(explIdx).replace(/^\nExplanation:\s*/i, '').trim();
    const optionLines = beforeCorrect.split(/\n(?=[A-E]\)\s)/);
    const question = optionLines[0].trim();
    const options = optionLines.slice(1).map((line) => line.replace(/^[A-E]\)\s*/, '').trim());

    out.push({ num, difficulty, question, options, correctAnswer, explanation });
  }

  out.sort((a, b) => a.num - b.num);
  return out;
}

function emitQuestion(
  ro: RoEntry & { num: number; difficulty: 'easy' | 'medium' | 'hard' },
  en: ParsedEn | undefined,
  correctAnswer: number,
): string {
  const id = `hn-exam-${String(ro.num).padStart(3, '0')}`;
  const enQuestion = en?.question ?? ro.question;
  const enOptions = en?.options ?? ro.options;
  const enExplanation = en?.explanation ?? ro.explanation;
  const enOpts = enOptions.map((option) => `\`${escapeTs(option)}\``).join(',\n      ');
  const roOpts = ro.options.map((option) => `\`${escapeTs(option)}\``).join(',\n      ');

  return `  {
    id: '${id}',
    category: 'head-neck',
    difficulty: '${ro.difficulty}',
    question: \`${escapeTs(enQuestion)}\`,
    question_ro: \`${escapeTs(ro.question)}\`,
    options: [
      ${enOpts},
    ],
    options_ro: [
      ${roOpts},
    ],
    correctAnswer: ${correctAnswer},
    explanation: \`${escapeTs(enExplanation)}\`,
    explanation_ro: \`${escapeTs(ro.explanation)}\`,
  }`;
}

function main(): void {
  const roQuestions = parseRomanian(fs.readFileSync(RO_SOURCE, 'utf8'));
  const enQuestions = parseEnglish(fs.readFileSync(EN_SOURCE, 'utf8'));
  const enByNum = new Map(enQuestions.map((question) => [question.num, question]));

  if (roQuestions.length !== 100) {
    console.warn(`Expected 100 questions, parsed ${roQuestions.length}`);
  }

  const body = roQuestions
    .map((ro) => emitQuestion(ro, enByNum.get(ro.num), ro.correctAnswer))
    .join(',\n');

  const output = `import type { Question } from './questions';

/** Head & Neck exam simulation (100 unique questions). Generated by scripts/build-head-neck-exam-questions.ts */
export const headNeckExamQuestions: Question[] = [
${body},
];
`;

  fs.writeFileSync(OUT, output, 'utf8');
  console.log(`Wrote ${OUT} (${roQuestions.length} questions)`);
}

main();
