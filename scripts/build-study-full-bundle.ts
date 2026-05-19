/**
 * Build offline premium study bundle from published drafts.
 *
 *   bun run study:build-bundle
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");
const OUT = path.join(__dirname, "..", "assets", "study", "med-admission-full.json");

type Draft = {
  chapterId: string;
  locale: string;
  title?: string;
  summaryMarkdown: string;
  summaryVersion?: number;
};

function main() {
  const ro: Record<string, unknown> = {};
  const en: Record<string, unknown> = {};

  for (const f of fs.readdirSync(DRAFTS_DIR)) {
    if (!f.endsWith(".json")) continue;
    const draft = JSON.parse(fs.readFileSync(path.join(DRAFTS_DIR, f), "utf8")) as Draft;
    if (draft.locale !== "ro" && draft.locale !== "en") continue;
    const entry = {
      chapterId: draft.chapterId,
      title: draft.title ?? null,
      summaryMarkdown: draft.summaryMarkdown,
      summaryVersion: draft.summaryVersion ?? 1,
      audioUrl: null,
      audioDurationSec: null,
    };
    if (draft.locale === "ro") ro[draft.chapterId] = entry;
    else en[draft.chapterId] = entry;
  }

  const payload = {
    moduleId: "med-admission-barrons",
    chaptersByLocale: { ro, en },
  };

  fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
  console.log(`Wrote ${OUT} (${Object.keys(ro).length} RO, ${Object.keys(en).length} EN chapters)`);
}

main();
