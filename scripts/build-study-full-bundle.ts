/**
 * Build offline premium study bundles from published drafts (grouped by moduleId).
 *
 *   bun run study:build-bundle
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");
const ASSETS_DIR = path.join(__dirname, "..", "assets", "study");

type Draft = {
  moduleId: string;
  chapterId: string;
  locale: string;
  title?: string;
  summaryMarkdown: string;
  summaryVersion?: number;
  status?: string;
};

const MODULE_BUNDLE_FILES: Record<string, string> = {
  "med-admission-barrons": "med-admission-full.json",
  "internal-organs": "internal-organs-full.json",
};

/** Free preview chapter IDs per module (must match constants/study.ts). */
const PREVIEW_CHAPTER_IDS: Record<string, string[]> = {
  "internal-organs": ["internal-organs-intro", "heart-external"],
};

function buildModuleBundle(moduleId: string, drafts: Draft[]) {
  const ro: Record<string, unknown> = {};
  const en: Record<string, unknown> = {};

  for (const draft of drafts) {
    if (draft.status && draft.status !== "published") continue;
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

  return {
    moduleId,
    chaptersByLocale: { ro, en },
  };
}

function main() {
  const allDrafts: Draft[] = [];
  for (const f of fs.readdirSync(DRAFTS_DIR)) {
    if (!f.endsWith(".json")) continue;
    allDrafts.push(JSON.parse(fs.readFileSync(path.join(DRAFTS_DIR, f), "utf8")) as Draft);
  }

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  for (const [moduleId, outFile] of Object.entries(MODULE_BUNDLE_FILES)) {
    const moduleDrafts = allDrafts.filter((d) => d.moduleId === moduleId);
    const payload = buildModuleBundle(moduleId, moduleDrafts);
    const outPath = path.join(ASSETS_DIR, outFile);
    fs.writeFileSync(outPath, JSON.stringify(payload), "utf8");
    const roCount = Object.keys(payload.chaptersByLocale.ro).length;
    const enCount = Object.keys(payload.chaptersByLocale.en).length;
    console.log(`Wrote ${outPath} (${roCount} RO, ${enCount} EN chapters)`);

    const previewIds = PREVIEW_CHAPTER_IDS[moduleId];
    if (previewIds?.length) {
      const previewPayload = {
        moduleId,
        chaptersByLocale: {
          ro: Object.fromEntries(
            previewIds
              .filter((id) => payload.chaptersByLocale.ro[id])
              .map((id) => [id, payload.chaptersByLocale.ro[id]]),
          ),
          en: Object.fromEntries(
            previewIds
              .filter((id) => payload.chaptersByLocale.en[id])
              .map((id) => [id, payload.chaptersByLocale.en[id]]),
          ),
        },
      };
      const previewPath = path.join(ASSETS_DIR, `${moduleId}-preview.json`);
      fs.writeFileSync(previewPath, JSON.stringify(previewPayload), "utf8");
      console.log(
        `Wrote ${previewPath} (EN preview: ${Object.keys(previewPayload.chaptersByLocale.en).length})`,
      );
    }
  }
}

main();
