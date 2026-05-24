import { describe, expect, it } from 'vitest';
import {
  applyRoundToMatch,
  computeRoundScoreAfterGuess,
  criticsRatingBonus,
  resolveCriticsRating,
  isMatchOver,
  soloCriticsRatingBonus,
  SOLO_CRITICS_STAR_THRESHOLD,
} from './scoring';

describe('scoring', () => {
  it('penalizes wrong guesses', () => {
    const score = computeRoundScoreAfterGuess(100, false);
    expect(score).toBe(90);
  });

  it('does not penalize winning guess', () => {
    const score = computeRoundScoreAfterGuess(100, true);
    expect(score).toBe(100);
  });

  it('detects match over at 2 wins', () => {
    expect(isMatchOver({ me: 2, opponent: 0 }, 2)).toBe('me');
    expect(isMatchOver({ me: 1, opponent: 1 }, 2)).toBe(null);
  });

  it('adds winner round score to match', () => {
    const m = applyRoundToMatch({ me: 50, opponent: 0 }, 'me', 80);
    expect(m.me).toBe(130);
  });

  it('computes critics bonus', () => {
    const b = criticsRatingBonus(
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
    expect(b.me).toBeGreaterThanOrEqual(0);
    expect(b.myStars).toBeGreaterThanOrEqual(1);
  });

  it('solo critics awards bonus at 4+ stars', () => {
    const perfect = soloCriticsRatingBonus([
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
    expect(perfect.myStars).toBeGreaterThanOrEqual(SOLO_CRITICS_STAR_THRESHOLD);
    expect(perfect.me).toBe(25);

    const solo = resolveCriticsRating('solo', [], []);
    expect(solo.oppStars).toBe(0);
    expect(solo.opponent).toBe(0);
  });
});
