import { CARD_DEFINITIONS } from '../components/cards/CardDefinitions';
import type { Card } from '../types';
import { getDevFilteredCardPool } from '../stores/devCardFilterStore';

/** Card pool for random draws — filtered in Vite dev builds only. */
export function getCardDrawPool(): Card[] {
  if (!import.meta.env.DEV) {
    return [...CARD_DEFINITIONS];
  }

  const filtered = getDevFilteredCardPool();
  if (filtered.length === 0) {
    console.warn(
      '[dev] Card filter emptied the draw pool; falling back to all cards.'
    );
    return [...CARD_DEFINITIONS];
  }
  return filtered;
}
