import { MAX_PLAYERS_PER_ROOM, ROOM_CODE_LENGTH, type Room } from './types.js';

const rooms = new Map<string, Room>();
// Reverse index: socketId -> roomId for O(1) lookup on guess/card/disconnect.
const socketRoom = new Map<string, string>();

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — easier to read.

function generateCode(): string {
  let out = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function emptyRoom(socketId: string): Room {
  let id = generateCode();
  while (rooms.has(id)) id = generateCode();
  return {
    id,
    players: [{ socketId, isHost: true }],
    createdAt: Date.now(),
    answer: null,
    roundIndex: 0,
    roundsWon: { [socketId]: 0 },
    roundActive: false,
    matchEnded: false,
    roundEndTimerHandle: null,
  };
}

export function createRoom(socketId: string): Room {
  const room = emptyRoom(socketId);
  rooms.set(room.id, room);
  socketRoom.set(socketId, room.id);
  return room;
}

export function joinRoom(
  rawRoomId: string,
  socketId: string,
): { room: Room | null; status: 'joined' | 'full' | 'missing' } {
  const roomId = rawRoomId.toUpperCase();
  const room = rooms.get(roomId);
  if (!room) return { room: null, status: 'missing' };
  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    return { room, status: 'full' };
  }
  room.players.push({ socketId, isHost: false });
  room.roundsWon[socketId] = 0;
  socketRoom.set(socketId, room.id);
  return { room, status: 'joined' };
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomForSocket(socketId: string): Room | undefined {
  const id = socketRoom.get(socketId);
  if (!id) return undefined;
  return rooms.get(id);
}

export function destroyRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.roundEndTimerHandle) clearTimeout(room.roundEndTimerHandle);
  for (const p of room.players) socketRoom.delete(p.socketId);
  rooms.delete(roomId);
}

export function removeSocket(socketId: string): { room: Room | null; wasInRoom: boolean } {
  const roomId = socketRoom.get(socketId);
  socketRoom.delete(socketId);
  if (!roomId) return { room: null, wasInRoom: false };
  const room = rooms.get(roomId);
  if (!room) return { room: null, wasInRoom: false };
  room.players = room.players.filter((p) => p.socketId !== socketId);
  return { room, wasInRoom: true };
}

export function opponentOf(room: Room, socketId: string): string | null {
  const other = room.players.find((p) => p.socketId !== socketId);
  return other?.socketId ?? null;
}
