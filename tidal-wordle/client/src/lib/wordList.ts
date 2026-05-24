import beachWords from '../data/beachWords.json';

export function getRandomWord(): string {
  const words = beachWords as string[];
  return words[Math.floor(Math.random() * words.length)];
}

export function getAllWords(): string[] {
  return beachWords as string[];
}
