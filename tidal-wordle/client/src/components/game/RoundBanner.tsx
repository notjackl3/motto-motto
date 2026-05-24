import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import CriticsStars from './CriticsStars';

// Auto-advances the round 3 seconds after a banner appears. We mirror the
// 2.5s setTimeout already inside gameStore.endRound — having it here too
// guarantees the next round triggers even if the store-side timer was
// missed (e.g. component remount). Skip-wait button stays for impatient
// players.
const AUTO_ADVANCE_MS = 3000;

export default function RoundBanner() {
  const banner = useGameStore((s) => s.roundBanner);
  const mode = useGameStore((s) => s.mode);
  const dismissRoundBanner = useGameStore((s) => s.dismissRoundBanner);
  const startRound = useGameStore((s) => s.startRound);
  const matchWinner = useGameStore((s) => s.matchWinner);
  const matchScore = useGameStore((s) => s.matchScore);
  const [remaining, setRemaining] = useState(AUTO_ADVANCE_MS);

  // Reset / tick countdown each time a new banner appears.
  useEffect(() => {
    if (!banner || matchWinner) return;
    setRemaining(AUTO_ADVANCE_MS);
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, AUTO_ADVANCE_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(interval);
        // Re-read so we don't double-advance if the store timer fired first.
        const live = useGameStore.getState();
        if (live.roundBanner && !live.matchWinner) {
          live.dismissRoundBanner();
          live.startRound();
        }
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [banner, matchWinner]);

  if (!banner) return null;

  function skipWait() {
    dismissRoundBanner();
    if (!matchWinner) startRound();
  }

  const won = banner.winner === 'me';
  const title = won
    ? 'Round won!'
    : mode === 'solo'
      ? 'Round lost'
      : 'Opponent won the round';
  const seconds = (remaining / 1000).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none p-4"
      role="status"
      aria-live="polite"
    >
      <div className="instrument-panel bracket-corners relative w-[min(28rem,90vw)] px-8 py-6 text-center text-white shadow-2xl pointer-events-auto">
        <span className="bracket-bl" />
        <span className="bracket-br" />
        <p className="label-instrument mb-1">
          Heat · Round {banner.roundNumber} of 3
        </p>
        <h3
          className={`text-3xl font-extrabold mb-1 ${
            won ? 'text-seafoam' : 'text-sand'
          }`}
        >
          {title}
        </h3>
        {banner.criticsStars && (
          <p className="text-sm text-white/80 mt-1">
            {mode === 'solo' ? (
              <>
                Critic&apos;s rating:{' '}
                <CriticsStars count={banner.criticsStars.me} />
              </>
            ) : (
              <>
                Critic&apos;s rating: You{' '}
                <CriticsStars count={banner.criticsStars.me} /> · Opp{' '}
                <CriticsStars count={banner.criticsStars.opponent} />
              </>
            )}
          </p>
        )}
        {typeof banner.roundScore === 'number' && (
          <p className="text-sm text-white/85 mt-2">
            <span className="opacity-70">Round score</span>{' '}
            <span className="font-bold text-seafoam tabular-nums">
              +{banner.roundScore}
            </span>{' '}
            <span className="opacity-50">·</span>{' '}
            <span className="opacity-70">Match</span>{' '}
            <span className="font-bold text-sand tabular-nums">
              {matchScore}
            </span>
          </p>
        )}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30 mb-2">
            <div
              className="h-full bg-seafoam transition-[width] duration-100 linear"
              style={{
                width: `${(remaining / AUTO_ADVANCE_MS) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-white/70">
            Next round in <span className="tabular-nums">{seconds}s</span>
          </p>
        </div>
        <button
          type="button"
          onClick={skipWait}
          className="mt-4 px-4 py-2 text-sm font-semibold uppercase tracking-wider bg-seafoam text-deep rounded-md hover:bg-white transition"
        >
          Skip · Next round
        </button>
      </div>
    </div>
  );
}
