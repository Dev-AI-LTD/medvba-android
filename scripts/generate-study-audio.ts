/**

 * Generate MP3 for a published summary via OpenAI TTS and upload to Supabase Storage.

 *

 *   bun run study:audio -- --chapter intro-anat-phys

 */

import "dotenv/config";

import * as fs from "node:fs";
import * as path from "node:path";

import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BUCKET = "study-audio";



export type GenerateStudyAudioParams = {

  chapterId: string;

  moduleId?: string;

  locale?: string;

};



export function parseStudyAudioArgs(argv: string[]): {
  chapterId?: string;
  moduleId: string;
  locale: string;
} {

  let chapterId: string | undefined;

  let moduleId = "med-admission-barrons";

  let locale = "ro";

  for (let i = 0; i < argv.length; i++) {

    if (argv[i] === "--chapter" && argv[i + 1]) chapterId = argv[++i];

    else if (argv[i] === "--module" && argv[i + 1]) moduleId = argv[++i];

    else if (argv[i] === "--locale" && argv[i + 1]) locale = argv[++i];

  }

  return { chapterId, moduleId, locale };

}



async function synthesizeMp3(text: string): Promise<Buffer> {

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) throw new Error("AI_API_KEY or OPENAI_API_KEY required");



  const plain = text.replace(/[#*]/g, "").slice(0, 12000);

  const res = await fetch(`${baseUrl}/audio/speech`, {

    method: "POST",

    headers: {

      Authorization: `Bearer ${apiKey}`,

      "Content-Type": "application/json",

    },

    body: JSON.stringify({

      model: process.env.AI_TTS_MODEL || "tts-1",

      voice: process.env.AI_TTS_VOICE || "nova",

      input: plain,

      response_format: "mp3",

    }),

  });



  if (!res.ok) {

    throw new Error(`TTS failed: ${res.status} ${await res.text()}`);

  }

  return Buffer.from(await res.arrayBuffer());

}



function getSupabaseAdmin() {

  const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim();

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {

    throw new Error(

      "Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) in .env",

    );

  }

  return createClient(url, key);

}



/** Generate MP3, upload to storage, update chapter_study_content. Returns public audio URL. */

export async function generateStudyChapterAudio(params: GenerateStudyAudioParams): Promise<string> {

  const { chapterId, moduleId = "med-admission-barrons", locale = "ro" } = params;

  const supabase = getSupabaseAdmin();



  const { data, error } = await supabase

    .from("chapter_study_content")

    .select("summary_markdown")

    .eq("module_id", moduleId)

    .eq("chapter_id", chapterId)

    .eq("locale", locale)

    .eq("status", "published")

    .maybeSingle();



  if (error || !data?.summary_markdown) {

    throw new Error(error?.message ?? `Published summary not found: ${moduleId}/${chapterId} [${locale}]`);

  }



  const mp3 = await synthesizeMp3(data.summary_markdown as string);

  const storagePath = `${moduleId}/${chapterId}-${locale}.mp3`;



  const { error: uploadErr } = await supabase.storage

    .from(BUCKET)

    .upload(storagePath, mp3, { contentType: "audio/mpeg", upsert: true });



  if (uploadErr) throw uploadErr;



  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const audioUrl = publicUrl.publicUrl;



  const { error: updateErr } = await supabase

    .from("chapter_study_content")

    .update({

      audio_url: audioUrl,

      audio_duration_sec: Math.ceil(mp3.length / 16000),

    })

    .eq("module_id", moduleId)

    .eq("chapter_id", chapterId)

    .eq("locale", locale);



  if (updateErr) throw updateErr;

  syncPreviewBundleAudioUrl(moduleId, chapterId, locale, audioUrl);

  return audioUrl;

}

/** Keep offline preview JSON in sync so play works when API is unreachable. */
function syncPreviewBundleAudioUrl(
  moduleId: string,
  chapterId: string,
  locale: string,
  audioUrl: string,
): void {
  const previewPath = path.join(__dirname, "..", "assets", "study", "med-admission-preview.json");
  if (!fs.existsSync(previewPath)) return;

  const bundle = JSON.parse(fs.readFileSync(previewPath, "utf8")) as {
    chaptersByLocale?: Record<string, Record<string, { audioUrl?: string | null }>>;
  };
  const chapter = bundle.chaptersByLocale?.[locale]?.[chapterId];
  if (!chapter) return;

  chapter.audioUrl = audioUrl;
  fs.writeFileSync(previewPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
}



function isDirectRun(): boolean {

  const entry = process.argv[1];

  if (!entry) return false;

  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entry);

}



async function cliMain() {

  const { chapterId, moduleId, locale } = parseStudyAudioArgs(process.argv.slice(2));

  if (!chapterId) {

    console.error("Usage: bun run study:audio -- --chapter <chapterId>");

    process.exit(1);

  }

  const audioUrl = await generateStudyChapterAudio({ chapterId, moduleId, locale });

  console.log(`Uploaded audio: ${audioUrl}`);

}



if (isDirectRun()) {

  cliMain().catch((e) => {

    console.error(e);

    process.exit(1);

  });

}


