import { create } from 'zustand';
import type { Card, GameMode, Guess } from '../types';

interface GameStoreState {
  mode: GameMode | null;
  answer: string | null;
  answerLength: number | null;
  myGuesses: Guess[];
  opponentGuesses: Guess[];
  myCooldownEndsAt: number | null;
  opponentCooldownEndsAt: number | null;
  myHand: Card[];
  activeEffects: Card[];
  roundScore: { me: number; opponent: number };
  matchScore: { me: number; opponent: number };
  roundsToWin: number;

  setMode: (mode: GameMode | null) => void;
  setAnswer: (answer: string | null) => void;
  addMyGuess: (guess: Guess) => void;
  addOpponentGuess: (guess: Guess) => void;
  setMyCooldownEndsAt: (at: number | null) => void;
  resetRound: () => void;
  resetMatch: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  mode: null,
  answer: null,
  answerLength: null,
  myGuesses: [],
  opponentGuesses: [],
  myCooldownEndsAt: null,
  opponentCooldownEndsAt: null,
  myHand: [],
  activeEffects: [],
  roundScore: { me: 0, opponent: 0 },
  matchScore: { me: 0, opponent: 0 },
  roundsToWin: 2,

  setMode: (mode) => set({ mode }),
  setAnswer: (answer) =>
    set({ answer, answerLength: answer ? answer.length : null }),
  addMyGuess: (guess) =>
    set((s) => ({ myGuesses: [...s.myGuesses, guess] })),
  addOpponentGuess: (guess) =>
    set((s) => ({ opponentGuesses: [...s.opponentGuesses, guess] })),
  setMyCooldownEndsAt: (at) => set({ myCooldownEndsAt: at }),
  resetRound: () =>
    set({
      answer: null,
      answerLength: null,
      myGuesses: [],
      opponentGuesses: [],
      myCooldownEndsAt: null,
      opponentCooldownEndsAt: null,
      activeEffects: [],
      roundScore: { me: 0, opponent: 0 },
    }),
  resetMatch: () =>
    set({
      mode: null,
      answer: null,
      answerLength: null,
      myGuesses: [],
      opponentGuesses: [],
      myCooldownEndsAt: null,
      opponentCooldownEndsAt: null,
      myHand: [],
      activeEffects: [],
      roundScore: { me: 0, opponent: 0 },
      matchScore: { me: 0, opponent: 0 },
    }),
}));
