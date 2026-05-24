import { describe, expect, it } from 'vitest';
import {
  computeRoundScore,
  criticsRatingStars,
  resolveCriticsRating,
  isMatchOver,
  ROUND_SCORE_BASE,
  ROUND_SCORE_MIN,
  ROUND_SCORE_PENALTY_PER_GUESS,
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

  it('computes round score that decreases with guess count', () => {
    expect(computeRoundScore(1, true)).toBe(ROUND_SCORE_BASE);
    expect(computeRoundScore(2, true)).toBe(
      ROUND_SCORE_BASE - ROUND_SCORE_PENALTY_PER_GUESS
    );
    expect(computeRoundScore(5, true)).toBe(
      ROUND_SCORE_BASE - 4 * ROUND_SCORE_PENALTY_PER_GUESS
    );
  });

  it('round score floors at ROUND_SCORE_MIN', () => {
    expect(computeRoundScore(20, true)).toBe(ROUND_SCORE_MIN);
    expect(computeRoundScore(100, true)).toBe(ROUND_SCORE_MIN);
  });

  it('round score is 0 for a lost round', () => {
    expect(computeRoundScore(1, false)).toBe(0);
    expect(computeRoundScore(5, false)).toBe(0);
  });

  it('round score is 0 when no guesses were submitted', () => {
    expect(computeRoundScore(0, true)).toBe(0);
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
