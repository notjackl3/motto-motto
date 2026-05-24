/**
 * Chess Gambit blunder penalties (by mode).
 *
 * Solo: Wordle tax — next guess row shows only half the tiles (see Guess.halfMaskSide).
 * Multiplayer: information leak — opponent learns one unrevealed answer letter (Dev B sync).
 */

import { SocketEvents } from '../../../shared/events';
import type { GameMode, HalfGuessSide } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';

/** Payload broadcast when a player blunders on Chess Gambit (CC0 puzzles; leak is gameplay). */
export interface ChessInfoLeakPayload {
  roomId: string;
  /** Socket id of the player who blundered. */
  fromPlayerId: string;
  /** 0-based index into the round answer. */
  position: number;
  letter: string;
}

export type ChessBlunderPenaltyKind = 'solo-wordle-tax' | 'multiplayer-info-leak';

export interface ChessBlunderPenaltyResult {
  kind: ChessBlunderPenaltyKind;
  /** Set when kind is solo-wordle-tax. */
  halfMaskSide?: HalfGuessSide;
  /** Built when kind is multiplayer-info-leak (for Dev B logging / tests). */
  leakPayload?: ChessInfoLeakPayload;
}

export function pickRandomHalfMaskSide(): HalfGuessSide {
  return Math.random() < 0.5 ? 'left' : 'right';
}

/**
 * Pick one answer position the opponent has not already been given via revealedLetters.
 */
export function pickChessInfoLeakReveal(
  answer: string,
  revealedLetters: Record<number, string>
): { position: number; letter: string } | null {
  const revealed = new Set(Object.keys(revealedLetters).map(Number));
  const unrevealed: number[] = [];
  for (let i = 0; i < answer.length; i += 1) {
    if (!revealed.has(i)) unrevealed.push(i);
  }
  if (unrevealed.length === 0) return null;
  const position = unrevealed[Math.floor(Math.random() * unrevealed.length)]!;
  return { position, letter: answer[position]! };
}

export function buildChessInfoLeakPayload(
  roomId: string,
  fromPlayerId: string,
  answer: string,
  revealedLetters: Record<number, string>
): ChessInfoLeakPayload | null {
  const reveal = pickChessInfoLeakReveal(answer, revealedLetters);
  if (!reveal) return null;
  return {
    roomId,
    fromPlayerId,
    position: reveal.position,
    letter: reveal.letter,
  };
}

/**
 * Local player receives opponent's chess blunder — grant one revealed answer letter.
 * Dev B: call from socket handler when `GameChessBlunderInfoLeak` arrives.
 */
export function applyOpponentChessInfoLeak(payload: ChessInfoLeakPayload): void {
  const state = useGameStore.getState();
  if (!state.answer) return;
  if (payload.position < 0 || payload.position >= state.answer.length) return;

  useGameStore.getState().revealAnswerLength();
  useGameStore.setState({
    revealedLetters: {
      ...state.revealedLetters,
      [payload.position]: payload.letter,
    },
  });
}

/**
 * Emit chess info leak to the room. Dev B: ensure server forwards to opponent only.
 */
export function emitChessBlunderInfoLeak(payload: ChessInfoLeakPayload): void {
  const socket = useMultiplayerStore.getState().socket;
  if (!socket) {
    console.warn('[chessBlunder] emitChessBlunderInfoLeak: no socket');
    return;
  }
  socket.emit(SocketEvents.GameChessBlunderInfoLeak, payload);
}

/**
 * Register incoming chess info leak. Dev B: invoke from `useSocket` (or equivalent).
 */
export function registerChessBlunderInfoLeakListener(
  socket: import('socket.io-client').Socket
): () => void {
  const handler = (payload: ChessInfoLeakPayload) => {
    const roomId = useMultiplayerStore.getState().roomCode;
    if (!roomId || payload.roomId !== roomId) return;
    const mySocketId = socket.id;
    if (payload.fromPlayerId === mySocketId) return;
    applyOpponentChessInfoLeak(payload);
  };
  socket.on(SocketEvents.GameChessBlunderInfoLeak, handler);
  return () => {
    socket.off(SocketEvents.GameChessBlunderInfoLeak, handler);
  };
}

function applySoloWordleTax(): HalfGuessSide {
  const side = pickRandomHalfMaskSide();
  useGameStore.setState({ chessWordleTaxPending: side });
  return side;
}

function applyMultiplayerInfoLeak(): ChessInfoLeakPayload | undefined {
  const state = useGameStore.getState();
  const roomId = useMultiplayerStore.getState().roomCode;
  const socket = useMultiplayerStore.getState().socket;
  if (!state.answer || !roomId || !socket?.id) {
    console.warn('[chessBlunder] multiplayer leak skipped: missing answer or room');
    return undefined;
  }

  const payload = buildChessInfoLeakPayload(
    roomId,
    socket.id,
    state.answer,
    state.revealedLetters
  );
  if (!payload) return undefined;

  emitChessBlunderInfoLeak(payload);
  return payload;
}

/**
 * Apply the mode-appropriate Chess Gambit blunder penalty after a wrong MCQ pick.
 */
export function applyChessBlunderPenalty(
  mode: GameMode | null
): ChessBlunderPenaltyResult {
  if (mode === 'multiplayer') {
    const leakPayload = applyMultiplayerInfoLeak();
    return { kind: 'multiplayer-info-leak', leakPayload };
  }

  const halfMaskSide = applySoloWordleTax();
  return { kind: 'solo-wordle-tax', halfMaskSide };
}

export function soloWordleTaxHint(side: HalfGuessSide): string {
  return `Next guess: only the ${side} half of each tile shows on your board.`;
}

export function multiplayerInfoLeakHint(): string {
  return 'Your opponent receives one revealed letter in their Intel panel.';
}
