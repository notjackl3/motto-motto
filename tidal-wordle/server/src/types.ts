// Server-side room types. Wire-facing types live in shared/events.ts.

import type { Role } from '../../shared/events.js';

export type RoomStatus = 'waiting' | 'playing' | 'roundEnd' | 'matchEnd';

export interface ActiveEffect {
  cardId: string;
  expiresAt: number; // epoch ms; 0 for non-expiring (consumed on next guess)
}

export interface Room {
  code: string;

  hostSocketId: string;
  guestSocketId: string | null;

  // Round state
  answer: string | null;
  answerLength: number | null;
  roundNumber: number; // 1..3
  roundsWon: { host: number; guest: number };

  // Guess + cooldown tracking
  guesses: { host: string[]; guest: string[] };
  cooldowns: { host: number | null; guest: number | null }; // epoch ms when cooldown ends

  // Persistent card effects (server tracks for routing only; client computes
  // visual / mechanical impact via existing cardEffects code).
  activeEffects: { host: ActiveEffect[]; guest: ActiveEffect[] };

  roundWinner: Role | null;
  status: RoomStatus;

  // Bookkeeping for timers we may need to cancel.
  createdAt: number;
  lastActivityAt: number;
  roundTimerHandle: NodeJS.Timeout | null;
  disconnectGraceHandle: NodeJS.Timeout | null;
  matchEndCleanupHandle: NodeJS.Timeout | null;
  inactivityHandle: NodeJS.Timeout | null;
}

export const ROOM_CODE_LENGTH = 6;
