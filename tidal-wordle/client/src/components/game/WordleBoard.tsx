import { useGameStore } from '../../stores/gameStore';

const ROWS = 6;
const COLS = 5;

export default function WordleBoard() {
  const guesses = useGameStore((s) => s.myGuesses);

  return (
    <div className="bg-black/40 rounded-lg p-3">
      <div className="text-xs uppercase opacity-70 mb-2">WordleBoard</div>
      {/* TODO: render guesses with colored letter states */}
      <div className="grid gap-1" style={{ gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}>
        {Array.from({ length: ROWS }).map((_, r) => (
          <div key={r} className="flex gap-1 justify-center">
            {Array.from({ length: COLS }).map((_, c) => {
              const letter = guesses[r]?.results[c]?.letter ?? '';
              return (
                <div
                  key={c}
                  className="w-10 h-10 border-2 border-white/30 flex items-center justify-center font-bold uppercase"
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
