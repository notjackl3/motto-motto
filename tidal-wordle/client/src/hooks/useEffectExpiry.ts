import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

/** Clears expired overlays and active effects (replaces global setInterval). */
export function useEffectExpiry(): void {
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const state = useGameStore.getState();
      const hadRecipeSpam = state.overlays.some((o) => o.type === 'recipe-spam');
      const overlays = state.overlays.filter(
        (o) => !o.expiresAt || o.expiresAt > now
      );
      const activeEffects = state.activeEffects.filter(
        (e) => !e.expiresAt || e.expiresAt > now
      );
      const updates: Partial<typeof state> = {};
      if (overlays.length !== state.overlays.length) {
        updates.overlays = overlays;
        if (
          hadRecipeSpam &&
          !overlays.some((o) => o.type === 'recipe-spam') &&
          state.halfGuessMask
        ) {
          updates.halfGuessMask = null;
        }
      }
      if (activeEffects.length !== state.activeEffects.length) {
        updates.activeEffects = activeEffects;
        if (
          state.faceSwap &&
          !activeEffects.some((e) => e.cardId === 'face-swap-glitch')
        ) {
          updates.faceSwap = false;
          updates.faceSwapImageUrl = null;
        }
      }
      if (
        state.forcedBreakLabel &&
        !state.forcedBreakPending &&
        !state.myGuesses.some(
          (g) => g.colorsRevealAt && g.colorsRevealAt > now
        )
      ) {
        updates.forcedBreakLabel = null;
        updates.forcedBreakIconUrl = null;
        updates.forcedBreakIconFallbackUrl = null;
      }
      if (Object.keys(updates).length > 0) {
        useGameStore.setState(updates);
      }
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, []);
}
