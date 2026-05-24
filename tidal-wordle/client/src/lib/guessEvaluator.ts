import type { LetterResult } from '../types';

export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const g = guess.toUpperCase();
  const a = answer.toUpperCase();
  const results: LetterResult[] = g.split('').map((letter) => ({
    letter,
    state: 'absent' as const,
  }));

  const answerCounts: Record<string, number> = {};
  for (const ch of a) {
    answerCounts[ch] = (answerCounts[ch] ?? 0) + 1;
  }

  // Pass 1: correct positions
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      results[i].state = 'correct';
      answerCounts[g[i]]--;
    }
  }

  // Pass 2: present elsewhere
  for (let i = 0; i < g.length; i++) {
    if (results[i].state === 'correct') continue;
    const ch = g[i];
    if (answerCounts[ch] > 0) {
      results[i].state = 'present';
      answerCounts[ch]--;
    }
  }

  return results;
}

export function isGuessCorrect(results: LetterResult[]): boolean {
  return results.length > 0 && results.every((r) => r.state === 'correct');
}
