import type { Card } from '../../types';

interface CardRendererProps {
  card: Card;
  onClick?: () => void;
}

const TYPE_STYLES: Record<Card['type'], string> = {
  attack: 'bg-red-500/70 border-red-300',
  buff: 'bg-emerald-500/70 border-emerald-300',
  wildcard: 'bg-purple-500/70 border-purple-300',
};

export default function CardRenderer({ card, onClick }: CardRendererProps) {
  // TODO: real card art + animations
  return (
    <button
      onClick={onClick}
      className={`w-32 h-44 rounded-lg border-2 p-2 text-left text-xs text-white shadow-lg hover:scale-105 transition ${TYPE_STYLES[card.type]}`}
    >
      <div className="font-bold text-sm mb-1">{card.name}</div>
      <div className="uppercase tracking-wide text-[10px] opacity-80 mb-2">
        {card.type} · {card.duration}
      </div>
      <div className="opacity-90 leading-tight">{card.description}</div>
    </button>
  );
}
