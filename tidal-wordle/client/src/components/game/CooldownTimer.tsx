import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import StickerImage from '../cards/StickerImage';

export default function CooldownTimer() {
  const endsAt = useGameStore((s) => s.myCooldownEndsAt);
  const cooldownFrozen = useGameStore((s) => s.cooldownFrozen);
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

  const guessCooldownRemaining =
    endsAt && !cooldownFrozen ? Math.max(0, endsAt - now) : 0;
  const guessSeconds = Math.ceil(guessCooldownRemaining / 1000);

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

  return (
    <div className="bg-black/40 rounded-lg p-3 text-center space-y-3">
      <div>
        <div className="text-xs uppercase opacity-70">Guess cooldown</div>
        <div className="text-2xl font-bold">
          {cooldownFrozen ? 'Paused' : guessSeconds > 0 ? `${guessSeconds}s` : 'Ready'}
        </div>
      </div>
      {showColorReveal && (
        <div className="border-t border-white/10 pt-2">
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
        <div className="border-t border-white/10 pt-2">
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
