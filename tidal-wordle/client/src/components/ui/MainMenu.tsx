import { useState } from 'react';
import WaveScene from '../scene/WaveScene';
import { useGameStore } from '../../stores/gameStore';

interface MainMenuProps {
  onSolo: () => void;
  onMultiplayer: () => void;
}

export default function MainMenu({ onSolo, onMultiplayer }: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const musicMuted = useGameStore((s) => s.musicMuted);
  const setMusicMuted = useGameStore((s) => s.setMusicMuted);

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <WaveScene />

      {/* Soft vignette so foreground text always reads. */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep/40 via-transparent to-deep/70 pointer-events-none" />

      <div className="relative h-full w-full flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-sand">
            Tidal Wordle
          </h1>
          <p className="mt-2 italic text-seafoam/90 text-lg">
            Beach-themed competitive Wordle, riding the waves.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-72 backdrop-blur-md bg-deep/40 rounded-xl p-4 border border-white/15 shadow-2xl">
          <button
            onClick={onSolo}
            className="bg-seafoam text-deep font-bold py-3 rounded-lg hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
          >
            Play Solo
          </button>
          <button
            onClick={onMultiplayer}
            className="bg-sand text-deep font-bold py-3 rounded-lg hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
          >
            Multiplayer
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition"
          >
            Settings
          </button>
          {showSettings && (
            <div className="mt-2 border-t border-white/15 pt-3 flex flex-col gap-2 text-sm">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span>Background music</span>
                <input
                  type="checkbox"
                  checked={!musicMuted}
                  onChange={(e) => setMusicMuted(!e.target.checked)}
                  className="h-4 w-4 accent-seafoam"
                />
              </label>
            </div>
          )}
        </div>

        <div className="text-xs opacity-50 absolute bottom-3">
          Tide data: NOAA CO-OPS · La Jolla #9410230
        </div>
      </div>
    </div>
  );
}
