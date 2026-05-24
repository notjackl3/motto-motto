import type { EffectTarget } from '../types';

type MpCardPlayFn = (cardId: string, target: EffectTarget) => void;

let mpCardPlayFn: MpCardPlayFn | null = null;

/** Register the socket emit handler (called when the socket connects). */
export function registerMpCardPlay(fn: MpCardPlayFn): void {
  mpCardPlayFn = fn;
}

export function unregisterMpCardPlay(): void {
  mpCardPlayFn = null;
}

/** Returns false when no socket bridge is registered yet. */
export function emitMpCardPlay(cardId: string, target: EffectTarget): boolean {
  if (!mpCardPlayFn) return false;
  mpCardPlayFn(cardId, target);
  return true;
}
