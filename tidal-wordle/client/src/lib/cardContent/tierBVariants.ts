import {
  getThemeContent,
  getThemeParentCategory,
  getWordThemeOverride,
  type WordTheme,
} from '../wordMeta';
import type { WordCategory } from '../wordMeta.types';

export type HalfSide = 'left' | 'right';

export interface MemeCannonVariant {
  /** Fallback emoji if image fails to load */
  stickerEmoji: string;
  captionTemplate: string;
  borderClass: string;
  assetTheme?: WordTheme;
}

export interface BrainrotVariant {
  stickerStyle: 'claw' | 'bubble' | 'wave' | 'sand' | 'stamp' | 'rope' | 'flipflop' | 'smoke' | 'vivid' | 'scatter';
}

export interface StatusDogVariant {
  dogEmoji: string;
}

export interface ForcedBreakVariant {
  label: string;
}

export interface BoredDistractionVariant {
  title: string;
  paragraphs: string[];
}

export interface RecipeSpamVariant {
  recipeTitle: string;
  ingredients: string[];
  maskSide: HalfSide;
}

export interface RejectionLetterVariant {
  letterhead: string;
  body: string;
}

export interface PlayfulInsultVariant {
  line: string;
}

export interface FaceSwapVariant {
  tagline: string;
}

const MEME: Record<WordCategory, MemeCannonVariant[]> = {
  'marine-animal': [
    { stickerEmoji: '🦀', captionTemplate: '{wrongGuess} ≠ apex predator', borderClass: 'border-red-500' },
    { stickerEmoji: '🦈', captionTemplate: 'Wrong species: {wrongGuess}', borderClass: 'border-blue-600' },
    { stickerEmoji: '🐚', captionTemplate: 'Shell game lost: {wrongGuess}', borderClass: 'border-amber-400' },
    { stickerEmoji: '🐦', captionTemplate: 'Seagull judgment: {wrongGuess}', borderClass: 'border-sky-400' },
  ],
  'marine-flora': [
    { stickerEmoji: '🪸', captionTemplate: 'Photosynthesis says no to {wrongGuess}', borderClass: 'border-pink-400' },
    { stickerEmoji: '🌿', captionTemplate: 'Kelp disagrees: {wrongGuess}', borderClass: 'border-green-600' },
    { stickerEmoji: '🫧', captionTemplate: 'Algae bloom of bad takes', borderClass: 'border-teal-400' },
    { stickerEmoji: '🪸', captionTemplate: 'Reef facts > {wrongGuess}', borderClass: 'border-rose-400' },
  ],
  'water-weather': [
    { stickerEmoji: '🌊', captionTemplate: 'Wiped out: {wrongGuess}', borderClass: 'border-blue-500' },
    { stickerEmoji: '🌧️', captionTemplate: 'Storm advisory: {wrongGuess}', borderClass: 'border-slate-500' },
    { stickerEmoji: '💨', captionTemplate: 'Blown off course: {wrongGuess}', borderClass: 'border-cyan-400' },
    { stickerEmoji: '🌊', captionTemplate: 'High tide, low guess', borderClass: 'border-indigo-500' },
  ],
  'shore-geology': [
    { stickerEmoji: '🪨', captionTemplate: 'Bedrock rejects {wrongGuess}', borderClass: 'border-stone-500' },
    { stickerEmoji: '🏖️', captionTemplate: 'Sand erases {wrongGuess}', borderClass: 'border-yellow-600' },
    { stickerEmoji: '⛰️', captionTemplate: 'Granular error: {wrongGuess}', borderClass: 'border-amber-700' },
    { stickerEmoji: '🏜️', captionTemplate: 'Dune verdict: nope', borderClass: 'border-orange-500' },
  ],
  'places-geography': [
    { stickerEmoji: '🗺️', captionTemplate: 'Not on this map: {wrongGuess}', borderClass: 'border-green-700' },
    { stickerEmoji: '✈️', captionTemplate: 'Tourist guess: {wrongGuess}', borderClass: 'border-blue-400' },
    { stickerEmoji: '📍', captionTemplate: 'Wrong pin: {wrongGuess}', borderClass: 'border-red-600' },
    { stickerEmoji: '🗺️', captionTemplate: "That's a place, not it", borderClass: 'border-emerald-600' },
  ],
  'boats-nautical': [
    { stickerEmoji: '⚓', captionTemplate: 'Port declined: {wrongGuess}', borderClass: 'border-navy-600' },
    { stickerEmoji: '⛵', captionTemplate: 'Man overboard: {wrongGuess}', borderClass: 'border-blue-700' },
    { stickerEmoji: '🚢', captionTemplate: 'Maritime nope', borderClass: 'border-slate-700' },
    { stickerEmoji: '⚓', captionTemplate: 'All ashore except {wrongGuess}', borderClass: 'border-indigo-700' },
  ],
  'beach-gear-activity': [
    { stickerEmoji: '🩴', captionTemplate: 'Wrong gear: {wrongGuess}', borderClass: 'border-orange-400' },
    { stickerEmoji: '🕶️', captionTemplate: 'SPF cannot save {wrongGuess}', borderClass: 'border-black' },
    { stickerEmoji: '🏄', captionTemplate: 'Wipeout word: {wrongGuess}', borderClass: 'border-sky-500' },
    { stickerEmoji: '🩴', captionTemplate: 'Return {wrongGuess} to rentals', borderClass: 'border-amber-500' },
  ],
  'beach-social-food': [
    { stickerEmoji: '🔥', captionTemplate: 'Not on the menu: {wrongGuess}', borderClass: 'border-red-500' },
    { stickerEmoji: '🌭', captionTemplate: 'Grill says no', borderClass: 'border-orange-600' },
    { stickerEmoji: '🧊', captionTemplate: 'Cooler closed for {wrongGuess}', borderClass: 'border-cyan-300' },
    { stickerEmoji: '🔥', captionTemplate: 'Charcoal judgment', borderClass: 'border-red-700' },
  ],
  'sensory-descriptive': [
    { stickerEmoji: '🎨', captionTemplate: 'Vibe: {wrongGuess}/10', borderClass: 'border-purple-400' },
    { stickerEmoji: '😎', captionTemplate: 'Hue mismatch', borderClass: 'border-yellow-400' },
    { stickerEmoji: '✨', captionTemplate: 'Not the vibe', borderClass: 'border-pink-300' },
    { stickerEmoji: '🎨', captionTemplate: 'Describe better than {wrongGuess}', borderClass: 'border-violet-500' },
  ],
  'abstract-generic': [
    { stickerEmoji: '🏖️', captionTemplate: 'BEACH WORDLE / {wrongGuess}', borderClass: 'border-black' },
    { stickerEmoji: '🏐', captionTemplate: 'Bold strategy: {wrongGuess}', borderClass: 'border-yellow-500' },
    { stickerEmoji: '📸', captionTemplate: 'Nice try, shore thing', borderClass: 'border-gray-600' },
    { stickerEmoji: '🏖️', captionTemplate: 'The tide waits for no guess', borderClass: 'border-teal-600' },
  ],
};

const BRAINROT: Record<WordCategory, BrainrotVariant[]> = {
  'marine-animal': [{ stickerStyle: 'claw' }, { stickerStyle: 'scatter' }],
  'marine-flora': [{ stickerStyle: 'bubble' }, { stickerStyle: 'bubble' }],
  'water-weather': [{ stickerStyle: 'wave' }, { stickerStyle: 'wave' }],
  'shore-geology': [{ stickerStyle: 'sand' }, { stickerStyle: 'scatter' }],
  'places-geography': [{ stickerStyle: 'stamp' }, { stickerStyle: 'stamp' }],
  'boats-nautical': [{ stickerStyle: 'rope' }, { stickerStyle: 'rope' }],
  'beach-gear-activity': [{ stickerStyle: 'flipflop' }, { stickerStyle: 'flipflop' }],
  'beach-social-food': [{ stickerStyle: 'smoke' }, { stickerStyle: 'smoke' }],
  'sensory-descriptive': [{ stickerStyle: 'vivid' }, { stickerStyle: 'vivid' }],
  'abstract-generic': [{ stickerStyle: 'scatter' }, { stickerStyle: 'scatter' }],
};

const STATUS_DOG: Record<WordCategory, StatusDogVariant[]> = {
  'marine-animal': [{ dogEmoji: '🐕‍🦺' }, { dogEmoji: '🦭' }, { dogEmoji: '🐕' }],
  'marine-flora': [{ dogEmoji: '🐕' }, { dogEmoji: '🌿🐕' }],
  'water-weather': [{ dogEmoji: '🐕‍🦺' }, { dogEmoji: '☔🐕' }],
  'shore-geology': [{ dogEmoji: '🐕' }, { dogEmoji: '🏖️🐕' }],
  'places-geography': [{ dogEmoji: '🧳🐕' }, { dogEmoji: '🐕' }],
  'boats-nautical': [{ dogEmoji: '⚓🐕' }, { dogEmoji: '🐕‍🦺' }],
  'beach-gear-activity': [{ dogEmoji: '🕶️🐕' }, { dogEmoji: '🐕' }],
  'beach-social-food': [{ dogEmoji: '🐕' }, { dogEmoji: '🍖🐕' }],
  'sensory-descriptive': [{ dogEmoji: '🐕' }, { dogEmoji: '🌈🐕' }],
  'abstract-generic': [{ dogEmoji: '🐕' }, { dogEmoji: '🐶' }],
};

const FORCED_BREAK: Record<WordCategory, ForcedBreakVariant[]> = {
  'marine-animal': [{ label: 'Hold — wildlife crossing' }],
  'marine-flora': [{ label: "Don't touch the reef…" }],
  'water-weather': [{ label: 'Wait for the set…' }],
  'shore-geology': [{ label: 'Sandcastle union break' }],
  'places-geography': [{ label: 'Customs delay' }],
  'boats-nautical': [{ label: 'Harbor closed' }],
  'beach-gear-activity': [{ label: 'Sunscreen dry time' }],
  'beach-social-food': [{ label: 'Hydration station' }],
  'sensory-descriptive': [{ label: 'Shade break' }],
  'abstract-generic': [{ label: 'Mandatory beach break' }],
};

function boredDistractionParagraphs(count = 60): string[] {
  const base =
    'Meanwhile, researchers insist this tangent matters. Tide charts, snack rankings, and unrelated beach lore fill the column inches below. You could be guessing letters, but instead you are reading item ';
  return Array.from({ length: count }, (_, i) => `${base}${i + 1}. `.repeat(8));
}

const BORED: Record<WordCategory, BoredDistractionVariant[]> = {
  'marine-animal': [
    { title: 'Top 50 tide pool facts', paragraphs: boredDistractionParagraphs(60) },
  ],
  'marine-flora': [
    { title: 'Kelp: superfood or super boring?', paragraphs: boredDistractionParagraphs(60) },
  ],
  'water-weather': [
    { title: 'Surf report scroll (every beach on earth)', paragraphs: boredDistractionParagraphs(60) },
  ],
  'shore-geology': [
    { title: 'Sand grain identification guide', paragraphs: boredDistractionParagraphs(60) },
  ],
  'places-geography': [
    { title: 'TripAdvisor: all coastal towns ranked', paragraphs: boredDistractionParagraphs(60) },
  ],
  'boats-nautical': [
    { title: "Every knot you'll never tie", paragraphs: boredDistractionParagraphs(60) },
  ],
  'beach-gear-activity': [
    { title: '100 beach hacks (#47 will shock you)', paragraphs: boredDistractionParagraphs(60) },
  ],
  'beach-social-food': [
    { title: "S'mores vs hot dogs: 10,000 word debate", paragraphs: boredDistractionParagraphs(60) },
  ],
  'sensory-descriptive': [
    { title: 'What your guess color says about you', paragraphs: boredDistractionParagraphs(60) },
  ],
  'abstract-generic': [
    { title: 'Why you should touch grass (sand edition)', paragraphs: boredDistractionParagraphs(60) },
  ],
};

const RECIPE_BASE = [
  '2 cups flour',
  '1 tsp sea salt',
  '3 tbsp coconut oil',
  '1/2 cup sugar',
  '2 eggs',
  '1 tsp vanilla',
  'Zest of one lime',
  'Toasted coconut flakes',
];

const RECIPE: Record<WordCategory, RecipeSpamVariant[]> = {
  'marine-animal': [
    { recipeTitle: 'Crab cake sliders', ingredients: RECIPE_BASE, maskSide: 'right' },
    { recipeTitle: 'Fish taco bowl', ingredients: RECIPE_BASE, maskSide: 'left' },
  ],
  'marine-flora': [
    { recipeTitle: 'Seaweed crunch wrap', ingredients: RECIPE_BASE, maskSide: 'right' },
  ],
  'water-weather': [
    { recipeTitle: 'Storm chowder', ingredients: RECIPE_BASE, maskSide: 'left' },
  ],
  'shore-geology': [
    { recipeTitle: 'Sand dollar cookies (joke)', ingredients: RECIPE_BASE, maskSide: 'right' },
  ],
  'places-geography': [
    { recipeTitle: 'Regional coastal stew', ingredients: RECIPE_BASE, maskSide: 'left' },
  ],
  'boats-nautical': [
    { recipeTitle: "Sailor's canned fish bake", ingredients: RECIPE_BASE, maskSide: 'right' },
  ],
  'beach-gear-activity': [
    { recipeTitle: 'Post-surf smoothie bowl', ingredients: RECIPE_BASE, maskSide: 'left' },
  ],
  'beach-social-food': [
    { recipeTitle: 'Boardwalk BBQ platter', ingredients: RECIPE_BASE, maskSide: 'right' },
  ],
  'sensory-descriptive': [
    { recipeTitle: 'Blue lagoon mocktail', ingredients: RECIPE_BASE, maskSide: 'left' },
  ],
  'abstract-generic': [
    { recipeTitle: 'Mystery beach potluck', ingredients: RECIPE_BASE, maskSide: 'right' },
  ],
};

const REJECTION: Record<WordCategory, RejectionLetterVariant[]> = {
  'marine-animal': [
    {
      letterhead: 'Dept. of Marine Resources',
      body: 'We regret to inform you that your application ({wrongGuess}) does not meet our crustacean standards.',
    },
  ],
  'marine-flora': [
    {
      letterhead: 'Reef Preservation Society',
      body: 'Your guess ({wrongGuess}) has been declined to protect sensitive habitat.',
    },
  ],
  'water-weather': [
    {
      letterhead: 'Coastal Commission',
      body: 'Forecast: {wrongGuess} will not make landfall as the answer.',
    },
  ],
  'shore-geology': [
    {
      letterhead: 'National Parks — Shore Division',
      body: 'Permit denied for guess: {wrongGuess}.',
    },
  ],
  'places-geography': [
    {
      letterhead: 'Tourism Board',
      body: 'We encourage you to visit {wrongGuess} on vacation, not as your guess.',
    },
  ],
  'boats-nautical': [
    {
      letterhead: 'Harbor Master',
      body: 'Vessel {wrongGuess} is not cleared for docking in this puzzle.',
    },
  ],
  'beach-gear-activity': [
    {
      letterhead: 'Beach Patrol',
      body: 'Safety notice: {wrongGuess} is not approved beach equipment for winning.',
    },
  ],
  'beach-social-food': [
    {
      letterhead: 'Health Inspector',
      body: 'Guess {wrongGuess} failed inspection. Probe row granted below.',
    },
  ],
  'sensory-descriptive': [
    {
      letterhead: 'Aesthetic Review Board',
      body: 'The committee finds {wrongGuess} aesthetically incorrect.',
    },
  ],
  'abstract-generic': [
    {
      letterhead: 'HR — Beach Wordle Division',
      body: 'We regret to inform you that {wrongGuess} does not align with our needs at this time.',
    },
  ],
};

const INSULTS: Record<WordCategory, PlayfulInsultVariant[]> = {
  'marine-animal': [
    { line: 'Wrong ecosystem, champ.' },
    { line: 'Even seagulls side-eye that guess.' },
    { line: 'That guess is off the food chain.' },
  ],
  'marine-flora': [
    { line: 'Not in this food chain.' },
    { line: 'You cannot prune your way to victory.' },
  ],
  'water-weather': [
    { line: 'That guess washed out.' },
    { line: 'Forecast: you are lost.' },
  ],
  'shore-geology': [
    { line: 'Rocks have better spelling.' },
    { line: 'Sand erodes faster than your logic.' },
  ],
  'places-geography': [
    { line: "That's a vacation, not the answer." },
    { line: 'Wrong latitude, buddy.' },
  ],
  'boats-nautical': [
    { line: 'Port called: they want that guess back.' },
    { line: 'All ashore who are not winning.' },
  ],
  'beach-gear-activity': [
    { line: 'You packed the wrong word for this beach.' },
    { line: 'Return that guess to rentals.' },
  ],
  'beach-social-food': [
    { line: 'Nobody ordered that guess.' },
    { line: 'The grill rejects you.' },
  ],
  'sensory-descriptive': [
    { line: 'Vibe: off.' },
    { line: 'The aesthetic is not there.' },
  ],
  'abstract-generic': [
    { line: 'Your guesses are weak sauce.' },
    { line: 'Bold strategy. Lets see if it pays off.' },
    { line: 'The tide waits for no one — neither should you.' },
  ],
};

const FACE_SWAP: Record<WordCategory, FaceSwapVariant[]> = {
  'marine-animal': [
    { tagline: 'Crab cam: {wrongGuess} is not the vibe' },
    { tagline: 'Wrong phylum — {wrongGuess}' },
  ],
  'marine-flora': [
    { tagline: 'Reef filter says no to {wrongGuess}' },
    { tagline: 'Photosynthesis rejects {wrongGuess}' },
  ],
  'water-weather': [
    { tagline: 'Wipeout face for {wrongGuess}' },
    { tagline: 'Swell judgment: {wrongGuess}' },
  ],
  'shore-geology': [
    { tagline: 'Sand face / hard no on {wrongGuess}' },
    { tagline: 'Bedrock side-eye: {wrongGuess}' },
  ],
  'places-geography': [
    { tagline: 'Tourist face-swap: not {wrongGuess}' },
    { tagline: 'Wrong pin: {wrongGuess}' },
  ],
  'boats-nautical': [
    { tagline: 'Captain says: {wrongGuess} overboard' },
    { tagline: 'Harbor glitch — {wrongGuess}' },
  ],
  'beach-gear-activity': [
    { tagline: 'Snorkel fail: {wrongGuess}' },
    { tagline: 'Wrong gear face: {wrongGuess}' },
  ],
  'beach-social-food': [
    { tagline: 'Grill face: {wrongGuess} not on menu' },
    { tagline: 'Potluck glitch — {wrongGuess}' },
  ],
  'sensory-descriptive': [
    { tagline: 'Vibe check failed: {wrongGuess}' },
    { tagline: 'Hue mismatch — {wrongGuess}' },
  ],
  'abstract-generic': [
    { tagline: 'BEACH GLITCH: {wrongGuess}' },
    { tagline: 'Face swap says no to {wrongGuess}' },
  ],
};

const HINT_PREFIX: Record<WordCategory, string> = {
  'marine-animal': 'Biologist whispers:',
  'marine-flora': 'Botanist notes:',
  'water-weather': 'Forecast desk:',
  'shore-geology': 'Ranger says:',
  'places-geography': 'Travel guide:',
  'boats-nautical': 'Harbor radio:',
  'beach-gear-activity': 'Lifeguard tip:',
  'beach-social-food': 'Grill master:',
  'sensory-descriptive': 'Vibe check:',
  'abstract-generic': 'Hint:',
};

const DICE_FLAVOR: Record<WordCategory, string[]> = {
  'marine-animal': ['Crab rolls the dice…', 'Shell shock reroll!'],
  'marine-flora': ['Kelp tangle reroll!', 'Floating seed scatter!'],
  'water-weather': ['Driftwood dice on the waves.', 'Ripple reroll!'],
  'shore-geology': ['Pebble toss reroll!', 'Sand swirl — again!'],
  'places-geography': ['Travel roulette!', 'Map says reroll!'],
  'boats-nautical': ['Barnacle dice clatter.', 'Captain orders reroll!'],
  'beach-gear-activity': ['Beach ball roll — reroll!', 'Shaka reroll!'],
  'beach-social-food': ['Shake the cooler — reroll!', 'Bonfire sparks reroll!'],
  'sensory-descriptive': ['Luck of the breeze.', 'Hue shift reroll!'],
  'abstract-generic': ['Reroll!', 'Dice say try again!'],
};

function pick<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

function parentCategory(theme: WordTheme): WordCategory {
  return getThemeParentCategory(theme);
}

export function pickMemeCannon(theme: WordTheme, answer?: string): MemeCannonVariant {
  const override = answer ? getWordThemeOverride(answer) : undefined;
  const themeContent = getThemeContent(theme);
  const base = pick(MEME[parentCategory(theme)]);
  const captionTemplate =
    override?.memeCaption ??
    (themeContent?.memeCaptions?.length
      ? pick(themeContent.memeCaptions)
      : base.captionTemplate);
  return { ...base, captionTemplate, assetTheme: theme };
}

export function pickBrainrot(theme: WordTheme): BrainrotVariant {
  return pick(BRAINROT[parentCategory(theme)]);
}

export function pickStatusDog(theme: WordTheme): StatusDogVariant {
  return pick(STATUS_DOG[parentCategory(theme)]);
}

export function pickForcedBreak(theme: WordTheme, answer?: string): ForcedBreakVariant {
  const override = answer ? getWordThemeOverride(answer) : undefined;
  const themeContent = getThemeContent(theme);
  if (override?.forcedBreakLabel) {
    return { label: override.forcedBreakLabel };
  }
  if (themeContent?.forcedBreakLabels?.length) {
    return { label: pick(themeContent.forcedBreakLabels) };
  }
  return pick(FORCED_BREAK[parentCategory(theme)]);
}

export function pickBoredDistraction(theme: WordTheme): BoredDistractionVariant {
  return pick(BORED[parentCategory(theme)]);
}

export function pickRecipeSpam(theme: WordTheme, answer?: string): RecipeSpamVariant {
  const override = answer ? getWordThemeOverride(answer) : undefined;
  const v = pick(RECIPE[parentCategory(theme)]);
  return {
    ...v,
    recipeTitle: override?.recipeTitle ?? v.recipeTitle,
    maskSide: Math.random() < 0.5 ? 'left' : 'right',
  };
}

export function pickRejectionLetter(theme: WordTheme): RejectionLetterVariant {
  return pick(REJECTION[parentCategory(theme)]);
}

export function pickPlayfulInsult(theme: WordTheme, answer?: string): PlayfulInsultVariant {
  const override = answer ? getWordThemeOverride(answer) : undefined;
  const themeContent = getThemeContent(theme);
  if (override?.insult) {
    return { line: override.insult };
  }
  if (themeContent?.insults?.length) {
    return { line: pick(themeContent.insults) };
  }
  return pick(INSULTS[parentCategory(theme)]);
}

export function pickFaceSwap(theme: WordTheme, answer?: string): FaceSwapVariant {
  const override = answer ? getWordThemeOverride(answer) : undefined;
  const themeContent = getThemeContent(theme);
  if (override?.faceSwapTagline) {
    return { tagline: override.faceSwapTagline };
  }
  if (themeContent?.faceSwapTaglines?.length) {
    return { tagline: pick(themeContent.faceSwapTaglines) };
  }
  return pick(FACE_SWAP[parentCategory(theme)]);
}

export function hintPrefix(theme: WordTheme, answer?: string): string {
  const override = answer ? getWordThemeOverride(answer) : undefined;
  const themeContent = getThemeContent(theme);
  return (
    override?.hintPrefix ??
    themeContent?.hintPrefix ??
    HINT_PREFIX[parentCategory(theme)]
  );
}

export function pickDiceFlavor(theme: WordTheme): string {
  const themeContent = getThemeContent(theme);
  if (themeContent?.diceFlavor?.length) {
    return pick(themeContent.diceFlavor);
  }
  return pick(DICE_FLAVOR[parentCategory(theme)]);
}

export function fillTemplate(template: string, wrongGuess: string): string {
  return template.replace(/\{wrongGuess\}/g, wrongGuess || '???');
}
