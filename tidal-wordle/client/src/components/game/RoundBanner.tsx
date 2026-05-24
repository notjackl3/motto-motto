import { useGameStore } from '../../stores/gameStore';
import CriticsStars from './CriticsStars';

export default function RoundBanner() {
  const banner = useGameStore((s) => s.roundBanner);
  const mode = useGameStore((s) => s.mode);
  const dismissRoundBanner = useGameStore((s) => s.dismissRoundBanner);
  const startRound = useGameStore((s) => s.startRound);
  const matchWinner = useGameStore((s) => s.matchWinner);

  if (!banner) return null;

  function skipWait() {
    dismissRoundBanner();
    if (!matchWinner) startRound();
  }

  const won = banner.winner === 'me';
  const title =
    mode === 'solo' && won
      ? `Word cleared! · Ch. ${banner.roundNumber}`
      : won
        ? 'Round won!'
        : mode === 'solo'
          ? 'Round lost'
          : 'Opponent won the round';

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="bg-deep/95 border border-seafoam/50 rounded-xl px-8 py-6 text-center shadow-2xl pointer-events-auto">
        <h3 className="text-2xl font-bold text-seafoam mb-1">{title}</h3>
        {banner.criticsStars && (
          <p className="text-sm text-white/70 mt-2">
            {mode === 'solo' ? (
              <>
                Critic&apos;s Rating:{' '}
                <CriticsStars count={banner.criticsStars.me} />
              </>
            ) : (
              <>
                Critic&apos;s Rating: You{' '}
                <CriticsStars count={banner.criticsStars.me} /> | Opp{' '}
                <CriticsStars count={banner.criticsStars.opponent} />
              </>
            )}
          </p>
        )}
        <p className="text-xs text-white/50 mt-3">
          {mode === 'solo' ? 'Next word loading…' : 'Next round starting…'}
        </p>
        <button
          type="button"
          onClick={skipWait}
          className="mt-3 text-xs underline text-white/60 hover:text-white"
        >
          Skip wait
        </button>
      </div>
    </div>
  );
}
