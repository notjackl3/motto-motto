import { useRef } from 'react';
import { dismissOverlay } from '../../lib/cardEffects';
import ChessGambitOverlay from './ChessGambitOverlay';
import RejectionLetterOverlay from './RejectionLetterOverlay';
import { useGameStore } from '../../stores/gameStore';

export default function EffectOverlays() {
  const overlays = useGameStore((s) => s.overlays);

  return (
    <>
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
    meta?: Record<string, unknown>;
  };
}) {
  const dismiss = () => dismissOverlay(overlay.id);
  const meta = overlay.meta ?? {};

  switch (overlay.type) {
    case 'bored-distraction':
      return (
        <BoredDistractionOverlay
          overlayId={overlay.id}
          title={(meta.title as string) ?? overlay.message ?? 'Distraction'}
          paragraphs={(meta.paragraphs as string[]) ?? [overlay.message ?? '']}
          headerImageUrl={meta.headerImageUrl as string | undefined}
        />
      );
    case 'rejection-letter':
      return (
        <RejectionLetterOverlay
          overlayId={overlay.id}
          message={overlay.message ?? ''}
          letterhead={meta.letterhead as string | undefined}
          letterheadImageUrl={meta.letterheadImageUrl as string | undefined}
          paperTextureUrl={meta.paperTextureUrl as string | undefined}
        />
      );
    case 'chess-gambit':
      return (
        <ChessGambitOverlay
          puzzleId={(meta.puzzleId as string) ?? 'scholars-mate-f7'}
        />
      );
    default:
      return null;
  }
}

function BoredDistractionOverlay({
  overlayId,
  title,
  paragraphs,
  headerImageUrl,
}: {
  overlayId: string;
  title: string;
  paragraphs: string[];
  headerImageUrl?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const clearDistractionBlock = useGameStore((s) => s.clearDistractionBlock);

  const tryDismiss = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 24;
    if (atBottom) {
      dismissOverlay(overlayId);
      clearDistractionBlock();
    }
  };

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/65 pointer-events-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`bored-distraction-${overlayId}`}
    >
      <div className="flex w-full max-w-lg max-h-[min(92vh,100%)] flex-col overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-950 shadow-2xl">
        <div className="shrink-0 bg-red-500/95 px-4 py-3 text-white border-b border-amber-200">
          <p className="text-[10px] uppercase tracking-widest opacity-80">
            Card drawn
          </p>
          <h2
            id={`bored-distraction-${overlayId}`}
            className="text-lg font-bold leading-tight"
          >
            Bored Distraction
          </h2>
          <p className="text-[10px] uppercase opacity-90 mt-0.5">
            Attack · instant
          </p>
          <p className="mt-2 text-sm leading-snug opacity-95">
            Chaos draw — a corner distraction with a random activity suggestion.
          </p>
        </div>
        {headerImageUrl && (
          <img
            src={headerImageUrl}
            alt=""
            className="h-28 w-full shrink-0 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="shrink-0 border-b border-amber-200 px-4 py-2.5 font-bold text-base leading-snug">
          {title}
        </div>
        <div
          ref={scrollRef}
          onScroll={tryDismiss}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {paragraphs.map((p, i) => (
            <section
              key={i}
              className="mb-4 min-h-[70vh] border-b border-amber-100/80 pb-8 last:border-b-0"
            >
              <p className="opacity-50 text-[10px] uppercase tracking-widest mb-3">
                Section {i + 1} of {paragraphs.length}
              </p>
              <p>{p}</p>
            </section>
          ))}
          <section className="min-h-[50vh] flex flex-col justify-end pb-16">
            <p className="font-semibold text-amber-800 text-center">
              ↓ Scroll to the bottom to continue playing ↓
            </p>
            <p className="mt-6 opacity-60">{paragraphs[0]}</p>
          </section>
        </div>
        <div className="shrink-0 border-t border-amber-200 p-2 text-center text-[10px] opacity-70">
          Keep scrolling…
        </div>
      </div>
    </div>
  );
}
