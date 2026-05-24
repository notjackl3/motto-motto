import {
  buildStoryboardPagesFromCompletedWords,
  isValidStoryboardPage,
} from './storyboard';
import type { StoryboardPage } from '../types';

const DB_NAME = 'tidal-solo-storyboard-v1';
const STORE = 'pages';
const KEY = 'chapters';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadSoloStoryboardPages(): Promise<StoryboardPage[]> {
  try {
    const db = await openDb();
    const raw = await idbGet<unknown>(db, KEY);
    if (!Array.isArray(raw)) return [];
    return raw.filter(isValidStoryboardPage);
  } catch (err) {
    console.warn('[storyboard] load failed:', err);
    return [];
  }
}

export async function saveSoloStoryboardPages(
  pages: StoryboardPage[]
): Promise<void> {
  try {
    const db = await openDb();
    await idbPut(db, KEY, pages);
  } catch (err) {
    console.warn('[storyboard] save failed:', err);
  }
}

/** Load persisted manga chapters; backfill from cleared words if storage is empty. */
export async function hydrateSoloStoryboard(
  completedWords: string[]
): Promise<StoryboardPage[]> {
  let pages = (await loadSoloStoryboardPages()).sort(
    (a, b) => a.roundIndex - b.roundIndex
  );

  if (pages.length === 0 && completedWords.length > 0) {
    pages = buildStoryboardPagesFromCompletedWords(completedWords);
    await saveSoloStoryboardPages(pages);
    return pages;
  }

  if (completedWords.length === 0) return pages;

  const merged = mergeStoryboardWithCompleted(pages, completedWords);
  const changed =
    merged.length !== pages.length ||
    merged.some((p, i) => p.id !== pages[i]?.id || p.imageUrl !== pages[i]?.imageUrl);

  if (changed) {
    await saveSoloStoryboardPages(merged);
  }

  return merged;
}

function mergeStoryboardWithCompleted(
  stored: StoryboardPage[],
  completedWords: string[]
): StoryboardPage[] {
  const byWord = new Map(stored.map((p) => [p.word.toLowerCase(), p]));
  const rebuilt = buildStoryboardPagesFromCompletedWords(completedWords);

  return rebuilt.map((fallbackPage) => {
    const saved = byWord.get(fallbackPage.word.toLowerCase());
    if (!saved) return fallbackPage;
    return {
      ...saved,
      roundIndex: fallbackPage.roundIndex,
      caption: saved.caption || fallbackPage.caption,
      narrative: saved.narrative || fallbackPage.narrative,
      imageUrl: saved.imageUrl ?? fallbackPage.imageUrl,
      imageFallbackUrl:
        saved.imageFallbackUrl ?? fallbackPage.imageFallbackUrl,
      status: saved.status === 'generating' ? 'ready' : saved.status,
    };
  });
}
