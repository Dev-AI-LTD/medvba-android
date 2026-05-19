/**
 * Upsert chapter study drafts into Supabase (service role).
 *
 *   bun run study:publish
 *   bun run study:publish -- --file content/study/drafts/intro-anat-phys.ro.json
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

type Draft = {
  moduleId: string;
  chapterId: string;
  locale: string;
  title?: string;
  summaryMarkdown: string;
  summaryVersion?: number;
  status: "draft" | "review" | "published";
  audioUrl?: string | null;
  audioDurationSec?: number | null;
};

function parseArgs(argv: string[]) {
  let file: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) file = path.resolve(process.cwd(), argv[++i]);
  }
  return { file };
}

async function upsertDraft(supabase: ReturnType<typeof createClient>, draft: Draft) {
  const row = {
    module_id: draft.moduleId,
    chapter_id: draft.chapterId,
    locale: draft.locale,
    title: draft.title ?? null,
    summary_markdown: draft.summaryMarkdown,
    summary_version: draft.summaryVersion ?? 1,
    audio_url: draft.audioUrl ?? null,
    audio_duration_sec: draft.audioDurationSec ?? null,
    status: draft.status,
    published_at: draft.status === "published" ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("chapter_study_content").upsert(row, {
    onConflict: "module_id,chapter_id,locale",
  });

  if (error) throw new Error(`${draft.chapterId}: ${error.message}`);
  console.log(`Published ${draft.moduleId}/${draft.chapterId} [${draft.locale}] (${draft.status})`);
}

async function main() {
  const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) in .env",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { file } = parseArgs(process.argv.slice(2));

  const files = file
    ? [file]
    : fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".json")).map((f) => path.join(DRAFTS_DIR, f));

  for (const f of files) {
    const draft = JSON.parse(fs.readFileSync(f, "utf8")) as Draft;
    await upsertDraft(supabase, draft);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
