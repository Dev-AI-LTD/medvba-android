/**
 * Parse Romanian author source → head-neck-intro-home.ro.json
 * Usage: bun run scripts/parse-head-neck-home-ro.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RO_AUTHOR = path.join(
  ROOT,
  "content/head-neck/sources/head-neck-intro-home.author-ro.txt",
);
const RO_JSON = path.join(
  ROOT,
  "content/head-neck/sources/head-neck-intro-home.ro.json",
);

type RoEntry = {
  question: string;
  options: string[];
  explanation: string;
};

function parseRomanian(raw: string): Record<string, RoEntry> {
  const text = raw.trim();
  const blocks = text.split(/(?=Întrebarea \d+ — Nivel: )/i);
  const out: Record<string, RoEntry> = {};

  for (const block of blocks) {
    const header = block.match(
      /^Întrebarea (\d+) — Nivel: (Ușor|Mediu|Dificil)\n([\s\S]*)/i,
    );
    if (!header) continue;

    const num = parseInt(header[1], 10);
    const id = `hn-home-${String(num).padStart(3, "0")}`;
    const body = header[3].trim();

    const correctMatch = body.match(/\nRăspuns corect:\s*([A-E])\s*\n/i);
    if (!correctMatch) {
      console.warn(`Q${num}: missing Răspuns corect`);
      continue;
    }

    const explIdx = body.search(/\nExplicație:\s*/i);
    const beforeCorrect = body.slice(0, correctMatch.index!).trim();
    const explanation = body
      .slice(explIdx)
      .replace(/^\nExplicație:\s*/i, "")
      .trim();

    const optionLines = beforeCorrect.split(/\n(?=[A-E]\)\s)/);
    const question = optionLines[0].trim();
    const options = optionLines.slice(1).map((line) =>
      line.replace(/^[A-E]\)\s*/, "").trim(),
    );

    out[id] = { question, options, explanation };
  }

  return out;
}

function main() {
  if (!fs.existsSync(RO_AUTHOR)) {
    console.error(`Missing ${RO_AUTHOR}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(RO_AUTHOR, "utf8");
  const byId = parseRomanian(raw);
  fs.writeFileSync(RO_JSON, JSON.stringify(byId, null, 2), "utf8");
  console.log(`Wrote ${Object.keys(byId).length} RO entries to ${RO_JSON}`);
}

main();
