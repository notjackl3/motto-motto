import { getWordBankSize } from '../../lib/wordList';
import { useGameStore } from '../../stores/gameStore';

const BANK_SIZE = getWordBankSize();

interface WordLexiconButtonProps {
  onClick: () => void;
}

/** Main-screen control to open the beach lexicon overlay (solo). */
export default function WordLexiconButton({ onClick }: WordLexiconButtonProps) {
  const cleared = useGameStore((s) => s.soloCompletedWords.length);
  const pct =
    BANK_SIZE > 0 ? Math.round((cleared / BANK_SIZE) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto font-mono text-[10px] tracking-[0.16em] uppercase text-white/70 hover:text-seafoam transition-colors px-2.5 py-1.5 border border-white/10 hover:border-seafoam/50 rounded backdrop-blur-sm bg-black/40 flex items-center gap-2"
      aria-label={`Beach lexicon, ${cleared} of ${BANK_SIZE} words cleared`}
    >
      <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono leading-none">
        L
      </kbd>
      <span>Lexicon</span>
      <span className="tabular-nums text-seafoam/90 border-l border-white/15 pl-2">
        {cleared}/{BANK_SIZE}
      </span>
      <span className="text-[9px] text-white/40 tabular-nums">{pct}%</span>
    </button>
  );
}
