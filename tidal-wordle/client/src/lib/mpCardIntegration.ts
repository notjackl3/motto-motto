/**
 * Multiplayer card integration for Dev B.
 *
 * On SocketEvents.GameCardPlayed:
 *   import { applyCardFromSocket } from './mpCardIntegration';
 *   // Incoming attack on local player:
 *   applyCardFromSocket(payload.cardId, 'self');
 *
 * When local player plays a card at opponent:
 *   applyCardFromSocket(payload.cardId, 'opponent');
 *
 * When opponent submits a guess (clears meme on their board view):
 *   clearMemeCannonForTarget('opponent');
 */
export type { GameCardPlayedPayload } from '../types';
export {
  applyCardFromSocket,
  applyEffect,
  clearMemeCannonForTarget,
  drawCard,
  getCardTarget,
  CARD_IDS,
} from './cardEffects';
