import type { Guess, MatchWinner, GameMode } from '../types';

/** Minimum letters per guess (any word allowed, not limited to word bank). */
export const MIN_GUESS_LENGTH = 2;

/**
 * Per-round score: highest when you solve in one guess, decays with each
 * extra guess, floors at MIN. Lost rounds award 0.
 *
 *   1 guess  → 1000
 *   2 guesses → 900
 *   …
 *   10+ guesses → 100 (floor)
 */
export const ROUND_SCORE_BASE = 1000;
export const ROUND_SCORE_PENALTY_PER_GUESS = 100;
export const ROUND_SCORE_MIN = 100;

export function computeRoundScore(
  guessCount: number,
  won: boolean
): number {
  if (!won || guessCount <= 0) return 0;
  const raw =
    ROUND_SCORE_BASE - (guessCount - 1) * ROUND_SCORE_PENALTY_PER_GUESS;
  return Math.max(ROUND_SCORE_MIN, raw);
}

export function isMatchOver(
  roundsWon: { me: number; opponent: number },
  roundsToWin: number
): MatchWinner {
  if (roundsWon.me >= roundsToWin) return 'me';
  if (roundsWon.opponent >= roundsToWin) return 'opponent';
  return null;
}

export function computeGuessEfficiency(guesses: Guess[]): number {
  if (guesses.length === 0) return 0;
  let totalCorrect = 0;
  let totalLetters = 0;
  for (const g of guesses) {
    totalLetters += g.results.length;
    totalCorrect += g.results.filter((r) => r.state === 'correct').length;
  }
  return totalLetters === 0 ? 0 : totalCorrect / totalLetters;
}

export function criticsRatingStars(
  myGuesses: Guess[],
  opponentGuesses: Guess[]
): { myStars: number; oppStars: number } {
  const myEff = computeGuessEfficiency(myGuesses);
  const oppEff = computeGuessEfficiency(opponentGuesses);
  const myStars = Math.min(5, Math.max(1, Math.round(myEff * 5)));
  const oppStars = Math.min(5, Math.max(1, Math.round(oppEff * 5)));
  return { myStars, oppStars };
}

export function soloCriticsRatingStars(myGuesses: Guess[]): { myStars: number } {
  const myEff = computeGuessEfficiency(myGuesses);
  const myStars = Math.min(5, Math.max(1, Math.round(myEff * 5)));
  return { myStars };
}

export function resolveCriticsRating(
  mode: GameMode | null,
  myGuesses: Guess[],
  opponentGuesses: Guess[]
): { myStars: number; oppStars: number } {
  if (mode === 'solo') {
    const solo = soloCriticsRatingStars(myGuesses);
    return { myStars: solo.myStars, oppStars: 0 };
  }
  return criticsRatingStars(myGuesses, opponentGuesses);
}
