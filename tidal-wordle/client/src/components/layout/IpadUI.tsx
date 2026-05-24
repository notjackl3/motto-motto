import { useEffect, useState } from 'react';
import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import CooldownTimer from '../game/CooldownTimer';
import CardHand from '../game/CardHand';
import OpponentBoard from '../game/OpponentBoard';
import ScorePanel from '../game/ScorePanel';
import KnowledgePanel from '../game/KnowledgePanel';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  onQuit: () => void;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function IpadUI({ onQuit }: Props) {
  const mode = useGameStore((s) => s.mode);
  const roomCode = useGameStore((s) => s.roomCode);
  const matchScore = useGameStore((s) => s.matchScore.me);
  const roundsWon = useGameStore((s) => s.roundsWon.me);
  const roundsToWin = useGameStore((s) => s.roundsToWin);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const myCooldownEndsAt = useGameStore((s) => s.myCooldownEndsAt);
  const cooldownFrozen = useGameStore((s) => s.cooldownFrozen);
  const roundOver = useGameStore((s) => s.roundOver);

  const now = useClock();
  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentRound = roundHistory.length + 1;
  const onCooldown =
    myCooldownEndsAt !== null &&
    Date.now() < myCooldownEndsAt &&
    !cooldownFrozen;

  const statusLabel = roundOver
    ? 'STANDBY'
    : onCooldown
      ? 'COOLING'
      : 'READY';
  const statusColor = roundOver
    ? 'text-brass'
    : onCooldown
      ? 'text-coral'
      : 'text-seafoam';

  return (
    <div className="ipad-tablet font-body w-full h-full p-[2.2%] flex flex-col gap-[1.2%]">
      {/* ─── Top instrument bar ─────────────────────────────────────── */}
      <div className="relative shrink-0 z-[3]">
        <div className="flex items-stretch justify-between gap-3">
          {/* Left: identity + clock */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-[18px] tracking-[0.18em] text-sand">
                TIDAL
              </span>
              <span className="label-instrument mt-[2px]">SURF · BOARD</span>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-brass/50 to-transparent" />
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-[11px] text-sand/80 tracking-wider">
                {time}
              </span>
              <span className="label-instrument">{mode === 'solo' ? 'SOLO RUN' : 'VS · LIVE'}</span>
            </div>
          </div>

          {/* Center: status readout */}
          <div className="flex items-center">
            <span className={`status-pill ${statusColor}`}>{statusLabel}</span>
          </div>

          {/* Right: round counter + room/quit */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="label-instrument">Round</div>
              <div className="font-display font-extrabold text-sand text-[18px] leading-none">
                {String(currentRound).padStart(2, '0')}
                <span className="text-brass/70 text-[11px] ml-1">
                  / {roundsToWin + 1}
                </span>
              </div>
            </div>
            {mode === 'multiplayer' && roomCode && (
              <div className="instrument-panel px-2.5 py-1 leading-tight">
                <div className="label-instrument">Room</div>
                <div className="font-mono font-bold text-sand text-[13px] tracking-[0.3em]">
                  {roomCode}
                </div>
              </div>
            )}
            <button
              onClick={onQuit}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/55 hover:text-coral transition-colors px-2 py-1 border border-white/10 hover:border-coral/60 rounded"
            >
              Quit
            </button>
          </div>
        </div>
        {/* Horizon divider */}
        <div className="mt-2 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
      </div>

      {/* ─── Main grid: left rail · board · right rail ─────────────── */}
      <div className="relative flex gap-[1%] flex-1 min-h-0 z-[2]">
        {/* Left rail: score */}
        <div className="bracket-corners relative w-[26%] min-w-0 instrument-panel p-2.5 overflow-hidden">
          <span className="bracket-bl" />
          <span className="bracket-br" />
          <div className="label-instrument mb-1.5">Score Telemetry</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="display-numeral text-[32px] text-seafoam">
              {matchScore}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-sand/60">
              MATCH PTS
            </span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: roundsToWin }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < roundsWon
                    ? 'bg-seafoam shadow-[0_0_6px_rgba(154,212,214,0.6)]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="min-h-0 flex-1 -mx-0.5">
            <ScorePanel />
          </div>
        </div>

        {/* Center: board + input */}
        <div className="bracket-corners relative flex-1 instrument-panel flex flex-col items-stretch px-3 pt-2 pb-3 min-w-0 min-h-0 overflow-hidden">
          <span className="bracket-bl" />
          <span className="bracket-br" />
          <div className="flex items-center justify-between mb-1">
            <span className="label-instrument">Decoder · Self</span>
            <span className="font-mono text-[9px] tracking-[0.22em] text-brass/70">
              ⌁ TIDE LOCK ⌁
            </span>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            <WordleBoard boardTarget="self" />
          </div>
          <div className="mt-2">
            <GuessInput />
          </div>
        </div>

        {/* Right rail: opponent (mp) or solo info + cooldown gauge */}
        <div className="w-[26%] min-w-0 flex flex-col gap-[6%]">
          <div className="bracket-corners relative instrument-panel p-2.5 flex flex-col items-center">
            <span className="bracket-bl" />
            <span className="bracket-br" />
            <div className="label-instrument mb-1.5 self-start">Cooldown</div>
            <CooldownTimer />
          </div>

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

      {/* ─── Bottom: card hand strip ─────────────────────────────── */}
      <div className="relative shrink-0 z-[2]">
        <div className="h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent mb-1.5" />
        <CardHand />
      </div>
    </div>
  );
}
