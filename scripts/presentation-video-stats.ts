/**
 * Prints question-bank totals for presentation voiceover/scripts.
 * Run: bun run scripts/presentation-video-stats.ts
 */
import { categories } from '../mocks/questions';

const total = categories.reduce((sum, c) => sum + c.questionCount, 0);

console.log('MEDVBA presentation stats');
console.log('-------------------------');
console.log(`Total questions: ${total.toLocaleString('ro-RO')}`);
for (const c of categories) {
  console.log(`  ${c.name}: ${c.questionCount.toLocaleString('ro-RO')}`);
}
console.log('\nUse in voiceover: "peste 21.000 de întrebări" or exact:', total);
