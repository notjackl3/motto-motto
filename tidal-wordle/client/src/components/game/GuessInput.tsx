import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { selectIsInputDisabled } from '../../stores/gameSelectors';
import { getSubmitFeedbackMessage } from '../../lib/submitFeedback';
export default function GuessInput() {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const submitGuess = useGameStore((s) => s.submitGuess);
  const knownLength = useGameStore((s) => s.answerLength);
  const myCooldownEndsAt = useGameStore((s) => s.myCooldownEndsAt);
  const inputLocked = useGameStore((s) => s.inputLocked);
  const roundOver = useGameStore((s) => s.roundOver);
  const matchWinner = useGameStore((s) => s.matchWinner);
  const chessPuzzleActive = useGameStore((s) => s.chessPuzzleActive);
  const cooldownFrozen = useGameStore((s) => s.cooldownFrozen);
  const distractionBlocking = useGameStore((s) => s.distractionBlocking);
  const cardDetailPopupDraw = useGameStore(
    (s) => s.cardDetailPopup?.source === 'draw'
  );
  const playfulInsultActive = useGameStore((s) =>
    s.overlays.some((o) => o.type === 'playful-insult')
  );
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const disabled = selectIsInputDisabled(
    {
      myCooldownEndsAt,
      inputLocked,
      chessPuzzleActive,
      cooldownFrozen,
      roundOver,
      matchWinner,
      distractionBlocking,
      cardDetailPopupDraw,
      playfulInsultActive,
    },
    now
  );
  const onCooldown =
    myCooldownEndsAt !== null && now < myCooldownEndsAt && !cooldownFrozen;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = submitGuess(value);
    if (!result.ok) {
      setFeedback(getSubmitFeedbackMessage(result, onCooldown));
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
    : 'Type any word — length unknown';

  return (
    <div className="flex flex-col gap-1 min-h-[4.5rem]">
      <form
        onSubmit={handleSubmit}
        className={`flex gap-2 bg-black/40 rounded-lg p-3 ${shake ? 'animate-shake' : ''}`}
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFeedback(null);
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={feedback ? 'guess-feedback' : undefined}
          className="flex-1 bg-white/10 rounded px-3 py-2 outline-none text-white placeholder-white/40 disabled:opacity-50 uppercase"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="bg-seafoam text-deep font-semibold px-4 py-2 rounded hover:bg-white transition disabled:opacity-50"
        >
          Guess
        </button>
      </form>
      {feedback && (
        <p id="guess-feedback" className="text-xs text-amber-300 px-1" role="alert">
          {feedback}
        </p>
      )}
    </div>
  );
}
