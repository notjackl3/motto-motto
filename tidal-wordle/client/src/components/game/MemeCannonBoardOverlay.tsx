import StickerImage from '../cards/StickerImage';

interface MemeCannonBoardOverlayProps {
  caption: string;
  borderClass: string;
  memeHeroUrl?: string;
  memeHeroFallbackUrl?: string;
  stickerUrl?: string;
  stickerFallbackUrl?: string;
  stickerEmoji?: string;
}

export default function MemeCannonBoardOverlay({
  caption,
  borderClass,
  memeHeroUrl,
  memeHeroFallbackUrl,
  stickerUrl,
  stickerFallbackUrl,
  stickerEmoji = '🖼️',
}: MemeCannonBoardOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-stretch justify-center bg-black/70 p-3 pointer-events-none animate-[meme-cannon-drop_420ms_ease-out_both]"
      aria-hidden
    >
      <div
        className={`flex min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden rounded-xl border-4 bg-white text-black shadow-2xl ${borderClass}`}
      >
        {memeHeroUrl ? (
          <img
            src={memeHeroUrl}
            alt=""
            className="min-h-[55%] w-full flex-1 object-contain bg-black"
            onError={
              memeHeroFallbackUrl
                ? (e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied === '1') return;
                    img.dataset.fallbackApplied = '1';
                    img.src = memeHeroFallbackUrl;
                  }
                : undefined
            }
          />
        ) : (
          <div className="flex min-h-[55%] flex-1 items-center justify-center bg-slate-100">
            {stickerUrl ? (
              <StickerImage
                src={stickerUrl}
                fallbackSrc={stickerFallbackUrl}
                alt=""
                size="lg"
                className="w-32 h-32"
              />
            ) : (
              <span className="text-8xl">{stickerEmoji}</span>
            )}
          </div>
        )}
        <div className="flex flex-col items-center gap-2 px-4 py-4 text-center">
          {memeHeroUrl && stickerUrl && (
            <StickerImage
              src={stickerUrl}
              fallbackSrc={stickerFallbackUrl}
              alt=""
              size="md"
              className="-mt-1"
            />
          )}
          <p className="text-xl font-black uppercase leading-tight tracking-wide">
            {caption}
          </p>
          <p className="text-[10px] uppercase tracking-widest opacity-50">
            Meme cannon · clears on next guess
          </p>
        </div>
      </div>
    </div>
  );
}
