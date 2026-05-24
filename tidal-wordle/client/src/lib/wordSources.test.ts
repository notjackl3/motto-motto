import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetWordSourcesForTests,
  _seedCacheForTests,
  extractPlayableWords,
  getRandomFetchedWord,
  loadedTopics,
  prefetchTopics,
} from './wordSources';

describe('wordSources.extractPlayableWords', () => {
  it('keeps single-word lowercase terms in the allowed length range', () => {
    const words = extractPlayableWords([
      { term: 'beach' },
      { term: 'ocean' },
      { term: 'surf' },
    ]);
    expect(words).toContain('BEACH');
    expect(words).toContain('OCEAN');
    expect(words).toContain('SURF');
  });

  it('splits multi-word terms and keeps each playable token', () => {
    const words = extractPlayableWords([{ term: 'sandy beach holiday' }]);
    expect(words).toEqual(expect.arrayContaining(['SANDY', 'BEACH', 'HOLIDAY']));
  });

  it('drops words outside MIN_WORD_LENGTH..MAX_WORD_LENGTH', () => {
    const words = extractPlayableWords([
      { term: 'a' },
      { term: 'to' },
      { term: 'antidisestablishmentarianism' },
    ]);
    expect(words).toHaveLength(0);
  });

  it('drops non-alphabetic tokens and ignores bad shapes', () => {
    const words = extractPlayableWords([
      { term: '12345' },
      { term: "isn't" },
      { term: 'wave' },
      { not_a_term: 'x' } as unknown,
      null,
    ]);
    expect(words).toEqual(['WAVE']);
  });

  it('returns [] for non-array input', () => {
    expect(extractPlayableWords(null)).toEqual([]);
    expect(extractPlayableWords({})).toEqual([]);
    expect(extractPlayableWords('beach')).toEqual([]);
  });
});

describe('wordSources.prefetchTopics', () => {
  beforeEach(() => {
    _resetWordSourcesForTests();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    _resetWordSourcesForTests();
  });

  it('populates cache for successful topics and skips failures', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('term=beach')) {
        return new Response(JSON.stringify([{ term: 'sandy' }, { term: 'wave' }]), {
          status: 200,
        });
      }
      if (url.includes('term=ocean')) {
        return new Response('not json', { status: 500 });
      }
      return new Response('[]', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await prefetchTopics(['beach', 'ocean']);

    expect(loadedTopics()).toEqual(['beach']);
    const picked = getRandomFetchedWord();
    expect(picked).not.toBeNull();
    expect(picked!.topic).toBe('beach');
    expect(['SANDY', 'WAVE']).toContain(picked!.word);
  });

  it('returns null when nothing has been fetched yet', () => {
    expect(getRandomFetchedWord()).toBeNull();
  });

  it('does not double-fetch when called concurrently', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([{ term: 'shore' }]), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([
      prefetchTopics(['beach']),
      prefetchTopics(['beach']),
      prefetchTopics(['beach']),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('survives a total network failure (all topics reject)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    await expect(prefetchTopics(['beach', 'ocean'])).resolves.toBeUndefined();
    expect(loadedTopics()).toEqual([]);
    expect(getRandomFetchedWord()).toBeNull();
  });
});

describe('wordSources.getRandomFetchedWord', () => {
  beforeEach(() => {
    _resetWordSourcesForTests();
  });

  it('picks across multiple seeded topics', () => {
    _seedCacheForTests({
      beach: ['SANDY'],
      ocean: ['WAVE'],
      food: ['PIZZA'],
    });
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const picked = getRandomFetchedWord();
      seen.add(picked!.topic);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
