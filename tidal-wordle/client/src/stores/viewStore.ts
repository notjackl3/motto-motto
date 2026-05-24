import { create } from 'zustand';

// Lightweight bridge between the in-canvas camera and the DOM HUD. We push
// the current camera pitch here at a low frequency (every ~120ms) so the
// DOM overlay can fade the iPad UI based on where the player is looking
// without forcing a re-render every frame.

interface ViewStoreState {
  pitch: number;
  setPitch: (p: number) => void;
}

export const useViewStore = create<ViewStoreState>((set) => ({
  pitch: 0,
  setPitch: (p) => set({ pitch: p }),
}));
