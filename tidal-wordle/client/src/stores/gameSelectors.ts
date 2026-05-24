import type { GameMode } from '../types';

export interface InputDisabledSlice {
  inputLocked: boolean;
  chessPuzzleActive: boolean;
  roundOver: boolean;
  matchWinner: 'me' | 'opponent' | null;
  distractionBlocking?: boolean;
  cardDetailPopupDraw?: boolean;
  playfulInsultActive?: boolean;
}

export function selectIsInputDisabled(state: InputDisabledSlice): boolean {
  if (state.distractionBlocking || state.cardDetailPopupDraw || state.playfulInsultActive) {
    return true;
  }
  if (state.inputLocked || state.chessPuzzleActive) return true;
  if (state.roundOver || state.matchWinner !== null) return true;
  return false;
}

export function selectSoloRoundLossLabel(mode: GameMode | null): string {
  return mode === 'solo' ? 'Rounds lost' : 'Opponent wins';
}
