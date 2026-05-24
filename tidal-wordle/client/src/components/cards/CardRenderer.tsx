import type { Card } from '../../types';

interface CardRendererProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
}

const TYPE_STYLES: Record<Card['type'], { bg: string; border: string; icon: string }> = {
  attack: {
    bg: 'bg-gradient-to-br from-red-500 via-rose-500 to-orange-600',
    border: 'border-red-200',
    icon: '⚡',
  },
  buff: {
    bg: 'bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-700',
    border: 'border-cyan-200',
    icon: '✨',
  },
  wildcard: {
    bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500',
    border: 'border-yellow-100',
    icon: '🎲',
  },
};

export default function CardRenderer({ card, onClick, disabled }: CardRendererProps) {
  const style = TYPE_STYLES[card.type];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-32 h-44 rounded-xl border-2 ${style.border} ${style.bg} text-left text-xs text-white shadow-xl transition will-change-transform
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:-translate-y-1 active:scale-95'}`}
    >
      {/* Type badge */}
      <div className="absolute top-1.5 right-1.5 text-xl drop-shadow">{style.icon}</div>

      <div className="p-2.5 h-full flex flex-col">
        <div className="font-bold text-sm leading-tight pr-6 drop-shadow-md">
          {card.name}
        </div>
        <div className="uppercase tracking-widest text-[9px] opacity-85 mt-0.5">
          {card.type} · {card.duration}
        </div>
        <div className="mt-2 text-[11px] leading-tight opacity-95 flex-1">
          {card.description}
        </div>
        <div className="text-[9px] uppercase tracking-widest opacity-75 mt-1">
          {card.targetSelf ? 'targets you' : 'targets opp.'}
        </div>
      </div>

      {/* Glossy sheen */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 via-transparent to-transparent" />
    </button>
  );
}
