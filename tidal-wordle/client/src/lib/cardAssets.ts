import type { WordCategory, WordTheme } from './wordMeta';
import { getThemeParentCategory } from './wordMeta';

export interface ThemeAssetUrls {
  primary: string;
  fallback: string;
}

function themeAssetPair(
  theme: WordTheme,
  build: (key: string) => string
): ThemeAssetUrls {
  const parent = getThemeParentCategory(theme);
  return {
    primary: build(theme),
    fallback: build(parent),
  };
}

const STICKERS = '/assets/stickers';
const CARDS = '/assets/cards';
const AUDIO_SFX = '/assets/audio/sfx';
const AUDIO_PLAYLISTS = '/assets/audio/playlists';

export function getCategoryStickerUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(theme, (k) => `${STICKERS}/${k}.png`);
}

export function getMemeHeroUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(theme, (k) => `${CARDS}/meme-cannon/meme-${k}.png`);
}

export function getBrainrotTileUrl(
  state: 'correct' | 'present' | 'absent'
): string {
  const key =
    state === 'correct' ? 'correct' : state === 'present' ? 'present' : 'absent';
  return `${STICKERS}/brainrot-${key}.png`;
}

export function getBrainrotFlairUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(theme, (k) => `${STICKERS}/brainrot-${k}.png`);
}

export function getStatusDogUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(theme, (k) => `${CARDS}/status-dog/dog-${k}.png`);
}

export function getRecipeHeaderUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(
    theme,
    (k) => `${CARDS}/recipe-spam/recipe-header-${k}.png`
  );
}

export function getRecipePaperTextureUrl(): string {
  return `${CARDS}/recipe-spam/recipe-sidebar-texture.png`;
}

export function getRejectionLetterheadUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(
    theme,
    (k) => `${CARDS}/rejection-letter/letterhead-${k}.png`
  );
}

export function getRejectionPaperTextureUrl(): string {
  return `${CARDS}/rejection-letter/paper-texture.png`;
}

export function getDistractionHeaderUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(
    theme,
    (k) => `${CARDS}/bored-distraction/distraction-${k}.png`
  );
}

export function getForcedBreakIconUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(
    theme,
    (k) => `${CARDS}/forced-break/break-icon-${k}.png`
  );
}

export function getForcedBreakIconGenericUrl(): string {
  return `${CARDS}/forced-break/break-icon-generic.png`;
}

export function getFaceSwapUrls(theme: WordTheme): ThemeAssetUrls {
  return themeAssetPair(theme, (k) => `${CARDS}/face-swap/face-${k}.png`);
}

export function getFaceSwapPresetUrl(
  preset: 'crab' | 'shark' | 'sunglasses' | 'clownfish' | 'surfer-wipeout'
): string {
  return `${CARDS}/face-swap/face-${preset}.png`;
}

export function getChessBoardUrl(): string {
  return `${CARDS}/chess-gambit/chess-board-mini.png`;
}

export function getStarFilledUrl(): string {
  return `${CARDS}/critics-rating/star-filled.png`;
}

export function getStarEmptyUrl(): string {
  return `${CARDS}/critics-rating/star-empty.png`;
}

const SFX_BY_CARD: Record<string, string> = {
  'meme-cannon': `${AUDIO_SFX}/sfx-meme-cannon.mp3`,
  'brainrot-glitch': `${AUDIO_SFX}/sfx-brainrot.mp3`,
  'status-dog': `${AUDIO_SFX}/sfx-status-dog.mp3`,
  'forced-break': `${AUDIO_SFX}/sfx-forced-break.mp3`,
  'recipe-spam': `${AUDIO_SFX}/sfx-recipe-spam.mp3`,
  'rejection-letter': `${AUDIO_SFX}/sfx-rejection-letter.mp3`,
  'dice-roll': `${AUDIO_SFX}/sfx-dice-roll.mp3`,
  'critics-rating': `${AUDIO_SFX}/sfx-critics-rating.mp3`,
};

export function getCardSfxUrl(cardId: string): string | undefined {
  return SFX_BY_CARD[cardId];
}

/** Playlist loops grouped by parent category until per-theme audio exists. */
export function getPlaylistUrl(theme: WordTheme): string {
  const parent = getThemeParentCategory(theme);
  return `${AUDIO_PLAYLISTS}/loop-${parent}.mp3`;
}

/** Legacy single-url helpers (parent category filenames). */
export function getCategoryStickerUrl(category: WordCategory): string {
  return `${STICKERS}/${category}.png`;
}

export function getMemeHeroUrl(category: WordCategory): string {
  return `${CARDS}/meme-cannon/meme-${category}.png`;
}

export function getBrainrotCategoryFlairUrl(category: WordCategory): string {
  return `${STICKERS}/brainrot-${category}.png`;
}

export function getStatusDogUrl(category: WordCategory): string {
  return `${CARDS}/status-dog/dog-${category}.png`;
}

export function getRecipeHeaderUrl(category: WordCategory): string {
  return `${CARDS}/recipe-spam/recipe-header-${category}.png`;
}

export function getRejectionLetterheadUrl(category: WordCategory): string {
  return `${CARDS}/rejection-letter/letterhead-${category}.png`;
}

export function getDistractionHeaderUrl(category: WordCategory): string {
  return `${CARDS}/bored-distraction/distraction-${category}.png`;
}

export function getFaceSwapUrl(category: WordCategory): string {
  return `${CARDS}/face-swap/face-${category}.png`;
}

export function getForcedBreakIconUrl(category: WordCategory): string {
  return `${CARDS}/forced-break/break-icon-${category}.png`;
}
