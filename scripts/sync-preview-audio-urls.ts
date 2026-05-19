/**
 * Fill med-admission-preview.json audioUrl from Supabase public storage pattern.
 *
 *   bun run study:sync-preview-audio
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = path.join(__dirname, "..", "assets", "study", "med-admission-preview.json");
const MODULE_ID = "med-admission-barrons";
const CHAPTERS = ["intro-anat-phys", "chem-basics", "cell-biology"];
const LOCALES = ["ro", "en"] as const;

function main() {
  const base = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim();
  if (!base) {
    console.error("Set EXPO_PUBLIC_SUPABASE_URL in .env");
    process.exit(1);
  }

  const bundle = JSON.parse(fs.readFileSync(PREVIEW, "utf8")) as {
    chaptersByLocale: Record<string, Record<string, { audioUrl?: string | null }>>;
  };

  for (const locale of LOCALES) {
    for (const chapterId of CHAPTERS) {
      const url = `${base.replace(/\/$/, "")}/storage/v1/object/public/study-audio/${MODULE_ID}/${chapterId}-${locale}.mp3`;
      const chapter = bundle.chaptersByLocale[locale]?.[chapterId];
      if (chapter) {
        chapter.audioUrl = url;
        console.log(`Set ${chapterId} [${locale}]`);
      }
    }
  }

  fs.writeFileSync(PREVIEW, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  console.log(`Updated ${PREVIEW}`);
}

main();
