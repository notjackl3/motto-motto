import { describe, expect, it } from 'vitest';
import {
  pickChessInfoLeakReveal,
  pickRandomHalfMaskSide,
} from './chessBlunderPenalties';

describe('pickChessInfoLeakReveal', () => {
  it('returns an unrevealed position and letter', () => {
    const reveal = pickChessInfoLeakReveal('BEACH', { 0: 'B', 2: 'A' });
    expect(reveal).not.toBeNull();
    expect(reveal!.letter).toBe('BEACH'[reveal!.position]);
    expect([0, 2]).not.toContain(reveal!.position);
  });

  it('returns null when every position is already revealed', () => {
    expect(
      pickChessInfoLeakReveal('HI', { 0: 'H', 1: 'I' })
    ).toBeNull();
  });
});

describe('pickRandomHalfMaskSide', () => {
  it('returns left or right', () => {
    const side = pickRandomHalfMaskSide();
    expect(['left', 'right']).toContain(side);
  });
});
