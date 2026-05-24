import WaveScene from '../scene/WaveScene';
import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import CooldownTimer from '../game/CooldownTimer';
import CardHand from '../game/CardHand';
import KnowledgePanel from '../game/KnowledgePanel';
import OpponentBoard from '../game/OpponentBoard';
import ScorePanel from '../game/ScorePanel';
import EffectOverlays from '../game/EffectOverlays';
import RoundBanner from '../game/RoundBanner';
import CardDetailPopup from '../game/CardDetailPopup';
import { useEffectExpiry } from '../../hooks/useEffectExpiry';
import { useGameStore } from '../../stores/gameStore';
import DevCardFilterPanel from '../dev/DevCardFilterPanel';

interface GameLayoutProps {
  onQuit: () => void;
}

export default function GameLayout({ onQuit }: GameLayoutProps) {
  const mode = useGameStore((s) => s.mode);
  useEffectExpiry();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WaveScene />
      <EffectOverlays />
      <CardDetailPopup />
      <RoundBanner />
      {import.meta.env.DEV && <DevCardFilterPanel />}
      <div className="absolute inset-0 z-10 flex flex-col p-4 pb-3 gap-3 text-white pointer-events-none">
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
          <div className="col-span-3 flex flex-col gap-3 pointer-events-auto min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScorePanel />
            </div>
            <CooldownTimer />
          </div>
          <div className="col-span-6 relative flex flex-col gap-3 pointer-events-auto min-h-0 overflow-hidden">
            <WordleBoard boardTarget="self" />
            <GuessInput />
          </div>
          <div className="col-span-3 flex flex-col gap-3 pointer-events-auto min-h-0 overflow-hidden">
            {mode === 'multiplayer' && (
              <div className="shrink-0 max-h-[40%] min-h-0 overflow-auto">
                <OpponentBoard />
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <KnowledgePanel />
            </div>
          </div>
        </div>
        <div className="shrink-0 pointer-events-auto">
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
