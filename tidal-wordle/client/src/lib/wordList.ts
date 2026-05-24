import beachWords from '../data/beachWords.json';

export const MIN_WORD_LENGTH = 4;
export const MAX_WORD_LENGTH = 10;

const RAW = beachWords as string[];
const WORDS = RAW.map((w) => w.toUpperCase()).filter(
  (w) => w.length >= MIN_WORD_LENGTH && w.length <= MAX_WORD_LENGTH
);
const WORD_SET = new Set(WORDS);

export function getAllWords(): string[] {
  return [...WORDS];
}

export function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function getRandomWordOfLength(n: number): string {
  const filtered = WORDS.filter((w) => w.length === n);
  if (filtered.length === 0) return getRandomWord();
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function isValidGuess(word: string): boolean {
  return WORD_SET.has(word.toUpperCase());
}

export function normalizeWord(word: string): string {
  return word.trim().toUpperCase();
}
