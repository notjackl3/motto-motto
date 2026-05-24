import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import StoryboardPageView from './StoryboardPageView';

interface PhoneStoryboardUIProps {
  onClose: () => void;
}

export default function PhoneStoryboardUI({ onClose }: PhoneStoryboardUIProps) {
  const pages = useGameStore((s) => s.storyboardPages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, pages.length - 1)
  );

  useEffect(() => {
    if (pages.length === 0) return;
    setActiveIndex(pages.length - 1);
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [pages.length]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || pages.length === 0) return;
    const pageHeight = el.clientHeight;
    if (pageHeight <= 0) return;
    const idx = Math.round(el.scrollTop / pageHeight);
    setActiveIndex(Math.min(Math.max(0, idx), pages.length - 1));
  }, [pages.length]);

  function scrollToPage(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: index * el.clientHeight, behavior: 'smooth' });
  }

  return (
    <div className="phone-storyboard h-full w-full flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex flex-col">
          <span className="font-mono text-[8px] tracking-[0.28em] uppercase text-brass/80">
            Surf Manga
          </span>
          <span className="text-[10px] text-white/55">
            {pages.length === 0
              ? 'Clear a word to open chapter 1'
              : `${pages.length} chapter${pages.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[9px] tracking-wider uppercase text-white/50 hover:text-coral px-2 py-1 rounded border border-white/10 hover:border-coral/50 transition-colors"
          aria-label="Put phone away"
        >
          Stow
        </button>
      </header>

      {pages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="text-2xl opacity-40" aria-hidden>
            📖
          </span>
          <p className="text-xs text-white/45 leading-relaxed">
            Each word you clear adds a manga panel. Clear all 500+ beach words
            to complete your surf manga epic.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth phone-storyboard-scroll"
          >
            {pages.map((page) => (
              <div
                key={page.id}
                className="h-full min-h-full snap-start snap-always px-2 py-2 box-border"
              >
                <StoryboardPageView page={page} />
              </div>
            ))}
          </div>

          <footer className="shrink-0 flex items-center justify-center gap-1.5 py-2 border-t border-white/10">
            {pages.map((page, i) => (
              <button
                key={page.id}
                type="button"
                onClick={() => scrollToPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === activeIndex ? 'bg-seafoam' : 'bg-white/25 hover:bg-white/45'
                }`}
                aria-label={`Go to panel ${i + 1}`}
                aria-current={i === activeIndex ? 'true' : undefined}
              />
            ))}
          </footer>
        </>
      )}
    </div>
  );
}
