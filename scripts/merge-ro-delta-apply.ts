/**
 * Merge `ro` entries from a delta JSON (written by `bun run translate:quiz-ro`) into
 * `locales/questionTranslations.ts` without hand-editing the large file.
 *
 * Delta shape: { "meta": {...}, "byId": { "<questionId>": { "question", "options", "explanation", ... } } }
 *
 * Usage:
 *   bun run merge:ro-delta
 *   bun run merge:ro-delta -- --delta scripts/ro-delta-last-run.json --target locales/questionTranslations.ts
 *   bun run merge:ro-delta -- --dry-run
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { generateTranslationFile, type TranslationResult } from "../lib/batch-translate";
import {
  questionTranslations,
  type QuestionTranslation,
} from "../locales/questionTranslations";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type DeltaFile = {
  meta?: Record<string, unknown>;
  byId: Record<string, QuestionTranslation>;
};

function parseArgs(argv: string[]) {
  let deltaPath = path.join(__dirname, "ro-delta-last-run.json");
  let targetTs = path.join(process.cwd(), "locales", "questionTranslations.ts");
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--delta" && argv[i + 1]) deltaPath = path.resolve(process.cwd(), argv[++i]);
    if (a === "--target" && argv[i + 1]) targetTs = path.resolve(process.cwd(), argv[++i]);
    if (a === "--dry-run") dryRun = true;
  }
  return { deltaPath, targetTs, dryRun };
}

function extractById(raw: unknown): Record<string, QuestionTranslation> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Delta root must be a JSON object");
  }
  const o = raw as Record<string, unknown>;
  if (o.byId && typeof o.byId === "object" && !Array.isArray(o.byId)) {
    return o.byId as Record<string, QuestionTranslation>;
  }
  const entries = Object.entries(o).filter(([k, v]) => k !== "meta" && v && typeof v === "object");
  if (
    entries.length > 0 &&
    typeof (entries[0][1] as QuestionTranslation).question === "string" &&
    Array.isArray((entries[0][1] as QuestionTranslation).options)
  ) {
    return Object.fromEntries(entries) as Record<string, QuestionTranslation>;
  }
  throw new Error('Delta must contain "byId" or be a flat map of id → { question, options, explanation }');
}

function main() {
  const { deltaPath, targetTs, dryRun } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(deltaPath)) {
    console.error("Delta file not found:", deltaPath);
    console.error("Run: bun run translate:quiz-ro -- --max 30");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(deltaPath, "utf8")) as unknown;
  const byId = extractById(raw);

  const merged = JSON.parse(JSON.stringify(questionTranslations)) as TranslationResult;
  let applied = 0;
  for (const [id, ro] of Object.entries(byId)) {
    if (!ro || typeof ro !== "object" || !Array.isArray(ro.options)) {
      console.warn("Skipping invalid entry:", id);
      continue;
    }
    if (!merged[id]) merged[id] = {};
    merged[id].ro = ro;
    applied++;
  }

  console.log(
    `merge-ro-delta: ${applied} id(s) from\n  ${deltaPath}\n→ ${targetTs}${dryRun ? " (dry-run, no write)" : ""}`,
  );

  if (dryRun) return;

  fs.mkdirSync(path.dirname(targetTs), { recursive: true });
  fs.writeFileSync(targetTs, generateTranslationFile(merged), "utf8");
  console.log("Done. Suggested: bun run audit:quiz-missing-ro && bunx tsc --noEmit");
}

main();
