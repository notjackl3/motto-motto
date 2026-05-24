import { getMemeHeroUrls } from './cardAssets';
import { fetchStoryboardImage } from './api/storyboardImage';
import { getWordTheme, themeLabel } from './wordMeta';
import type { StoryboardPage } from '../types';

const STORY_OPENERS = [
  'Our surfer paddles out toward',
  'The tide turns when we reach',
  'A new chapter opens at',
  'The beach diary remembers',
];

const STORY_MIDDLES = [
  'Waves crash as the story deepens.',
  'Seagulls scatter — something shifts.',
  'The horizon glows; the plot thickens.',
  'Salt air carries the next beat.',
];

const STORY_CLOSERS = [
  'Will the tide bring victory?',
  'The final panel awaits…',
  'One more wave to ride.',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

function buildNarrative(
  word: string,
  roundIndex: number,
  priorWords: string[]
): { caption: string; narrative: string } {
  const label = themeLabel(getWordTheme(word));
  const display = word.toUpperCase();

  if (roundIndex === 1) {
    return {
      caption: display,
      narrative: `Chapter 1 — ${label}. Our beach manga begins at the ${display}…`,
    };
  }

  if (priorWords.length > 0) {
    const prev = priorWords[priorWords.length - 1]!.toUpperCase();
    const middle = pick(STORY_MIDDLES, roundIndex + word.length);
    const closer =
      roundIndex >= 3 ? pick(STORY_CLOSERS, roundIndex) : middle;
    return {
      caption: display,
      narrative: `${pick(STORY_OPENERS, roundIndex)} ${display}. After ${prev}, ${closer}`,
    };
  }

  return {
    caption: display,
    narrative: `${pick(STORY_OPENERS, roundIndex)} ${display}.`,
  };
}

function themeFallbackUrls(word: string) {
  const theme = getWordTheme(word);
  return getMemeHeroUrls(theme);
}

/** Generate panel art via OpenAI (server proxy); falls back to theme assets. */
export async function generateStoryboardPage(
  word: string,
  roundIndex: number,
  priorWords: string[]
): Promise<
  Pick<
    StoryboardPage,
    'caption' | 'narrative' | 'imageUrl' | 'imageFallbackUrl' | 'status'
  >
> {
  const { caption, narrative } = buildNarrative(word, roundIndex, priorWords);
  const fallback = themeFallbackUrls(word);

  try {
    const { imageUrl } = await fetchStoryboardImage({
      word,
      roundIndex,
      priorWords,
      caption,
      narrative,
    });
    return {
      caption,
      narrative,
      imageUrl,
      imageFallbackUrl: fallback.primary,
      status: 'ready',
    };
  } catch (err) {
    console.warn('[storyboard] OpenAI image unavailable, using theme fallback:', err);
    return {
      caption,
      narrative,
      imageUrl: fallback.primary,
      imageFallbackUrl: fallback.fallback,
      status: 'ready',
    };
  }
}

export function createStoryboardPageStub(
  word: string,
  roundIndex: number,
  priorWords: string[] = []
): StoryboardPage {
  const { caption, narrative } = buildNarrative(word, roundIndex, priorWords);
  return {
    id: `sb-${roundIndex}-${word}-${Date.now()}`,
    roundIndex,
    word,
    caption,
    narrative,
    imageUrl: null,
    imageFallbackUrl: null,
    status: 'generating',
    createdAt: Date.now(),
  };
}
