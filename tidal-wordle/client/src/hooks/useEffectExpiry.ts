import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

/** Clears expired overlays and active effects (replaces global setInterval). */
export function useEffectExpiry(): void {
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const state = useGameStore.getState();
      const overlays = state.overlays.filter(
        (o) => !o.expiresAt || o.expiresAt > now
      );
      const activeEffects = state.activeEffects.filter(
        (e) => !e.expiresAt || e.expiresAt > now
      );
      if (
        overlays.length !== state.overlays.length ||
        activeEffects.length !== state.activeEffects.length
      ) {
        useGameStore.setState({ overlays, activeEffects });
      }
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, []);
}
