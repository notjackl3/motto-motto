import { useGameStore } from '../../stores/gameStore';

export default function OpponentBoard() {
  const guesses = useGameStore((s) => s.opponentGuesses);

  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="text-xs uppercase opacity-70 mb-2">OpponentBoard (read-only)</div>
      {/* TODO: render obscured opponent guesses */}
      <div className="text-sm opacity-60">
        {guesses.length === 0 ? 'Opponent has not guessed yet.' : `${guesses.length} guesses`}
      </div>
    </div>
  );
}
