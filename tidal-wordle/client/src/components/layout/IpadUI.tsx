import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import ActiveEffectTimers from '../game/ActiveEffectTimers';
import CardHand from '../game/CardHand';
import OpponentBoard from '../game/OpponentBoard';
import KnowledgePanel from '../game/KnowledgePanel';
import CardDetailPopup from '../game/CardDetailPopup';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { selectIsMyTurn } from '../../stores/gameSelectors';

export default function IpadUI() {
  const mode = useGameStore((s) => s.mode);
  const roomCode = useGameStore((s) => s.roomCode);
  const activeTurn = useGameStore((s) => s.activeTurn);
  const myRole = useMultiplayerStore((s) => s.role);
  const isMyTurn = selectIsMyTurn(mode, activeTurn, myRole);

  const isSolo = mode === 'solo';
  const rightRailClass = isSolo ? 'w-[22%]' : 'w-[26%]';

  return (
    <div className="ipad-tablet font-body w-full h-full p-[2%] flex flex-col gap-[1%]">
      {/* ─── Main grid: board · right rail ─────────────────────────── */}
      <div className="relative flex gap-[0.8%] flex-1 min-h-0 z-[2] overflow-hidden">
        {/* Center: board + input */}
        <div className="bracket-corners relative flex-1 min-w-0 instrument-panel flex flex-col items-stretch px-2 pt-1.5 pb-2 min-h-0 overflow-hidden">
          <span className="bracket-bl" />
          <span className="bracket-br" />
          <div className="flex items-center justify-between mb-1 shrink-0 gap-2">
            <span className="label-instrument">Decoder · Self</span>
            {mode === 'multiplayer' && (
              <span
                className={`font-mono text-[9px] tracking-[0.2em] shrink-0 ${
                  isMyTurn ? 'text-seafoam' : 'text-white/45'
                }`}
              >
                {isMyTurn ? 'YOUR TURN' : 'OPPONENT TURN'}
              </span>
            )}
            {mode === 'multiplayer' && roomCode && (
              <span className="font-mono text-[9px] tracking-[0.28em] text-sand/60 shrink-0">
                {roomCode}
              </span>
            )}
            <span className="font-mono text-[9px] tracking-[0.22em] text-brass/70 shrink-0">
              ⌁ TIDE LOCK ⌁
            </span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-stretch justify-center overflow-hidden">
            <WordleBoard boardTarget="self" />
          </div>
          <div className="mt-1.5 shrink-0">
            <GuessInput />
          </div>
        </div>

        {/* Right rail: opponent (mp) or solo info + optional card timers */}
        <div className={`${rightRailClass} min-w-0 flex flex-col gap-[5%]`}>
          <ActiveEffectTimersPanel />

          <div className="bracket-corners relative instrument-panel p-2.5 flex-1 min-h-0 overflow-hidden">
            <span className="bracket-bl" />
            <span className="bracket-br" />
            {mode === 'multiplayer' ? (
              <>
                <div className="label-instrument mb-1.5">Opponent</div>
                <OpponentBoard />
              </>
            ) : (
              <>
                <div className="label-instrument mb-1.5">Surf Log</div>
                <KnowledgePanel />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom: card history strip (content-sized) ───────────── */}
      <div className="relative shrink-0 z-[4] flex flex-col">
        <div className="h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent mb-1 shrink-0" />
        <div className="relative overflow-visible">
          <CardDetailPopup />
          <CardHand solo={isSolo} />
        </div>
      </div>
    </div>
  );
}

function ActiveEffectTimersPanel() {
  const forcedBreakLabel = useGameStore((s) => s.forcedBreakLabel);
  const forcedBreakPending = useGameStore((s) => s.forcedBreakPending);
  const myGuesses = useGameStore((s) => s.myGuesses);
  const statusDogActive = useGameStore((s) =>
    s.activeEffects.some(
      (e) => e.cardId === 'status-dog' && e.target === 'self' && e.expiresAt
    )
  );

  const hasColorReveal =
    Boolean(forcedBreakLabel) &&
    (forcedBreakPending ||
      myGuesses.some((g) => g.colorsRevealAt && g.colorsRevealAt > Date.now()));

  if (!hasColorReveal && !statusDogActive) return null;

  return (
    <div className="bracket-corners relative instrument-panel shrink-0 flex flex-col items-center p-2">
      <span className="bracket-bl" />
      <span className="bracket-br" />
      <div className="label-instrument mb-1.5 self-start">Active Effects</div>
      <ActiveEffectTimers />
    </div>
  );
}
