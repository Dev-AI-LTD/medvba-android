/**
 * questions_head_neck_continued.ts stores Romanian in primary fields only.
 * This script: copies them to *_ro, translates EN into question/options/explanation, rewrites the file.
 *
 *   bun run normalize:head-neck-continued
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { llmGenerateObjectJson } from "../lib/llm-generate-object-json";
import {
  externalCarotidArteryQuestions,
  facialMusclesQuestions,
  infratemporalFossaQuestions,
  masticatoryMusclesQuestions,
  nasalBoneQuestions,
  nasalCavityQuestions,
  orbitQuestions,
  pterygopalatineFossaQuestions,
  subclavianArteryQuestions,
} from "../mocks/questions_head_neck_continued";
import type { Question } from "../mocks/questions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../mocks/questions_head_neck_continued.ts");

const BATCH = 8;
const DELAY_MS = 800;

const exportsList: { name: string; questions: Question[] }[] = [
  { name: "nasalBoneQuestions", questions: nasalBoneQuestions },
  { name: "subclavianArteryQuestions", questions: subclavianArteryQuestions },
  { name: "nasalCavityQuestions", questions: nasalCavityQuestions },
  { name: "orbitQuestions", questions: orbitQuestions },
  { name: "infratemporalFossaQuestions", questions: infratemporalFossaQuestions },
  { name: "pterygopalatineFossaQuestions", questions: pterygopalatineFossaQuestions },
  { name: "externalCarotidArteryQuestions", questions: externalCarotidArteryQuestions },
  { name: "facialMusclesQuestions", questions: facialMusclesQuestions },
  { name: "masticatoryMusclesQuestions", questions: masticatoryMusclesQuestions },
];

const enSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      explanation: z.string(),
    }),
  ),
});

function escapeTs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\\n");
}

function emitQuestion(q: Question): string {
  const optsEn = (q.options ?? []).map((o) => `      \`${escapeTs(o)}\`,`).join("\n");
  const optsRo = (q.options_ro ?? []).map((o) => `      \`${escapeTs(o)}\`,`).join("\n");
  return `  {
    id: '${q.id}',
    category: '${q.category}',
    difficulty: '${q.difficulty}',
    question: \`${escapeTs(q.question)}\`,
    question_ro: \`${escapeTs(q.question_ro ?? q.question)}\`,
    options: [
${optsEn}
    ],
    options_ro: [
${optsRo}
    ],
    correctAnswer: ${q.correctAnswer},
    explanation: \`${escapeTs(q.explanation)}\`,
    explanation_ro: \`${escapeTs(q.explanation_ro ?? q.explanation)}\`,
  }`;
}

async function translateRoToEn(batch: Question[]): Promise<Map<string, { question: string; options: string[]; explanation: string }>> {
  const payload = batch.map((q) => ({
    id: q.id,
    question: q.question_ro ?? q.question,
    options: q.options_ro ?? q.options,
    explanation: q.explanation_ro ?? q.explanation,
  }));

  const prompt = `You are a medical translator. Translate each anatomy question from Romanian to English.

Input:
${JSON.stringify(payload, null, 2)}

Rules:
- Accurate medical English for entrance exams.
- Same number of options as input.
- Output JSON: { "items": [ { "id", "question", "options", "explanation" } ] }
- No markdown.`;

  const result = await llmGenerateObjectJson(prompt, enSchema, {
    coerceParsedJson: (p) => {
      if (Array.isArray(p)) return { items: p };
      if (p && typeof p === "object" && Array.isArray((p as { items?: unknown }).items)) {
        return p;
      }
      return p;
    },
  });

  const map = new Map<string, { question: string; options: string[]; explanation: string }>();
  for (const item of result.items) {
    map.set(item.id, item);
  }
  return map;
}

async function main() {
  const all: Question[] = [];
  for (const { questions } of exportsList) {
    all.push(...questions);
  }

  const normalized: Question[] = all.map((q) => ({
    ...q,
    question_ro: q.question_ro ?? q.question,
    options_ro: q.options_ro ?? [...q.options],
    explanation_ro: q.explanation_ro ?? q.explanation,
  }));

  console.log(`Normalizing ${normalized.length} continued head-neck questions (RO→EN primary)...`);

  for (let i = 0; i < normalized.length; i += BATCH) {
    const batch = normalized.slice(i, i + BATCH);
    console.log(`Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(normalized.length / BATCH)}`);
    const enMap = await translateRoToEn(batch);
    for (const q of batch) {
      const en = enMap.get(q.id);
      if (!en || en.options.length !== q.options.length) {
        console.warn(`Skip EN for ${q.id}`);
        continue;
      }
      q.question = en.question;
      q.options = en.options;
      q.explanation = en.explanation;
    }
    if (i + BATCH < normalized.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  let byId = new Map(normalized.map((q) => [q.id, q]));

  const parts: string[] = [
    `import type { Question } from './questions';`,
    ``,
  ];

  for (const { name, questions: orig } of exportsList) {
    const items = orig.map((o) => byId.get(o.id)!);
    parts.push(`export const ${name}: Question[] = [`);
    parts.push(items.map(emitQuestion).join(",\n"));
    parts.push(`];`);
    parts.push(``);
  }

  fs.writeFileSync(OUT, parts.join("\n"), "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
