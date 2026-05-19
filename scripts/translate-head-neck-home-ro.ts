/**
 * Translate Head & Neck Home bank (hn-home-*) to Romanian.
 *
 *   bun run translate:head-neck-home-ro
 *   bun run translate:head-neck-home-ro -- --max 20
 *
 * Writes:
 *   scripts/ro-delta-head-neck-home.json
 *   content/head-neck/sources/head-neck-intro-home.ro.json
 *
 * Then: bun run build:head-neck-home
 *       bun run merge:ro-delta -- --delta scripts/ro-delta-head-neck-home.json
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { batchTranslateQuestions } from "../lib/batch-translate";
import type { QuestionTranslation } from "../locales/questionTranslations";
import { headNeckHomeQuestions } from "../mocks/questions_head_neck_home";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function parseArgs(argv: string[]) {
  let max: number | undefined;
  let skip = 0;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max" && argv[i + 1]) {
      max = Math.max(0, parseInt(argv[++i], 10));
    } else if (a === "--skip" && argv[i + 1]) {
      skip = Math.max(0, parseInt(argv[++i], 10));
    }
  }
  return { max, skip };
}

async function main() {
  const { max, skip } = parseArgs(process.argv.slice(2));
  console.log(
    `translate-head-neck-home-ro: ${headNeckHomeQuestions.length} source questions, skip=${skip}, max=${max ?? "all"}`,
  );

  const pending = headNeckHomeQuestions.filter(
    (q) => !q.question_ro?.trim() || q.options_ro?.length !== q.options.length,
  );
  console.log(`Pending RO: ${pending.length}`);

  const result = await batchTranslateQuestions(
    ["ro"],
    (p) => {
      console.log(`[${p.completed}/${p.total}] ${p.current}`);
    },
    {
      sourceQuestions: headNeckHomeQuestions,
      skipQuestions: skip,
      maxQuestions: max,
    },
  );

  const byId: Record<string, QuestionTranslation> = {};
  for (const q of headNeckHomeQuestions) {
    const ro = result[q.id]?.ro;
    if (ro) byId[q.id] = ro;
  }

  const deltaPath = path.join(__dirname, "ro-delta-head-neck-home.json");
  fs.writeFileSync(
    deltaPath,
    JSON.stringify(
      {
        meta: {
          locale: "ro",
          skip,
          max: max ?? null,
          generatedAt: new Date().toISOString(),
          writtenIds: Object.keys(byId).length,
        },
        byId,
      },
      null,
      2,
    ),
    "utf8",
  );

  const roSourcePath = path.join(
    ROOT,
    "content/head-neck/sources/head-neck-intro-home.ro.json",
  );
  fs.mkdirSync(path.dirname(roSourcePath), { recursive: true });
  fs.writeFileSync(roSourcePath, JSON.stringify(byId, null, 2), "utf8");

  console.log(`\nWrote ${Object.keys(byId).length} RO entries:`);
  console.log(`  ${deltaPath}`);
  console.log(`  ${roSourcePath}`);
  console.log("\nNext:");
  console.log("  bun run build:head-neck-home");
  console.log(
    "  bun run merge:ro-delta -- --delta scripts/ro-delta-head-neck-home.json",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
