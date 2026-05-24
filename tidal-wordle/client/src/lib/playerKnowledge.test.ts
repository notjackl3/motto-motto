import { describe, expect, it } from 'vitest';
import {
  buildLetterPattern,
  formatLetterPattern,
  selectPlayerKnowledge,
} from './playerKnowledge';

describe('playerKnowledge', () => {
  it('merges correct guesses and revealed letters', () => {
    const pattern = buildLetterPattern({
      answerLength: 5,
      revealedLetters: { 4: 'H' },
      myGuesses: [
        {
          word: 'BEACH',
          submittedAt: 0,
          results: [
            { letter: 'B', state: 'correct' },
            { letter: 'E', state: 'absent' },
            { letter: 'A', state: 'correct' },
            { letter: 'C', state: 'absent' },
            { letter: 'H', state: 'correct' },
          ],
        },
      ],
    });
    expect(pattern).toEqual(['B', '_', 'A', '_', 'H']);
    expect(formatLetterPattern(pattern!)).toBe('B, _, A, _, H');
  });

  it('selectPlayerKnowledge reports empty state', () => {
    const k = selectPlayerKnowledge({
      answerLength: null,
      revealedLetters: {},
      myGuesses: [],
      hints: [],
    });
    expect(k.hasContent).toBe(false);
  });

  it('selectPlayerKnowledge combines all sources', () => {
    const k = selectPlayerKnowledge({
      answerLength: 4,
      revealedLetters: { 0: 'W' },
      myGuesses: [],
      hints: [{ id: '1', text: 'Related word: swell', createdAt: 0 }],
    });
    expect(k.hasContent).toBe(true);
    expect(k.answerLength).toBe(4);
    expect(k.patternDisplay).toBe('W, _, _, _');
    expect(k.hints).toHaveLength(1);
  });
});
