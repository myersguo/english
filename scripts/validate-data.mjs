import { readFile } from 'node:fs/promises';

const EXPECTED = {
  operations: 100,
  general: 400,
  picturable: 200,
  qualities: 100,
  opposites: 50
};

const source = await readFile('src/data/basicWords.ts', 'utf8');
const match = source.match(/export const basicWords: BasicWord\[] = ([\s\S]*);\n$/);
if (!match) throw new Error('Unable to read generated basicWords array.');

const words = JSON.parse(match[1]);
if (words.length !== 850) throw new Error(`Expected 850 words, got ${words.length}`);

const seen = new Set();
const counts = Object.fromEntries(Object.keys(EXPECTED).map(key => [key, 0]));
for (const entry of words) {
  if (seen.has(entry.word.toLowerCase())) throw new Error(`Duplicate word: ${entry.word}`);
  seen.add(entry.word.toLowerCase());
  counts[entry.category] += 1;
  if (!entry.chineseMeaning || !entry.englishDefinition || !entry.examples?.[0]?.en) {
    throw new Error(`Incomplete entry: ${entry.word}`);
  }
}

for (const [category, expected] of Object.entries(EXPECTED)) {
  if (counts[category] !== expected) {
    throw new Error(`${category}: expected ${expected}, got ${counts[category]}`);
  }
}

console.log('Data validation passed:', counts);
