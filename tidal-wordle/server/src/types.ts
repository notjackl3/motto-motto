// Server-side room + player types. Kept narrowly server-shaped — the wire
// types that go between client and server live in `shared/events.ts`.
// TODO: share types between client and server through a published package
// or build step.

export interface RoomPlayer {
  socketId: string;
  isHost: boolean;
}

export interface Room {
  id: string;
  players: RoomPlayer[];
  createdAt: number;

  // Active round state.
  answer: string | null;
  roundIndex: number;
  roundsWon: Record<string, number>; // socketId -> rounds won
  roundActive: boolean;
  matchEnded: boolean;

  // Per-round bookkeeping so the disconnect path can cancel pending timers.
  roundEndTimerHandle: NodeJS.Timeout | null;
}

export const MAX_PLAYERS_PER_ROOM = 2;
export const ROOM_CODE_LENGTH = 6;
