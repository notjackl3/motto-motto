import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import CardRenderer from '../cards/CardRenderer';
import { playSfx } from '../../lib/audio';

export default function CardHand() {
  const hand = useGameStore((s) => s.myHand);
  const knownIdsRef = useRef<Set<string>>(new Set());

  // SFX + animation trigger: detect freshly drawn cards.
  useEffect(() => {
    const known = knownIdsRef.current;
    const newOnes = hand.filter((c) => !known.has(c.id));
    if (newOnes.length > 0 && known.size > 0) {
      playSfx('cardDraw');
    }
    knownIdsRef.current = new Set(hand.map((c) => c.id));
  }, [hand]);

  return (
    <div className="backdrop-blur-sm bg-black/40 rounded-xl p-3 border border-white/10 shadow-lg">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs uppercase tracking-widest opacity-70">Your hand</div>
        <div className="text-[10px] opacity-50">
          {hand.length} card{hand.length === 1 ? '' : 's'}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {hand.length === 0 ? (
          <div className="text-sm opacity-60 italic px-2 py-3">
            No cards in hand yet.
          </div>
        ) : (
          hand.map((card) => (
            <div key={card.id} className="card-deal flex-shrink-0">
              <CardRenderer card={card} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
