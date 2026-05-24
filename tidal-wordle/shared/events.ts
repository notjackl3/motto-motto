// Wire-protocol contract between client and server.
// Both sides import the Events constant + payload types from here.
//
// Naming:
//   - Client → server events are emitted with the same string the server
//     listens on (Socket.IO uses event names, not directions).
//   - Server → client events are usually a sibling string (e.g. ROOM_CREATE
//     in, ROOM_CREATED out). The Events const lists all of them flat.

export const Events = {
  // Lobby / room lifecycle
  ROOM_CREATE: 'room:create',
  ROOM_CREATED: 'room:created',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_FULL: 'room:full',
  ROOM_NOT_FOUND: 'room:notFound',
  // Match flow
  GAME_START: 'game:start',
  GAME_GUESS: 'game:guess', // client → server
  GAME_GUESS_RESULT: 'game:guessResult', // server → both clients
  GAME_INVALID_GUESS: 'game:invalidGuess',
  GAME_COOLDOWN_VIOLATION: 'game:cooldownViolation',
  /** Emitted when a player guesses out of turn (sequential multiplayer). */
  GAME_TURN_VIOLATION: 'game:turnViolation',
  GAME_CARD_PLAYED: 'game:cardPlayed', // client → server
  GAME_CARD_EFFECT: 'game:cardEffect', // server → both clients
  GAME_ROUND_END: 'game:roundEnd',
  GAME_NEXT_ROUND: 'game:nextRound',
  GAME_MATCH_END: 'game:matchEnd',
  OPPONENT_LEFT: 'opponent:left',
  /** Chess Gambit blunder: leaker's client emits; opponent applies revealed letter. */
  GAME_CHESS_BLUNDER_INFO_LEAK: 'game:chessBlunderInfoLeak',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// Back-compat alias so any straggler import that still references
// SocketEvents keeps compiling while we finish the rewrite. Remove later.
export const SocketEvents = {
  RoomCreate: Events.ROOM_CREATE,
  RoomCreated: Events.ROOM_CREATED,
  RoomJoin: Events.ROOM_JOIN,
  RoomJoined: Events.ROOM_JOINED,
  RoomFull: Events.ROOM_FULL,
  RoomNotFound: Events.ROOM_NOT_FOUND,
  GameStart: Events.GAME_START,
  GameGuess: Events.GAME_GUESS,
  GameCardPlayed: Events.GAME_CARD_PLAYED,
  GameCooldownViolation: Events.GAME_COOLDOWN_VIOLATION,
  GameRoundEnd: Events.GAME_ROUND_END,
  GameMatchEnd: Events.GAME_MATCH_END,
  OpponentLeft: Events.OPPONENT_LEFT,
  GameChessBlunderInfoLeak: Events.GAME_CHESS_BLUNDER_INFO_LEAK,
} as const;

// ----- Tuning constants -----

export const GUESS_COOLDOWN_MS = 3000;
export const ROUNDS_TO_WIN = 2; // best of 3
export const ROUND_TRANSITION_MS = 5000;
export const DISCONNECT_GRACE_MS = 30_000;
export const MATCH_END_PERSIST_MS = 60_000;
export const ROOM_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

// ----- Wire types -----

export type Role = 'host' | 'guest';

export type WireLetterState = 'correct' | 'present' | 'absent';

export interface WireLetterResult {
  letter: string;
  state: WireLetterState;
}

// ROOM_CREATED → host
export interface RoomCreatedPayload {
  roomId: string;
  role: 'host';
}

// ROOM_JOINED → both players (per-recipient)
export interface RoomJoinedPayload {
  roomId: string;
  role: Role;
  playerCount: number; // 1 if just host present, 2 once guest joined
}

export interface RoomFullPayload {
  roomId: string;
}
export interface RoomNotFoundPayload {
  roomId: string;
}

// GAME_START → both players (per-recipient: yourRole differs)
export interface GameStartPayload {
  roundNumber: number; // 1, 2, or 3
  yourRole: Role;
  opponentName: string; // "Opponent" default; future: user-set
  /** Role allowed to submit the next guess (sequential turns). */
  activeTurn: Role;
}

// GAME_GUESS (client → server)
export interface GameGuessInbound {
  guess: string;
}

// GAME_GUESS_RESULT → both players
export interface GameGuessResultPayload {
  role: Role; // who guessed
  guess: string;
  evaluation: WireLetterResult[];
  isCorrect: boolean;
  /** @deprecated Sequential MP uses activeTurn; kept for wire compat. */
  cooldownEndsAt: number;
  /** Role allowed to submit the next guess (unchanged if the round ended). */
  activeTurn: Role;
  answerLength: number; // first-guess-reveals-length to both
  timestamp: number;
}

export interface GameInvalidGuessPayload {
  reason: 'length' | 'unknown';
  expectedLength?: number;
}

export interface GameCooldownViolationPayload {
  cooldownEndsAt: number;
}

export interface GameTurnViolationPayload {
  activeTurn: Role;
}

// GAME_CARD_PLAYED (client → server)
export interface GameCardPlayedInbound {
  cardId: string;
  target: 'self' | 'opponent' | 'both';
}

// GAME_CARD_EFFECT → both players
export interface GameCardEffectPayload {
  sourceRole: Role;
  cardId: string;
  affectedRole: Role | 'both';
  timestamp: number;
}

// GAME_ROUND_END → both players
export interface GameRoundEndPayload {
  winner: Role | null; // null if the round ended without a solve (timeout etc.)
  answer: string;
  roundNumber: number;
  roundsWon: { host: number; guest: number };
  nextRoundAt: number | null; // null when match ended
}

// GAME_NEXT_ROUND → both players
export interface GameNextRoundPayload {
  roundNumber: number;
  activeTurn: Role;
}

// GAME_MATCH_END → both players
export interface GameMatchEndPayload {
  winner: Role;
  roundsWon: { host: number; guest: number };
}

// OPPONENT_LEFT → remaining player
export interface OpponentLeftPayload {
  reason: 'disconnect' | 'leave';
  graceMs: number; // window for opponent to reconnect before room is torn down
}
