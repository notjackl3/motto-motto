import { useGameStore } from '../../stores/gameStore';
import StickerImage from '../cards/StickerImage';

/** Dev A fallback when face-swap-glitch fires (Dev B scene can also read faceSwap + faceSwapImageUrl). */
export default function FaceSwapHud() {
  const faceSwap = useGameStore((s) => s.faceSwap);
  const url = useGameStore((s) => s.faceSwapImageUrl);

  if (!faceSwap || !url) return null;

  return (
    <div
      className="absolute top-24 left-1/2 -translate-x-1/2 z-[35] pointer-events-none"
      aria-hidden
    >
      <StickerImage
        src={url}
        alt=""
        size="lg"
        className="w-32 h-32 drop-shadow-2xl animate-pulse"
      />
    </div>
  );
}
