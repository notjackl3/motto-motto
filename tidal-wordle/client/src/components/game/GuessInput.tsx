import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { selectIsInputDisabled, selectIsMyTurn } from '../../stores/gameSelectors';
import { getSubmitFeedbackMessage } from '../../lib/submitFeedback';
import { useSocket } from '../../hooks/useSocket';

export default function GuessInput() {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submitGuess = useGameStore((s) => s.submitGuess);
  const multiplayerSubmitGuess = useGameStore((s) => s.multiplayerSubmitGuess);
  const mode = useGameStore((s) => s.mode);
  const activeTurn = useGameStore((s) => s.activeTurn);
  const myRole = useMultiplayerStore((s) => s.role);
  const { sendGuess } = useSocket();
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
  const wordBankExhausted = useGameStore((s) => s.wordBankExhausted);
  const hasAnswer = useGameStore((s) => s.answer);

  const isMyTurn = selectIsMyTurn(mode, activeTurn, myRole);

  const disabled =
    wordBankExhausted ||
    (mode === 'solo' && !hasAnswer) ||
    selectIsInputDisabled({
    inputLocked,
    chessPuzzleActive,
    roundOver,
    matchWinner,
    distractionBlocking,
    cardDetailPopupDraw,
    playfulInsultActive,
    isMyTurn,
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result =
      mode === 'multiplayer'
        ? multiplayerSubmitGuess(value)
        : submitGuess(value);
    if (!result.ok) {
      setFeedback(getSubmitFeedbackMessage(result));
      if (result.reason === 'length') {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      return;
    }
    // In multiplayer the pre-check passed but the actual guess hasn't been
    // recorded yet — emit it to the server, which will broadcast the result.
    if (mode === 'multiplayer') {
      sendGuess(value.toLowerCase());
    }
    setFeedback(null);
    setValue('');
  }

  const placeholder = wordBankExhausted
    ? 'All words cleared — epic complete'
    : mode === 'multiplayer' && !isMyTurn
      ? "Opponent's turn…"
      : knownLength
        ? `Type a ${knownLength}-letter word (or any guess)...`
        : 'Type any word — length unknown';

  const ready = !disabled;

  return (
    <div className="flex flex-col gap-1">
      <form
        onSubmit={handleSubmit}
        className={`relative flex gap-2 rounded-lg p-2 transition-all
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
          className="flex-1 bg-transparent rounded pl-6 pr-3 py-1.5 outline-none text-white placeholder-white/35 disabled:opacity-50 uppercase font-mono tracking-[0.16em] text-[15px] caret-seafoam"
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
