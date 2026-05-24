import { useEffect, useState } from 'react';
import { dismissOverlay } from '../../lib/cardEffects';

export const PLAYFUL_INSULT_MIN_MS = 3500;

interface PlayfulInsultBoardOverlayProps {
  overlayId: string;
  message: string;
}

export default function PlayfulInsultBoardOverlay({
  overlayId,
  message,
}: PlayfulInsultBoardOverlayProps) {
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(
      () => setCanDismiss(true),
      PLAYFUL_INSULT_MIN_MS
    );
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 pointer-events-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`playful-insult-${overlayId}`}
    >
      <div className="w-full max-w-sm rounded-2xl border-4 border-red-300 bg-red-500 px-6 py-5 text-center text-white shadow-2xl">
        <p className="text-[10px] uppercase tracking-widest opacity-80 mb-2">
          Playful Insult
        </p>
        <p
          id={`playful-insult-${overlayId}`}
          className="text-xl font-bold leading-snug"
        >
          {message}
        </p>
        {canDismiss ? (
          <button
            type="button"
            onClick={() => dismissOverlay(overlayId)}
            className="mt-5 w-full rounded-lg bg-white/25 py-2.5 text-sm font-semibold transition hover:bg-white/35"
          >
            Got it
          </button>
        ) : (
          <p className="mt-5 animate-pulse text-sm font-normal opacity-70">
            Hang on…
          </p>
        )}
      </div>
    </div>
  );
}
