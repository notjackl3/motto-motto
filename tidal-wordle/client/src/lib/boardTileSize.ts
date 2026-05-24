/** Tile + row layout classes scaled to letter count (words up to 10 letters). */
export function boardRowLayout(colCount: number): {
  gridTemplateColumns: string;
  gapClass: string;
  fontClass: string;
  maxWidthPx: number;
  tileWidthPx: number;
} {
  const cols = Math.max(colCount, 1);
  const gapClass =
    cols <= 6 ? 'gap-1' : cols <= 8 ? 'gap-0.5' : 'gap-px';
  const fontClass =
    cols <= 5
      ? 'text-sm'
      : cols <= 7
        ? 'text-xs'
        : cols <= 9
          ? 'text-[10px]'
          : 'text-[9px]';
  const maxTilePx = cols <= 5 ? 44 : cols <= 7 ? 38 : cols <= 9 ? 32 : 28;
  const gapPx = cols <= 6 ? 4 : 2;
  const maxWidthPx = cols * maxTilePx + (cols - 1) * gapPx;
  return {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gapClass,
    fontClass,
    maxWidthPx,
    tileWidthPx: maxTilePx,
  };
}
