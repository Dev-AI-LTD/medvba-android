/**
 * Generate draft chapter summaries from quiz questions (AI).
 *
 *   bun run study:generate -- --chapter intro-anat-phys
 *   bun run study:generate -- --module med-admission-barrons --max 3
 *   bun run study:generate -- --module internal-organs --chapter heart-external --topic
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { generateText } from "../lib/ai-provider";
import {
  buildChapterSummaryPrompt,
  buildTopicSummaryPrompt,
} from "../lib/study-summary-prompt";
import { getChaptersForModule, moduleChaptersMap } from "../mocks/chapters";
import { STUDY_PILOT_MODULE_ID } from "../constants/study";
import { resolveStudyChapterForQuiz } from "../lib/quizToStudyChapter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

function parseArgs(argv: string[]) {
  let chapter: string | undefined;
  let moduleId = STUDY_PILOT_MODULE_ID;
  let max: number | undefined;
  let locale: "ro" | "en" = "ro";
  let topic = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--chapter" && argv[i + 1]) chapter = argv[++i];
    else if (a === "--module" && argv[i + 1]) moduleId = argv[++i];
    else if (a === "--max" && argv[i + 1]) max = parseInt(argv[++i], 10);
    else if (a === "--locale" && argv[i + 1]) locale = argv[++i] as "ro" | "en";
    else if (a === "--topic") topic = true;
  }
  return { chapter, moduleId, max, locale, topic };
}

function loadParentSummaryMarkdown(
  parentModuleId: string,
  parentChapterId: string,
  locale: "ro" | "en",
): { title?: string; markdown?: string } {
  const draftPath = path.join(DRAFTS_DIR, `${parentChapterId}.${locale}.json`);
  if (!fs.existsSync(draftPath)) return {};
  try {
    const draft = JSON.parse(fs.readFileSync(draftPath, "utf8")) as {
      moduleId?: string;
      title?: string;
      summaryMarkdown?: string;
    };
    if (draft.moduleId && draft.moduleId !== parentModuleId) return {};
    return { title: draft.title, markdown: draft.summaryMarkdown };
  } catch {
    return {};
  }
}

async function generateOne(
  moduleId: string,
  chapterId: string,
  chapterTitle: string,
  locale: "ro" | "en",
  topic: boolean,
) {
  const mod = moduleChaptersMap[moduleId];
  if (!mod) throw new Error(`Unknown module: ${moduleId}`);
  const ch = mod.chapters.find((c) => c.id === chapterId);
  if (!ch) throw new Error(`Unknown chapter: ${chapterId}`);

  const useTopicMode = topic || moduleId !== STUDY_PILOT_MODULE_ID;
  let prompt: string;
  let parentModuleId: string | undefined;
  let parentChapterId: string | undefined;

  if (useTopicMode) {
    const parent = resolveStudyChapterForQuiz(moduleId, chapterId);
    const parentDraft = parent
      ? loadParentSummaryMarkdown(parent.studyModuleId, parent.studyChapterId, locale)
      : {};
    parentModuleId = parent?.studyModuleId;
    parentChapterId = parent?.studyChapterId;

    prompt = buildTopicSummaryPrompt({
      chapterTitle,
      moduleId,
      questions: ch.questions,
      locale,
      parentChapterTitle: parentDraft.title,
      parentSummaryMarkdown: parentDraft.markdown,
    });
  } else {
    prompt = buildChapterSummaryPrompt({
      chapterTitle,
      moduleId,
      questions: ch.questions,
      locale,
    });
  }

  const summaryMarkdown = await generateText({
    messages: [
      {
        role: "system",
        content: "You write accurate medical study summaries. Output markdown only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    maxTokens: useTopicMode ? 1800 : 2500,
  });

  const payload: Record<string, unknown> = {
    moduleId,
    chapterId,
    locale,
    title: chapterTitle,
    summaryMarkdown: summaryMarkdown.trim(),
    summaryVersion: 1,
    status: "draft",
  };

  if (parentModuleId && parentChapterId) {
    payload.parentModuleId = parentModuleId;
    payload.parentChapterId = parentChapterId;
  }

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  const outPath = path.join(DRAFTS_DIR, `${chapterId}.${locale}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${outPath}${useTopicMode ? " (topic)" : ""}`);
}

async function main() {
  const { chapter, moduleId, max, locale, topic } = parseArgs(process.argv.slice(2));
  const chapters = getChaptersForModule(moduleId);
  const targets = chapter
    ? chapters.filter((c) => c.id === chapter)
    : chapters.slice(0, max ?? chapters.length);

  if (!targets.length) {
    console.error("No chapters matched.");
    process.exit(1);
  }

  for (const ch of targets) {
    await generateOne(moduleId, ch.id, ch.name || ch.id, locale, topic);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
