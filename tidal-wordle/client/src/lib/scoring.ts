import type { Guess, MatchWinner, GameMode } from '../types';

/** Minimum letters per guess (any word allowed, not limited to word bank). */
export const MIN_GUESS_LENGTH = 2;

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
