import { describe, expect, it } from 'vitest';
import {
  getAllWords,
  getRandomWord,
  getRandomWordOfLength,
  isValidGuess,
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
} from './wordList';

describe('wordList', () => {
  it('filters words to allowed lengths', () => {
    const words = getAllWords();
    expect(words.length).toBeGreaterThan(50);
    for (const w of words) {
      expect(w.length).toBeGreaterThanOrEqual(MIN_WORD_LENGTH);
      expect(w.length).toBeLessThanOrEqual(MAX_WORD_LENGTH);
    }
  });

  it('validates dictionary words', () => {
    expect(isValidGuess('BEACH')).toBe(true);
    expect(isValidGuess('ZZZZZ')).toBe(false);
  });

  it('returns words of requested length when possible', () => {
    const w = getRandomWordOfLength(5);
    expect(w.length).toBe(5);
  });

  it('getRandomWord returns from list', () => {
    const w = getRandomWord();
    expect(getAllWords()).toContain(w);
  });
});
