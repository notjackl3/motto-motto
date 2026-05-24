/**
 * Multi-source word pool for solo Wordle.
 *
 * Fetches related words from https://relatedwords.io across several topics
 * (beach, ocean, surf, food, sport, …) and exposes a small API for the
 * gameStore to pull a random fetched word. If the network is unavailable
 * the store falls back to the local beachWords.json via wordList.ts.
 *
 * Browser CORS: the relatedwords.io API does not return
 * Access-Control-Allow-Origin, so the client hits a same-origin
 * `/api/words` path. In dev this is proxied by vite.config.ts directly
 * to relatedwords.io; in a real deployment it should be proxied by the
 * Express server (see server/src/index.ts).
 */
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH } from './wordList';

export const DEFAULT_TOPICS = [
  'beach',
  'ocean',
  'surf',
  'summer',
  'island',
  'animal',
  'food',
  'sport',
  'music',
  'travel',
  'forest',
  'mountain',
  'city',
  'space',
  'weather',
] as const;

export type Topic = string;

interface RelatedTerm {
  term: string;
}

const cache = new Map<Topic, string[]>();
let inflight: Promise<void> | null = null;

function tokenize(term: string): string[] {
  return term.toLowerCase().split(/[^a-z]+/).filter(Boolean);
}

function isPlayable(word: string): boolean {
  return (
    /^[a-z]+$/.test(word) &&
    word.length >= MIN_WORD_LENGTH &&
    word.length <= MAX_WORD_LENGTH
  );
}

export function extractPlayableWords(terms: unknown): string[] {
  if (!Array.isArray(terms)) return [];
  const out = new Set<string>();
  for (const entry of terms) {
    const term = (entry as RelatedTerm | undefined)?.term;
    if (typeof term !== 'string') continue;
    for (const token of tokenize(term)) {
      if (isPlayable(token)) out.add(token.toUpperCase());
    }
  }
  return [...out];
}

async function fetchTopic(
  topic: Topic,
  signal?: AbortSignal
): Promise<string[]> {
  const url = `/api/words?term=${encodeURIComponent(topic)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} for topic "${topic}"`);
  const data = (await res.json()) as unknown;
  return extractPlayableWords(data);
}

/**
 * Fetch all topics in parallel and populate the cache. Safe to call
 * multiple times — concurrent calls share one in-flight Promise.
 */
export function prefetchTopics(
  topics: readonly Topic[] = DEFAULT_TOPICS,
  signal?: AbortSignal
): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const results = await Promise.allSettled(
      topics.map((t) => fetchTopic(t, signal))
    );
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        cache.set(topics[i], r.value);
      }
    });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Topics that have at least one playable word loaded. */
export function loadedTopics(): Topic[] {
  return [...cache.entries()].filter(([, ws]) => ws.length > 0).map(([t]) => t);
}

/**
 * Pick a random word from a random loaded topic, or null when nothing has
 * been fetched yet (caller should fall back to the local word list).
 */
export function getRandomFetchedWord(): { word: string; topic: Topic } | null {
  const topics = loadedTopics();
  if (topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const words = cache.get(topic)!;
  const word = words[Math.floor(Math.random() * words.length)];
  return { word, topic };
}

/** Test-only: clear cache + in-flight state between cases. */
export function _resetWordSourcesForTests(): void {
  cache.clear();
  inflight = null;
}

/** Test-only: seed the cache directly without going through fetch. */
export function _seedCacheForTests(entries: Record<Topic, string[]>): void {
  for (const [topic, words] of Object.entries(entries)) {
    cache.set(topic, words);
  }
}
