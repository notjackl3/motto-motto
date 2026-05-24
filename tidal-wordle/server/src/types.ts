// Duplicated minimal types until we share a single source.
// TODO: share types between client and server through a published package or build step.

export interface RoomPlayer {
  socketId: string;
  isHost: boolean;
}

export interface Room {
  id: string;
  players: RoomPlayer[];
  createdAt: number;
}

export const MAX_PLAYERS_PER_ROOM = 2;
