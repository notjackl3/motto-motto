export type GameMode = 'solo' | 'multiplayer';

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface LetterResult {
  letter: string;
  state: LetterState;
}

export interface Guess {
  word: string;
  results: LetterResult[];
  submittedAt: number;
}

export type CardType = 'attack' | 'buff' | 'wildcard';
export type CardDuration = 'instant' | 'persistent';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  targetSelf: boolean;
  duration: CardDuration;
}

export interface PlayerState {
  id: string;
  name: string;
  guesses: Guess[];
  cooldownEndsAt: number | null;
  hand: Card[];
  activeEffects: Card[];
  roundScore: number;
  matchScore: number;
}

export interface RoundScore {
  me: number;
  opponent: number;
}

export type RoutingScreen = 'menu' | 'lobby' | 'game' | 'gameOver';
