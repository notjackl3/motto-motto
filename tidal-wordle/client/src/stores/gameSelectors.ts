import type { GameMode } from '../types';
import type { Role } from '../../../shared/events';

export interface InputDisabledSlice {
  inputLocked: boolean;
  chessPuzzleActive: boolean;
  roundOver: boolean;
  matchWinner: 'me' | 'opponent' | null;
  distractionBlocking?: boolean;
  cardDetailPopupDraw?: boolean;
  playfulInsultActive?: boolean;
  /** Sequential MP: false when it is the opponent's turn. */
  isMyTurn?: boolean;
}

export function selectIsInputDisabled(state: InputDisabledSlice): boolean {
  if (state.isMyTurn === false) return true;
  if (state.distractionBlocking || state.cardDetailPopupDraw || state.playfulInsultActive) {
    return true;
  }
  if (state.inputLocked || state.chessPuzzleActive) return true;
  if (state.roundOver || state.matchWinner !== null) return true;
  return false;
}

export function selectSoloRoundLossLabel(mode: GameMode | null): string {
  return mode === 'solo' ? 'Clear a word to unlock' : 'Opponent wins';
}

/** True when the local player may submit a guess in sequential multiplayer. */
export function selectIsMyTurn(
  mode: GameMode | null,
  activeTurn: Role | null,
  myRole: Role | null,
): boolean {
  if (mode !== 'multiplayer') return true;
  if (!myRole || activeTurn === null) return true;
  return activeTurn === myRole;
}
