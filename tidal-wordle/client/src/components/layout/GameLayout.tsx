import WaveScene from '../scene/WaveScene';
import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import CooldownTimer from '../game/CooldownTimer';
import CardHand from '../game/CardHand';
import OpponentBoard from '../game/OpponentBoard';
import ScorePanel from '../game/ScorePanel';
import EffectOverlays from '../game/EffectOverlays';
import { useGameStore } from '../../stores/gameStore';

interface GameLayoutProps {
  onQuit: () => void;
}

export default function GameLayout({ onQuit }: GameLayoutProps) {
  const mode = useGameStore((s) => s.mode);
  const hints = useGameStore((s) => s.hints);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WaveScene />
      <EffectOverlays />
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-3 p-4 text-white z-10 pointer-events-none">
        <div className="col-span-3 row-span-2 flex flex-col gap-3 pointer-events-auto">
          <ScorePanel />
          <CooldownTimer />
        </div>
        <div className="col-span-6 row-span-5 flex flex-col gap-3 pointer-events-auto">
          <WordleBoard />
          <GuessInput />
          {hints.length > 0 && (
            <div className="text-xs opacity-80 max-h-16 overflow-y-auto">
              Latest hint: {hints[hints.length - 1]?.text}
            </div>
          )}
        </div>
        <div className="col-span-3 row-span-2 pointer-events-auto">
          {mode === 'multiplayer' ? (
            <OpponentBoard />
          ) : (
            <div className="bg-black/30 rounded-lg p-3 text-sm opacity-60">
              Solo mode — attack cards hit your own board
            </div>
          )}
        </div>
        <div className="col-span-12 row-span-1 pointer-events-auto">
          <CardHand />
        </div>
        <button
          onClick={onQuit}
          className="absolute top-2 right-2 text-xs underline opacity-70 pointer-events-auto"
        >
          Quit to menu
        </button>
      </div>
    </div>
  );
}
