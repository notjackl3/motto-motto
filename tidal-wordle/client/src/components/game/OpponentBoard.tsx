import { useGameStore } from '../../stores/gameStore';
import type { LetterState } from '../../types';

const STATE_CLASSES: Record<LetterState, string> = {
  correct: 'bg-emerald-700/80',
  present: 'bg-amber-600/80',
  absent: 'bg-slate-700/80',
  empty: 'bg-white/5',
};

/** Read-only obscured view — Dev B writes opponentGuesses via socket. */
export default function OpponentBoard() {
  const guesses = useGameStore((s) => s.opponentGuesses);

  return (
    <div className="bg-black/30 rounded-lg p-3 h-full overflow-auto">
      <div className="text-xs uppercase opacity-70 mb-2">Opponent</div>
      {guesses.length === 0 ? (
        <p className="text-sm opacity-60">No guesses yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {guesses.map((g, row) => (
            <div key={row} className="flex gap-1 justify-center">
              {g.results.map((r, col) => (
                <div
                  key={col}
                  className={`w-8 h-8 shrink-0 rounded border border-white/20 ${STATE_CLASSES[r.state]}`}
                  title={r.state}
                  aria-label={`${r.state} tile`}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] opacity-50 mt-2">Colors only — letters hidden</p>
    </div>
  );
}
