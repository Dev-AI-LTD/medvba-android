/**
 * Create English drafts from existing Romanian study drafts (AI translation).
 *
 *   bun run study:translate-en
 *   bun run study:translate-en -- --chapter tissues
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { generateText } from "../lib/ai-provider";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

const EN_TITLES: Record<string, string> = {
  "intro-anat-phys": "Introduction to anatomy and physiology",
  "chem-basics": "Chemical basis of the human body",
  "cell-biology": "Cell biology",
  tissues: "Tissues",
  integumentary: "Integumentary system",
  skeletal: "Skeletal system",
  muscular: "Muscular system",
  nervous: "Nervous system",
  senses: "Special senses",
  endocrine: "Endocrine system",
  blood: "Blood",
  cardiovascular: "Cardiovascular system",
  lymphatic: "Lymphatic system and immunity",
  respiratory: "Respiratory system",
  digestive: "Digestive system",
  metabolism: "Metabolism and nutrition",
  urinary: "Urinary system",
  "repro-male": "Male reproductive system",
  "repro-female": "Female reproductive system",
  embryology: "Pregnancy and early development",
};

type RoDraft = {
  moduleId: string;
  chapterId: string;
  locale: string;
  title?: string;
  summaryMarkdown: string;
  summaryVersion?: number;
  status: "draft" | "review" | "published";
};

function parseArgs(argv: string[]) {
  let chapter: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--chapter" && argv[i + 1]) chapter = argv[++i];
  }
  return { chapter };
}

async function translateOne(ro: RoDraft) {
  const enMarkdown = await generateText({
    messages: [
      {
        role: "system",
        content:
          "You are a medical translator. Translate Romanian study summaries to professional English. Keep markdown structure with these exact headings: ## What you learn in this chapter, ## Key concepts, ## Clinical and exam connections, ## Common exam pitfalls, ## Mini-summary. Translate ALL text to English, including bold lead terms before colons in bullets (e.g. **Main divisions**: not **Diviziuni principale**:). Output markdown only.",
      },
      {
        role: "user",
        content: `Translate this chapter summary to English:\n\n${ro.summaryMarkdown}`,
      },
    ],
    temperature: 0.3,
    maxTokens: 2800,
  });

  const payload = {
    moduleId: ro.moduleId,
    chapterId: ro.chapterId,
    locale: "en" as const,
    title: EN_TITLES[ro.chapterId] ?? ro.title ?? ro.chapterId,
    summaryMarkdown: enMarkdown.trim(),
    summaryVersion: ro.summaryVersion ?? 1,
    status: ro.status,
  };

  const outPath = path.join(DRAFTS_DIR, `${ro.chapterId}.en.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
}

async function main() {
  const { chapter } = parseArgs(process.argv.slice(2));
  const roFiles = fs
    .readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith(".ro.json"))
    .filter((f) => !chapter || f.startsWith(`${chapter}.`));

  if (!roFiles.length) {
    console.error("No .ro.json drafts found.");
    process.exit(1);
  }

  for (const f of roFiles) {
    const ro = JSON.parse(fs.readFileSync(path.join(DRAFTS_DIR, f), "utf8")) as RoDraft;
    await translateOne(ro);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
