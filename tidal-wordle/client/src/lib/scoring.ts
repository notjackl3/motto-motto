import type { Guess, MatchWinner, GameMode } from '../types';

export const DEFAULT_COOLDOWN_MS = 3000;
export const ROUND_START_SCORE = 100;
export const WRONG_GUESS_PENALTY = 10;
export const CRITICS_BONUS = 25;
/** Solo Critic's Rating: stars needed to earn the round-end bonus. */
export const SOLO_CRITICS_STAR_THRESHOLD = 4;
/** Minimum letters per guess (any word allowed, not limited to word bank). */
export const MIN_GUESS_LENGTH = 2;

export function computeRoundScoreAfterGuess(
  current: number,
  solved: boolean
): number {
  if (solved) return current;
  return Math.max(0, current - WRONG_GUESS_PENALTY);
}

export function applyRoundToMatch(
  matchScore: { me: number; opponent: number },
  roundWinner: 'me' | 'opponent',
  winnerRoundScore: number
): { me: number; opponent: number } {
  if (roundWinner === 'me') {
    return { me: matchScore.me + winnerRoundScore, opponent: matchScore.opponent };
  }
  return { me: matchScore.me, opponent: matchScore.opponent + winnerRoundScore };
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

export function criticsRatingBonus(
  myGuesses: Guess[],
  opponentGuesses: Guess[]
): { me: number; opponent: number; myStars: number; oppStars: number } {
  const myEff = computeGuessEfficiency(myGuesses);
  const oppEff = computeGuessEfficiency(opponentGuesses);
  const myStars = Math.min(5, Math.max(1, Math.round(myEff * 5)));
  const oppStars = Math.min(5, Math.max(1, Math.round(oppEff * 5)));
  if (myEff > oppEff) return { me: CRITICS_BONUS, opponent: 0, myStars, oppStars };
  if (oppEff > myEff) return { me: 0, opponent: CRITICS_BONUS, myStars, oppStars };
  return { me: 0, opponent: 0, myStars, oppStars };
}

export function soloCriticsRatingBonus(myGuesses: Guess[]): {
  me: number;
  myStars: number;
} {
  const myEff = computeGuessEfficiency(myGuesses);
  const myStars = Math.min(5, Math.max(1, Math.round(myEff * 5)));
  const me = myStars >= SOLO_CRITICS_STAR_THRESHOLD ? CRITICS_BONUS : 0;
  return { me, myStars };
}

export function resolveCriticsRating(
  mode: GameMode | null,
  myGuesses: Guess[],
  opponentGuesses: Guess[]
): { me: number; opponent: number; myStars: number; oppStars: number } {
  if (mode === 'solo') {
    const solo = soloCriticsRatingBonus(myGuesses);
    return { me: solo.me, opponent: 0, myStars: solo.myStars, oppStars: 0 };
  }
  return criticsRatingBonus(myGuesses, opponentGuesses);
}
