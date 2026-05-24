import { useEffect, useState } from 'react';
import { getCardDescription } from '../cards/CardDefinitions';
import type { Card } from '../../types';
import { useGameStore } from '../../stores/gameStore';

const TYPE_STYLES: Record<Card['type'], string> = {
  attack: 'bg-red-500/95 border-red-300',
  buff: 'bg-emerald-500/95 border-emerald-300',
  wildcard: 'bg-purple-500/95 border-purple-300',
};

const TYPE_LABELS: Record<Card['type'], string> = {
  attack: 'Attack',
  buff: 'Buff',
  wildcard: 'Wildcard',
};

export default function CardDetailPopup() {
  const popup = useGameStore((s) => s.cardDetailPopup);
  const mode = useGameStore((s) => s.mode);
  const dismiss = useGameStore((s) => s.dismissCardDetailPopup);
  const statusDogExpiresAt = useGameStore((s) => {
    const effect = s.activeEffects.find(
      (e) => e.cardId === 'status-dog' && e.target === 'self'
    );
    return effect?.expiresAt;
  });
  const faceSwapExpiresAt = useGameStore((s) => {
    const effect = s.activeEffects.find(
      (e) => e.cardId === 'face-swap-glitch' && e.target === 'self'
    );
    return effect?.expiresAt;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!popup) return;
    const tracking =
      (popup.card.id === 'status-dog' && statusDogExpiresAt) ||
      (popup.card.id === 'face-swap-glitch' && faceSwapExpiresAt);
    if (!tracking) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [popup, statusDogExpiresAt, faceSwapExpiresAt]);

  if (!popup) return null;

  const { card, source } = popup;
  const title = source === 'draw' ? 'Card drawn' : 'Card from history';
  const description = getCardDescription(card, mode);
  const statusDogSeconds =
    card.id === 'status-dog' && statusDogExpiresAt
      ? Math.ceil(Math.max(0, statusDogExpiresAt - now) / 1000)
      : 0;
  const faceSwapSeconds =
    card.id === 'face-swap-glitch' && faceSwapExpiresAt
      ? Math.ceil(Math.max(0, faceSwapExpiresAt - now) / 1000)
      : 0;

  return (
    <div
      className="absolute bottom-full left-1/2 z-[65] w-[min(100%,18rem)] -translate-x-1/2 mb-2 px-1 pointer-events-auto"
      role="dialog"
      aria-labelledby="card-detail-title"
    >
      <div
        className={`relative rounded-xl border-2 p-4 pr-10 text-white shadow-2xl backdrop-blur-sm ${TYPE_STYLES[card.type]}`}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/25 text-lg leading-none hover:bg-black/40 transition"
          aria-label="Close card details"
        >
          ×
        </button>
        <p
          id="card-detail-title"
          className="text-[10px] uppercase tracking-widest opacity-80 mb-1"
        >
          {title}
        </p>
        <h3 className="text-lg font-bold leading-tight mb-0.5">{card.name}</h3>
        <p className="text-[10px] uppercase opacity-90 mb-2">
          {TYPE_LABELS[card.type]} · {card.duration}
        </p>
        <p className="text-sm leading-relaxed opacity-95">{description}</p>
        {statusDogSeconds > 0 && (
          <p className="mt-2 text-sm font-semibold tabular-nums">
            Cover lifts in {statusDogSeconds}s
          </p>
        )}
        {faceSwapSeconds > 0 && (
          <p className="mt-2 text-sm font-semibold tabular-nums">
            Glitch clears in {faceSwapSeconds}s
          </p>
        )}
      </div>
    </div>
  );
}
