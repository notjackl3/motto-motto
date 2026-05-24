/**
 * gameStore seam (Dev A / Dev B):
 * - Dev B owns: mode (sync), opponentGuesses (write via socket), opponentCooldownEndsAt,
 *   tide fields, and reads musicSwapActive + faceSwap from scene.
 * - Dev A owns: answer, guesses (my), scoring, cards, hints, overlays, inputLocked, glitchActive.
 * - Coordinate before adding fields Dev B must read (document in PR).
 */
import { create } from 'zustand';
import type {
  ActiveEffect,
  EffectTarget,
  GameMode,
  Guess,
  Hint,
  MatchWinner,
  OverlayState,
  RoundBannerState,
  SubmitGuessResult,
} from '../types';
import { evaluateGuess, isGuessCorrect } from '../lib/guessEvaluator';
import {
  applyCriticsAtRoundEnd,
  fireCardAfterGuess,
} from '../lib/cardEffects';
import { getRandomWord, isValidGuess, normalizeWord } from '../lib/wordList';
import {
  DEFAULT_COOLDOWN_MS,
  MIN_FIRST_GUESS_LENGTH,
  MAX_GUESSES,
  ROUND_START_SCORE,
  applyRoundToMatch,
  computeRoundScoreAfterGuess,
  isMatchOver,
} from '../lib/scoring';

type MatchEndListener = (winner: MatchWinner) => void;
const matchEndListeners = new Set<MatchEndListener>();

export function onMatchEnd(listener: MatchEndListener): () => void {
  matchEndListeners.add(listener);
  return () => matchEndListeners.delete(listener);
}

function notifyMatchEnd(winner: MatchWinner): void {
  matchEndListeners.forEach((fn) => fn(winner));
}

interface GameStoreState {
  mode: GameMode | null;
  answer: string | null;
  answerLength: number | null;
  myGuesses: Guess[];
  opponentGuesses: Guess[];
  myCooldownEndsAt: number | null;
  opponentCooldownEndsAt: number | null;
  myHand: import('../types').Card[];
  activeEffects: ActiveEffect[];
  roundScore: { me: number; opponent: number };
  matchScore: { me: number; opponent: number };
  roundsWon: { me: number; opponent: number };
  roundsToWin: number;
  matchWinner: MatchWinner;
  revealedLetters: Record<number, string>;
  hints: Hint[];
  cardDrawHistory: import('../types').Card[];
  inputLocked: boolean;
  glitchActive: EffectTarget | null;
  glitchUntilNextGuess: boolean;
  overlays: OverlayState[];
  cooldownFrozen: boolean;
  forcedBreakActive: boolean;
  chessPuzzleActive: boolean;
  chessLockUntil: number | null;
  pendingDiceRandomize: boolean;
  pendingCardSwap: boolean;
  criticsRatingPending: boolean;
  lastCriticsRatings: { me: number; opponent: number } | null;
  roundOver: boolean;
  roundBanner: RoundBannerState | null;
  musicSwapActive: boolean;
  faceSwap: boolean;

  setMode: (mode: GameMode | null) => void;
  startMatch: (mode: GameMode) => void;
  startRound: () => void;
  submitGuess: (word: string) => SubmitGuessResult;
  endRound: (winner: 'me' | 'opponent') => void;
  dismissRoundBanner: () => void;
  resetRound: () => void;
  resetMatch: () => void;
  setMyCooldownEndsAt: (at: number | null) => void;
}

const initialRoundState = {
  answer: null as string | null,
  answerLength: null as number | null,
  myGuesses: [] as Guess[],
  opponentGuesses: [] as Guess[],
  myCooldownEndsAt: null as number | null,
  opponentCooldownEndsAt: null as number | null,
  activeEffects: [] as ActiveEffect[],
  roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
  revealedLetters: {} as Record<number, string>,
  hints: [] as Hint[],
  inputLocked: false,
  glitchActive: null as EffectTarget | null,
  glitchUntilNextGuess: false,
  overlays: [] as OverlayState[],
  cooldownFrozen: false,
  forcedBreakActive: false,
  chessPuzzleActive: false,
  chessLockUntil: null as number | null,
  criticsRatingPending: false,
  lastCriticsRatings: null as { me: number; opponent: number } | null,
  roundOver: false,
  roundBanner: null as RoundBannerState | null,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  mode: null,
  ...initialRoundState,
  myHand: [],
  matchScore: { me: 0, opponent: 0 },
  roundsWon: { me: 0, opponent: 0 },
  roundsToWin: 2,
  matchWinner: null,
  cardDrawHistory: [],
  pendingDiceRandomize: false,
  pendingCardSwap: false,
  musicSwapActive: false,
  faceSwap: false,

  setMode: (mode) => set({ mode }),

  startMatch: (mode) => {
    set({
      mode,
      matchScore: { me: 0, opponent: 0 },
      roundsWon: { me: 0, opponent: 0 },
      matchWinner: null,
      cardDrawHistory: [],
      myHand: [],
      roundBanner: null,
      ...initialRoundState,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
    });
    get().startRound();
  },

  startRound: () => {
    const word = getRandomWord();
    set({
      ...initialRoundState,
      answer: word,
      answerLength: null,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
      roundOver: false,
      roundBanner: null,
      pendingDiceRandomize: false,
      pendingCardSwap: false,
    });
  },

  submitGuess: (rawWord: string): SubmitGuessResult => {
    const state = get();
    if (!state.answer) return { ok: false, reason: 'no_answer' };
    if (state.roundOver || state.matchWinner) {
      return { ok: false, reason: 'round_over' };
    }
    if (state.inputLocked || state.chessPuzzleActive) {
      return { ok: false, reason: 'locked' };
    }
    if (
      state.myCooldownEndsAt &&
      Date.now() < state.myCooldownEndsAt &&
      !state.cooldownFrozen
    ) {
      return { ok: false, reason: 'locked' };
    }
    if (state.myGuesses.length >= MAX_GUESSES) {
      return { ok: false, reason: 'round_over' };
    }

    const word = normalizeWord(rawWord);
    if (!word) return { ok: false, reason: 'length' };

    if (state.answerLength === null) {
      if (word.length < MIN_FIRST_GUESS_LENGTH) {
        return { ok: false, reason: 'length' };
      }
    } else {
      if (word.length !== state.answerLength) {
        return { ok: false, reason: 'length' };
      }
      if (!isValidGuess(word)) {
        return { ok: false, reason: 'not_in_list' };
      }
    }

    const results = evaluateGuess(word, state.answer);
    const solved = isGuessCorrect(results);
    const guess: Guess = { word, results, submittedAt: Date.now() };

    let newRoundScore = state.roundScore.me;
    if (!solved) {
      newRoundScore = computeRoundScoreAfterGuess(
        state.roundScore.me,
        results,
        false
      );
    }

    const updates: Partial<GameStoreState> = {
      myGuesses: [...state.myGuesses, guess],
      roundScore: { ...state.roundScore, me: newRoundScore },
    };

    if (state.answerLength === null) {
      updates.answerLength = state.answer.length;
    }

    if (state.glitchUntilNextGuess) {
      updates.glitchActive = null;
      updates.glitchUntilNextGuess = false;
    }

    set(updates);

    if (!state.cooldownFrozen) {
      set({ myCooldownEndsAt: Date.now() + DEFAULT_COOLDOWN_MS });
    }

    const guessCount = get().myGuesses.length;
    const roundEnds = solved || guessCount >= MAX_GUESSES;

    if (!roundEnds) {
      fireCardAfterGuess();
    }

    if (solved) {
      get().endRound('me');
      return { ok: true, solved: true };
    }

    if (guessCount >= MAX_GUESSES) {
      get().endRound('opponent');
      return { ok: true, solved: false };
    }

    return { ok: true, solved: false };
  },

  endRound: (winner: 'me' | 'opponent') => {
    const state = get();
    if (state.roundOver) return;

    applyCriticsAtRoundEnd();
    const afterCritics = get();

    const winnerScore =
      winner === 'me'
        ? afterCritics.roundScore.me
        : afterCritics.roundScore.opponent;

    const newMatchScore = applyRoundToMatch(
      afterCritics.matchScore,
      winner,
      winnerScore
    );
    const newRoundsWon = {
      me: afterCritics.roundsWon.me + (winner === 'me' ? 1 : 0),
      opponent:
        afterCritics.roundsWon.opponent + (winner === 'opponent' ? 1 : 0),
    };
    const matchWinner = isMatchOver(newRoundsWon, afterCritics.roundsToWin);
    const roundNumber =
      newRoundsWon.me + newRoundsWon.opponent;

    set({
      roundOver: true,
      matchScore: newMatchScore,
      roundsWon: newRoundsWon,
      matchWinner,
      roundBanner: matchWinner
        ? null
        : {
            winner,
            points: winnerScore,
            roundNumber,
            criticsStars: afterCritics.lastCriticsRatings ?? undefined,
          },
    });

    if (matchWinner) {
      notifyMatchEnd(matchWinner);
      return;
    }

    setTimeout(() => {
      const s = get();
      if (!s.matchWinner && s.roundBanner) {
        get().dismissRoundBanner();
        get().startRound();
      }
    }, 2500);
  },

  dismissRoundBanner: () => set({ roundBanner: null }),

  resetRound: () => {
    set({
      ...initialRoundState,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
    });
    get().startRound();
  },

  resetMatch: () => {
    set({
      mode: null,
      matchScore: { me: 0, opponent: 0 },
      roundsWon: { me: 0, opponent: 0 },
      matchWinner: null,
      cardDrawHistory: [],
      myHand: [],
      pendingDiceRandomize: false,
      pendingCardSwap: false,
      musicSwapActive: false,
      faceSwap: false,
      roundBanner: null,
      ...initialRoundState,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
    });
  },

  setMyCooldownEndsAt: (at) => set({ myCooldownEndsAt: at }),
}));
