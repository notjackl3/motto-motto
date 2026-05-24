import { useGameStore } from '../../stores/gameStore';
import CardRenderer from '../cards/CardRenderer';

interface CardHandProps {
  solo?: boolean;
}

export default function CardHand({ solo = false }: CardHandProps) {
  const hand = useGameStore((s) => s.myHand);
  const history = useGameStore((s) => s.cardDrawHistory);
  const showCardDetailPopup = useGameStore((s) => s.showCardDetailPopup);

  return (
    <div
      className={`bg-black/50 rounded-lg border border-white/10 flex flex-col shrink-0 ${
        solo ? 'px-2 py-1' : 'px-2 py-1'
      }`}
    >
      <div className="text-[9px] uppercase opacity-70 mb-1 shrink-0 tracking-wide flex items-center justify-between">
        <span>
          Hand · tap to play{' '}
          <span className="opacity-60 normal-case">({hand.length})</span>
        </span>
        {history.length > 0 && (
          <span className="opacity-50 normal-case">
            recent: {history.length}
          </span>
        )}
      </div>
      <div
        className={`overflow-x-auto overflow-y-visible ${
          solo
            ? 'grid grid-flow-col auto-cols-[4.5rem] gap-1.5 items-stretch'
            : 'flex gap-1.5 items-center'
        }`}
      >
        {hand.length === 0 && history.length === 0 ? (
          <div className="text-[11px] opacity-60 italic py-1 col-span-full">
            Guess a word to draw your first card
          </div>
        ) : (
          <>
            {hand.map((card, i) => (
              <CardRenderer
                key={`hand-${card.id}-${i}`}
                card={card}
                compact
                solo={solo}
                onClick={() => showCardDetailPopup(card, 'hand')}
                highlight
              />
            ))}
            {history.length > 0 && hand.length > 0 && (
              <div
                aria-hidden
                className="self-stretch w-px bg-white/15 mx-1 shrink-0"
              />
            )}
            {history.map((card, i) => (
              <CardRenderer
                key={`hist-${card.id}-${i}`}
                card={card}
                compact
                solo={solo}
                onClick={() => showCardDetailPopup(card, 'history')}
                dimmed
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
