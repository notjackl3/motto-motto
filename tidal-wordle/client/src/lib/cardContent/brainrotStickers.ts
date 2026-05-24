import type { BrainrotVariant } from './tierBVariants';
import type { LetterState } from '../../types';

export interface BrainrotSticker {
  row: number;
  col: number;
  state: LetterState;
}

const STATES: LetterState[] = ['correct', 'present', 'absent'];

export function generateBrainrotStickers(
  rowCount: number,
  maxCols: number,
  style: BrainrotVariant['stickerStyle']
): BrainrotSticker[] {
  const count = style === 'scatter' ? 6 + Math.floor(Math.random() * 4) : 4;
  const stickers: BrainrotSticker[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const row = Math.floor(Math.random() * Math.max(1, rowCount));
    const col = Math.floor(Math.random() * Math.max(1, maxCols));
    const key = `${row}-${col}`;
    if (used.has(key)) continue;
    used.add(key);
    stickers.push({
      row,
      col,
      state: STATES[Math.floor(Math.random() * STATES.length)],
    });
  }
  return stickers;
}

export function stickerAccentClass(state: LetterState): string {
  switch (state) {
    case 'correct':
      return 'bg-emerald-500/90 border-emerald-300';
    case 'present':
      return 'bg-amber-500/90 border-amber-300';
    default:
      return 'bg-slate-500/90 border-slate-400';
  }
}
