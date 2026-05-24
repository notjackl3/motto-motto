/**
 * TEMPORARY — dev-only card draw filters. Remove with DevCardFilterPanel.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CARD_DEFINITIONS } from '../components/cards/CardDefinitions';
import type { Card, CardType } from '../types';

const ALL_TYPES: CardType[] = ['attack', 'buff', 'wildcard'];
const STORAGE_KEY = 'tidal-dev-card-filter';

function defaultTypes(): Record<CardType, boolean> {
  return { attack: true, buff: true, wildcard: true };
}

function defaultCardEnabled(): Record<string, boolean> {
  return Object.fromEntries(CARD_DEFINITIONS.map((c) => [c.id, true]));
}

export interface DevCardFilterState {
  types: Record<CardType, boolean>;
  cards: Record<string, boolean>;
  toggleType: (type: CardType) => void;
  setType: (type: CardType, enabled: boolean) => void;
  toggleCard: (id: string) => void;
  reset: () => void;
}

export const useDevCardFilterStore = create<DevCardFilterState>()(
  persist(
    (set) => ({
      types: defaultTypes(),
      cards: defaultCardEnabled(),
      toggleType: (type) =>
        set((s) => ({
          types: { ...s.types, [type]: !s.types[type] },
        })),
      setType: (type, enabled) =>
        set((s) => ({
          types: { ...s.types, [type]: enabled },
        })),
      toggleCard: (id) =>
        set((s) => ({
          cards: { ...s.cards, [id]: !s.cards[id] },
        })),
      reset: () =>
        set({
          types: defaultTypes(),
          cards: defaultCardEnabled(),
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ types: state.types, cards: state.cards }),
      merge: (persisted, current) => {
        const saved = persisted as
          | Pick<DevCardFilterState, 'types' | 'cards'>
          | undefined;
        return {
          ...current,
          types: { ...defaultTypes(), ...saved?.types },
          cards: { ...defaultCardEnabled(), ...saved?.cards },
        };
      },
    }
  )
);

export function getDevFilteredCardPool(): Card[] {
  const { types, cards } = useDevCardFilterStore.getState();
  return CARD_DEFINITIONS.filter(
    (c) => types[c.type] && (cards[c.id] ?? true)
  );
}

export function devCardPoolSummary(): {
  poolSize: number;
  byType: Record<CardType, number>;
} {
  const pool = getDevFilteredCardPool();
  const byType: Record<CardType, number> = {
    attack: 0,
    buff: 0,
    wildcard: 0,
  };
  for (const c of pool) byType[c.type]++;
  return { poolSize: pool.length, byType };
}

export { ALL_TYPES };
