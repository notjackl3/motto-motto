import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useGameStore } from '../stores/gameStore';
import {
  SocketEvents,
  type GameCardPlayedPayload,
  type GameCooldownViolationPayload,
  type GameGuessPayload,
  type GameMatchEndPayload,
  type GameRoundEndPayload,
  type GameStartPayload,
  type OpponentLeftPayload,
  type RoomCreatedPayload,
  type RoomJoinedPayload,
} from '../../../shared/events';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

// ---- Socket lifecycle (single instance, lives in multiplayerStore) ----

function ensureSocket(): Socket {
  const existing = useMultiplayerStore.getState().socket;
  if (existing) return existing;
  const s = io(SERVER_URL, { autoConnect: true });
  useMultiplayerStore.setState({ socket: s, connectionStatus: 'connecting' });
  s.on('connect', () => {
    useMultiplayerStore.setState({ connectionStatus: 'connected' });
    useGameStore.setState({ isConnected: true });
  });
  s.on('disconnect', () => {
    useMultiplayerStore.setState({ connectionStatus: 'disconnected' });
    useGameStore.setState({ isConnected: false });
  });
  return s;
}

export function useSocket() {
  const socket = useMultiplayerStore((s) => s.socket);

  function connect(): Socket {
    return ensureSocket();
  }

  function disconnect() {
    const s = useMultiplayerStore.getState().socket;
    s?.disconnect();
    useMultiplayerStore.getState().reset();
    useGameStore.setState({ isConnected: false });
  }

  function createRoom() {
    const s = ensureSocket();
    s.emit(SocketEvents.RoomCreate);
  }

  function joinRoom(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    const s = ensureSocket();
    s.emit(SocketEvents.RoomJoin, { roomId: code });
  }

  function sendGuess(word: string) {
    const s = useMultiplayerStore.getState().socket;
    s?.emit(SocketEvents.GameGuess, { word: word.toLowerCase() });
  }

  function sendCardPlay(cardId: string, target: 'self' | 'opponent') {
    const s = useMultiplayerStore.getState().socket;
    s?.emit(SocketEvents.GameCardPlayed, { cardId, target });
  }

  return {
    socket,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    sendGuess,
    sendCardPlay,
  };
}

// ---- Bridge: server events → store updates. Install once at the app root. ----

export function useSocketBridge() {
  const socket = useMultiplayerStore((s) => s.socket);

  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (payload: RoomCreatedPayload) => {
      useGameStore.getState().setRoomCode(payload.roomId);
      useMultiplayerStore.setState({ roomId: payload.roomId, isHost: true });
    };

    const onRoomJoined = (payload: RoomJoinedPayload) => {
      useGameStore.getState().setRoomCode(payload.roomId);
      useMultiplayerStore.setState({
        roomId: payload.roomId,
        isHost: payload.isHost,
      });
      // Two players present — caller (Lobby) watches for this via roomCode + multiplayerReady.
      if (payload.playerCount >= 2) {
        useGameStore.setState({ opponentLeft: false });
        useMultiplayerStore.setState({
          opponent: { id: 'opponent', name: 'Opponent', connected: true },
        });
      }
    };

    const onRoomFull = () => {
      console.warn('[socket] room:full');
    };

    const onRoomNotFound = () => {
      console.warn('[socket] room:notFound');
    };

    const onGameStart = (payload: GameStartPayload) => {
      const store = useGameStore.getState();
      store.setMode('multiplayer');
      // Reset for the upcoming round; Dev A owns answer/answerLength but we
      // can hint at length so the board renders the right number of slots.
      store.resetRound();
      useGameStore.setState({
        answerLength: payload.answerLength,
        matchScore: payload.matchScore,
        opponentLeft: false,
        matchEnd: null,
      });
    };

    const onGameGuess = (payload: GameGuessPayload) => {
      // Reconcile self-guess if Dev A's optimistic flow doesn't already add it.
      const wireToLocal = payload.evaluation.map((r) => ({
        letter: r.letter,
        state: r.state as 'correct' | 'present' | 'absent',
      }));
      const guess = {
        word: payload.guess,
        results: wireToLocal,
        submittedAt: payload.timestamp,
      };

      const store = useGameStore.getState();
      if (payload.fromSelf) {
        const already = store.myGuesses.find((g) => g.word === payload.guess);
        if (!already) store.addMyGuess(guess);
        store.setMyCooldownEndsAt(payload.cooldownEndsAt);
      } else {
        store.addOpponentGuess(guess);
        store.setOpponentCooldownEndsAt(payload.cooldownEndsAt);
      }
    };

    const onCooldownViolation = (payload: GameCooldownViolationPayload) => {
      useGameStore.getState().setMyCooldownEndsAt(payload.cooldownEndsAt);
    };

    const onCardPlayed = (payload: GameCardPlayedPayload) => {
      // Surface an event Dev A's card-effect listener can pick up. We avoid
      // calling `applyEffect` directly here because that module is Dev A's
      // and may not exist yet — see seam note in gameStore.
      useGameStore.getState().pushIncomingCardPlay({
        cardId: payload.cardId,
        fromSelf: payload.fromSelf,
        target: payload.target,
        timestamp: payload.timestamp,
      });
    };

    const onRoundEnd = (payload: GameRoundEndPayload) => {
      useGameStore.setState({
        matchScore: payload.matchScore,
        // Show the answer the round resolved on so the UI can reveal it.
        answer: payload.answer,
      });
    };

    const onMatchEnd = (payload: GameMatchEndPayload) => {
      useGameStore.getState().setMatchEnd({
        winner: payload.winner,
        finalRoundScores: [],
        finalMatchScore: payload.matchScore,
      });
    };

    const onOpponentLeft = (_payload: OpponentLeftPayload) => {
      const store = useGameStore.getState();
      store.setOpponentLeft(true);
      store.setMatchEnd({
        winner: 'me',
        finalRoundScores: [],
        finalMatchScore: store.matchScore,
      });
    };

    socket.on(SocketEvents.RoomCreated, onRoomCreated);
    socket.on(SocketEvents.RoomJoined, onRoomJoined);
    socket.on(SocketEvents.RoomFull, onRoomFull);
    socket.on(SocketEvents.RoomNotFound, onRoomNotFound);
    socket.on(SocketEvents.GameStart, onGameStart);
    socket.on(SocketEvents.GameGuess, onGameGuess);
    socket.on(SocketEvents.GameCooldownViolation, onCooldownViolation);
    socket.on(SocketEvents.GameCardPlayed, onCardPlayed);
    socket.on(SocketEvents.GameRoundEnd, onRoundEnd);
    socket.on(SocketEvents.GameMatchEnd, onMatchEnd);
    socket.on(SocketEvents.OpponentLeft, onOpponentLeft);

    return () => {
      socket.off(SocketEvents.RoomCreated, onRoomCreated);
      socket.off(SocketEvents.RoomJoined, onRoomJoined);
      socket.off(SocketEvents.RoomFull, onRoomFull);
      socket.off(SocketEvents.RoomNotFound, onRoomNotFound);
      socket.off(SocketEvents.GameStart, onGameStart);
      socket.off(SocketEvents.GameGuess, onGameGuess);
      socket.off(SocketEvents.GameCooldownViolation, onCooldownViolation);
      socket.off(SocketEvents.GameCardPlayed, onCardPlayed);
      socket.off(SocketEvents.GameRoundEnd, onRoundEnd);
      socket.off(SocketEvents.GameMatchEnd, onMatchEnd);
      socket.off(SocketEvents.OpponentLeft, onOpponentLeft);
    };
  }, [socket]);
}

export function useAutoConnectSocket() {
  const { connect, disconnect } = useSocket();
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
