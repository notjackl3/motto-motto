import { useGameStore } from '../../stores/gameStore';
import CardRenderer from '../cards/CardRenderer';

interface CardHandProps {
  solo?: boolean;
}

export default function CardHand({ solo = false }: CardHandProps) {
  const history = useGameStore((s) => s.cardDrawHistory);
  const showCardDetailPopup = useGameStore((s) => s.showCardDetailPopup);

  return (
    <div
      className={`bg-black/50 rounded-lg border border-white/10 flex flex-col shrink-0 ${
        solo ? 'px-2 py-1' : 'px-2 py-1'
      }`}
    >
      <div className="text-[9px] uppercase opacity-70 mb-1 shrink-0 tracking-wide">
        Recent cards · tap for details
      </div>
      <div
        className={`overflow-x-auto overflow-y-visible ${
          solo
            ? 'grid grid-flow-col auto-cols-[4.5rem] gap-1.5 items-stretch'
            : 'flex gap-1.5 items-center'
        }`}
      >
        {history.length === 0 ? (
          <div className="text-[11px] opacity-60 italic py-1 col-span-full">
            Cards appear after your first guess
          </div>
        ) : (
          history.map((card, i) => (
            <CardRenderer
              key={`${card.id}-${i}`}
              card={card}
              compact
              solo={solo}
              onClick={() => showCardDetailPopup(card, 'history')}
            />
          ))
        )}
      </div>
    </div>
  );
}
