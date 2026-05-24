import { useGameStore } from '../../stores/gameStore';
import CardRenderer from '../cards/CardRenderer';

export default function CardHand() {
  const history = useGameStore((s) => s.cardDrawHistory);
  const showCardDetailPopup = useGameStore((s) => s.showCardDetailPopup);

  return (
    <div className="bg-black/50 rounded-lg px-3 py-2 border border-white/10">
      <div className="text-xs uppercase opacity-70 mb-2">
        Card history (last 5 — tap a card for details)
      </div>
      <div className="flex gap-2 overflow-x-auto overflow-y-visible pb-1 min-h-[5.5rem] items-center">
        {history.length === 0 ? (
          <div className="text-sm opacity-60 italic py-4">
            Cards appear after your first guess
          </div>
        ) : (
          history.map((card, i) => (
            <CardRenderer
              key={`${card.id}-${i}`}
              card={card}
              compact
              onClick={() => showCardDetailPopup(card, 'history')}
            />
          ))
        )}
      </div>
    </div>
  );
}
