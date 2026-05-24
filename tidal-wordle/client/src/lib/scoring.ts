import type { Guess, MatchWinner } from '../types';
import { isGuessCorrect } from './guessEvaluator';

export const DEFAULT_COOLDOWN_MS = 3000;
export const ROUND_START_SCORE = 100;
export const WRONG_GUESS_PENALTY = 10;
export const CRITICS_BONUS = 25;
export const MIN_FIRST_GUESS_LENGTH = 2;
export const MAX_GUESSES = 6;

export function computeRoundScoreAfterGuess(
  current: number,
  results: { state: string }[],
  solved: boolean
): number {
  if (solved) return current;
  if (!isGuessCorrect(results as Guess['results'])) {
    return Math.max(0, current - WRONG_GUESS_PENALTY);
  }
  return current;
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
