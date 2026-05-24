import { useGameStore } from '../../stores/gameStore';
import { selectSoloRoundLossLabel } from '../../stores/gameSelectors';

export default function ScorePanel() {
  const mode = useGameStore((s) => s.mode);
  const roundScore = useGameStore((s) => s.roundScore.me);
  const matchScore = useGameStore((s) => s.matchScore.me);
  const roundsWon = useGameStore((s) => s.roundsWon);
  const roundsToWin = useGameStore((s) => s.roundsToWin);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const myGuesses = useGameStore((s) => s.myGuesses);
  const roundOver = useGameStore((s) => s.roundOver);
  const matchWinner = useGameStore((s) => s.matchWinner);
  const lossLabel = selectSoloRoundLossLabel(mode);

  const currentRoundNumber = roundHistory.length + 1;
  const needToWin = Math.max(0, roundsToWin - roundsWon.me);

  return (
    <div className="bg-black/40 rounded-lg p-3 flex flex-col gap-2 min-h-0 max-h-full overflow-hidden">
      <div className="text-xs uppercase opacity-70 tracking-wide">Match</div>

      <div className="rounded-md bg-white/5 px-2 py-1.5 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="opacity-80">Match pts</span>
          <span className="font-semibold text-seafoam">{matchScore}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="opacity-70">Rounds won</span>
          <span>
            {roundsWon.me} / {roundsToWin}
            {matchWinner === null && needToWin > 0 && (
              <span className="opacity-50"> · need {needToWin}</span>
            )}
          </span>
        </div>
        {mode === 'solo' ? (
          <div className="flex justify-between text-xs opacity-70">
            <span>{lossLabel}</span>
            <span>{roundsWon.opponent}</span>
          </div>
        ) : (
          <div className="flex justify-between text-xs opacity-70">
            <span>Opponent rounds</span>
            <span>{roundsWon.opponent}</span>
          </div>
        )}
      </div>

      {!roundOver && matchWinner === null && (
        <div className="rounded-md border border-seafoam/30 bg-seafoam/10 px-2 py-1.5">
          <div className="text-[10px] uppercase text-seafoam/90 mb-0.5">
            Round {currentRoundNumber} · in progress
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="opacity-70">Round score</span>
              <span className="font-medium">{roundScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Your guesses</span>
              <span>{myGuesses.length}</span>
            </div>
            <div className="text-[10px] opacity-50 mt-1">Word hidden until round ends</div>
          </div>
        </div>
      )}

      {roundHistory.length > 0 && (
        <div className="flex flex-col min-h-0 flex-1">
          <div className="text-[10px] uppercase opacity-60 mb-1">
            Completed rounds
          </div>
          <ul className="space-y-1.5 overflow-y-auto min-h-0 flex-1 pr-0.5">
            {[...roundHistory].reverse().map((r) => (
              <li
                key={`${r.roundIndex}-${r.answer}`}
                className={`rounded-md bg-white/5 px-2 py-1.5 text-xs border-l-2 ${
                  r.winner === 'me'
                    ? 'border-l-emerald-400'
                    : 'border-l-amber-500/80'
                }`}
              >
                <div className="flex justify-between items-baseline gap-1">
                  <span className="font-bold uppercase tracking-wide text-white">
                    {r.answer}
                  </span>
                  <span className="text-[10px] opacity-50 shrink-0">
                    R{r.roundIndex}
                  </span>
                </div>
                <div className="mt-0.5 opacity-90">
                  {r.winner === 'me' ? (
                    <span className="text-emerald-300">You won</span>
                  ) : mode === 'solo' ? (
                    <span className="text-amber-300">Round lost</span>
                  ) : (
                    <span className="text-amber-300">Opponent won</span>
                  )}
                  <span className="opacity-70">
                    {' '}
                    · +{r.pointsBanked} match pts
                  </span>
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {r.myGuessCount} guess{r.myGuessCount === 1 ? '' : 'es'}
                  {r.winningGuess && r.winner === 'me' && (
                    <span> · solved with {r.winningGuess}</span>
                  )}
                  {r.myFinalRoundScore !== r.pointsBanked && r.winner === 'me' && (
                    <span> · round score {r.myFinalRoundScore}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {roundHistory.length === 0 && (roundOver || myGuesses.length === 0) && (
        <p className="text-[10px] opacity-50 italic">
          Finish a round to see words here.
        </p>
      )}
    </div>
  );
}
