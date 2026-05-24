import { MAX_PLAYERS_PER_ROOM, type Room } from './types.js';

const rooms = new Map<string, Room>();

function generateCode(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function createRoom(socketId: string): Room {
  let id = generateCode();
  while (rooms.has(id)) id = generateCode();
  const room: Room = {
    id,
    players: [{ socketId, isHost: true }],
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

export function joinRoom(roomId: string, socketId: string): {
  room: Room | null;
  status: 'joined' | 'full' | 'missing';
} {
  const room = rooms.get(roomId);
  if (!room) return { room: null, status: 'missing' };
  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    return { room, status: 'full' };
  }
  room.players.push({ socketId, isHost: false });
  return { room, status: 'joined' };
}

export function removeSocket(socketId: string): void {
  for (const [id, room] of rooms.entries()) {
    room.players = room.players.filter((p) => p.socketId !== socketId);
    if (room.players.length === 0) rooms.delete(id);
  }
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}
