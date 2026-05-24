import { getAllWords } from '../wordList';

/** One dictionary word matching the known letter pattern. */
export function suggestWordFromPattern(pattern: string[]): string | null {
  const len = pattern.length;
  if (len === 0) return null;
  const words = getAllWords().filter((w) => w.length === len);
  for (const w of words) {
    let ok = true;
    for (let i = 0; i < len; i++) {
      if (pattern[i] !== '_' && pattern[i] !== w[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return w.toLowerCase();
  }
  return null;
}
