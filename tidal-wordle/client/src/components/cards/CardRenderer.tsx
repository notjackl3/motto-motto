import type { Card } from '../../types';
import { getCardDescription } from '../cards/CardDefinitions';
import { useGameStore } from '../../stores/gameStore';

interface CardRendererProps {
  card: Card;
  onClick?: () => void;
  /** Compact strip for card history (fits bottom bar). */
  compact?: boolean;
  /** Slightly larger cards in solo layout. */
  solo?: boolean;
  /** Hand card — playable, draws extra attention. */
  highlight?: boolean;
  /** Already-played card from history — muted look. */
  dimmed?: boolean;
}

const TYPE_STYLES: Record<Card['type'], string> = {
  attack: 'bg-red-500/70 border-red-300',
  buff: 'bg-emerald-500/70 border-emerald-300',
  wildcard: 'bg-purple-500/70 border-purple-300',
};

export default function CardRenderer({
  card,
  onClick,
  compact,
  solo,
  highlight,
  dimmed,
}: CardRendererProps) {
  const mode = useGameStore((s) => s.mode);
  const description = getCardDescription(card, mode);

  if (compact) {
    const sizeClass = solo
      ? 'w-[4.5rem] h-[3.5rem]'
      : 'w-[4.5rem] h-[3.5rem] shrink-0';
    const tone = dimmed
      ? 'opacity-55 saturate-50'
      : highlight
        ? 'ring-2 ring-white/70 shadow-[0_0_12px_rgba(255,255,255,0.35)]'
        : '';
    const className = `${sizeClass} rounded border px-1.5 py-1 text-left text-white transition ${TYPE_STYLES[card.type]} ${tone} ${
      onClick ? 'cursor-pointer hover:scale-[1.03] hover:brightness-110' : ''
    }`;

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          data-card-id={card.id}
          aria-label={`View ${card.name} card details`}
          className={className}
        >
          <div className="font-bold text-[10px] leading-tight truncate">{card.name}</div>
          <div className="text-[8px] uppercase opacity-80">{card.type}</div>
        </button>
      );
    }

    return (
      <div data-card-id={card.id} className={className} title={description}>
        <div className="font-bold text-[10px] leading-tight truncate">{card.name}</div>
        <div className="text-[8px] uppercase opacity-80">{card.type}</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-card-id={card.id}
      aria-label={`${card.name}, ${card.type} card`}
      className={`w-32 h-44 rounded-lg border-2 p-2 text-left text-xs text-white shadow-lg hover:scale-105 transition shrink-0 ${TYPE_STYLES[card.type]}`}
    >
      <div className="font-bold text-sm mb-1">{card.name}</div>
      <div className="uppercase tracking-wide text-[10px] opacity-80 mb-2">
        {card.type} · {card.duration}
      </div>
      <div className="opacity-90 leading-tight">{description}</div>
    </button>
  );
}
