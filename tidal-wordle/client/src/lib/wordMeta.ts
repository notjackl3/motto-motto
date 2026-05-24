import categoriesData from '../data/beachWordCategories.json';
import themeContentData from '../data/themeContent.json';
import overridesData from '../data/wordThemeOverrides.json';
import { getAllWords } from './wordList';
import type { WordCategory } from './wordMeta.types';

export type { WordCategory };

export const WORD_CATEGORIES = categoriesData.categories as readonly WordCategory[];
export const WORD_THEMES = categoriesData.themes as readonly string[];
export type WordTheme = (typeof WORD_THEMES)[number];

const byWord = categoriesData.byWord as Record<string, WordTheme>;
const byTheme = categoriesData.byTheme as Record<string, string[]>;
const byCategory = categoriesData.byCategory as Record<string, string[]>;
const themeParent = categoriesData.themeParent as Record<string, WordCategory>;
const themeLabels = categoriesData.themeLabels as Record<string, string>;

export interface WordThemeOverride {
  memeCaption?: string;
  memeHeroPath?: string;
  insult?: string;
  forcedBreakLabel?: string;
  faceSwapTagline?: string;
  recipeTitle?: string;
  hintPrefix?: string;
}

const wordOverrides = overridesData.overrides as Record<string, WordThemeOverride>;

export function getWordTheme(word: string): WordTheme {
  const key = word.toLowerCase();
  return (byWord[key] as WordTheme) ?? 'abstract-beach';
}

/** Legacy parent category (10 buckets) for related-word pools and fallbacks. */
export function getWordCategory(word: string): WordCategory {
  return getThemeParentCategory(getWordTheme(word));
}

export function getThemeParentCategory(theme: WordTheme): WordCategory {
  return (themeParent[theme] as WordCategory) ?? 'abstract-generic';
}

export function getWordsInTheme(theme: WordTheme): string[] {
  return byTheme[theme] ?? [];
}

export function getWordsInCategory(category: WordCategory): string[] {
  return byCategory[category] ?? [];
}

export function themeLabel(theme: WordTheme): string {
  return themeLabels[theme] ?? 'beach';
}

export function getWordThemeOverride(word: string): WordThemeOverride | undefined {
  return wordOverrides[word.toLowerCase()];
}

export function getThemeContent(theme: WordTheme) {
  return themeContentData.themes[theme as keyof typeof themeContentData.themes];
}

/** Random other word from the same theme, then parent category. */
export function getCategoryRelatedWord(answer: string): string {
  const upper = answer.toUpperCase();
  const theme = getWordTheme(answer);
  const themePool = getWordsInTheme(theme).filter(
    (w) => w.toUpperCase() !== upper
  );
  if (themePool.length > 0) {
    return themePool[Math.floor(Math.random() * themePool.length)].toLowerCase();
  }
  const cat = getThemeParentCategory(theme);
  const pool = getWordsInCategory(cat).filter(
    (w) => w.toUpperCase() !== upper
  );
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)].toLowerCase();
  }
  const all = getAllWords().filter((w) => w !== upper);
  return all[Math.floor(Math.random() * all.length)]?.toLowerCase() ?? 'coastal';
}

export function categoryLabel(category: WordCategory): string {
  const labels: Record<WordCategory, string> = {
    'marine-animal': 'marine animal',
    'marine-flora': 'sea plant',
    'water-weather': 'water phenomenon',
    'shore-geology': 'shore landform',
    'places-geography': 'place name',
    'boats-nautical': 'nautical term',
    'beach-gear-activity': 'beach activity',
    'beach-social-food': 'beach social',
    'sensory-descriptive': 'descriptive',
    'abstract-generic': 'beach',
  };
  return labels[category] ?? 'beach';
}
