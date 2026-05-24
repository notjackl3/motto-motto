import type { LetterResult } from '../types';

/** Player solved when guess exactly matches the answer (length + letters). */
export function isSolvedGuess(guess: string, answer: string): boolean {
  return guess.toUpperCase() === answer.toUpperCase();
}

/** When guess is longer than answer, align answer[0..] to a sliding window in the guess. */
function findBestAlignmentOffset(guess: string, answer: string): number {
  const maxOffset = guess.length - answer.length;
  let bestOffset = 0;
  let bestScore = -1;
  for (let offset = 0; offset <= maxOffset; offset++) {
    let score = 0;
    for (let j = 0; j < answer.length; j++) {
      if (guess[offset + j] === answer[j]) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }
  return bestOffset;
}

function evaluateWithAlignment(
  guess: string,
  answer: string,
  offset: number
): LetterResult[] {
  const results: LetterResult[] = guess.split('').map((letter) => ({
    letter,
    state: 'absent' as const,
  }));

  const answerCounts: Record<string, number> = {};
  for (const ch of answer) {
    answerCounts[ch] = (answerCounts[ch] ?? 0) + 1;
  }

  for (let i = 0; i < guess.length; i++) {
    const answerIndex = i - offset;
    if (answerIndex >= 0 && answerIndex < answer.length && guess[i] === answer[answerIndex]) {
      results[i].state = 'correct';
      results[i].answerIndex = answerIndex;
      answerCounts[guess[i]]--;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (results[i].state === 'correct') continue;
    const ch = guess[i];
    if (answerCounts[ch] > 0) {
      results[i].state = 'present';
      answerCounts[ch]--;
    }
  }

  return results;
}

/**
 * Wordle-style evaluation for variable-length guesses.
 * Shorter guesses compare index-to-index; longer guesses align the answer inside the guess.
 */
export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const g = guess.toUpperCase();
  const a = answer.toUpperCase();
  const offset = g.length > a.length ? findBestAlignmentOffset(g, a) : 0;
  return evaluateWithAlignment(g, a, offset);
}

/** @deprecated Use isSolvedGuess for win detection */
export function isGuessCorrect(results: LetterResult[]): boolean {
  return results.length > 0 && results.every((r) => r.state === 'correct');
}
