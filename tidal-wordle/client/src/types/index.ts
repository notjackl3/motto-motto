export type GameMode = 'solo' | 'multiplayer';

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface LetterResult {
  letter: string;
  state: LetterState;
  /** Answer index for correct tiles (defaults to guess index when omitted). */
  answerIndex?: number;
}

export interface Guess {
  word: string;
  results: LetterResult[];
  submittedAt: number;
  /** Rejection-letter probe row — does not count toward win or card draw. */
  isProbe?: boolean;
  /** Forced-break: green/yellow/grey tile colors stay hidden until this timestamp. */
  colorsRevealAt?: number;
  /** Chess Gambit solo blunder: hide left or right half of this row's tiles. */
  halfMaskSide?: HalfGuessSide;
}

export type CardType = 'attack' | 'buff' | 'wildcard';
export type CardDuration = 'instant' | 'persistent';

export interface CardApiSource {
  /** Category label from the project's "API Category" reference doc. */
  category: string;
  /** The specific API the card draws from (display name). */
  apiName: string;
  /** Optional URL — clickable in the card popup if present. */
  url?: string;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  /** Shown in solo when the multiplayer wording does not apply (attacks = self-chaos). */
  soloDescription?: string;
  targetSelf: boolean;
  duration: CardDuration;
  /** Inspiration source — which public API the card's mechanic riffs on. */
  apiSource?: CardApiSource;
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

export type HalfGuessSide = 'left' | 'right';

export interface HalfGuessMask {
  target: EffectTarget;
  side: HalfGuessSide;
}

export interface OverlayState {
  id: string;
  type: string;
  message?: string;
  expiresAt?: number;
  dismissable?: boolean;
  /** Tier B payload for overlays (meme pack, recipe title, scroll content, etc.) */
  meta?: Record<string, unknown>;
}

export interface PlayerState {
  id: string;
  name: string;
  guesses: Guess[];
  hand: Card[];
  activeEffects: ActiveEffect[];
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
  roundNumber: number;
  criticsStars?: { me: number; opponent: number };
}

/** Completed round snapshot for match history UI. */
export type CardDetailSource = 'draw' | 'hand' | 'history';

export interface CardDetailPopupState {
  card: Card;
  source: CardDetailSource;
}

export interface CompletedRoundRecord {
  roundIndex: number;
  answer: string;
  winner: 'me' | 'opponent';
  myGuessCount: number;
  opponentGuessCount: number;
  winningGuess?: string;
}

/** Dev B: payload for SocketEvents.GameCardPlayed */
export interface GameCardPlayedPayload {
  cardId: string;
  targetPlayerId: string;
  fromPlayerId: string;
}

export type RoutingScreen = 'menu' | 'lobby' | 'game' | 'gameOver';

/** Dev B scene can read this URL when faceSwap is true (optional HUD fallback in Dev A). */
export type FaceSwapImageUrl = string | null;
