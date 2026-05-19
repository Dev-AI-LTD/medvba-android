/**
 * Parse content/head-neck/sources/head-neck-intro-home.en.txt → mocks/questions_head_neck_home.ts
 *
 *   bun run scripts/build-head-neck-home-questions.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(
  ROOT,
  "content/head-neck/sources/head-neck-intro-home.en.txt",
);
const OUT = path.join(ROOT, "mocks/questions_head_neck_home.ts");
const RO_SOURCE = path.join(
  ROOT,
  "content/head-neck/sources/head-neck-intro-home.ro.json",
);
const RO_AUTHOR = path.join(
  ROOT,
  "content/head-neck/sources/head-neck-intro-home.author-ro.txt",
);

type RoEntry = {
  question: string;
  options: string[];
  explanation: string;
};

const Q100_EXPLANATION_SUFFIX =
  " increases pharyngeal pressure, favoring herniation. Treatment is surgical (cricopharyngeal myotomy + diverticulectomy).";

type ParsedQ = {
  num: number;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

function escapeTs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\\n");
}

function parseSource(raw: string): ParsedQ[] {
  let text = raw.trim();
  if (text.startsWith("HEAD AND NECK")) {
    const idx = text.indexOf("Question 1");
    if (idx >= 0) text = text.slice(idx);
  }

  const blocks = text.split(/(?=Question \d+ — Level: )/);
  const out: ParsedQ[] = [];

  for (const block of blocks) {
    const header = block.match(
      /^Question (\d+) — Level: (Easy|Medium|Hard)\n([\s\S]*)/,
    );
    if (!header) continue;

    const num = parseInt(header[1], 10);
    const difficulty = header[2].toLowerCase() as ParsedQ["difficulty"];
    const body = header[3].trim();

    const correctMatch = body.match(/\nCorrect answer:\s*([A-E])\s*\n/i);
    if (!correctMatch) {
      console.warn(`Q${num}: missing correct answer`);
      continue;
    }
    const letter = correctMatch[1].toUpperCase();
    const correctAnswer = letter.charCodeAt(0) - 65;

    const explIdx = body.search(/\nExplanation:\s*/i);
    const beforeCorrect = body.slice(0, correctMatch.index!).trim();
    let explanation = body
      .slice(explIdx)
      .replace(/^\nExplanation:\s*/i, "")
      .trim();

    const optionLines = beforeCorrect.split(/\n(?=[A-E]\)\s)/);
    const question = optionLines[0].trim();
    const options = optionLines.slice(1).map((line) =>
      line.replace(/^[A-E]\)\s*/, "").trim(),
    );

    if (options.length !== 5) {
      console.warn(`Q${num}: expected 5 options, got ${options.length}`);
    }

    if (num === 100 && explanation.endsWith("Cricopharyngeal dysfunction")) {
      explanation += Q100_EXPLANATION_SUFFIX;
    }

    out.push({
      num,
      difficulty,
      question,
      options,
      correctAnswer,
      explanation,
    });
  }

  out.sort((a, b) => a.num - b.num);
  return out;
}

function parseRomanianAuthor(raw: string): Record<string, RoEntry> {
  const text = raw.trim();
  const blocks = text.split(/(?=Întrebarea \d+ — Nivel: )/i);
  const out: Record<string, RoEntry> = {};

  for (const block of blocks) {
    const header = block.match(
      /^Întrebarea (\d+) — Nivel: (Ușor|Mediu|Dificil)\n([\s\S]*)/i,
    );
    if (!header) continue;

    const num = parseInt(header[1], 10);
    const id = `hn-home-${String(num).padStart(3, "0")}`;
    const body = header[3].trim();

    const correctMatch = body.match(/\nRăspuns corect:\s*([A-E])\s*\n/i);
    if (!correctMatch) continue;

    const explIdx = body.search(/\nExplicație:\s*/i);
    const beforeCorrect = body.slice(0, correctMatch.index!).trim();
    const explanation = body
      .slice(explIdx)
      .replace(/^\nExplicație:\s*/i, "")
      .trim();

    const optionLines = beforeCorrect.split(/\n(?=[A-E]\)\s)/);
    const question = optionLines[0].trim();
    const options = optionLines
      .slice(1)
      .map((line) => line.replace(/^[A-E]\)\s*/, "").trim());

    out[id] = { question, options, explanation };
  }

  return out;
}

function loadRoById(): Record<string, RoEntry> {
  if (fs.existsSync(RO_AUTHOR)) {
    const fromAuthor = parseRomanianAuthor(
      fs.readFileSync(RO_AUTHOR, "utf8"),
    );
    if (Object.keys(fromAuthor).length > 0) {
      fs.writeFileSync(RO_SOURCE, JSON.stringify(fromAuthor, null, 2), "utf8");
      return fromAuthor;
    }
  }
  if (!fs.existsSync(RO_SOURCE)) return {};
  try {
    return JSON.parse(fs.readFileSync(RO_SOURCE, "utf8")) as Record<
      string,
      RoEntry
    >;
  } catch {
    console.warn(`Could not parse ${RO_SOURCE}`);
    return {};
  }
}

function emitTs(questions: ParsedQ[], roById: Record<string, RoEntry>): string {
  const items = questions.map((q) => {
    const id = `hn-home-${String(q.num).padStart(3, "0")}`;
    const opts = q.options.map((o) => `      \`${escapeTs(o)}\`,`).join("\n");
    const ro = roById[id];
    const roBlock = ro
      ? `,
    question_ro: \`${escapeTs(ro.question)}\`,
    options_ro: [
${ro.options.map((o) => `      \`${escapeTs(o)}\`,`).join("\n")}
    ],
    explanation_ro: \`${escapeTs(ro.explanation)}\``
      : "";
    return `  {
    id: '${id}',
    category: 'head-neck',
    difficulty: '${q.difficulty}',
    question: \`${escapeTs(q.question)}\`,
    options: [
${opts}
    ],
    correctAnswer: ${q.correctAnswer},
    explanation: \`${escapeTs(q.explanation)}\`${roBlock}
  }`;
  });

  return `import type { Question } from './questions';

/** Head & Neck — Home / Intro chapter (${questions.length} questions). Generated by scripts/build-head-neck-home-questions.ts */
export const headNeckHomeQuestions: Question[] = [
${items.join(",\n")},
];
`;
}

function main() {
  const raw = fs.readFileSync(SOURCE, "utf8");
  const parsed = parseSource(raw);
  if (parsed.length !== 100) {
    console.warn(`Expected 100 questions, parsed ${parsed.length}`);
  }
  const roById = loadRoById();
  const roCount = Object.keys(roById).length;
  fs.writeFileSync(OUT, emitTs(parsed, roById), "utf8");
  console.log(`Wrote ${OUT} (${parsed.length} questions, ${roCount} with RO)`);
}

main();
