import { useGameStore } from '../../stores/gameStore';

export default function ScorePanel() {
  const round = useGameStore((s) => s.roundScore);
  const match = useGameStore((s) => s.matchScore);
  const roundsWon = useGameStore((s) => s.roundsWon);
  const roundsToWin = useGameStore((s) => s.roundsToWin);

  return (
    <div className="bg-black/40 rounded-lg p-3 flex flex-col gap-1">
      <div className="text-xs uppercase opacity-70">Score</div>
      <div className="flex justify-between text-sm">
        <span>Round</span>
        <span>{round.me}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Match</span>
        <span>{match.me}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Rounds won</span>
        <span>
          {roundsWon.me} - {roundsWon.opponent} (first to {roundsToWin})
        </span>
      </div>
    </div>
  );
}
