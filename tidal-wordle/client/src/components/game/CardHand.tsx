import { useGameStore } from '../../stores/gameStore';
import CardRenderer from '../cards/CardRenderer';

export default function CardHand() {
  const hand = useGameStore((s) => s.myHand);

  return (
    <div className="bg-black/40 rounded-lg p-3">
      <div className="text-xs uppercase opacity-70 mb-2">CardHand</div>
      <div className="flex gap-2 overflow-x-auto">
        {hand.length === 0 ? (
          <div className="text-sm opacity-60 italic">No cards yet — TODO: deal opening hand</div>
        ) : (
          hand.map((card) => <CardRenderer key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}
