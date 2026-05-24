import type { StoryboardPage } from '../../types';

interface StoryboardPageViewProps {
  page: StoryboardPage;
}

export default function StoryboardPageView({ page }: StoryboardPageViewProps) {
  const isGenerating = page.status === 'generating';

  return (
    <article
      className="storyboard-page snap-start shrink-0 w-full flex flex-col h-full"
      aria-label={`Round ${page.roundIndex}: ${page.word}`}
    >
      <div className="manga-panel relative flex-1 min-h-0 overflow-hidden rounded-sm">
        {isGenerating ? (
          <GeneratingPlaceholder roundIndex={page.roundIndex} word={page.word} />
        ) : page.imageUrl ? (
          <>
            <img
              src={page.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover manga-panel-art"
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
            <MangaSpeedLines />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-deep via-ocean to-seafoam/30" />
        )}

        <div className="absolute top-2 left-2 font-mono text-[8px] tracking-widest uppercase text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
          Ch.{page.roundIndex}
        </div>

        <div className="absolute bottom-3 left-2 right-2 manga-speech-bubble">
          <p className="font-bold text-sm leading-tight text-deep mb-1">
            {page.caption}
          </p>
          <p className="text-[11px] leading-snug text-deep/85">
            {page.narrative}
          </p>
        </div>
      </div>
    </article>
  );
}

function GeneratingPlaceholder({
  roundIndex,
  word,
}: {
  roundIndex: number;
  word: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-deep to-ocean">
      <div className="manga-generating-spinner" aria-hidden />
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-seafoam/80">
        Drawing panel…
      </p>
      <p className="text-xs text-white/50">
        Round {roundIndex} · {word}
      </p>
    </div>
  );
}

function MangaSpeedLines() {
  return (
    <>
      <div className="manga-speed-lines pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 border-2 border-black/80 rounded-sm" />
    </>
  );
}
