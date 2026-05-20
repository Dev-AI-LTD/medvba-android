/**
 * Write English drafts for Internal Organs pilot chapters.
 * Run: bun run study:seed-internal-organs-en
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PILOT_EN, mdEn } from "./internal-organs-pilot-en-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");
const PARENT_MODULE = "med-admission-barrons";
const MODULE_ID = "internal-organs";

function main() {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  for (const seed of PILOT_EN) {
    const payload = {
      moduleId: MODULE_ID,
      chapterId: seed.chapterId,
      locale: "en",
      title: seed.title,
      parentModuleId: PARENT_MODULE,
      parentChapterId: seed.parentChapterId,
      summaryMarkdown: mdEn(seed),
      summaryVersion: 1,
      status: "published",
    };
    const outPath = path.join(DRAFTS_DIR, `${seed.chapterId}.en.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Wrote ${outPath}`);
  }
}

main();
