import type { BasicWord, CategoryId, QuizMode } from './types';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter(item => item !== id) : [...list, id];
}

export function uniqueCategories(words: BasicWord[]) {
  return words.reduce<Record<CategoryId, number>>((acc, word) => {
    acc[word.category] = (acc[word.category] ?? 0) + 1;
    return acc;
  }, {} as Record<CategoryId, number>);
}

export function makeQuiz(words: BasicWord[], mode: QuizMode, seed = Date.now()) {
  const pool = [...words].sort((a, b) => seeded(seed + a.id.length, a.id) - seeded(seed + b.id.length, b.id));
  const answer = pool[0];
  const choices = [answer, ...pool.filter(word => word.id !== answer.id).slice(0, 3)]
    .sort((a, b) => seeded(seed, a.id) - seeded(seed, b.id));
  return { answer, choices, mode };
}

function seeded(seed: number, text: string) {
  let hash = seed;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  }
  return hash;
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
