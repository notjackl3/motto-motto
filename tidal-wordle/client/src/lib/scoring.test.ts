import { describe, expect, it } from 'vitest';
import {
  criticsRatingStars,
  resolveCriticsRating,
  isMatchOver,
  soloCriticsRatingStars,
} from './scoring';

describe('scoring', () => {
  it('detects match over at 2 wins', () => {
    expect(isMatchOver({ me: 2, opponent: 0 }, 2)).toBe('me');
    expect(isMatchOver({ me: 1, opponent: 1 }, 2)).toBe(null);
  });

  it('computes critics star ratings', () => {
    const b = criticsRatingStars(
      [
        {
          word: 'WAVE',
          submittedAt: 0,
          results: [
            { letter: 'W', state: 'correct' },
            { letter: 'A', state: 'correct' },
            { letter: 'V', state: 'correct' },
            { letter: 'E', state: 'correct' },
          ],
        },
      ],
      []
    );
    expect(b.myStars).toBeGreaterThanOrEqual(1);
    expect(b.oppStars).toBeGreaterThanOrEqual(1);
  });

  it('solo critics returns stars only', () => {
    const perfect = soloCriticsRatingStars([
      {
        word: 'WAVE',
        submittedAt: 0,
        results: [
          { letter: 'W', state: 'correct' },
          { letter: 'A', state: 'correct' },
          { letter: 'V', state: 'correct' },
          { letter: 'E', state: 'correct' },
        ],
      },
    ]);
    expect(perfect.myStars).toBeGreaterThanOrEqual(4);

    const solo = resolveCriticsRating('solo', [], []);
    expect(solo.oppStars).toBe(0);
    expect(solo.myStars).toBeGreaterThanOrEqual(1);
  });
});
