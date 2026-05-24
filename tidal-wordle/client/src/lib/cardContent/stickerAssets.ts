import type { WordTheme } from '../wordMeta';
import type { LetterState } from '../../types';
import {
  getBrainrotFlairUrls,
  getBrainrotTileUrl,
  getCategoryStickerUrls,
  type ThemeAssetUrls,
} from '../cardAssets';

export { getBrainrotTileUrl };

export function getBrainrotStickerUrl(
  state: LetterState,
  theme?: WordTheme
): { primary: string; fallback?: string } {
  if (theme) {
    const urls = getBrainrotFlairUrls(theme);
    return { primary: urls.primary, fallback: urls.fallback };
  }
  return { primary: getBrainrotTileUrl(state === 'empty' ? 'absent' : state) };
}

export function getCategoryStickerUrl(theme: WordTheme): ThemeAssetUrls {
  return getCategoryStickerUrls(theme);
}

export function primaryAsset(urls: ThemeAssetUrls): string {
  return urls.primary;
}
