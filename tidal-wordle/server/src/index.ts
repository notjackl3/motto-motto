import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, type Socket } from 'socket.io';
import {
  SocketEvents,
  ROUNDS_TO_WIN,
  ROUND_TRANSITION_MS,
  type GameCardPlayedPayload,
  type GameGuessPayload,
  type GameMatchEndPayload,
  type GameRoundEndPayload,
  type GameStartPayload,
  type OpponentLeftPayload,
  type RoomCreatedPayload,
  type RoomJoinedPayload,
} from '../../shared/events.js';
import {
  createRoom,
  destroyRoom,
  getRoomForSocket,
  joinRoom,
  opponentOf,
  removeSocket,
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

function startRound(room: Room) {
  room.answer = pickAnswer();
  room.roundActive = true;
  for (const player of room.players) {
    const opponent = opponentOf(room, player.socketId);
    const payload: GameStartPayload = {
      answerLength: room.answer.length,
      roundIndex: room.roundIndex,
      roundsWon: {
        me: room.roundsWon[player.socketId] ?? 0,
        opponent: opponent ? (room.roundsWon[opponent] ?? 0) : 0,
      },
    };
    io.to(player.socketId).emit(SocketEvents.GameStart, payload);
  }
  console.log(`[room ${room.id}] round ${room.roundIndex + 1} start — answer="${room.answer}"`);
}

function finishRound(room: Room, winnerSocketId: string | null) {
  if (!room.answer) return;
  room.roundActive = false;
  if (winnerSocketId) {
    room.roundsWon[winnerSocketId] = (room.roundsWon[winnerSocketId] ?? 0) + 1;
  }

  const matchWinner = room.players.find(
    (p) => (room.roundsWon[p.socketId] ?? 0) >= ROUNDS_TO_WIN,
  );
  const isMatchOver = !!matchWinner;
  const answer = room.answer;
  const finishedIndex = room.roundIndex;

  // Per-recipient round-end payload (me/opponent perspective).
  for (const player of room.players) {
    const opponent = opponentOf(room, player.socketId);
    const myWins = room.roundsWon[player.socketId] ?? 0;
    const oppWins = opponent ? (room.roundsWon[opponent] ?? 0) : 0;
    const winnerLabel: 'me' | 'opponent' | null =
      winnerSocketId === null
        ? null
        : winnerSocketId === player.socketId
          ? 'me'
          : 'opponent';

    const payload: GameRoundEndPayload = {
      winner: winnerLabel,
      answer,
      roundIndex: finishedIndex,
      roundsWon: { me: myWins, opponent: oppWins },
      nextRoundAt: isMatchOver ? null : Date.now() + ROUND_TRANSITION_MS,
    };
    io.to(player.socketId).emit(SocketEvents.GameRoundEnd, payload);
  }
  console.log(`[room ${room.id}] round ${finishedIndex + 1} end — winner=${winnerSocketId ?? 'none'}`);

  if (isMatchOver && matchWinner) {
    room.matchEnded = true;
    room.answer = null;
    for (const player of room.players) {
      const opponent = opponentOf(room, player.socketId);
      const matchPayload: GameMatchEndPayload = {
        winner:
          matchWinner.socketId === player.socketId
            ? 'me'
            : 'opponent',
        roundsWon: {
          me: room.roundsWon[player.socketId] ?? 0,
          opponent: opponent ? (room.roundsWon[opponent] ?? 0) : 0,
        },
      };
      io.to(player.socketId).emit(SocketEvents.GameMatchEnd, matchPayload);
    }
    console.log(`[room ${room.id}] match end — winner=${matchWinner.socketId}`);
    return;
  }

  // Schedule next round.
  room.roundIndex += 1;
  room.answer = null;
  if (room.roundEndTimerHandle) clearTimeout(room.roundEndTimerHandle);
  room.roundEndTimerHandle = setTimeout(() => {
    room.roundEndTimerHandle = null;
    if (room.players.length < 2) return;
    startRound(room);
  }, ROUND_TRANSITION_MS);
}

function handleGuess(socket: Socket, raw: unknown) {
  const room = getRoomForSocket(socket.id);
  if (!room || !room.roundActive || !room.answer) return;

  const word = typeof raw === 'string' ? raw : (raw as { word?: string })?.word;
  if (typeof word !== 'string' || word.length !== room.answer.length) {
    return;
  }

  const now = Date.now();

  const evaluation = evaluateGuess(word, room.answer);
  const correct = isCorrect(evaluation);

  for (const player of room.players) {
    const payload: GameGuessPayload = {
      playerId: socket.id,
      fromSelf: player.socketId === socket.id,
      guess: word.toLowerCase(),
      evaluation,
      isCorrect: correct,
      timestamp: now,
    };
    io.to(player.socketId).emit(SocketEvents.GameGuess, payload);
  }

  if (correct) {
    finishRound(room, socket.id);
  }
}

function handleCardPlayed(socket: Socket, raw: unknown) {
  const room = getRoomForSocket(socket.id);
  if (!room) return;

  const payloadIn = (raw ?? {}) as { cardId?: unknown; target?: unknown };
  const cardId = typeof payloadIn.cardId === 'string' ? payloadIn.cardId : null;
  const target = payloadIn.target === 'self' ? 'self' : 'opponent';
  if (!cardId) return;

  const now = Date.now();
  for (const player of room.players) {
    const payload: GameCardPlayedPayload = {
      playerId: socket.id,
      fromSelf: player.socketId === socket.id,
      cardId,
      target,
      timestamp: now,
    };
    io.to(player.socketId).emit(SocketEvents.GameCardPlayed, payload);
  }
}

io.on('connection', (socket) => {
  console.log('[socket] connected', socket.id);

  socket.on(SocketEvents.RoomCreate, () => {
    const room = createRoom(socket.id);
    socket.join(room.id);
    const payload: RoomCreatedPayload = { roomId: room.id };
    socket.emit(SocketEvents.RoomCreated, payload);
    console.log('[socket] room:create', room.id, 'by', socket.id);
  });

  socket.on(SocketEvents.RoomJoin, (payload: { roomId?: string }) => {
    const { room, status } = joinRoom(payload?.roomId ?? '', socket.id);
    if (status === 'joined' && room) {
      socket.join(room.id);
      for (const player of room.players) {
        const joinedPayload: RoomJoinedPayload = {
          roomId: room.id,
          isHost: player.isHost,
          playerCount: room.players.length,
        };
        io.to(player.socketId).emit(SocketEvents.RoomJoined, joinedPayload);
      }
      console.log('[socket] room:join', room.id, 'by', socket.id);

      // Both players present — kick off the first round.
      if (room.players.length === 2 && !room.roundActive && !room.matchEnded) {
        startRound(room);
      }
    } else if (status === 'full') {
      socket.emit(SocketEvents.RoomFull, { roomId: payload?.roomId });
    } else {
      socket.emit(SocketEvents.RoomNotFound, { roomId: payload?.roomId });
    }
  });

  socket.on(SocketEvents.GameGuess, (payload) => handleGuess(socket, payload));
  socket.on(SocketEvents.GameCardPlayed, (payload) => handleCardPlayed(socket, payload));

  // TODO (Dev B): scope to opponent socket only; validate room + match state.
  socket.on(SocketEvents.GameChessBlunderInfoLeak, (payload: { roomId?: string }) => {
    const roomId = payload?.roomId;
    if (roomId) {
      socket.to(roomId).emit(SocketEvents.GameChessBlunderInfoLeak, payload);
    }
  });

  socket.on('disconnect', () => {
    console.log('[socket] disconnected', socket.id);
    const { room, wasInRoom } = removeSocket(socket.id);
    if (!wasInRoom || !room) return;

    if (room.players.length === 0) {
      destroyRoom(room.id);
      return;
    }

    if (room.roundEndTimerHandle) {
      clearTimeout(room.roundEndTimerHandle);
      room.roundEndTimerHandle = null;
    }
    room.roundActive = false;

    const payload: OpponentLeftPayload = { reason: 'disconnect' };
    for (const remaining of room.players) {
      io.to(remaining.socketId).emit(SocketEvents.OpponentLeft, payload);
    }
    // Keep the room around briefly in case the user reconnects? For now we
    // tear it down — reconnection handling is a later phase.
    destroyRoom(room.id);
  });
});

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
