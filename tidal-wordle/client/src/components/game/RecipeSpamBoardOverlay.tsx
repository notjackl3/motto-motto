import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { HalfGuessSide } from '../../types';

function panelSideClass(side: HalfGuessSide): string {
  return side === 'left' ? 'left-0 border-r' : 'right-0 border-l';
}

export default function RecipeSpamBoardOverlay() {
  const overlay = useGameStore((s) =>
    s.overlays.find(
      (o) =>
        o.type === 'recipe-spam' &&
        ((o.meta?.target as string | undefined) ?? 'self') === 'self'
    )
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const maskSide = (overlay?.meta?.maskSide as HalfGuessSide | undefined) ?? 'right';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollHeight <= el.clientHeight) return;

    let frame = 0;
    let scrollTop = 0;
    const tick = () => {
      scrollTop += 0.35;
      const max = el.scrollHeight - el.clientHeight;
      if (scrollTop >= max) scrollTop = 0;
      el.scrollTop = scrollTop;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [overlay?.id, overlay?.message]);

  if (!overlay) return null;

  const meta = overlay.meta ?? {};
  const recipeTitle =
    (meta.recipeTitle as string) ?? "Sandy's Sunset Scones";
  const headerImageUrl = meta.headerImageUrl as string | undefined;
  const ingredients = overlay.message
    ? overlay.message.split('\n').filter(Boolean)
    : [];

  return (
    <div
      className={`absolute top-0 bottom-0 z-20 flex w-1/2 flex-col overflow-hidden border-amber-200 bg-amber-50 text-amber-950 shadow-lg pointer-events-none ${panelSideClass(maskSide)}`}
      aria-hidden
    >
      {headerImageUrl && (
        <img
          src={headerImageUrl}
          alt=""
          className="h-14 w-full shrink-0 object-cover"
        />
      )}
      <div className="shrink-0 border-b border-amber-200 px-3 py-2 font-serif text-sm font-bold leading-snug">
        {recipeTitle}
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-2 text-xs leading-relaxed"
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-700/80">
          Ingredients
        </p>
        <ul className="space-y-1.5">
          {ingredients.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-amber-600/70">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="shrink-0 border-t border-amber-200 px-3 py-1.5 text-[10px] leading-snug opacity-60">
        Submit your next guess to dismiss early.
      </p>
    </div>
  );
}
