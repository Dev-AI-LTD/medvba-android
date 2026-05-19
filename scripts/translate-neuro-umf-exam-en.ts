/**
 * Translate UMF neuroanatomy exam affirmations RO → EN.
 * Saves progress incrementally; safe to resume.
 *
 *   bun run scripts/translate-neuro-umf-exam-en.ts
 *   bun run scripts/translate-neuro-umf-exam-en.ts -- --max=30
 */
import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { llmGenerateObjectJson } from '@/lib/llm-generate-object-json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RO_SOURCE = path.join(ROOT, 'content/neuroanatomy/sources/umf-exam-affirmations.json');
const EN_OUT = path.join(ROOT, 'content/neuroanatomy/sources/umf-exam-affirmations.en.json');

const BATCH_SIZE = 3;
const DELAY_MS = 1200;

type RoQuestion = {
  id: string;
  stem: string;
  options: string[];
  correctAnswers: number[];
};

type EnQuestion = {
  id: string;
  stem: string;
  options: string[];
};

const translationSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string(),
      stem: z.string(),
      options: z.array(z.string()),
    }),
  ),
});

function parseArgs(): { max?: number } {
  const maxArg = process.argv.find((arg) => arg.startsWith('--max='));
  return {
    max: maxArg ? parseInt(maxArg.split('=')[1] ?? '', 10) : undefined,
  };
}

function loadEnMap(): Map<string, EnQuestion> {
  if (!fs.existsSync(EN_OUT)) return new Map();
  try {
    const data = JSON.parse(fs.readFileSync(EN_OUT, 'utf8')) as EnQuestion[];
    return new Map(data.map((entry) => [entry.id, entry]));
  } catch {
    return new Map();
  }
}

function saveEnMap(map: Map<string, EnQuestion>): void {
  const sorted = [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(EN_OUT, JSON.stringify(sorted, null, 2), 'utf8');
}

async function translateBatch(batch: RoQuestion[]): Promise<EnQuestion[]> {
  const payload = batch.map((question) => ({
    id: question.id,
    stem: question.stem,
    options: question.options,
  }));

  const prompt = `You are a medical translator specializing in neuroanatomy.

Translate the following Romanian UMF-style exam affirmation questions into English.

Requirements:
- Preserve exact medical meaning and standard English anatomical terminology.
- Keep the same number of options as the Romanian source for each question.
- Do not reorder, merge, or split options.
- Stems like "se poate afirma că" → "the following can be stated regarding..." or natural clinical English.
- Return one translation object per input id.

Input:
${JSON.stringify(payload, null, 2)}`;

  const result = await llmGenerateObjectJson(prompt, translationSchema);
  return result.translations;
}

async function main(): Promise<void> {
  const { max } = parseArgs();
  const roQuestions = JSON.parse(fs.readFileSync(RO_SOURCE, 'utf8')) as RoQuestion[];
  const enMap = loadEnMap();

  const pending = roQuestions.filter((question) => !enMap.has(question.id));
  const toProcess = max ? pending.slice(0, max) : pending;

  console.log(`Total RO questions: ${roQuestions.length}`);
  console.log(`Already translated: ${enMap.size}`);
  console.log(`Pending this run: ${toProcess.length}`);

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);

    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${batch.map((q) => q.id).join(', ')})... `);

    try {
      const translations = await translateBatch(batch);
      for (const translation of translations) {
        const source = batch.find((question) => question.id === translation.id);
        if (!source) continue;
        if (translation.options.length !== source.options.length) {
          console.warn(
            `\nWarning: ${translation.id} option count ${translation.options.length} != ${source.options.length}`,
          );
        }
        enMap.set(translation.id, translation);
      }
      saveEnMap(enMap);
      console.log('saved');
    } catch (error) {
      console.error('\nFailed:', error);
      saveEnMap(enMap);
      process.exit(1);
    }

    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`Done. English entries: ${enMap.size}/${roQuestions.length} → ${EN_OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
