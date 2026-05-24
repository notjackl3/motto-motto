import { useMemo, useState } from 'react';
import { getChessPuzzleById, shuffleOptionOrder } from '../../lib/chessPuzzles';
import {
  answerChessPuzzle,
  type ChessPuzzleAnswerResult,
} from '../../lib/cardEffects';
import {
  multiplayerInfoLeakHint,
  soloWordleTaxHint,
} from '../../lib/chessBlunderPenalties';
import { useGameStore } from '../../stores/gameStore';
import ChessBoard from './ChessBoard';

type Phase = 'pick' | 'correct' | 'wrong';

interface ChessGambitOverlayProps {
  puzzleId: string;
}

function blunderFooter(
  answer: ChessPuzzleAnswerResult,
  mode: 'solo' | 'multiplayer' | null
): string | undefined {
  if (answer.result !== 'wrong') return undefined;
  if (answer.penalty.kind === 'solo-wordle-tax' && answer.penalty.halfMaskSide) {
    return soloWordleTaxHint(answer.penalty.halfMaskSide);
  }
  if (mode === 'multiplayer') {
    return multiplayerInfoLeakHint();
  }
  return undefined;
}

export default function ChessGambitOverlay({ puzzleId }: ChessGambitOverlayProps) {
  const puzzle = getChessPuzzleById(puzzleId);
  const mode = useGameStore((s) => s.mode);
  const [phase, setPhase] = useState<Phase>('pick');
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [wrongFooter, setWrongFooter] = useState<string | undefined>();

  const optionOrder = useMemo(
    () => shuffleOptionOrder(puzzle?.options.length ?? 4),
    [puzzle?.options.length]
  );

  if (!puzzle) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-auto">
        <div className="bg-white text-deep p-6 rounded-xl text-center">
          <p className="text-sm">Chess puzzle failed to load.</p>
        </div>
      </div>
    );
  }

  function handlePick(optionIndex: number) {
    if (phase !== 'pick' || !puzzle) return;
    setPickedIndex(optionIndex);
    const answer = answerChessPuzzle(puzzle.id, optionIndex);
    if (answer.result === 'correct') {
      setPhase('correct');
      return;
    }
    setWrongFooter(blunderFooter(answer, mode));
    setPhase('wrong');
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 pointer-events-auto p-4">
      <div className="bg-white text-deep rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-deep text-white px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-seafoam/80">
              Chess Gambit
            </p>
            <h3 className="font-bold text-lg leading-tight">{puzzle.title}</h3>
          </div>
          <span className="text-2xl" aria-hidden>
            ♞
          </span>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <p className="text-sm text-center text-slate-600">{puzzle.prompt}</p>

          <ChessBoard fen={puzzle.fen} />

          {phase === 'pick' && (
            <div className="w-full grid grid-cols-2 gap-2">
              {optionOrder.map((optionIndex) => (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => handlePick(optionIndex)}
                  className="bg-slate-100 hover:bg-seafoam/30 border border-slate-200 px-3 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {puzzle.options[optionIndex]?.label}
                </button>
              ))}
            </div>
          )}

          {phase === 'correct' && pickedIndex !== null && (
            <ResultBanner
              tone="success"
              title="Correct!"
              body={`${puzzle.options[pickedIndex]?.label} — you may continue guessing.`}
            />
          )}

          {phase === 'wrong' && (
            <ResultBanner
              tone="penalty"
              title="Blunder!"
              body={puzzle.wrongFeedback}
              footer={wrongFooter}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ResultBanner({
  tone,
  title,
  body,
  footer,
}: {
  tone: 'success' | 'penalty';
  title: string;
  body: string;
  footer?: string;
}) {
  const isSuccess = tone === 'success';
  return (
    <div
      className={`w-full rounded-lg px-4 py-3 text-center ${
        isSuccess
          ? 'bg-seafoam/20 border border-seafoam/40'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      <p
        className={`font-bold text-base mb-1 ${
          isSuccess ? 'text-emerald-800' : 'text-red-700'
        }`}
      >
        {title}
      </p>
      <p className="text-sm text-slate-700">{body}</p>
      {footer && (
        <p
          className={`text-xs mt-2 leading-snug ${
            isSuccess ? 'text-emerald-700/70' : 'text-red-600'
          }`}
        >
          {footer}
        </p>
      )}
    </div>
  );
}
