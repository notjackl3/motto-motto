import { create } from 'zustand';

// Dev B note: persistent character customization picked in the Wardrobe panel
// on the welcome screen, and read by Surfer (third-person showcase) + BodyRig
// + IpadRig (first-person in-game). Each item carries a pattern/shape spec —
// not just a color — so options feel meaningfully distinct.

export type ShirtPattern =
  | 'solid'
  | 'stripes-h' // thin horizontal stripes around the torso
  | 'stripes-v' // racing-stripe down the front
  | 'spots' // hibiscus / floral dots
  | 'emblem' // a single chest emblem
  | 'racing'; // two thick stripes shoulder-to-hem

export type ShirtCut = 'rashguard' | 'tank' | 'tee';

export interface ShirtOption {
  id: string;
  name: string;
  description: string;
  color: string;
  accent: string;
  pattern: ShirtPattern;
  cut: ShirtCut;
}

export type ShortsPattern =
  | 'solid'
  | 'stripes-side' // racing stripe down the outer thigh
  | 'stripes-h' // band around the leg
  | 'spots'
  | 'floral';

export interface ShortsOption {
  id: string;
  name: string;
  description: string;
  color: string;
  accent: string;
  pattern: ShortsPattern;
}

export type BoardShape = 'shortboard' | 'longboard' | 'fish' | 'gun';
export type BoardPattern =
  | 'single-stripe'
  | 'double-stripe'
  | 'tip-block'
  | 'spots'
  | 'flame'
  | 'checker';

export interface BoardOption {
  id: string;
  name: string;
  description: string;
  deck: string;
  stripe: string;
  rail: string;
  shape: BoardShape;
  pattern: BoardPattern;
  finColor: string;
}

export interface HatOption {
  id: string;
  name: string;
  description: string;
  color: string | null;
  style: 'none' | 'straw' | 'bucket' | 'snapback' | 'visor';
  accent?: string;
}

export const SHIRTS: ShirtOption[] = [
  {
    id: 'coral-rashguard',
    name: 'Coral Rashguard',
    description: 'Long-sleeve, sun-warmed coral. The classic dawn-patrol kit.',
    color: '#ff7a59',
    accent: '#c44030',
    pattern: 'solid',
    cut: 'rashguard',
  },
  {
    id: 'reef-diver',
    name: 'Reef Diver',
    description: 'Aqua rashguard with white reef-stripe bands.',
    color: '#3aa8c0',
    accent: '#f0f8ff',
    pattern: 'stripes-h',
    cut: 'rashguard',
  },
  {
    id: 'sunset-tank',
    name: 'Sunset Tank',
    description: 'Sleeveless pink tank, magic-hour energy.',
    color: '#ff8eb4',
    accent: '#ffd4e3',
    pattern: 'racing',
    cut: 'tank',
  },
  {
    id: 'banana-aloha',
    name: 'Banana Aloha',
    description: 'Loud Hawaiian button-up — yellow with hibiscus spots.',
    color: '#ffd166',
    accent: '#d92b2b',
    pattern: 'spots',
    cut: 'tee',
  },
  {
    id: 'lifeguard-red',
    name: 'Lifeguard Red',
    description: 'Red tank with the white cross. Authority on the sand.',
    color: '#d92b2b',
    accent: '#ffffff',
    pattern: 'emblem',
    cut: 'tank',
  },
  {
    id: 'palm-green',
    name: 'Palm Green',
    description: 'Frond-green tee with two thin gold racing stripes.',
    color: '#4fb56d',
    accent: '#f1c43c',
    pattern: 'stripes-v',
    cut: 'tee',
  },
  {
    id: 'surf-white',
    name: 'Surf White',
    description: 'Salt-bleached tank with bold navy hoops.',
    color: '#f5f5f5',
    accent: '#1f2a55',
    pattern: 'stripes-h',
    cut: 'tank',
  },
  {
    id: 'midnight-wetsuit',
    name: 'Midnight Wetsuit',
    description: 'Full neoprene with neon teal racing stripes.',
    color: '#1a2238',
    accent: '#44ffee',
    pattern: 'racing',
    cut: 'rashguard',
  },
];

export const SHORTS: ShortsOption[] = [
  {
    id: 'navy-trunks',
    name: 'Navy Trunks',
    description: 'Solid navy, the dependable default.',
    color: '#1f2a55',
    accent: '#f5f5f5',
    pattern: 'solid',
  },
  {
    id: 'sunset-stripe',
    name: 'Sunset Stripe',
    description: 'Orange with crisp white racing stripes down the side.',
    color: '#ff8a3c',
    accent: '#ffffff',
    pattern: 'stripes-side',
  },
  {
    id: 'black-wetsuit',
    name: 'Black Neoprene',
    description: 'Long black wetsuit legs with a single yellow band.',
    color: '#1a1a1a',
    accent: '#f1c43c',
    pattern: 'stripes-h',
  },
  {
    id: 'tropical-teal',
    name: 'Tropical Teal',
    description: 'Lagoon teal with cream coral-spot pattern.',
    color: '#0f9d8f',
    accent: '#fff8e2',
    pattern: 'spots',
  },
  {
    id: 'aloha-magenta',
    name: 'Aloha Magenta',
    description: 'Magenta board shorts with hibiscus floral.',
    color: '#c8568e',
    accent: '#ffd166',
    pattern: 'floral',
  },
  {
    id: 'lemon',
    name: 'Lemon Drop',
    description: 'Citrus yellow trunks with a red horizontal band.',
    color: '#f1c43c',
    accent: '#d92b2b',
    pattern: 'stripes-h',
  },
];

export const BOARDS: BoardOption[] = [
  {
    id: 'classic-cream',
    name: 'Classic Cream',
    description: 'Shortboard. Cream deck, single red stripe, blue rails.',
    deck: '#f8e8b0',
    stripe: '#e25a3a',
    rail: '#2898d4',
    shape: 'shortboard',
    pattern: 'single-stripe',
    finColor: '#2898d4',
  },
  {
    id: 'tropical-sunset',
    name: 'Tropical Sunset Longboard',
    description: 'Longboard with double coral stripes and yellow rails.',
    deck: '#ffb27f',
    stripe: '#ff5a5a',
    rail: '#ffe066',
    shape: 'longboard',
    pattern: 'double-stripe',
    finColor: '#ff5a5a',
  },
  {
    id: 'ocean-camo',
    name: 'Ocean Camo Fish',
    description: 'Fish tail with a dark spine and aqua-spot camo.',
    deck: '#6fb8c8',
    stripe: '#0a3a5c',
    rail: '#3aa8c0',
    shape: 'fish',
    pattern: 'spots',
    finColor: '#0a3a5c',
  },
  {
    id: 'pineapple-express',
    name: 'Pineapple Express',
    description: 'Yellow fish tail with green checker pattern.',
    deck: '#ffe066',
    stripe: '#4fb56d',
    rail: '#ff8a3c',
    shape: 'fish',
    pattern: 'checker',
    finColor: '#4fb56d',
  },
  {
    id: 'shark-bite',
    name: 'Shark Bite Gun',
    description: 'Big-wave gun with a black spine and red flame tip.',
    deck: '#dfe7ef',
    stripe: '#1a1a2e',
    rail: '#d92b2b',
    shape: 'gun',
    pattern: 'flame',
    finColor: '#d92b2b',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    description: 'After-hours shortboard, magenta tip block on a black deck.',
    deck: '#1a1a2e',
    stripe: '#ff44dd',
    rail: '#44ffee',
    shape: 'shortboard',
    pattern: 'tip-block',
    finColor: '#44ffee',
  },
];

export const HATS: HatOption[] = [
  {
    id: 'none',
    name: 'Bare Head',
    description: 'Let the sea breeze through your hair.',
    color: null,
    style: 'none',
  },
  {
    id: 'straw-hat',
    name: 'Straw Hat',
    description: 'Wide brim with a brown ribbon — beach-bum approved.',
    color: '#e9c87a',
    style: 'straw',
    accent: '#6a4a25',
  },
  {
    id: 'bucket-hat',
    name: 'Bucket Hat',
    description: 'Teal canvas with a cream band — fishing-village core.',
    color: '#2faf9e',
    style: 'bucket',
    accent: '#fff8e2',
  },
  {
    id: 'snapback',
    name: 'Snapback',
    description: 'Flat brim, backwards. You know the type.',
    color: '#d92b2b',
    style: 'snapback',
    accent: '#1a1a1a',
  },
  {
    id: 'visor',
    name: 'Sun Visor',
    description: 'Tangerine band with a white brim. Pure sun-defense.',
    color: '#ff8a3c',
    style: 'visor',
    accent: '#f5f5f5',
  },
];

interface AppearanceState {
  shirtId: string;
  shortsId: string;
  boardId: string;
  hatId: string;
  setShirt: (id: string) => void;
  setShorts: (id: string) => void;
  setBoard: (id: string) => void;
  setHat: (id: string) => void;
}

const STORAGE_KEY = 'tidal-wordle:appearance:v1';

interface PersistedShape {
  shirtId: string;
  shortsId: string;
  boardId: string;
  hatId: string;
}

const DEFAULTS: PersistedShape = {
  shirtId: 'coral-rashguard',
  shortsId: 'navy-trunks',
  boardId: 'classic-cream',
  hatId: 'none',
};

function loadPersisted(): PersistedShape {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return {
      shirtId: SHIRTS.find((s) => s.id === parsed.shirtId)
        ? (parsed.shirtId as string)
        : DEFAULTS.shirtId,
      shortsId: SHORTS.find((s) => s.id === parsed.shortsId)
        ? (parsed.shortsId as string)
        : DEFAULTS.shortsId,
      boardId: BOARDS.find((b) => b.id === parsed.boardId)
        ? (parsed.boardId as string)
        : DEFAULTS.boardId,
      hatId: HATS.find((h) => h.id === parsed.hatId)
        ? (parsed.hatId as string)
        : DEFAULTS.hatId,
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: PersistedShape) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private mode — ignore; appearance just doesn't persist.
  }
}

const initial = loadPersisted();

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  shirtId: initial.shirtId,
  shortsId: initial.shortsId,
  boardId: initial.boardId,
  hatId: initial.hatId,
  setShirt: (id) => {
    set({ shirtId: id });
    persist({ ...pickPersisted(get()), shirtId: id });
  },
  setShorts: (id) => {
    set({ shortsId: id });
    persist({ ...pickPersisted(get()), shortsId: id });
  },
  setBoard: (id) => {
    set({ boardId: id });
    persist({ ...pickPersisted(get()), boardId: id });
  },
  setHat: (id) => {
    set({ hatId: id });
    persist({ ...pickPersisted(get()), hatId: id });
  },
}));

function pickPersisted(s: AppearanceState): PersistedShape {
  return {
    shirtId: s.shirtId,
    shortsId: s.shortsId,
    boardId: s.boardId,
    hatId: s.hatId,
  };
}

export function getShirt(id: string): ShirtOption {
  return SHIRTS.find((s) => s.id === id) ?? SHIRTS[0];
}
export function getShorts(id: string): ShortsOption {
  return SHORTS.find((s) => s.id === id) ?? SHORTS[0];
}
export function getBoard(id: string): BoardOption {
  return BOARDS.find((b) => b.id === id) ?? BOARDS[0];
}
export function getHat(id: string): HatOption {
  return HATS.find((h) => h.id === id) ?? HATS[0];
}
