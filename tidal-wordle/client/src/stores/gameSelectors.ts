import type { GameMode } from '../types';

export interface InputDisabledSlice {
  myCooldownEndsAt: number | null;
  inputLocked: boolean;
  chessPuzzleActive: boolean;
  cooldownFrozen: boolean;
  roundOver: boolean;
  matchWinner: 'me' | 'opponent' | null;
  distractionBlocking?: boolean;
  cardDetailPopupDraw?: boolean;
  playfulInsultActive?: boolean;
}

export function selectIsOnCooldown(
  state: InputDisabledSlice,
  now = Date.now()
): boolean {
  if (state.cooldownFrozen) return false;
  return state.myCooldownEndsAt !== null && now < state.myCooldownEndsAt;
}

export function selectIsInputDisabled(
  state: InputDisabledSlice,
  now = Date.now()
): boolean {
  if (state.distractionBlocking || state.cardDetailPopupDraw || state.playfulInsultActive) {
    return true;
  }
  if (state.inputLocked || state.chessPuzzleActive) return true;
  if (state.roundOver || state.matchWinner !== null) return true;
  return selectIsOnCooldown(state, now);
}

export function selectSoloRoundLossLabel(mode: GameMode | null): string {
  return mode === 'solo' ? 'Rounds lost' : 'Opponent wins';
}
