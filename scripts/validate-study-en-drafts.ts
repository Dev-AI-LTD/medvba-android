/**
 * Fail if English study drafts still contain Romanian markers.
 * Run: bun run study:validate-en
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

const RO_MARKERS =
  /[ăâîșțĂÂÎȘȚ]|## Ce înveți|## Concepte cheie|## Legături clinice|## Capcane frecvente|## Mini-rezumat|\*\*(Diviziuni|Sistemul|Celule|Locația|Funcția|Valva|Fluxul|Tipuri de oase|Structura ochiului|Urechea|Unitatea funcțională)\b/i;

function main() {
  const failures: string[] = [];
  for (const file of fs.readdirSync(DRAFTS_DIR)) {
    if (!file.endsWith(".en.json")) continue;
    const draft = JSON.parse(
      fs.readFileSync(path.join(DRAFTS_DIR, file), "utf8"),
    ) as { summaryMarkdown?: string };
    if (draft.summaryMarkdown && RO_MARKERS.test(draft.summaryMarkdown)) {
      failures.push(file);
    }
  }
  if (failures.length) {
    console.error("Romanian text found in EN drafts:");
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log("All EN study drafts passed validation.");
}

main();
