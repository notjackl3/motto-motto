import StickerImage from '../cards/StickerImage';

interface FaceSwapBoardOverlayProps {
  faceImageUrl: string;
  faceImageFallbackUrl?: string;
  tagline: string;
  secondsLeft: number;
}

export default function FaceSwapBoardOverlay({
  faceImageUrl,
  faceImageFallbackUrl,
  tagline,
  secondsLeft,
}: FaceSwapBoardOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-2 bg-black/60 p-4 pointer-events-none face-swap-glitch-overlay"
      aria-hidden
    >
      <StickerImage
        src={faceImageUrl}
        fallbackSrc={faceImageFallbackUrl}
        alt=""
        size="lg"
        className="w-40 h-40 max-w-[70%] drop-shadow-2xl face-swap-glitch-face"
      />
      <p className="text-center text-sm font-bold uppercase tracking-wide text-white drop-shadow-md">
        {tagline}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-white/70 tabular-nums">
        Face swap · {secondsLeft}s
      </p>
    </div>
  );
}
