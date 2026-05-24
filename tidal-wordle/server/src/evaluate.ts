// Server-authoritative Wordle evaluation. Two-pass algorithm so duplicate
// letters resolve correctly (a guessed letter only counts as 'present' if
// the answer still has an un-matched occurrence of it).
//
// NOTE: this duplicates Dev A's client-side `guessEvaluator.ts` on purpose —
// the client evaluator is for optimistic UX, the server's is the source of
// truth. If the two disagree, the server wins.

import type { WireLetterResult } from '../../shared/events.js';

export function evaluateGuess(guess: string, answer: string): WireLetterResult[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const len = a.length;
  const result: WireLetterResult[] = new Array(len);
  const remaining: Record<string, number> = {};

  // First pass: correct letters and bookkeeping for present-pass.
  for (let i = 0; i < len; i++) {
    if (g[i] === a[i]) {
      result[i] = { letter: g[i], state: 'correct' };
    } else {
      remaining[a[i]] = (remaining[a[i]] ?? 0) + 1;
    }
  }

  // Second pass: present (only if still un-matched) vs absent.
  for (let i = 0; i < len; i++) {
    if (result[i]) continue;
    const letter = g[i] ?? '';
    if (remaining[letter] > 0) {
      result[i] = { letter, state: 'present' };
      remaining[letter] -= 1;
    } else {
      result[i] = { letter, state: 'absent' };
    }
  }

  return result;
}

export function isCorrect(results: WireLetterResult[]): boolean {
  return results.every((r) => r.state === 'correct');
}
