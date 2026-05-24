const STORAGE_KEY = 'tidal-solo-completed-words-v1';

/** Words the player has cleared in solo (lowercase), persisted across sessions. */
export function loadSoloCompletedWords(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((w): w is string => typeof w === 'string')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function saveSoloCompletedWords(words: string[]): void {
  if (typeof localStorage === 'undefined') return;
  const unique = [...new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean))];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function clearSoloCompletedWords(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
