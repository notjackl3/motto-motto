import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

const ROWS = 6;

const CELL_STYLES = {
  correct: 'bg-emerald-500/80 border-emerald-300 text-white',
  present: 'bg-yellow-500/80 border-yellow-300 text-white',
  absent: 'bg-white/10 border-white/20 text-white/70',
  empty: 'bg-white/5 border-white/15 text-white/40',
} as const;

function OpponentCooldown() {
  const endsAt = useGameStore((s) => s.opponentCooldownEndsAt);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const pct = remaining > 0 ? Math.min(1, remaining / 3000) : 0;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] uppercase tracking-widest opacity-60">
        <span>Opponent cooldown</span>
        <span>{remaining > 0 ? `${Math.ceil(remaining / 1000)}s` : 'Ready'}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded overflow-hidden mt-1">
        <div
          className="h-full bg-sand transition-[width] duration-200"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function OpponentBoard() {
  const guesses = useGameStore((s) => s.opponentGuesses);
  const answerLength = useGameStore((s) => s.answerLength) ?? 5;

  return (
    <div className="backdrop-blur-sm bg-black/40 rounded-lg p-3 border border-white/10 shadow-lg">
      <div className="text-xs uppercase tracking-widest opacity-70 mb-2">Opponent</div>
      <div className="grid gap-1">
        {Array.from({ length: ROWS }).map((_, r) => (
          <div key={r} className="flex gap-1 justify-center">
            {Array.from({ length: answerLength }).map((_, c) => {
              const result = guesses[r]?.results[c];
              const state = result?.state ?? 'empty';
              const letter = result?.letter ?? '';
              return (
                <div
                  key={c}
                  className={`w-6 h-6 border text-[10px] font-bold uppercase flex items-center justify-center rounded-sm ${CELL_STYLES[state]}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <OpponentCooldown />
    </div>
  );
}
