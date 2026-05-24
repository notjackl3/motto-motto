import WaveScene from '../scene/WaveScene';
import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import CooldownTimer from '../game/CooldownTimer';
import CardHand from '../game/CardHand';
import OpponentBoard from '../game/OpponentBoard';
import ScorePanel from '../game/ScorePanel';
import { useGameStore } from '../../stores/gameStore';

interface GameLayoutProps {
  onBackToMenu: () => void;
}

export default function GameLayout({ onBackToMenu }: GameLayoutProps) {
  const mode = useGameStore((s) => s.mode);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WaveScene />
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-3 p-4 text-white">
        <div className="col-span-3 row-span-2 flex flex-col gap-3">
          <ScorePanel />
          <CooldownTimer />
        </div>
        <div className="col-span-6 row-span-5 flex flex-col gap-3">
          <WordleBoard />
          <GuessInput />
        </div>
        <div className="col-span-3 row-span-2">
          {mode === 'multiplayer' ? (
            <OpponentBoard />
          ) : (
            <div className="bg-black/30 rounded-lg p-3 text-sm opacity-60">Solo mode</div>
          )}
        </div>
        <div className="col-span-12 row-span-1">
          <CardHand />
        </div>
        <button
          onClick={onBackToMenu}
          className="absolute top-2 right-2 text-xs underline opacity-70"
        >
          Quit to menu
        </button>
      </div>
    </div>
  );
}
