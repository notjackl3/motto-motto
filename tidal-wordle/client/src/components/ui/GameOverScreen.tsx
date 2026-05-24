interface GameOverScreenProps {
  winner: 'me' | 'opponent' | null;
  onReplay: () => void;
}

export default function GameOverScreen({ winner, onReplay }: GameOverScreenProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-ocean to-deep">
      <h2 className="text-4xl font-bold">Game Over</h2>
      <p className="text-xl opacity-80">
        {winner === 'me' ? 'You win!' : winner === 'opponent' ? 'Opponent wins.' : 'No winner yet.'}
      </p>
      <button
        onClick={onReplay}
        className="bg-seafoam text-deep font-semibold px-6 py-3 rounded hover:bg-white transition"
      >
        Play Again
      </button>
    </div>
  );
}
