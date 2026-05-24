import type {
  Guess,
  HalfGuessMask,
  HalfGuessSide,
  LetterResult,
  LetterState,
} from '../types';

export function isHalfMasked(
  col: number,
  colCount: number,
  mask: HalfGuessMask | null,
  boardTarget: 'self' | 'opponent'
): boolean {
  if (!mask || mask.target !== boardTarget) return false;
  const split = Math.ceil(colCount / 2);
  if (mask.side === 'left') return col < split;
  return col >= split;
}

export function areGuessColorsRevealed(guess: Guess, now = Date.now()): boolean {
  if (!guess.colorsRevealAt) return true;
  return now >= guess.colorsRevealAt;
}

export function displayLetterState(
  result: LetterResult,
  masked: boolean,
  colorsRevealed = true
): LetterState {
  if (masked) return 'empty';
  if (!colorsRevealed && result.state !== 'empty') return 'empty';
  return result.state;
}

export function halfMaskOverlayClass(side: HalfGuessSide): string {
  return side === 'left'
    ? 'recipe-half-mask recipe-half-mask-left'
    : 'recipe-half-mask recipe-half-mask-right';
}

/** Insert bonus probe row at fixed index; later guesses fill rows below it. */
export function mergeBoardRowsWithProbe(
  guesses: Guess[],
  probe: Guess | null,
  probeRowIndex: number | null
): Guess[] {
  if (!probe || probeRowIndex === null) return guesses;
  const regular = guesses.filter((g) => !g.isProbe);
  const before = regular.slice(0, probeRowIndex);
  const after = regular.slice(probeRowIndex);
  return [...before, probe, ...after];
}
