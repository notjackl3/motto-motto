import { useGameStore } from '../../stores/gameStore';
import { selectSoloRoundLossLabel } from '../../stores/gameSelectors';

export default function ScorePanel() {
  const mode = useGameStore((s) => s.mode);
  const myGuesses = useGameStore((s) => s.myGuesses);
  const roundOver = useGameStore((s) => s.roundOver);
  const matchWinner = useGameStore((s) => s.matchWinner);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const lossLabel = selectSoloRoundLossLabel(mode);

  const currentRoundNumber = roundHistory.length + 1;

  return (
    <div className="flex flex-col gap-1.5 min-h-0 max-h-full overflow-hidden text-white">
      {!roundOver && matchWinner === null && (
        <div className="rounded-md border border-seafoam/30 bg-seafoam/10 px-2 py-1.5">
          <div className="font-mono text-[8.5px] tracking-[0.22em] uppercase text-seafoam/90 mb-0.5">
            R{String(currentRoundNumber).padStart(2, '0')} · IN PROGRESS
          </div>
          <div className="text-[11px]">
            <div className="flex justify-between">
              <span className="opacity-70">Guesses</span>
              <span className="font-mono">{myGuesses.length}</span>
            </div>
          </div>
          <div className="text-[9px] opacity-50 mt-1 italic">
            Word hidden until round ends
          </div>
        </div>
      )}

      {roundHistory.length > 0 && (
        <div className="flex flex-col min-h-0 flex-1">
          <div className="font-mono text-[8.5px] tracking-[0.22em] uppercase opacity-60 mb-1">
            Logged Rounds
          </div>
          <ul className="space-y-1 overflow-y-auto min-h-0 flex-1 pr-0.5">
            {[...roundHistory].reverse().map((r) => (
              <li
                key={`${r.roundIndex}-${r.answer}`}
                className={`rounded-md bg-white/[0.04] px-2 py-1.5 text-[11px] border-l-2 transition-colors hover:bg-white/[0.06] ${
                  r.winner === 'me'
                    ? 'border-l-seafoam'
                    : 'border-l-coral/80'
                }`}
              >
                <div className="flex justify-between items-baseline gap-1">
                  <span className="font-display font-bold uppercase tracking-wider text-sand text-[12px]">
                    {r.answer}
                  </span>
                  <span className="font-mono text-[9px] opacity-50 shrink-0">
                    R{String(r.roundIndex).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px]">
                  {r.winner === 'me' ? (
                    <span className="text-seafoam font-medium">Cleared</span>
                  ) : mode === 'solo' ? (
                    <span className="text-coral/90">Wiped</span>
                  ) : (
                    <span className="text-coral/90">Opponent</span>
                  )}
                </div>
                <div className="font-mono text-[9px] opacity-50 mt-0.5">
                  {r.myGuessCount} guess{r.myGuessCount === 1 ? '' : 'es'}
                  {r.winningGuess && r.winner === 'me' && (
                    <span> · {r.winningGuess}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {roundHistory.length === 0 && (roundOver || myGuesses.length === 0) && (
        <p className="text-[10px] opacity-50 italic font-mono tracking-wide">
          {mode === 'solo' ? lossLabel : 'Awaiting first round'}…
        </p>
      )}
    </div>
  );
}
