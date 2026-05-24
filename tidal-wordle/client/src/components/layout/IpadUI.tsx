import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import CooldownTimer from '../game/CooldownTimer';
import CardHand from '../game/CardHand';
import OpponentBoard from '../game/OpponentBoard';
import ScorePanel from '../game/ScorePanel';
import { useGameStore } from '../../stores/gameStore';

// Tablet-shaped HUD that sits on the iPad screen surface inside the 3D scene.
// Compact column layout — designed for a ~960×640 px screen face.
interface Props {
  onQuit: () => void;
}

export default function IpadUI({ onQuit }: Props) {
  const mode = useGameStore((s) => s.mode);
  const roomCode = useGameStore((s) => s.roomCode);

  return (
    <div
      className="ipad-ui"
      style={{
        width: '100%',
        height: '100%',
        padding: '2.5%',
        background:
          'radial-gradient(circle at 30% 0%, rgba(154,212,214,0.18), transparent 60%), linear-gradient(180deg, #062035 0%, #0a3658 100%)',
        color: 'white',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        borderRadius: '1.4%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5%',
        boxSizing: 'border-box',
        boxShadow:
          'inset 0 0 0 2px rgba(255,255,255,0.06), inset 0 0 60px rgba(0,0,0,0.55)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <ScorePanel />
        </div>
        <div className="flex items-center justify-center">
          <CooldownTimer />
        </div>
        <div className="flex-1 flex flex-col gap-2 items-end">
          {mode === 'multiplayer' && roomCode && (
            <div className="backdrop-blur-sm bg-black/40 rounded-lg p-2 border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-widest opacity-60">
                Room
              </div>
              <div className="text-lg font-bold tracking-[0.3em] text-sand leading-none">
                {roomCode}
              </div>
            </div>
          )}
          <button
            onClick={onQuit}
            className="text-[11px] underline opacity-70 hover:opacity-100 transition"
          >
            Quit to menu
          </button>
        </div>
      </div>

      {/* Middle: opponent + player board */}
      <div className="flex gap-3 flex-1 min-h-0">
        {mode === 'multiplayer' ? (
          <div className="w-[200px]">
            <OpponentBoard />
          </div>
        ) : (
          <div className="w-[200px] backdrop-blur-sm bg-black/30 rounded-lg p-3 text-xs opacity-70 border border-white/10">
            Solo practice — first to crack the answer wins the round.
          </div>
        )}
        <div className="flex-1 flex flex-col gap-2 items-center min-h-0">
          <WordleBoard />
          <GuessInput />
        </div>
      </div>

      {/* Bottom: card hand */}
      <div>
        <CardHand />
      </div>
    </div>
  );
}
