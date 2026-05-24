import { useGameStore } from '../../stores/gameStore';
import CardRenderer from '../cards/CardRenderer';

export default function CardHand() {
  const history = useGameStore((s) => s.cardDrawHistory);

  return (
    <div className="bg-black/40 rounded-lg p-3">
      <div className="text-xs uppercase opacity-70 mb-2">
        Card history (last 5 — auto-fired each guess)
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {history.length === 0 ? (
          <div className="text-sm opacity-60 italic">
            Cards appear after your first guess
          </div>
        ) : (
          history.map((card, i) => (
            <CardRenderer key={`${card.id}-${i}`} card={card} />
          ))
        )}
      </div>
    </div>
  );
}
