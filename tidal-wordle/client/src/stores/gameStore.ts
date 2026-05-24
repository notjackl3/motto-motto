import { create } from 'zustand';
import type { Card, GameMode, Guess } from '../types';

export interface MatchEndPayload {
  winner: 'me' | 'opponent' | null;
  finalRoundScores: Array<{ me: number; opponent: number }>;
  finalMatchScore: { me: number; opponent: number };
}

// Seam note (Dev B → Dev A): incoming card plays from the opponent are pushed
// here by useSocket so Dev A's card-effect logic can consume them without us
// taking a hard import dependency on Dev A's `cardEffects.ts`. Dev A should
// subscribe (e.g. zustand `subscribe`) and call shift/clear after applying.
export interface IncomingCardPlay {
  cardId: string;
  fromSelf: boolean;
  target: 'self' | 'opponent';
  timestamp: number;
}

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

  // Dev B owned multiplayer + scene fields.
  roomCode: string | null;
  isConnected: boolean;
  opponentLeft: boolean;
  matchEnd: MatchEndPayload | null;
  musicSwapActive: boolean;
  musicMuted: boolean;
  faceSwap: boolean;
  incomingCardPlays: IncomingCardPlay[];

  setMode: (mode: GameMode | null) => void;
  setAnswer: (answer: string | null) => void;
  addMyGuess: (guess: Guess) => void;
  addOpponentGuess: (guess: Guess) => void;
  setMyCooldownEndsAt: (at: number | null) => void;
  setOpponentCooldownEndsAt: (at: number | null) => void;
  setRoomCode: (code: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  setOpponentLeft: (left: boolean) => void;
  setMatchEnd: (m: MatchEndPayload | null) => void;
  setMusicSwapActive: (active: boolean) => void;
  setMusicMuted: (muted: boolean) => void;
  setFaceSwap: (on: boolean) => void;
  pushIncomingCardPlay: (play: IncomingCardPlay) => void;
  consumeIncomingCardPlay: () => IncomingCardPlay | null;
  clearIncomingCardPlays: () => void;
  resetRound: () => void;
  resetMatch: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
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

  roomCode: null,
  isConnected: false,
  opponentLeft: false,
  matchEnd: null,
  musicSwapActive: false,
  musicMuted: false,
  faceSwap: false,
  incomingCardPlays: [],

  setMode: (mode) => set({ mode }),
  setAnswer: (answer) =>
    set({ answer, answerLength: answer ? answer.length : null }),
  addMyGuess: (guess) =>
    set((s) => ({ myGuesses: [...s.myGuesses, guess] })),
  addOpponentGuess: (guess) =>
    set((s) => ({ opponentGuesses: [...s.opponentGuesses, guess] })),
  setMyCooldownEndsAt: (at) => set({ myCooldownEndsAt: at }),
  setOpponentCooldownEndsAt: (at) => set({ opponentCooldownEndsAt: at }),
  setRoomCode: (code) => set({ roomCode: code }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setOpponentLeft: (left) => set({ opponentLeft: left }),
  setMatchEnd: (m) => set({ matchEnd: m }),
  setMusicSwapActive: (active) => set({ musicSwapActive: active }),
  setMusicMuted: (muted) => set({ musicMuted: muted }),
  setFaceSwap: (on) => set({ faceSwap: on }),
  pushIncomingCardPlay: (play) =>
    set((s) => ({ incomingCardPlays: [...s.incomingCardPlays, play] })),
  consumeIncomingCardPlay: () => {
    const queue = get().incomingCardPlays;
    if (queue.length === 0) return null;
    const [next, ...rest] = queue;
    set({ incomingCardPlays: rest });
    return next;
  },
  clearIncomingCardPlays: () => set({ incomingCardPlays: [] }),
  resetRound: () =>
    set({
      answer: null,
      answerLength: null,
      myGuesses: [],
      opponentGuesses: [],
      myCooldownEndsAt: null,
      opponentCooldownEndsAt: null,
      activeEffects: [],
      faceSwap: false,
      musicSwapActive: false,
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
      roomCode: null,
      opponentLeft: false,
      matchEnd: null,
      faceSwap: false,
      musicSwapActive: false,
      incomingCardPlays: [],
    }),
}));
