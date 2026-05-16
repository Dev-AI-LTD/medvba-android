/**
 * CLI: translate missing Romanian for the full quiz-session pool (deduped allQuestions).
 *
 * Requires OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY (see lib/llm-generate-object-json.ts).
 *
 * Always writes **delta JSON** (`ro-delta-last-run.json` by default): only `ro` payloads for this run’s ids.
 * Apply into the repo with: `bun run merge:ro-delta`
 *
 * Examples:
 *   bun run translate:quiz-ro -- --max 30
 *   bun run translate:quiz-ro -- --skip 100 --max 50
 *   bun run translate:quiz-ro -- --delta-out scripts/my-delta.json
 *   bun run translate:quiz-ro -- --out scripts/questionTranslations.ro-partial.ts   (optional: full merged .ts)
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
  batchTranslateQuestions,
  generateTranslationFile,
  getPendingTranslationQuestions,
} from "../lib/batch-translate";
import type { QuestionTranslation } from "../locales/questionTranslations";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv: string[]) {
  let max: number | undefined;
  let skip = 0;
  let out: string | null = null;
  let deltaOut = path.join(__dirname, "ro-delta-last-run.json");
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max" && argv[i + 1]) {
      max = Math.max(0, parseInt(argv[++i], 10));
      if (Number.isNaN(max)) max = undefined;
    } else if (a === "--skip" && argv[i + 1]) {
      skip = Math.max(0, parseInt(argv[++i], 10));
      if (Number.isNaN(skip)) skip = 0;
    } else if (a === "--out" && argv[i + 1]) {
      out = path.resolve(process.cwd(), argv[++i]);
    } else if (a === "--delta-out" && argv[i + 1]) {
      deltaOut = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { max, skip, out, deltaOut };
}

async function main() {
  const { max, skip, out, deltaOut } = parseArgs(process.argv.slice(2));
  console.log(
    `batch-translate-quiz-ro: languages=ro, skip=${skip}, max=${max ?? "∞"}, deltaOut=${deltaOut}${out ? `, fullTsOut=${out}` : ""}`,
  );

  const planned = getPendingTranslationQuestions(["ro"], {
    skipQuestions: skip,
    maxQuestions: max,
  });

  const result = await batchTranslateQuestions(
    ["ro"],
    (p) => {
      const pct = p.total ? ((p.completed / p.total) * 100).toFixed(1) : "0";
      console.log(`[${pct}%] ${p.completed}/${p.total} — ${p.current}`);
      if (p.errors.length) console.warn(`  errors: ${p.errors.length}`);
    },
    { skipQuestions: skip, maxQuestions: max },
  );

  const byId: Record<string, QuestionTranslation> = {};
  for (const q of planned) {
    const ro = result[q.id]?.ro;
    if (ro) byId[q.id] = ro;
  }

  const deltaPayload = {
    meta: {
      locale: "ro",
      skip,
      max: max ?? null,
      generatedAt: new Date().toISOString(),
      plannedIds: planned.length,
      writtenIds: Object.keys(byId).length,
    },
    byId,
  };

  fs.mkdirSync(path.dirname(deltaOut), { recursive: true });
  fs.writeFileSync(deltaOut, JSON.stringify(deltaPayload, null, 2), "utf8");
  console.log(`\nWrote RO delta (${deltaPayload.meta.writtenIds} id(s)) to:\n  ${deltaOut}`);
  console.log("Apply: bun run merge:ro-delta");

  if (out) {
    const body = generateTranslationFile(result);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body, "utf8");
    console.log(`\nWrote full merged map (${Object.keys(result).length} ids) to:\n  ${out}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
