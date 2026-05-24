import { describe, expect, it } from 'vitest';
import { getRelatedHint } from './relatedHints';

describe('getRelatedHint', () => {
  it('returns curated hint for known words', () => {
    expect(getRelatedHint('CORAL')).toBe('reef');
    expect(getRelatedHint('WAVE')).toBe('swell');
  });

  it('never returns empty', () => {
    expect(getRelatedHint('XYZZY').length).toBeGreaterThan(0);
  });
});
