import type { Guess, Hint } from '../types';

export interface PlayerKnowledgeInput {
  answerLength: number | null;
  revealedLetters: Record<number, string>;
  myGuesses: Guess[];
  hints: Hint[];
}

/** Merges correct guess tiles and card-revealed letters into one pattern. */
export function buildLetterPattern(input: {
  answerLength: number | null;
  revealedLetters: Record<number, string>;
  myGuesses: Guess[];
}): string[] | null {
  const { answerLength, revealedLetters, myGuesses } = input;
  const revealedPositions = Object.keys(revealedLetters).map(Number);

  let maxFromGuesses = 0;
  for (const g of myGuesses) {
    g.results.forEach((r, i) => {
      if (r.state !== 'correct') return;
      const pos = r.answerIndex ?? i;
      maxFromGuesses = Math.max(maxFromGuesses, pos + 1);
    });
  }

  const span =
    answerLength ??
    Math.max(
      maxFromGuesses,
      revealedPositions.length > 0 ? Math.max(...revealedPositions) + 1 : 0
    );

  if (span <= 0) return null;

  const pattern = Array<string>(span).fill('_');

  for (const g of myGuesses) {
    g.results.forEach((r, i) => {
      if (r.state !== 'correct') return;
      const pos = r.answerIndex ?? i;
      if (pos >= 0 && pos < span) pattern[pos] = r.letter;
    });
  }
  for (const [pos, letter] of Object.entries(revealedLetters)) {
    const i = Number(pos);
    if (i >= 0 && i < span) pattern[i] = letter;
  }

  return pattern.every((c) => c === '_') ? null : pattern;
}

export function formatLetterPattern(pattern: string[]): string {
  return pattern.join(', ');
}

/** When the player doesn't know the answer length yet, append an "…" to the
 *  rendered pattern so they don't misread "_, E" as "two-letter word ending
 *  in E". The ellipsis hints that more positions exist that are still
 *  unknown. */
function withUnknownTail(displayed: string): string {
  return `${displayed}, …`;
}

export function selectPlayerKnowledge(input: PlayerKnowledgeInput) {
  const pattern = buildLetterPattern(input);
  const hints = input.hints;
  const lengthUnknown = input.answerLength === null;

  const patternDisplay = pattern
    ? lengthUnknown
      ? withUnknownTail(formatLetterPattern(pattern))
      : formatLetterPattern(pattern)
    : null;

  return {
    answerLength: input.answerLength,
    pattern,
    patternDisplay,
    hints,
    hasContent:
      input.answerLength !== null || pattern !== null || hints.length > 0,
  };
}
