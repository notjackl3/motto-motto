import { create } from 'zustand';

// Lightweight bridge between the in-canvas camera and the DOM HUD. We push
// the current camera pitch here at a low frequency (every ~120ms) so the
// DOM overlay can fade the iPad UI based on where the player is looking
// without forcing a re-render every frame.

interface HintToastState {
  text: string;
  tick: number;
}

interface ViewStoreState {
  pitch: number;
  setPitch: (p: number) => void;
  // Monotonic counter bumped each time a mystery-box hint is collected.
  // A DOM overlay watches it and plays a rainbow flash for ~1.2s.
  rainbowFlashTick: number;
  triggerRainbowFlash: () => void;
  // Hint toast: text shown on a transient overlay when a mystery box is
  // hit. `tick` is monotonic so the overlay can re-trigger animation even
  // if the same text repeats.
  hintToast: HintToastState | null;
  pushHintToast: (text: string) => void;
}

export const useViewStore = create<ViewStoreState>((set, get) => ({
  pitch: 0,
  setPitch: (p) => set({ pitch: p }),
  rainbowFlashTick: 0,
  triggerRainbowFlash: () =>
    set({ rainbowFlashTick: get().rainbowFlashTick + 1 }),
  hintToast: null,
  pushHintToast: (text) => {
    const prev = get().hintToast;
    set({ hintToast: { text, tick: (prev?.tick ?? 0) + 1 } });
  },
}));
