import {
  ROOM_INACTIVITY_TIMEOUT_MS,
  type Role,
} from '../../shared/events.js';
import { ROOM_CODE_LENGTH, type Room } from './types.js';

const rooms = new Map<string, Room>();
const socketRoom = new Map<string, string>(); // socketId → roomCode

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

function generateCode(): string {
  let out = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function uniqueCode(): string {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  return code;
}

function scheduleInactivityCleanup(room: Room): void {
  if (room.inactivityHandle) clearTimeout(room.inactivityHandle);
  room.inactivityHandle = setTimeout(() => {
    deleteRoom(room.code);
  }, ROOM_INACTIVITY_TIMEOUT_MS);
}

export function touchRoom(room: Room): void {
  room.lastActivityAt = Date.now();
  scheduleInactivityCleanup(room);
}

export function createRoom(hostSocketId: string): Room {
  const code = uniqueCode();
  const now = Date.now();
  const room: Room = {
    code,
    hostSocketId,
    guestSocketId: null,
    answer: null,
    answerLength: null,
    roundNumber: 1,
    roundsWon: { host: 0, guest: 0 },
    guesses: { host: [], guest: [] },
    cooldowns: { host: null, guest: null },
    activeEffects: { host: [], guest: [] },
    roundWinner: null,
    status: 'waiting',
    createdAt: now,
    lastActivityAt: now,
    roundTimerHandle: null,
    disconnectGraceHandle: null,
    matchEndCleanupHandle: null,
    inactivityHandle: null,
  };
  rooms.set(code, room);
  socketRoom.set(hostSocketId, code);
  scheduleInactivityCleanup(room);
  return room;
}

export type JoinResult =
  | { status: 'joined'; room: Room }
  | { status: 'full' }
  | { status: 'notFound' };

export function joinRoom(rawCode: string, guestSocketId: string): JoinResult {
  const code = rawCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return { status: 'notFound' };
  if (room.guestSocketId && room.guestSocketId !== guestSocketId) {
    return { status: 'full' };
  }
  room.guestSocketId = guestSocketId;
  socketRoom.set(guestSocketId, code);
  // Cancel disconnect-grace if the guest is the one who'd left and returned.
  if (room.disconnectGraceHandle) {
    clearTimeout(room.disconnectGraceHandle);
    room.disconnectGraceHandle = null;
  }
  touchRoom(room);
  return { status: 'joined', room };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomBySocket(socketId: string): Room | undefined {
  const code = socketRoom.get(socketId);
  if (!code) return undefined;
  return rooms.get(code);
}

export function roleInRoom(room: Room, socketId: string): Role | null {
  if (room.hostSocketId === socketId) return 'host';
  if (room.guestSocketId === socketId) return 'guest';
  return null;
}

export function opponentRoleOf(role: Role): Role {
  return role === 'host' ? 'guest' : 'host';
}

export function opponentSocketIdOf(room: Room, role: Role): string | null {
  return role === 'host' ? room.guestSocketId : room.hostSocketId;
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (!room) return;
  if (room.roundTimerHandle) clearTimeout(room.roundTimerHandle);
  if (room.disconnectGraceHandle) clearTimeout(room.disconnectGraceHandle);
  if (room.matchEndCleanupHandle) clearTimeout(room.matchEndCleanupHandle);
  if (room.inactivityHandle) clearTimeout(room.inactivityHandle);
  if (room.hostSocketId) socketRoom.delete(room.hostSocketId);
  if (room.guestSocketId) socketRoom.delete(room.guestSocketId);
  rooms.delete(code);
}

/**
 * Mark a socket as no longer associated with its room. Returns the room +
 * the role they had, so the caller can broadcast opponent:left / schedule
 * the disconnect-grace window.
 */
export function detachSocket(socketId: string): {
  room: Room | null;
  role: Role | null;
} {
  const code = socketRoom.get(socketId);
  socketRoom.delete(socketId);
  if (!code) return { room: null, role: null };
  const room = rooms.get(code);
  if (!room) return { room: null, role: null };
  let role: Role | null = null;
  if (room.hostSocketId === socketId) {
    role = 'host';
    room.hostSocketId = '';
  } else if (room.guestSocketId === socketId) {
    role = 'guest';
    room.guestSocketId = null;
  }
  return { room, role };
}
