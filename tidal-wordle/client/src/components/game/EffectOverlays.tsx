import { dismissOverlay, solveChessPuzzle } from '../../lib/cardEffects';
import { useGameStore } from '../../stores/gameStore';

export default function EffectOverlays() {
  const overlays = useGameStore((s) => s.overlays);
  const hints = useGameStore((s) => s.hints);
  const lastCritics = useGameStore((s) => s.lastCriticsRatings);

  return (
    <>
      {hints.length > 0 && (
        <div className="absolute top-20 left-4 max-w-xs z-30 flex flex-col gap-1">
          {hints.slice(-3).map((h) => (
            <div
              key={h.id}
              className="bg-emerald-900/90 border border-emerald-400 rounded px-3 py-2 text-sm"
            >
              {h.text}
            </div>
          ))}
        </div>
      )}

      {lastCritics && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-purple-900/90 rounded px-4 py-2 text-sm">
          Critic&apos;s Rating: You {'★'.repeat(lastCritics.me)} | Opponent{' '}
          {'★'.repeat(lastCritics.opponent)}
        </div>
      )}

      {overlays.map((overlay) => (
        <Overlay key={overlay.id} overlay={overlay} />
      ))}
    </>
  );
}

function Overlay({
  overlay,
}: {
  overlay: {
    id: string;
    type: string;
    message?: string;
    dismissable?: boolean;
  };
}) {
  const dismiss = () => dismissOverlay(overlay.id);

  switch (overlay.type) {
    case 'meme-cannon':
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="bg-white text-black p-6 rounded-lg max-w-sm text-center border-4 border-black">
            <div className="text-6xl mb-2">🖼️</div>
            <p className="font-impact text-xl uppercase">{overlay.message}</p>
            <p className="text-xs mt-2 opacity-60">meme cannon</p>
          </div>
        </div>
      );
    case 'playful-insult':
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-xl max-w-xs text-center">
            {overlay.message}
          </div>
        </div>
      );
    case 'forced-break':
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white text-deep p-8 rounded-xl max-w-md text-center shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Forced Break</h3>
            <p className="mb-4">{overlay.message}</p>
            <button
              onClick={dismiss}
              className="bg-seafoam text-deep font-semibold px-6 py-2 rounded"
            >
              Continue
            </button>
          </div>
        </div>
      );
    case 'bored-distraction':
      return (
        <div className="absolute bottom-24 right-4 z-40 bg-amber-100 text-amber-900 p-4 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-medium">{overlay.message}</p>
          {overlay.dismissable && (
            <button
              onClick={dismiss}
              className="mt-2 text-xs underline"
            >
              Dismiss
            </button>
          )}
        </div>
      );
    case 'recipe-spam':
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-amber-50 text-amber-950 w-96 max-h-80 overflow-hidden rounded-lg shadow-2xl relative">
            <div className="p-4 border-b font-serif text-lg font-bold">
              Sandy&apos;s Sunset Scones
            </div>
            <div className="p-4 h-48 overflow-y-auto text-sm whitespace-pre-line recipe-scroll">
              {overlay.message}
            </div>
            <button
              onClick={dismiss}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs"
            >
              X
            </button>
          </div>
        </div>
      );
    case 'rejection-letter':
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white text-gray-800 p-8 rounded shadow-xl max-w-md font-serif">
            <p className="text-xs uppercase tracking-widest mb-4 opacity-50">
              HR Department — Beach Corp
            </p>
            <p className="mb-4 leading-relaxed">{overlay.message}</p>
            <button
              onClick={dismiss}
              className="text-sm underline"
            >
              Close
            </button>
          </div>
        </div>
      );
    case 'chess-gambit':
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white text-deep p-6 rounded-xl max-w-sm text-center">
            <h3 className="font-bold text-lg mb-2">Chess Gambit</h3>
            <p className="text-sm mb-4">White to move. Win material in one move.</p>
            <div className="text-4xl mb-4 font-mono">♔ ♕ ♖</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => solveChessPuzzle(false)}
                className="bg-slate-200 px-4 py-2 rounded text-sm"
              >
                Qh5 (wrong)
              </button>
              <button
                onClick={() => solveChessPuzzle(true)}
                className="bg-seafoam px-4 py-2 rounded text-sm font-semibold"
              >
                Qxf7+ (correct)
              </button>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
