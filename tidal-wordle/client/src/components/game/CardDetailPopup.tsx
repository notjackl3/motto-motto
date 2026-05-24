import { useEffect, useRef, useState } from 'react';
import { getCardDescription } from '../cards/CardDefinitions';
import type { Card } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { playCardFromHand } from '../../lib/cardEffects';

const ATTACK_FULLSCREEN_DURATION_MS = 4200;

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
  // Attack draws get a full-screen "you got hit" overlay instead of the
  // small anchored panel — bigger feedback, demands the player's attention,
  // can't be hidden behind the iPad UI.
  if (card.type === 'attack' && source === 'draw') {
    return <AttackHitOverlay card={card} onDismiss={dismiss} />;
  }

  // Attack cards auto-fire on draw (player can't activate their own damage)
  // and dice-roll is a meta reroll that also fires automatically.
  // Everything else with source 'draw' or 'hand' is sitting in myHand
  // ready to play.
  const isAutoFired = card.type === 'attack' || card.id === 'dice-roll';
  const inHand = !isAutoFired && (source === 'draw' || source === 'hand');
  const title = isAutoFired
    ? source === 'draw'
      ? card.type === 'attack'
        ? 'You got hit!'
        : 'Card drawn'
      : 'Card from history'
    : source === 'draw'
      ? 'Card drawn — ready to play'
      : source === 'hand'
        ? 'In your hand'
        : 'Card from history';
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
      className="absolute bottom-full left-1/2 z-[65] w-[min(100%,26rem)] -translate-x-1/2 mb-3 px-1 pointer-events-auto"
      role="dialog"
      aria-labelledby="card-detail-title"
    >
      <div
        className={`relative rounded-2xl border-2 p-6 pr-12 text-white shadow-2xl backdrop-blur-sm ${TYPE_STYLES[card.type]}`}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-black/25 text-xl leading-none hover:bg-black/40 transition"
          aria-label="Close card details"
        >
          ×
        </button>
        <p
          id="card-detail-title"
          className="text-[11px] uppercase tracking-widest opacity-80 mb-1.5"
        >
          {title}
        </p>
        <h3 className="text-2xl font-bold leading-tight mb-1">{card.name}</h3>
        <p className="text-[11px] uppercase tracking-wide opacity-90 mb-3">
          {TYPE_LABELS[card.type]} · {card.duration}
        </p>
        <p className="text-base leading-relaxed opacity-95 mb-3">{description}</p>
        {inHand ? (
          <button
            type="button"
            onClick={() => {
              playCardFromHand(card.id);
              dismiss();
            }}
            className="w-full mt-1 mb-1 bg-white/95 text-black font-bold uppercase tracking-wider text-sm py-3 rounded-md hover:bg-white transition shadow-md"
          >
            ▶ Play card
          </button>
        ) : (
          <div className="text-[11px] uppercase tracking-widest font-semibold opacity-90 bg-black/20 rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5">
            <span aria-hidden>{card.type === 'attack' ? '⚡' : '✓'}</span>
            {card.type === 'attack' && source === 'draw'
              ? 'Attack hit you — effect applied'
              : source === 'draw'
                ? 'Resolved automatically'
                : 'Played earlier this round'}
          </div>
        )}
        {card.apiSource && (
          <div className="mt-3 pt-3 border-t border-white/25">
            <p className="text-[10px] uppercase tracking-widest opacity-75 mb-1">
              Inspired by API
            </p>
            <p className="text-sm font-semibold leading-tight">
              {card.apiSource.category}
            </p>
            {card.apiSource.url ? (
              <a
                href={card.apiSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline decoration-white/50 hover:decoration-white opacity-90"
              >
                {card.apiSource.apiName} ↗
              </a>
            ) : (
              <p className="text-xs opacity-90">{card.apiSource.apiName}</p>
            )}
          </div>
        )}
        {statusDogSeconds > 0 && (
          <p className="mt-3 text-sm font-semibold tabular-nums">
            Cover lifts in {statusDogSeconds}s
          </p>
        )}
        {faceSwapSeconds > 0 && (
          <p className="mt-3 text-sm font-semibold tabular-nums">
            Glitch clears in {faceSwapSeconds}s
          </p>
        )}
      </div>
    </div>
  );
}

// Fullscreen attack-hit overlay. Used when the player draws an attack card —
// the chaos is forced on them, so the notification fills the viewport and
// auto-dismisses after a few seconds. Click anywhere to dismiss early.
function AttackHitOverlay({
  card,
  onDismiss,
}: {
  card: Card;
  onDismiss: () => void;
}) {
  const mode = useGameStore((s) => s.mode);
  const description = getCardDescription(card, mode);
  const [remaining, setRemaining] = useState(ATTACK_FULLSCREEN_DURATION_MS);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const left = Math.max(0, ATTACK_FULLSCREEN_DURATION_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(tick);
        onDismiss();
      }
    }, 80);
    return () => window.clearInterval(tick);
  }, [onDismiss]);

  const progress = remaining / ATTACK_FULLSCREEN_DURATION_MS;

  return (
    <div
      // fixed inset-0 = viewport-locked, immune to ancestor overflow/transform.
      // z-[110] sits above the iPad UI overlay (~z-30) and other effect
      // overlays so the player can't miss the hit.
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 pointer-events-auto p-4 attack-hit-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`attack-hit-${card.id}`}
      onClick={onDismiss}
    >
      <div
        // Stop propagation so clicking inside the panel doesn't dismiss
        // accidentally (the wrapper's onClick is the "click anywhere else").
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl border-4 border-red-300/70 bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-8 sm:p-10 text-white shadow-[0_0_60px_rgba(255,80,80,0.6)] attack-hit-shake"
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-md bg-black/30 text-2xl leading-none hover:bg-black/50 transition"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl" aria-hidden>
            ⚡
          </span>
          <p
            id={`attack-hit-${card.id}`}
            className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold opacity-90"
          >
            Attack — You got hit!
          </p>
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-2">
          {card.name}
        </h2>
        <p className="text-[11px] sm:text-xs uppercase tracking-widest opacity-80 mb-6">
          Attack · {card.duration}
        </p>
        <p className="text-lg sm:text-xl leading-relaxed opacity-95">
          {description}
        </p>
        {card.apiSource && (
          <div className="mt-6 pt-4 border-t border-white/30">
            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
              Inspired by API
            </p>
            <p className="text-sm font-semibold">{card.apiSource.category}</p>
            {card.apiSource.url && (
              <a
                href={card.apiSource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs underline decoration-white/50 hover:decoration-white opacity-90"
              >
                {card.apiSource.apiName} ↗
              </a>
            )}
          </div>
        )}
        <div className="mt-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full bg-white/85 transition-[width] duration-100 linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[10px] uppercase tracking-widest opacity-70">
            Auto-dismiss · click anywhere to continue
          </p>
        </div>
      </div>
    </div>
  );
}
