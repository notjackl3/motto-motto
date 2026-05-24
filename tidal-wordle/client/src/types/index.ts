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

export type EffectTarget = 'self' | 'opponent';

export interface ActiveEffect {
  id: string;
  cardId: string;
  target: EffectTarget;
  expiresAt?: number;
  payload?: Record<string, unknown>;
}

export interface Hint {
  id: string;
  text: string;
  createdAt: number;
}

export interface OverlayState {
  id: string;
  type: string;
  message?: string;
  expiresAt?: number;
  dismissable?: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  guesses: Guess[];
  cooldownEndsAt: number | null;
  hand: Card[];
  activeEffects: ActiveEffect[];
  roundScore: number;
  matchScore: number;
}

export interface RoundScore {
  me: number;
  opponent: number;
}

export type MatchWinner = 'me' | 'opponent' | null;

export type SubmitGuessResult =
  | { ok: true; solved: boolean }
  | {
      ok: false;
      reason: 'length' | 'not_in_list' | 'locked' | 'round_over' | 'no_answer';
    };

export interface RoundBannerState {
  winner: 'me' | 'opponent';
  points: number;
  roundNumber: number;
  criticsStars?: { me: number; opponent: number };
}

/** Dev B: payload for SocketEvents.GameCardPlayed */
export interface GameCardPlayedPayload {
  cardId: string;
  targetPlayerId: string;
  fromPlayerId: string;
}

export type RoutingScreen = 'menu' | 'lobby' | 'game' | 'gameOver';
