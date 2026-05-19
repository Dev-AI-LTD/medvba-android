/**
 * Generate TTS MP3 for multiple chapters (updates Supabase audio_url).
 *
 *   bun run study:audio-batch
 *   bun run study:audio-batch -- --chapters intro-anat-phys,chem-basics,cell-biology --locale ro
 */
import "dotenv/config";
import { generateStudyChapterAudio } from "./generate-study-audio";

const DEFAULT_CHAPTERS = ["intro-anat-phys", "chem-basics", "cell-biology"];
const DEFAULT_LOCALES = ["ro", "en"];

function parseArgs(argv: string[]) {
  let chapters = [...DEFAULT_CHAPTERS];
  let locales = [...DEFAULT_LOCALES];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--chapters" && argv[i + 1]) {
      chapters = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (argv[i] === "--locale" && argv[i + 1]) {
      locales = [argv[++i]];
    } else if (argv[i] === "--locales" && argv[i + 1]) {
      locales = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return { chapters, locales };
}

async function main() {
  const { chapters, locales } = parseArgs(process.argv.slice(2));
  console.log(`Generating audio for ${chapters.length} chapter(s), locales: ${locales.join(", ")}`);

  for (const chapterId of chapters) {
    for (const locale of locales) {
      console.log(`\n--- ${chapterId} [${locale}] ---`);
      const audioUrl = await generateStudyChapterAudio({ chapterId, locale });
      console.log(`Uploaded audio: ${audioUrl}`);
    }
  }

  console.log("\nDone. Reload app — chapters with audio_url will use recorded MP3.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
