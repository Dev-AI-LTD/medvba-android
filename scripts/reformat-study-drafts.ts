/**
 * Reformat study drafts to match intro chapter layout (sections, bullets, spacing).
 *
 *   bun run study:reformat
 *   bun run study:reformat -- --chapter integumentary
 *   bun run study:reformat -- --from 4   (skip first 3 free-preview chapters)
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { generateText } from "../lib/ai-provider";
import { buildReformatSummaryPrompt } from "../lib/study-summary-prompt";
import { STUDY_FREE_PREVIEW_CHAPTER_IDS } from "../constants/study";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

const REFERENCE_RO = path.join(DRAFTS_DIR, "intro-anat-phys.ro.json");
const REFERENCE_EN = path.join(DRAFTS_DIR, "intro-anat-phys.en.json");

type Draft = {
  moduleId: string;
  chapterId: string;
  locale: "ro" | "en";
  title?: string;
  summaryMarkdown: string;
  summaryVersion?: number;
  status: "draft" | "review" | "published";
};

function parseArgs(argv: string[]) {
  let chapter: string | undefined;
  let fromChapter = 0;
  let skipPreview = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--chapter" && argv[i + 1]) chapter = argv[++i];
    else if (a === "--from" && argv[i + 1]) fromChapter = parseInt(argv[++i], 10);
    else if (a === "--skip-preview") skipPreview = true;
  }
  return { chapter, fromChapter, skipPreview };
}

const CHAPTER_ORDER = [
  "intro-anat-phys",
  "chem-basics",
  "cell-biology",
  "tissues",
  "integumentary",
  "skeletal",
  "muscular",
  "nervous",
  "senses",
  "endocrine",
  "blood",
  "cardiovascular",
  "lymphatic",
  "respiratory",
  "digestive",
  "metabolism",
  "urinary",
  "repro-male",
  "repro-female",
  "embryology",
];

async function reformatOne(draft: Draft, referenceMd: string) {
  const summaryMarkdown = await generateText({
    messages: [
      {
        role: "system",
        content:
          "You reformat medical study summaries. Preserve facts; fix structure, spacing, and bullet style only.",
      },
      {
        role: "user",
        content: buildReformatSummaryPrompt({
          chapterTitle: draft.title ?? draft.chapterId,
          locale: draft.locale,
          existingMarkdown: draft.summaryMarkdown,
          referenceMarkdown: referenceMd,
        }),
      },
    ],
    temperature: 0.25,
    maxTokens: 2800,
  });

  draft.summaryMarkdown = summaryMarkdown.trim();
  draft.summaryVersion = (draft.summaryVersion ?? 1) + 1;
  return draft;
}

async function main() {
  const { chapter, fromChapter, skipPreview } = parseArgs(process.argv.slice(2));
  const refRo = JSON.parse(fs.readFileSync(REFERENCE_RO, "utf8")) as Draft;
  const refEn = JSON.parse(fs.readFileSync(REFERENCE_EN, "utf8")) as Draft;

  const previewSet = new Set<string>(STUDY_FREE_PREVIEW_CHAPTER_IDS);

  let targets = CHAPTER_ORDER.filter((id, idx) => {
    if (chapter) return id === chapter;
    if (idx < fromChapter) return false;
    if (skipPreview && previewSet.has(id)) return false;
    return true;
  });

  if (!targets.length) {
    console.error("No chapters to reformat.");
    process.exit(1);
  }

  for (const chapterId of targets) {
    for (const locale of ["ro", "en"] as const) {
      const filePath = path.join(DRAFTS_DIR, `${chapterId}.${locale}.json`);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skip missing ${filePath}`);
        continue;
      }
      const draft = JSON.parse(fs.readFileSync(filePath, "utf8")) as Draft;
      const ref = locale === "ro" ? refRo.summaryMarkdown : refEn.summaryMarkdown;
      console.log(`Reformat ${chapterId} [${locale}]...`);
      await reformatOne(draft, ref);
      fs.writeFileSync(filePath, JSON.stringify(draft, null, 2), "utf8");
      console.log(`  Wrote ${filePath}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
