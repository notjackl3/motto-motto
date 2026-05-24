import { create } from 'zustand';

// Cross-component channel for "the player just got hit by something solid".
// EnvironmentObjects sets `lastImpactAt` to the current r3f clock time when
// an obstacle passes through the player's lane; SurfingMotion subscribes
// (via a frame-time read, not a store subscription) and converts a recent
// impact into a shake spike that decays over ~0.7s.
//
// We keep this separate from the wave-crest "splash" reaction in
// SurfingMotion — waves only tilt the camera; obstacle hits add the
// high-frequency shake.

interface ImpactStoreState {
  lastImpactAt: number; // r3f clock.elapsedTime when the hit happened
  lastImpactStrength: number; // 0..1
  triggerImpact: (clockTime: number, strength: number) => void;
}

export const useImpactStore = create<ImpactStoreState>((set) => ({
  lastImpactAt: -100,
  lastImpactStrength: 0,
  triggerImpact: (clockTime, strength) =>
    set({ lastImpactAt: clockTime, lastImpactStrength: Math.min(1, strength) }),
}));
