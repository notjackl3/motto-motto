interface StickerImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<StickerImageProps['size']>, string> = {
  sm: 'w-7 h-7',
  md: 'w-14 h-14',
  lg: 'w-24 h-24',
};

/** Renders a sticker PNG/SVG; tries fallbackSrc if primary 404s. */
export default function StickerImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  size = 'md',
}: StickerImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${SIZE[size]} object-contain drop-shadow-lg pointer-events-none select-none ${className}`}
      draggable={false}
      onError={
        fallbackSrc
          ? (e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackApplied === '1') return;
              img.dataset.fallbackApplied = '1';
              img.src = fallbackSrc;
            }
          : undefined
      }
    />
  );
}
