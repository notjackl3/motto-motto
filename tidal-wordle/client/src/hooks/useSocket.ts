import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useGameStore } from '../stores/gameStore';
import {
  Events,
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
  type RoomCreatedPayload,
  type RoomFullPayload,
  type RoomJoinedPayload,
  type RoomNotFoundPayload,
} from '../../../shared/events';
import type { Guess } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

// ---- Socket lifecycle (single instance, lives in multiplayerStore) ----

function ensureSocket(): Socket {
  const existing = useMultiplayerStore.getState().socket;
  if (existing) return existing;
  const s = io(SERVER_URL, { autoConnect: true });
  useMultiplayerStore.getState().setSocket(s);
  useMultiplayerStore.getState().setStatus('connecting');
  s.on('connect', () => useMultiplayerStore.getState().setStatus('connected'));
  s.on('disconnect', () =>
    useMultiplayerStore.getState().setStatus('disconnected'),
  );
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
  }

  function createRoom() {
    const s = ensureSocket();
    s.emit(Events.ROOM_CREATE);
  }

  function joinRoom(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    const s = ensureSocket();
    s.emit(Events.ROOM_JOIN, { roomId: code });
  }

  function sendGuess(word: string) {
    const s = useMultiplayerStore.getState().socket;
    const payload: GameGuessInbound = { guess: word.toLowerCase() };
    s?.emit(Events.GAME_GUESS, payload);
  }

  function sendCardPlay(
    cardId: string,
    target: 'self' | 'opponent' | 'both' = 'opponent',
  ) {
    const s = useMultiplayerStore.getState().socket;
    const payload: GameCardPlayedInbound = { cardId, target };
    s?.emit(Events.GAME_CARD_PLAYED, payload);
  }

  function leaveRoom() {
    disconnect();
    useGameStore.getState().resetMatch();
  }

  return {
    socket,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    sendGuess,
    sendCardPlay,
    leaveRoom,
  };
}

// ---- Bridge: server events → store updates. Install once at the app root. ----

export function useSocketBridge() {
  const socket = useMultiplayerStore((s) => s.socket);

  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (payload: RoomCreatedPayload) => {
      useGameStore.getState().setRoomCode(payload.roomId);
      const mp = useMultiplayerStore.getState();
      mp.setRoom(payload.roomId, 'host');
      mp.setLobbyStatus('waitingForOpponent');
    };

    const onRoomJoined = (payload: RoomJoinedPayload) => {
      const mp = useMultiplayerStore.getState();
      mp.setRoom(payload.roomId, payload.role);
      useGameStore.getState().setRoomCode(payload.roomId);
      if (payload.playerCount >= 2) {
        mp.setOpponent(payload.role === 'host' ? 'guest' : 'host', 'Opponent');
        mp.setOpponentConnected(true);
        mp.setLobbyStatus('inGame');
        useGameStore.getState().setOpponentLeft(false);
      }
    };

    const onRoomFull = (payload: RoomFullPayload) => {
      useMultiplayerStore.getState().setLobbyError({
        type: 'full',
        roomCode: payload.roomId,
      });
    };

    const onRoomNotFound = (payload: RoomNotFoundPayload) => {
      useMultiplayerStore.getState().setLobbyError({
        type: 'notFound',
        roomCode: payload.roomId,
      });
    };

    const onGameStart = (payload: GameStartPayload) => {
      const mp = useMultiplayerStore.getState();
      if (mp.roomCode) mp.setRoom(mp.roomCode, payload.yourRole);
      mp.setOpponent(
        payload.yourRole === 'host' ? 'guest' : 'host',
        payload.opponentName,
      );
      mp.setOpponentConnected(true);
      mp.setLobbyStatus('inGame');
      // Reset round state without picking a local word; server is authoritative.
      useGameStore.getState().applyRemoteNextRound(payload.roundNumber);
      useGameStore.getState().setOpponentLeft(false);
    };

    const onGameGuessResult = (payload: GameGuessResultPayload) => {
      const mp = useMultiplayerStore.getState();
      const myRole = mp.role;
      const isSelf = payload.role === myRole;

      const guess: Guess = {
        word: payload.guess,
        results: payload.evaluation.map((r) => ({
          letter: r.letter,
          state: r.state,
        })),
        submittedAt: payload.timestamp,
      };

      const store = useGameStore.getState();
      store.setAnswerLengthFromServer(payload.answerLength);

      if (isSelf) {
        store.addMyGuess(guess);
        store.setMyCooldownEndsAt(payload.cooldownEndsAt);
        // Hybrid: card draws stay client-side per guess via Dev A's path.
        if (!payload.isCorrect) {
          void import('../lib/cardEffects')
            .then((m) => m.fireCardAfterGuess?.())
            .catch(() => {
              /* card draw optional; failure non-fatal */
            });
        }
      } else {
        store.addOpponentGuess(guess);
        store.setOpponentCooldownEndsAt(payload.cooldownEndsAt);
      }
    };

    const onCooldownViolation = (payload: GameCooldownViolationPayload) => {
      useGameStore.getState().setMyCooldownEndsAt(payload.cooldownEndsAt);
    };

    const onInvalidGuess = (payload: GameInvalidGuessPayload) => {
      if (payload.expectedLength) {
        useGameStore
          .getState()
          .setAnswerLengthFromServer(payload.expectedLength);
      }
    };

    const onCardEffect = (payload: GameCardEffectPayload) => {
      const mp = useMultiplayerStore.getState();
      const myRole = mp.role;
      const targetsMe =
        payload.affectedRole === 'both' || payload.affectedRole === myRole;
      void import('../lib/cardEffects')
        .then((m) =>
          m.applyCardFromSocket(payload.cardId, targetsMe ? 'self' : 'opponent'),
        )
        .catch(() => {
          /* card module optional in scenes where it isn't loaded */
        });
    };

    const onRoundEnd = (payload: GameRoundEndPayload) => {
      const mp = useMultiplayerStore.getState();
      const myRole = mp.role;
      const winnerLocal: 'me' | 'opponent' =
        payload.winner === myRole ? 'me' : 'opponent';
      useGameStore.getState().applyRemoteRoundEnd(winnerLocal, payload.answer);
    };

    const onNextRound = (payload: GameNextRoundPayload) => {
      useGameStore.getState().applyRemoteNextRound(payload.roundNumber);
    };

    const onMatchEnd = (_payload: GameMatchEndPayload) => {
      // applyRemoteRoundEnd already advances roundsWon + matchWinner, which
      // routes to GameOverScreen via App.tsx. Safety-net handler only.
    };

    const onOpponentLeft = (_payload: OpponentLeftPayload) => {
      useGameStore.getState().setOpponentLeft(true);
      useMultiplayerStore.getState().setOpponentConnected(false);
    };

    socket.on(Events.ROOM_CREATED, onRoomCreated);
    socket.on(Events.ROOM_JOINED, onRoomJoined);
    socket.on(Events.ROOM_FULL, onRoomFull);
    socket.on(Events.ROOM_NOT_FOUND, onRoomNotFound);
    socket.on(Events.GAME_START, onGameStart);
    socket.on(Events.GAME_GUESS_RESULT, onGameGuessResult);
    socket.on(Events.GAME_COOLDOWN_VIOLATION, onCooldownViolation);
    socket.on(Events.GAME_INVALID_GUESS, onInvalidGuess);
    socket.on(Events.GAME_CARD_EFFECT, onCardEffect);
    socket.on(Events.GAME_ROUND_END, onRoundEnd);
    socket.on(Events.GAME_NEXT_ROUND, onNextRound);
    socket.on(Events.GAME_MATCH_END, onMatchEnd);
    socket.on(Events.OPPONENT_LEFT, onOpponentLeft);

    return () => {
      socket.off(Events.ROOM_CREATED, onRoomCreated);
      socket.off(Events.ROOM_JOINED, onRoomJoined);
      socket.off(Events.ROOM_FULL, onRoomFull);
      socket.off(Events.ROOM_NOT_FOUND, onRoomNotFound);
      socket.off(Events.GAME_START, onGameStart);
      socket.off(Events.GAME_GUESS_RESULT, onGameGuessResult);
      socket.off(Events.GAME_COOLDOWN_VIOLATION, onCooldownViolation);
      socket.off(Events.GAME_INVALID_GUESS, onInvalidGuess);
      socket.off(Events.GAME_CARD_EFFECT, onCardEffect);
      socket.off(Events.GAME_ROUND_END, onRoundEnd);
      socket.off(Events.GAME_NEXT_ROUND, onNextRound);
      socket.off(Events.GAME_MATCH_END, onMatchEnd);
      socket.off(Events.OPPONENT_LEFT, onOpponentLeft);
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
