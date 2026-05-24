export interface MemeBoardSticker {
  row: number;
  col: number;
}

export function generateMemeBoardStickers(
  rowCount: number,
  maxCols: number,
  count = 4
): MemeBoardSticker[] {
  const stickers: MemeBoardSticker[] = [];
  const used = new Set<string>();
  const rows = Math.max(1, rowCount);
  const cols = Math.max(1, maxCols);

  for (let i = 0; i < count; i++) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const key = `${row}-${col}`;
    if (used.has(key)) continue;
    used.add(key);
    stickers.push({ row, col });
  }
  return stickers.length > 0 ? stickers : [{ row: 0, col: 0 }];
}
