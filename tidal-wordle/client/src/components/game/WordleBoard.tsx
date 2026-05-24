import { useGameStore } from '../../stores/gameStore';
import type { LetterState } from '../../types';

const MAX_ROWS = 6;

const STATE_CLASSES: Record<LetterState, string> = {
  correct: 'bg-emerald-600 border-emerald-400 text-white',
  present: 'bg-amber-500 border-amber-300 text-white',
  absent: 'bg-slate-600 border-slate-500 text-white/80',
  empty: 'border-white/30 text-white',
};

function isTileCovered(
  row: number,
  col: number,
  effects: ReturnType<typeof useGameStore.getState>['activeEffects']
): boolean {
  return effects.some(
    (e) =>
      e.cardId === 'status-dog' &&
      e.payload &&
      (e.payload as { row: number; col: number }).row === row &&
      (e.payload as { row: number; col: number }).col === col
  );
}

export default function WordleBoard() {
  const guesses = useGameStore((s) => s.myGuesses);
  const answerLength = useGameStore((s) => s.answerLength);
  const glitchActive = useGameStore((s) => s.glitchActive);
  const activeEffects = useGameStore((s) => s.activeEffects);
  const revealedLetters = useGameStore((s) => s.revealedLetters);

  const firstGuessLen = guesses[0]?.word.length ?? 5;
  const cols = answerLength ?? firstGuessLen;
  const isGlitching = glitchActive === 'self';

  return (
    <div
      className={`bg-black/40 rounded-lg p-3 relative ${isGlitching ? 'glitch-board' : ''}`}
      data-testid="wordle-board"
    >
      <div className="grid gap-1">
        {Array.from({ length: MAX_ROWS }).map((_, r) => (
          <div key={r} className="flex gap-1 justify-center">
            {Array.from({ length: cols }).map((_, c) => {
              const result = guesses[r]?.results[c];
              const letter = result?.letter ?? '';
              const state: LetterState = result?.state ?? 'empty';
              const covered = isTileCovered(r, c, activeEffects);

              return (
                <div
                  key={c}
                  className={`w-10 h-10 border-2 flex items-center justify-center font-bold uppercase text-sm transition-colors ${STATE_CLASSES[state]} ${covered ? 'status-dog-tile' : ''}`}
                >
                  {covered ? '🐕' : letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {Object.keys(revealedLetters).length > 0 && (
        <div className="mt-2 text-xs opacity-70">
          Revealed:{' '}
          {Object.entries(revealedLetters)
            .map(([pos, l]) => `${Number(pos) + 1}=${l}`)
            .join(', ')}
        </div>
      )}
    </div>
  );
}
