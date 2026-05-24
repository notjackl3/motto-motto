import { create } from 'zustand';

// Shared player movement state driven by PlayerControls (WASD). Read via
// `getState()` inside useFrame callbacks so consumers don't subscribe and
// re-render every frame.
//
// - forwardSpeedMul: multiplier on the constant forward drift. 1.0 baseline,
//   ~1.8 when W is held, ~0.35 when S is held.
// - lateralLean: target camera/body roll in radians from A/D.
// - driftDistance: an accumulator the env objects use to compute their
//   wrapping z. Advanced by PlayerControls each frame using delta * speedMul
//   so changes in speed don't cause object positions to jump.

interface MovementStoreState {
  forwardSpeedMul: number;
  lateralLean: number;
  driftDistance: number;
  setForwardSpeedMul: (v: number) => void;
  setLateralLean: (v: number) => void;
  setDriftDistance: (v: number) => void;
}

export const useMovementStore = create<MovementStoreState>((set) => ({
  forwardSpeedMul: 1,
  lateralLean: 0,
  driftDistance: 0,
  setForwardSpeedMul: (v) => set({ forwardSpeedMul: v }),
  setLateralLean: (v) => set({ lateralLean: v }),
  setDriftDistance: (v) => set({ driftDistance: v }),
}));
