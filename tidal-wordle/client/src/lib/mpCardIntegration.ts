/**
 * Multiplayer card integration entry point for Dev B docs / external imports.
 */
export type { GameCardPlayedPayload } from '../types';
export { emitMpCardPlay, registerMpCardPlay, unregisterMpCardPlay } from './mpCardEmit';
export {
  applyCardFromSocket,
  applyEffect,
  clearMemeCannonForTarget,
  drawCard,
  getCardTarget,
  CARD_IDS,
} from './cardEffects';
