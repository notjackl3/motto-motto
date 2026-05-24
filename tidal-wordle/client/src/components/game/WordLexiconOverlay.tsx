import { useEffect, useMemo } from 'react';
import { getAllWords, getWordBankSize } from '../../lib/wordList';
import { useGameStore } from '../../stores/gameStore';

const BANK_SIZE = getWordBankSize();

interface WordLexiconOverlayProps {
  onClose: () => void;
}

export default function WordLexiconOverlay({ onClose }: WordLexiconOverlayProps) {
  const completed = useGameStore((s) => s.soloCompletedWords);
  const exhausted = useGameStore((s) => s.wordBankExhausted);

  const completedSet = useMemo(
    () => new Set(completed.map((w) => w.toLowerCase())),
    [completed]
  );

  const allWords = useMemo(() => getAllWords(), []);

  const sortedWords = useMemo(() => {
    const byKey = new Map(allWords.map((w) => [w.toLowerCase(), w]));
    const cleared = completed
      .map((w) => byKey.get(w.toLowerCase()))
      .filter((w): w is string => Boolean(w));
    const locked = allWords.filter((w) => !completedSet.has(w.toLowerCase()));
    return { cleared, locked };
  }, [allWords, completed, completedSet]);

  const pct =
    BANK_SIZE > 0 ? Math.round((completed.length / BANK_SIZE) * 100) : 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[26] flex items-center justify-center p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lexicon-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close lexicon"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[min(85vh,640px)] flex flex-col rounded-xl border border-seafoam/30 bg-deep/95 shadow-2xl overflow-hidden">
        <header className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="lexicon-title"
                className="font-mono text-[10px] tracking-[0.28em] uppercase text-seafoam"
              >
                Beach Lexicon
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {completed.length} of {BANK_SIZE} words cleared ({pct}%)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[9px] tracking-wider uppercase text-white/50 hover:text-coral px-2 py-1 rounded border border-white/10 hover:border-coral/50 transition-colors shrink-0"
            >
              Close
            </button>
          </div>

          <div
            className="h-2 rounded-full bg-white/10 overflow-hidden mt-3"
            role="progressbar"
            aria-valuenow={completed.length}
            aria-valuemin={0}
            aria-valuemax={BANK_SIZE}
          >
            <div
              className="h-full bg-gradient-to-r from-seafoam/80 to-seafoam rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {exhausted && (
            <p className="text-[11px] text-amber-200/90 mt-2 font-medium">
              Epic surf complete — every word in the bank is cleared.
            </p>
          )}

          <p className="text-[11px] text-white/45 mt-3">
            Cleared words appear at the top — locked words stay hidden until you
            guess them.
          </p>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {sortedWords.cleared.length > 0 && (
            <section className="mb-4">
              <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-seafoam/70 mb-2">
                Cleared ({sortedWords.cleared.length})
              </h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {sortedWords.cleared.map((word, index) => (
                  <li
                    key={word}
                    title={`Cleared — chapter ${index + 1}`}
                    className="rounded px-2 py-1.5 text-[11px] font-mono uppercase tracking-wide border border-seafoam/40 bg-seafoam/15 text-sand"
                  >
                    <span className="block truncate">{word}</span>
                    <span className="text-[9px] opacity-40 block mt-0.5">
                      Ch. {index + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sortedWords.locked.length > 0 && (
            <section>
              <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/35 mb-2">
                Locked ({sortedWords.locked.length})
              </h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {sortedWords.locked.map((word, index) => (
                  <li
                    key={word}
                    title="Not cleared yet"
                    className="rounded px-2 py-1.5 text-[11px] font-mono uppercase tracking-wide border border-white/10 bg-white/[0.03] text-white/25"
                  >
                    <span
                      className="block truncate blur-[4px] select-none"
                      aria-hidden
                    >
                      ????
                    </span>
                    <span className="text-[9px] opacity-40 block mt-0.5">
                      #{String(index + 1).padStart(3, '0')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
