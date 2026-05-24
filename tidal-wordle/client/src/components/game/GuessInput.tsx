import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { selectIsInputDisabled } from '../../stores/gameSelectors';
import { getSubmitFeedbackMessage } from '../../lib/submitFeedback';

export default function GuessInput() {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submitGuess = useGameStore((s) => s.submitGuess);
  const knownLength = useGameStore((s) => s.answerLength);
  const inputLocked = useGameStore((s) => s.inputLocked);
  const roundOver = useGameStore((s) => s.roundOver);
  const matchWinner = useGameStore((s) => s.matchWinner);
  const chessPuzzleActive = useGameStore((s) => s.chessPuzzleActive);
  const distractionBlocking = useGameStore((s) => s.distractionBlocking);
  const cardDetailPopupDraw = useGameStore(
    (s) => s.cardDetailPopup?.source === 'draw'
  );
  const playfulInsultActive = useGameStore((s) =>
    s.overlays.some((o) => o.type === 'playful-insult')
  );

  const disabled = selectIsInputDisabled({
    inputLocked,
    chessPuzzleActive,
    roundOver,
    matchWinner,
    distractionBlocking,
    cardDetailPopupDraw,
    playfulInsultActive,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = submitGuess(value);
    if (!result.ok) {
      setFeedback(getSubmitFeedbackMessage(result));
      if (result.reason === 'length') {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      return;
    }
    setFeedback(null);
    setValue('');
  }

  const placeholder = knownLength
    ? `Type a ${knownLength}-letter word (or any guess)...`
    : '';

  const ready = !disabled;

  return (
    <div className="flex flex-col gap-1">
      <form
        onSubmit={handleSubmit}
        className={`relative flex gap-1.5 min-w-0 rounded-lg p-1.5 transition-all
          ${shake ? 'animate-shake' : ''}
          ${
            ready
              ? 'bg-gradient-to-r from-seafoam/15 via-seafoam/10 to-brass/15 ring-1 ring-seafoam/40 shadow-[0_0_18px_rgba(154,212,214,0.18)]'
              : 'bg-black/40 ring-1 ring-white/10'
          }
        `}
      >
        <span
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[9px] tracking-[0.22em] uppercase ${
            ready ? 'text-seafoam' : 'text-white/35'
          }`}
        >
          ▸
        </span>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFeedback(null);
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={feedback ? 'guess-feedback' : undefined}
          className="flex-1 min-w-0 bg-transparent rounded pl-6 pr-3 py-1.5 outline-none text-white placeholder-white/35 disabled:opacity-50 uppercase font-mono tracking-[0.12em] text-[14px] caret-seafoam"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="font-display font-bold uppercase tracking-[0.18em] text-[11px] bg-seafoam text-abyss px-4 py-1.5 rounded-md hover:bg-white hover:shadow-[0_0_18px_rgba(154,212,214,0.6)] active:scale-95 transition disabled:opacity-40 disabled:hover:bg-seafoam disabled:hover:shadow-none"
        >
          Send ▸
        </button>
      </form>
      {feedback && (
        <p
          id="guess-feedback"
          className="font-mono text-[10px] tracking-wider text-coral px-1 uppercase"
          role="alert"
        >
          ⚠ {feedback}
        </p>
      )}
    </div>
  );
}
