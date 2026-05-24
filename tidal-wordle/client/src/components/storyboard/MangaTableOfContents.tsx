import type { StoryboardPage } from '../../types';

interface MangaTableOfContentsProps {
  pages: StoryboardPage[];
  activeIndex: number;
  onSelectChapter: (index: number) => void;
}

export default function MangaTableOfContents({
  pages,
  activeIndex,
  onSelectChapter,
}: MangaTableOfContentsProps) {
  if (pages.length === 0) {
    return (
      <p className="text-xs text-white/45 text-center py-8 px-4 italic leading-relaxed">
        Your table of contents fills in as you clear words. Chapter 1 appears
        after your first solve.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-1.5 pb-2">
      {pages.map((page, index) => (
        <li key={page.id}>
          <button
            type="button"
            onClick={() => onSelectChapter(index)}
            className={`w-full flex gap-2.5 items-stretch text-left rounded-lg border px-2 py-2 transition-colors ${
              index === activeIndex
                ? 'border-seafoam/50 bg-seafoam/15'
                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
            }`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            <ChapterThumb page={page} />
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-brass/80 shrink-0">
                  Ch.{page.roundIndex}
                </span>
                <StatusBadge status={page.status} />
              </div>
              <span className="font-display font-bold text-sm uppercase tracking-wide text-sand truncate">
                {page.word}
              </span>
              <span className="text-[10px] text-white/55 line-clamp-2 leading-snug">
                {page.caption}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}

function ChapterThumb({ page }: { page: StoryboardPage }) {
  const src = page.imageUrl ?? page.imageFallbackUrl;

  return (
    <div className="w-14 h-14 shrink-0 rounded overflow-hidden border border-white/15 bg-black/40 relative">
      {page.status === 'generating' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-deep/80">
          <div className="manga-generating-spinner scale-75" aria-hidden />
        </div>
      ) : src ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (
              page.imageFallbackUrl &&
              img.src !== page.imageFallbackUrl
            ) {
              img.src = page.imageFallbackUrl;
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-deep via-ocean to-seafoam/30" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: StoryboardPage['status'] }) {
  if (status === 'generating') {
    return (
      <span className="font-mono text-[7px] tracking-wider uppercase text-amber-200/80 shrink-0">
        Drawing…
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="font-mono text-[7px] tracking-wider uppercase text-coral/80 shrink-0">
        Error
      </span>
    );
  }
  return (
    <span className="font-mono text-[7px] tracking-wider uppercase text-seafoam/70 shrink-0">
      Ready
    </span>
  );
}
