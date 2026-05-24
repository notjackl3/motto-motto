export const SocketEvents = {
  RoomCreate: 'room:create',
  RoomCreated: 'room:created',
  RoomJoin: 'room:join',
  RoomJoined: 'room:joined',
  RoomFull: 'room:full',
  RoomNotFound: 'room:notFound',
  GameStart: 'game:start',
  GameGuess: 'game:guess',
  GameCardPlayed: 'game:cardPlayed',
  GameRoundEnd: 'game:roundEnd',
  GameMatchEnd: 'game:matchEnd',
  OpponentLeft: 'opponent:left',
  /** Chess Gambit blunder: leaker's client emits; opponent applies revealed letter. */
  GameChessBlunderInfoLeak: 'game:chessBlunderInfoLeak',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

// Best of 3 = first to win 2 rounds.
export const ROUNDS_TO_WIN = 2;

// Delay between a correct guess and the next round.
export const ROUND_TRANSITION_MS = 5000;

// ----- Payload types shared across the wire -----

export type WireLetterState = 'correct' | 'present' | 'absent';

export interface WireLetterResult {
  letter: string;
  state: WireLetterState;
}

export interface RoomCreatedPayload {
  roomId: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  isHost: boolean;
  playerCount: number;
}

export interface GameStartPayload {
  answerLength: number;
  roundIndex: number;
  roundsWon: { me: number; opponent: number };
}

export interface GameGuessPayload {
  playerId: string; // socket id
  fromSelf: boolean; // server fills this per-recipient
  guess: string;
  evaluation: WireLetterResult[];
  isCorrect: boolean;
  timestamp: number;
}

export interface GameCardPlayedPayload {
  playerId: string;
  fromSelf: boolean;
  cardId: string;
  target: 'self' | 'opponent';
  timestamp: number;
}

export interface GameRoundEndPayload {
  winner: 'me' | 'opponent' | null;
  answer: string;
  roundIndex: number;
  roundsWon: { me: number; opponent: number };
  nextRoundAt: number | null;
}

export interface GameMatchEndPayload {
  winner: 'me' | 'opponent' | null;
  roundsWon: { me: number; opponent: number };
}

export interface OpponentLeftPayload {
  reason: 'disconnect' | 'leave';
}
