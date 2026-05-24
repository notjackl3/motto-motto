import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { SocketEvents } from '../../shared/events.js';
import { createRoom, joinRoom, removeSocket } from './rooms.js';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN },
});

io.on('connection', (socket) => {
  console.log('[socket] connected', socket.id);

  socket.on(SocketEvents.RoomCreate, () => {
    const room = createRoom(socket.id);
    socket.join(room.id);
    socket.emit(SocketEvents.RoomJoined, { roomId: room.id, isHost: true });
    console.log('[socket] room:create', room.id, 'by', socket.id);
  });

  socket.on(SocketEvents.RoomJoin, (payload: { roomId: string }) => {
    const { room, status } = joinRoom(payload?.roomId ?? '', socket.id);
    if (status === 'joined' && room) {
      socket.join(room.id);
      io.to(room.id).emit(SocketEvents.RoomJoined, {
        roomId: room.id,
        playerCount: room.players.length,
      });
      console.log('[socket] room:join', room.id, 'by', socket.id);
    } else if (status === 'full') {
      socket.emit(SocketEvents.RoomFull, { roomId: payload?.roomId });
    } else {
      socket.emit(SocketEvents.RoomFull, { roomId: payload?.roomId, missing: true });
    }
  });

  // Stub handlers — echo / broadcast within room.
  socket.on(SocketEvents.GameStart, (payload) => {
    socket.broadcast.emit(SocketEvents.GameStart, payload);
  });
  socket.on(SocketEvents.GameGuess, (payload) => {
    socket.broadcast.emit(SocketEvents.GameGuess, payload);
  });
  socket.on(SocketEvents.GameCardPlayed, (payload) => {
    socket.broadcast.emit(SocketEvents.GameCardPlayed, payload);
  });
  socket.on(SocketEvents.GameRoundEnd, (payload) => {
    socket.broadcast.emit(SocketEvents.GameRoundEnd, payload);
  });
  socket.on(SocketEvents.GameMatchEnd, (payload) => {
    socket.broadcast.emit(SocketEvents.GameMatchEnd, payload);
  });

  socket.on('disconnect', () => {
    console.log('[socket] disconnected', socket.id);
    removeSocket(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
