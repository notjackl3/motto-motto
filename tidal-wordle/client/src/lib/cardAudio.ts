import type { WordTheme } from './wordMeta';
import { getCardSfxUrl, getPlaylistUrl } from './cardAssets';

let playlistAudio: HTMLAudioElement | null = null;
let playlistTheme: WordTheme | null = null;

/** Short SFX when a card effect fires. Fails silently if autoplay blocked. */
export function playCardSfx(cardId: string): void {
  const url = getCardSfxUrl(cardId);
  if (!url) return;
  const audio = new Audio(url);
  audio.volume = 0.45;
  void audio.play().catch(() => {});
}

/** Looping beach track for beach-playlist card (30s card duration). */
export function startPlaylistForTheme(theme: WordTheme): void {
  stopPlaylist();
  const url = getPlaylistUrl(theme);
  playlistAudio = new Audio(url);
  playlistAudio.loop = true;
  playlistAudio.volume = 0.35;
  playlistTheme = theme;
  void playlistAudio.play().catch(() => {});
}

/** @deprecated Use startPlaylistForTheme */
export function startPlaylistForCategory(category: WordTheme): void {
  startPlaylistForTheme(category);
}

export function stopPlaylist(): void {
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.currentTime = 0;
    playlistAudio = null;
  }
  playlistTheme = null;
}

export function getActivePlaylistTheme(): WordTheme | null {
  return playlistTheme;
}
