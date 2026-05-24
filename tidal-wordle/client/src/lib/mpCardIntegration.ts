/**
 * Multiplayer card integration surface for Dev B.
 *
 * When receiving SocketEvents.GameCardPlayed, call:
 *   applyCardFromSocket(payload.cardId, target)
 *
 * Payload shape:
 *   { cardId: string; targetPlayerId: string }
 *
 * Determine target:
 *   - If the card is played ON you (attack from opponent): target = 'self'
 *   - If you played a buff on yourself: target = 'self'
 *   - If you played an attack on opponent: target = 'opponent' (on opponent's client they receive 'self')
 *
 * On the receiving client, always use target='self' for effects that hit you,
 * and the socket handler should map incoming attacks to applyCardFromSocket(cardId, 'self').
 */
export { applyCardFromSocket, applyEffect, drawCard } from './cardEffects';
