import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

export default function GuessInput() {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(Date.now());
  const submitGuess = useGameStore((s) => s.submitGuess);
  const myCooldownEndsAt = useGameStore((s) => s.myCooldownEndsAt);
  const inputLocked = useGameStore((s) => s.inputLocked);
  const roundOver = useGameStore((s) => s.roundOver);
  const matchWinner = useGameStore((s) => s.matchWinner);
  const answerLength = useGameStore((s) => s.answerLength);
  const myGuesses = useGameStore((s) => s.myGuesses);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const onCooldown =
    myCooldownEndsAt !== null && now < myCooldownEndsAt;
  const disabled =
    inputLocked || onCooldown || roundOver || matchWinner !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = submitGuess(value);
    if (!result.ok) {
      if (result.reason === 'length') {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      return;
    }
    setValue('');
  }

  const placeholder =
    answerLength === null
      ? 'First guess — any length...'
      : `Guess ${answerLength} letters (${myGuesses.length}/6)...`;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 bg-black/40 rounded-lg p-3 ${shake ? 'animate-shake' : ''}`}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-white/10 rounded px-3 py-2 outline-none text-white placeholder-white/40 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-seafoam text-deep font-semibold px-4 py-2 rounded hover:bg-white transition disabled:opacity-50"
      >
        Guess
      </button>
    </form>
  );
}
