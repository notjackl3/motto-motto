import { useGameStore } from '../../stores/gameStore';

export default function ScorePanel() {
  const round = useGameStore((s) => s.roundScore);
  const match = useGameStore((s) => s.matchScore);
  const roundsToWin = useGameStore((s) => s.roundsToWin);

  return (
    <div className="bg-black/40 rounded-lg p-3 flex flex-col gap-1">
      <div className="text-xs uppercase opacity-70">ScorePanel</div>
      <div className="flex justify-between text-sm">
        <span>Round</span>
        <span>{round.me} - {round.opponent}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Match (first to {roundsToWin})</span>
        <span>{match.me} - {match.opponent}</span>
      </div>
    </div>
  );
}
