import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, type Socket } from 'socket.io';
import {
  Events,
  GUESS_COOLDOWN_MS,
  ROUNDS_TO_WIN,
  ROUND_TRANSITION_MS,
  DISCONNECT_GRACE_MS,
  MATCH_END_PERSIST_MS,
  type GameCardEffectPayload,
  type GameCardPlayedInbound,
  type GameCooldownViolationPayload,
  type GameGuessInbound,
  type GameGuessResultPayload,
  type GameInvalidGuessPayload,
  type GameMatchEndPayload,
  type GameNextRoundPayload,
  type GameRoundEndPayload,
  type GameStartPayload,
  type OpponentLeftPayload,
  type Role,
  type RoomCreatedPayload,
  type RoomFullPayload,
  type RoomJoinedPayload,
  type RoomNotFoundPayload,
} from '../../shared/events.js';
import {
  createRoom,
  deleteRoom,
  detachSocket,
  getRoomBySocket,
  joinRoom,
  opponentRoleOf,
  opponentSocketIdOf,
  roleInRoom,
  touchRoom,
} from './rooms.js';
import type { Room } from './types.js';
import { getTideSnapshot } from './tides.js';
import { pickAnswer } from './words.js';
import { evaluateGuess, isCorrect } from './evaluate.js';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/tides', async (req, res) => {
  const station = (req.query.station as string | undefined)?.trim() || '9410230';
  try {
    const snapshot = await getTideSnapshot(station);
    res.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[tides] proxy failed:', message);
    res.status(502).json({ error: message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN },
});

// ---------- Match / round flow ----------

function socketIdForRole(room: Room, role: Role): string | null {
  return role === 'host' ? room.hostSocketId || null : room.guestSocketId;
}

function startMatch(room: Room): void {
  room.roundNumber = 1;
  room.roundsWon = { host: 0, guest: 0 };
  startRound(room);
  for (const role of ['host', 'guest'] as const) {
    const sid = socketIdForRole(room, role);
    if (!sid) continue;
    const payload: GameStartPayload = {
      roundNumber: room.roundNumber,
      yourRole: role,
      opponentName: 'Opponent',
    };
    io.to(sid).emit(Events.GAME_START, payload);
  }
  console.log(`[room ${room.code}] match start — answer="${room.answer}"`);
}

function startRound(room: Room): void {
  room.answer = pickAnswer();
  room.answerLength = room.answer.length;
  room.guesses = { host: [], guest: [] };
  room.cooldowns = { host: null, guest: null };
  room.activeEffects = { host: [], guest: [] };
  room.roundWinner = null;
  room.status = 'playing';
  touchRoom(room);
}

function broadcast(room: Room, event: string, payload: unknown): void {
  for (const role of ['host', 'guest'] as const) {
    const sid = socketIdForRole(room, role);
    if (sid) io.to(sid).emit(event, payload);
  }
}

function handleRoundEnd(room: Room, winner: Role | null): void {
  if (room.status === 'roundEnd' || room.status === 'matchEnd') return;
  if (!room.answer) return;
  room.status = 'roundEnd';
  room.roundWinner = winner;
  if (winner) room.roundsWon[winner] += 1;

  const matchOver =
    room.roundsWon.host >= ROUNDS_TO_WIN ||
    room.roundsWon.guest >= ROUNDS_TO_WIN ||
    room.roundNumber >= 3;

  const payload: GameRoundEndPayload = {
    winner,
    answer: room.answer,
    roundNumber: room.roundNumber,
    roundsWon: { ...room.roundsWon },
    nextRoundAt: matchOver ? null : Date.now() + ROUND_TRANSITION_MS,
  };
  broadcast(room, Events.GAME_ROUND_END, payload);
  console.log(
    `[room ${room.code}] round ${room.roundNumber} end — winner=${winner ?? 'none'}`,
  );

  if (matchOver) {
    handleMatchEnd(room);
    return;
  }

  if (room.roundTimerHandle) clearTimeout(room.roundTimerHandle);
  room.roundTimerHandle = setTimeout(() => {
    room.roundTimerHandle = null;
    // Only continue if both players are still present.
    if (!room.hostSocketId || !room.guestSocketId) return;
    room.roundNumber += 1;
    startRound(room);
    const nextPayload: GameNextRoundPayload = { roundNumber: room.roundNumber };
    broadcast(room, Events.GAME_NEXT_ROUND, nextPayload);
    console.log(`[room ${room.code}] round ${room.roundNumber} start — answer="${room.answer}"`);
  }, ROUND_TRANSITION_MS);
}

function handleMatchEnd(room: Room): void {
  // Determine winner by rounds won. Tie shouldn't happen (best-of-3 with
  // ROUNDS_TO_WIN=2), but guard anyway: whoever has more wins.
  const winner: Role =
    room.roundsWon.host >= room.roundsWon.guest ? 'host' : 'guest';
  room.status = 'matchEnd';
  const payload: GameMatchEndPayload = {
    winner,
    roundsWon: { ...room.roundsWon },
  };
  broadcast(room, Events.GAME_MATCH_END, payload);
  console.log(`[room ${room.code}] match end — winner=${winner}`);

  if (room.matchEndCleanupHandle) clearTimeout(room.matchEndCleanupHandle);
  room.matchEndCleanupHandle = setTimeout(
    () => deleteRoom(room.code),
    MATCH_END_PERSIST_MS,
  );
}

// ---------- Per-socket handlers ----------

function handleGuess(socket: Socket, raw: unknown): void {
  const room = getRoomBySocket(socket.id);
  if (!room || room.status !== 'playing' || !room.answer) return;
  const role = roleInRoom(room, socket.id);
  if (!role) return;

  const word =
    typeof raw === 'string'
      ? raw
      : typeof (raw as GameGuessInbound)?.guess === 'string'
        ? (raw as GameGuessInbound).guess
        : null;
  if (!word) return;
  const guessLower = word.toLowerCase();

  if (guessLower.length !== room.answer.length) {
    const payload: GameInvalidGuessPayload = {
      reason: 'length',
      expectedLength: room.answer.length,
    };
    socket.emit(Events.GAME_INVALID_GUESS, payload);
    return;
  }

  const now = Date.now();
  const cooldownEnd = room.cooldowns[role];
  if (cooldownEnd && now < cooldownEnd) {
    const payload: GameCooldownViolationPayload = {
      cooldownEndsAt: cooldownEnd,
    };
    socket.emit(Events.GAME_COOLDOWN_VIOLATION, payload);
    return;
  }

  const nextCooldownEnd = now + GUESS_COOLDOWN_MS;
  room.cooldowns[role] = nextCooldownEnd;
  room.guesses[role].push(guessLower);
  touchRoom(room);

  const evaluation = evaluateGuess(guessLower, room.answer);
  const correct = isCorrect(evaluation);

  const payload: GameGuessResultPayload = {
    role,
    guess: guessLower,
    evaluation,
    isCorrect: correct,
    cooldownEndsAt: nextCooldownEnd,
    answerLength: room.answer.length,
    timestamp: now,
  };
  broadcast(room, Events.GAME_GUESS_RESULT, payload);

  if (correct) {
    handleRoundEnd(room, role);
  }
}

function handleCardPlayed(socket: Socket, raw: unknown): void {
  const room = getRoomBySocket(socket.id);
  if (!room) return;
  const role = roleInRoom(room, socket.id);
  if (!role) return;

  const inbound = (raw ?? {}) as GameCardPlayedInbound;
  if (typeof inbound.cardId !== 'string' || !inbound.cardId) return;

  // Resolve target. Server trusts the client-declared target (since Dev A's
  // card metadata determines this from cardId on the client too — we don't
  // duplicate that table here).
  let affectedRole: Role | 'both';
  if (inbound.target === 'both') {
    affectedRole = 'both';
  } else if (inbound.target === 'self') {
    affectedRole = role;
  } else {
    affectedRole = opponentRoleOf(role);
  }

  touchRoom(room);
  const payload: GameCardEffectPayload = {
    sourceRole: role,
    cardId: inbound.cardId,
    affectedRole,
    timestamp: Date.now(),
  };
  broadcast(room, Events.GAME_CARD_EFFECT, payload);
}

function handleDisconnect(socket: Socket): void {
  const { room, role } = detachSocket(socket.id);
  if (!room || !role) return;

  // If both slots are now empty, just tear it down.
  if (!room.hostSocketId && !room.guestSocketId) {
    deleteRoom(room.code);
    return;
  }

  // Cancel pending round timers — game is paused while we wait for reconnect.
  if (room.roundTimerHandle) {
    clearTimeout(room.roundTimerHandle);
    room.roundTimerHandle = null;
  }

  const payload: OpponentLeftPayload = {
    reason: 'disconnect',
    graceMs: DISCONNECT_GRACE_MS,
  };
  const opponentSid = opponentSocketIdOf(room, role);
  if (opponentSid) io.to(opponentSid).emit(Events.OPPONENT_LEFT, payload);

  // 30s grace window for a reconnect (currently not implemented client-side
  // beyond the same socket reconnecting, but the room stays alive so a future
  // reconnect-by-roomCode path can rebind).
  if (room.disconnectGraceHandle) clearTimeout(room.disconnectGraceHandle);
  room.disconnectGraceHandle = setTimeout(() => {
    room.disconnectGraceHandle = null;
    // If the slot is still empty, kill the room.
    const stillHostMissing = !room.hostSocketId && role === 'host';
    const stillGuestMissing = !room.guestSocketId && role === 'guest';
    if (stillHostMissing || stillGuestMissing) {
      deleteRoom(room.code);
    }
  }, DISCONNECT_GRACE_MS);
}

// ---------- Socket wiring ----------

io.on('connection', (socket) => {
  console.log('[socket] connected', socket.id);

  socket.on(Events.ROOM_CREATE, () => {
    const room = createRoom(socket.id);
    socket.join(room.code);
    const payload: RoomCreatedPayload = { roomId: room.code, role: 'host' };
    socket.emit(Events.ROOM_CREATED, payload);
    console.log('[socket] room:create', room.code, 'by', socket.id);
  });

  socket.on(Events.ROOM_JOIN, (payload: { roomId?: string }) => {
    const code = (payload?.roomId ?? '').trim();
    const result = joinRoom(code, socket.id);
    if (result.status === 'notFound') {
      const out: RoomNotFoundPayload = { roomId: code };
      socket.emit(Events.ROOM_NOT_FOUND, out);
      return;
    }
    if (result.status === 'full') {
      const out: RoomFullPayload = { roomId: code };
      socket.emit(Events.ROOM_FULL, out);
      return;
    }
    const room = result.room;
    socket.join(room.code);
    for (const role of ['host', 'guest'] as const) {
      const sid = socketIdForRole(room, role);
      if (!sid) continue;
      const out: RoomJoinedPayload = {
        roomId: room.code,
        role,
        playerCount: (room.hostSocketId ? 1 : 0) + (room.guestSocketId ? 1 : 0),
      };
      io.to(sid).emit(Events.ROOM_JOINED, out);
    }
    console.log('[socket] room:join', room.code, 'by', socket.id);

    if (
      room.hostSocketId &&
      room.guestSocketId &&
      room.status === 'waiting'
    ) {
      startMatch(room);
    }
  });

  socket.on(Events.GAME_GUESS, (payload) => handleGuess(socket, payload));
  socket.on(Events.GAME_CARD_PLAYED, (payload) =>
    handleCardPlayed(socket, payload),
  );

  socket.on('disconnect', () => {
    console.log('[socket] disconnected', socket.id);
    handleDisconnect(socket);
  });
});

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
