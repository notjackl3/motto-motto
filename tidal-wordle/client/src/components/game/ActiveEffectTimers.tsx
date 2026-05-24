import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import StickerImage from '../cards/StickerImage';

/** Card-driven timers (forced break color reveal, Status Dog) — not guess cooldown. */
export default function ActiveEffectTimers() {
  const forcedBreakLabel = useGameStore((s) => s.forcedBreakLabel);
  const forcedBreakIconUrl = useGameStore((s) => s.forcedBreakIconUrl);
  const forcedBreakIconFallbackUrl = useGameStore((s) => s.forcedBreakIconFallbackUrl);
  const forcedBreakPending = useGameStore((s) => s.forcedBreakPending);
  const myGuesses = useGameStore((s) => s.myGuesses);
  const statusDogEffect = useGameStore((s) =>
    s.activeEffects.find(
      (e) => e.cardId === 'status-dog' && e.target === 'self' && e.expiresAt
    )
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const colorRevealEndsAt = useMemo(() => {
    let latest: number | null = null;
    for (const guess of myGuesses) {
      if (guess.colorsRevealAt && guess.colorsRevealAt > now) {
        if (latest === null || guess.colorsRevealAt > latest) {
          latest = guess.colorsRevealAt;
        }
      }
    }
    return latest;
  }, [myGuesses, now]);

  const colorRevealRemaining = colorRevealEndsAt
    ? Math.max(0, colorRevealEndsAt - now)
    : 0;
  const colorRevealSeconds = Math.ceil(colorRevealRemaining / 1000);

  const showColorReveal =
    Boolean(forcedBreakLabel) &&
    (forcedBreakPending || colorRevealSeconds > 0);

  const statusDogRemaining = statusDogEffect?.expiresAt
    ? Math.max(0, statusDogEffect.expiresAt - now)
    : 0;
  const statusDogSeconds = Math.ceil(statusDogRemaining / 1000);

  if (!showColorReveal && statusDogSeconds <= 0) return null;

  return (
    <div className="bg-black/40 rounded-lg p-3 text-center space-y-3 w-full">
      {showColorReveal && (
        <div>
          <div className="text-xs uppercase opacity-70">Color reveal</div>
          <div className="text-xl font-bold text-seafoam">
            {forcedBreakPending && colorRevealSeconds === 0
              ? 'Next guess'
              : `${colorRevealSeconds}s`}
          </div>
          {forcedBreakLabel && (
            <div className="flex flex-col items-center gap-1 mt-1">
              {forcedBreakIconUrl && (
                <StickerImage
                  src={forcedBreakIconUrl}
                  fallbackSrc={forcedBreakIconFallbackUrl ?? undefined}
                  alt=""
                  size="sm"
                  className="w-8 h-8"
                />
              )}
              <p className="text-xs text-seafoam/90 leading-snug">{forcedBreakLabel}</p>
            </div>
          )}
        </div>
      )}
      {statusDogSeconds > 0 && (
        <div className={showColorReveal ? 'border-t border-white/10 pt-2' : ''}>
          <div className="text-xs uppercase opacity-70">Status Dog</div>
          <div className="text-xl font-bold text-amber-300">{statusDogSeconds}s</div>
          <p className="text-xs mt-1 text-amber-200/80 leading-snug">
            One tile is covered on your board
          </p>
        </div>
      )}
    </div>
  );
}
