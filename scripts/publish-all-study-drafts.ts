/**
 * Publish all draft JSON files in content/study/drafts/
 *
 *   bun run study:publish-all
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

const files = fs
  .readdirSync(DRAFTS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

for (const f of files) {
  const full = path.join(DRAFTS_DIR, f);
  const draft = JSON.parse(fs.readFileSync(full, "utf8")) as { status?: string };
  if (draft.status !== "published") {
    draft.status = "published";
    fs.writeFileSync(full, JSON.stringify(draft, null, 2), "utf8");
  }
  const r = spawnSync("bun", ["run", "study:publish", "--", "--file", full], {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`Published ${files.length} draft(s).`);
