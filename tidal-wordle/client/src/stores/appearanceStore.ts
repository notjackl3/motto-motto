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

export type HatStyle =
  | 'none'
  | 'straw'
  | 'bucket'
  | 'snapback'
  | 'visor'
  | 'beanie'
  | 'cowboy'
  | 'fedora'
  | 'top-hat'
  | 'headband'
  | 'sombrero'
  | 'propeller';

export interface HatOption {
  id: string;
  name: string;
  description: string;
  color: string | null;
  style: HatStyle;
  accent?: string;
}

// ============================================================
//  SHIRTS  (50 — existing IDs first so saved selections survive)
// ============================================================

export const SHIRTS: ShirtOption[] = [
  { id: 'coral-rashguard', name: 'Coral Rashguard', description: 'Long-sleeve, sun-warmed coral. The classic dawn-patrol kit.', color: '#ff7a59', accent: '#c44030', pattern: 'solid', cut: 'rashguard' },
  { id: 'reef-diver', name: 'Reef Diver', description: 'Aqua rashguard with white reef-stripe bands.', color: '#3aa8c0', accent: '#f0f8ff', pattern: 'stripes-h', cut: 'rashguard' },
  { id: 'sunset-tank', name: 'Sunset Tank', description: 'Sleeveless pink tank, magic-hour energy.', color: '#ff8eb4', accent: '#ffd4e3', pattern: 'racing', cut: 'tank' },
  { id: 'banana-aloha', name: 'Banana Aloha', description: 'Loud Hawaiian button-up — yellow with hibiscus spots.', color: '#ffd166', accent: '#d92b2b', pattern: 'spots', cut: 'tee' },
  { id: 'lifeguard-red', name: 'Lifeguard Red', description: 'Red tank with the white cross. Authority on the sand.', color: '#d92b2b', accent: '#ffffff', pattern: 'emblem', cut: 'tank' },
  { id: 'palm-green', name: 'Palm Green', description: 'Frond-green tee with two thin gold racing stripes.', color: '#4fb56d', accent: '#f1c43c', pattern: 'stripes-v', cut: 'tee' },
  { id: 'surf-white', name: 'Surf White', description: 'Salt-bleached tank with bold navy hoops.', color: '#f5f5f5', accent: '#1f2a55', pattern: 'stripes-h', cut: 'tank' },
  { id: 'midnight-wetsuit', name: 'Midnight Wetsuit', description: 'Full neoprene with neon teal racing stripes.', color: '#1a2238', accent: '#44ffee', pattern: 'racing', cut: 'rashguard' },

  { id: 'lava-orange', name: 'Lava Flow', description: 'Hot lava orange with deep red battle stripes.', color: '#ff4f00', accent: '#7a0000', pattern: 'racing', cut: 'rashguard' },
  { id: 'mint-cooler', name: 'Mint Cooler', description: 'Cooling mint tank with chalk-white hoops.', color: '#7ee8b8', accent: '#ffffff', pattern: 'stripes-h', cut: 'tank' },
  { id: 'sky-patrol', name: 'Sky Patrol', description: 'Sky-blue rashguard with a gold cloud emblem.', color: '#6ab8f0', accent: '#f1c43c', pattern: 'emblem', cut: 'rashguard' },
  { id: 'sand-surfer', name: 'Sand Surfer', description: 'Soft sand tee, fits in anywhere on the beach.', color: '#d8b777', accent: '#7a4d24', pattern: 'solid', cut: 'tee' },
  { id: 'cherry-pop', name: 'Cherry Pop', description: 'Cherry-red tank speckled with white dots.', color: '#ed2939', accent: '#ffffff', pattern: 'spots', cut: 'tank' },
  { id: 'lemon-splash', name: 'Lemon Splash', description: 'Citrus yellow tee with magenta racing stripes.', color: '#fde047', accent: '#c71585', pattern: 'stripes-v', cut: 'tee' },
  { id: 'plum-sunset', name: 'Plum Sunset', description: 'Royal plum rashguard, mysterious and smooth.', color: '#8e44ad', accent: '#ffd166', pattern: 'solid', cut: 'rashguard' },
  { id: 'mango-tango', name: 'Mango Tango', description: 'Mango tee with little green palm-leaf dots.', color: '#ff9933', accent: '#4fb56d', pattern: 'spots', cut: 'tee' },
  { id: 'aqua-reef', name: 'Aqua Reef', description: 'Bright aqua tank, sun-bleached white bands.', color: '#00cccc', accent: '#fffaf0', pattern: 'stripes-h', cut: 'tank' },
  { id: 'charcoal-classic', name: 'Charcoal Classic', description: 'Sharp charcoal tee, two neon racing stripes.', color: '#2a2a2a', accent: '#ff44dd', pattern: 'stripes-v', cut: 'tee' },
  { id: 'rose-gold', name: 'Rose Gold', description: 'Soft rose-gold tank, dipped in cream stripes.', color: '#ffb7c5', accent: '#fff0e6', pattern: 'racing', cut: 'tank' },
  { id: 'olive-patrol', name: 'Olive Patrol', description: 'Olive rashguard, two khaki racing stripes.', color: '#6b8e23', accent: '#cda63a', pattern: 'stripes-v', cut: 'rashguard' },

  { id: 'lavender-mist', name: 'Lavender Mist', description: 'Soft lavender tank for the chill set.', color: '#c8a2c8', accent: '#7a4d8a', pattern: 'solid', cut: 'tank' },
  { id: 'toxic-lime', name: 'Toxic Lime', description: 'Searing lime rashguard with a black flash emblem.', color: '#c0ff00', accent: '#0a0a0a', pattern: 'emblem', cut: 'rashguard' },
  { id: 'burgundy-dive', name: 'Burgundy Dive', description: 'Deep burgundy rashguard, dive-team uniform energy.', color: '#800020', accent: '#f1c43c', pattern: 'solid', cut: 'rashguard' },
  { id: 'salmon-fade', name: 'Salmon Fade', description: 'Salmon tee with cream horizontal bands.', color: '#fa8072', accent: '#fff8e2', pattern: 'stripes-h', cut: 'tee' },
  { id: 'royal-wave', name: 'Royal Wave', description: 'Royal-blue rashguard with twin gold stripes.', color: '#1e3a8a', accent: '#f1c43c', pattern: 'stripes-v', cut: 'rashguard' },
  { id: 'pearl-white', name: 'Pearl White', description: 'Pearl tank dotted with pale pink spots.', color: '#f8f8ff', accent: '#ffb7c5', pattern: 'spots', cut: 'tank' },
  { id: 'lifeguard-yellow', name: 'Lifeguard Yellow', description: 'Bright yellow tank with a red emergency cross.', color: '#f1c40f', accent: '#d92b2b', pattern: 'emblem', cut: 'tank' },
  { id: 'pacific-blue', name: 'Pacific Blue', description: 'Open-ocean blue rashguard, smooth and solid.', color: '#0077b6', accent: '#caf0f8', pattern: 'solid', cut: 'rashguard' },
  { id: 'magma-red', name: 'Magma Red', description: 'Magma-red rashguard with twin black battle stripes.', color: '#cc2936', accent: '#0a0a0a', pattern: 'racing', cut: 'rashguard' },
  { id: 'forest-camo', name: 'Forest Camo', description: 'Dark forest tee speckled with khaki camo dots.', color: '#355e3b', accent: '#cda63a', pattern: 'spots', cut: 'tee' },

  { id: 'beach-bum-tan', name: 'Beach-Bum Tan', description: 'Earthy tan tank — the bare minimum is enough.', color: '#d2a679', accent: '#6a4a25', pattern: 'solid', cut: 'tank' },
  { id: 'cyan-pulse', name: 'Cyan Pulse', description: 'Cyan rashguard with strobing white bands.', color: '#06b6d4', accent: '#ffffff', pattern: 'stripes-h', cut: 'rashguard' },
  { id: 'coral-coast', name: 'Coral Coast', description: 'Coral tee with crisp white twin stripes.', color: '#ff6b6b', accent: '#ffffff', pattern: 'stripes-v', cut: 'tee' },
  { id: 'surf-black', name: 'Surf Black', description: 'Pure black rashguard, twin orange racing stripes.', color: '#0a0a0a', accent: '#ff8a3c', pattern: 'racing', cut: 'rashguard' },
  { id: 'pumpkin-spice', name: 'Pumpkin Spice', description: 'Pumpkin-orange tee — autumn surf vibes.', color: '#d35400', accent: '#7a3a20', pattern: 'solid', cut: 'tee' },
  { id: 'mint-sea', name: 'Mint Sea', description: 'Soft mint tank with white reef hoops.', color: '#98ff98', accent: '#ffffff', pattern: 'stripes-h', cut: 'tank' },
  { id: 'hibiscus-bloom', name: 'Hibiscus Bloom', description: 'Magenta tee scattered with yellow hibiscus.', color: '#c71585', accent: '#ffd166', pattern: 'spots', cut: 'tee' },
  { id: 'marlin-blue', name: 'Marlin Blue', description: 'Deep marlin-blue tee with a gold fish emblem.', color: '#1f3a93', accent: '#f1c43c', pattern: 'emblem', cut: 'tee' },
  { id: 'coconut-cream', name: 'Coconut Cream', description: 'Creamy coconut rashguard, sun-faded and soft.', color: '#fff4e6', accent: '#a06a3a', pattern: 'solid', cut: 'rashguard' },
  { id: 'volcano-black', name: 'Volcano Black', description: 'Ink-black rashguard with deep magma stripes.', color: '#1a0f0f', accent: '#cc2936', pattern: 'racing', cut: 'rashguard' },

  { id: 'tiki-torch', name: 'Tiki Torch', description: 'Tiki-orange tee dotted with flame-yellow spots.', color: '#ff6347', accent: '#ffd166', pattern: 'spots', cut: 'tee' },
  { id: 'sea-glass', name: 'Sea Glass', description: 'Cool sea-glass tank, smooth and solid.', color: '#88d8c0', accent: '#3aa8c0', pattern: 'solid', cut: 'tank' },
  { id: 'sunrise-pink', name: 'Sunrise Pink', description: 'Sunrise-pink tee with creamy horizontal bands.', color: '#ff9a8b', accent: '#fff8e2', pattern: 'stripes-h', cut: 'tee' },
  { id: 'storm-grey', name: 'Storm Grey', description: 'Storm-cloud grey rashguard, twin teal stripes.', color: '#708090', accent: '#3aa8c0', pattern: 'stripes-v', cut: 'rashguard' },
  { id: 'fluoro-pink', name: 'Fluoro Pink', description: 'Eye-searing fluoro pink with twin lime stripes.', color: '#ff007f', accent: '#c0ff00', pattern: 'racing', cut: 'tank' },
  { id: 'driftwood-tan', name: 'Driftwood Tan', description: 'Driftwood tee — earthy, weathered, dependable.', color: '#b08968', accent: '#3a2a14', pattern: 'solid', cut: 'tee' },
  { id: 'cobalt-surfer', name: 'Cobalt Surfer', description: 'Cobalt rashguard scattered with white spray dots.', color: '#0047ab', accent: '#ffffff', pattern: 'spots', cut: 'rashguard' },
  { id: 'tropical-punch', name: 'Tropical Punch', description: 'Punch-pink tank, twin orange racing stripes.', color: '#ff4081', accent: '#ff8a3c', pattern: 'stripes-v', cut: 'tank' },
  { id: 'ice-blue', name: 'Ice Blue', description: 'Glacier blue rashguard speckled with snow-white.', color: '#b3e5fc', accent: '#ffffff', pattern: 'spots', cut: 'rashguard' },
  { id: 'shaka-tee', name: 'Shaka Tee', description: 'Shaka-yellow tee with a brown emblem on the chest.', color: '#f4c542', accent: '#6a4a25', pattern: 'emblem', cut: 'tee' },

  { id: 'kelp-forest', name: 'Kelp Forest', description: 'Deep-kelp green rashguard, gold reef bands.', color: '#2a5a2a', accent: '#f1c43c', pattern: 'stripes-h', cut: 'rashguard' },
  { id: 'big-kahuna', name: 'Big Kahuna', description: 'Tan tee with a bold red Big-Kahuna cross emblem.', color: '#e8b873', accent: '#d92b2b', pattern: 'emblem', cut: 'tee' },
];

// ============================================================
//  SHORTS  (30 — existing IDs first)
// ============================================================

export const SHORTS: ShortsOption[] = [
  { id: 'navy-trunks', name: 'Navy Trunks', description: 'Solid navy, the dependable default.', color: '#1f2a55', accent: '#f5f5f5', pattern: 'solid' },
  { id: 'sunset-stripe', name: 'Sunset Stripe', description: 'Orange with crisp white racing stripes down the side.', color: '#ff8a3c', accent: '#ffffff', pattern: 'stripes-side' },
  { id: 'black-wetsuit', name: 'Black Neoprene', description: 'Long black wetsuit legs with a single yellow band.', color: '#1a1a1a', accent: '#f1c43c', pattern: 'stripes-h' },
  { id: 'tropical-teal', name: 'Tropical Teal', description: 'Lagoon teal with cream coral-spot pattern.', color: '#0f9d8f', accent: '#fff8e2', pattern: 'spots' },
  { id: 'aloha-magenta', name: 'Aloha Magenta', description: 'Magenta board shorts with hibiscus floral.', color: '#c8568e', accent: '#ffd166', pattern: 'floral' },
  { id: 'lemon', name: 'Lemon Drop', description: 'Citrus yellow trunks with a red horizontal band.', color: '#f1c43c', accent: '#d92b2b', pattern: 'stripes-h' },

  { id: 'coral-boardies', name: 'Coral Boardies', description: 'Coral boardies with white outer stripes.', color: '#ff7a59', accent: '#ffffff', pattern: 'stripes-side' },
  { id: 'reef-trunks', name: 'Reef Trunks', description: 'Aqua trunks scattered with white reef blossoms.', color: '#3aa8c0', accent: '#ffffff', pattern: 'floral' },
  { id: 'sand-camo', name: 'Sand Camo', description: 'Sand-tone trunks with darker camo spots.', color: '#d8b777', accent: '#6a4a25', pattern: 'spots' },
  { id: 'storm-wetsuit', name: 'Storm Wetsuit', description: 'Long charcoal neoprene with a single cyan band.', color: '#36454f', accent: '#06b6d4', pattern: 'stripes-h' },
  { id: 'lime-shorts', name: 'Lime Pop Shorts', description: 'Bright lime trunks, neon and unmissable.', color: '#c0ff00', accent: '#2a2a2a', pattern: 'solid' },
  { id: 'hibiscus-trunks', name: 'Hibiscus Trunks', description: 'Magenta trunks dotted with yellow blossoms.', color: '#c71585', accent: '#ffd166', pattern: 'floral' },
  { id: 'sky-trunks', name: 'Sky Trunks', description: 'Sky-blue trunks with crisp white outer stripes.', color: '#6ab8f0', accent: '#ffffff', pattern: 'stripes-side' },
  { id: 'olive-cargo', name: 'Olive Cargo', description: 'Olive cargo shorts, solid and quiet.', color: '#6b8e23', accent: '#3a2a14', pattern: 'solid' },
  { id: 'sunset-burn', name: 'Sunset Burn', description: 'Burnt orange trunks with cream waistband.', color: '#ff4500', accent: '#fff8e2', pattern: 'stripes-h' },
  { id: 'rose-beach', name: 'Rose Beach', description: 'Rose pink trunks speckled with white spray.', color: '#ffb7c5', accent: '#ffffff', pattern: 'spots' },
  { id: 'charcoal-trunks', name: 'Charcoal Trunks', description: 'Charcoal trunks with neon side stripes.', color: '#2a2a2a', accent: '#ff44dd', pattern: 'stripes-side' },
  { id: 'mint-boardies', name: 'Mint Boardies', description: 'Mint boardies covered in cream blossoms.', color: '#98ff98', accent: '#fff8e2', pattern: 'floral' },
  { id: 'plum-shorts', name: 'Plum Shorts', description: 'Royal plum shorts, solid and luxurious.', color: '#8e44ad', accent: '#ffd166', pattern: 'solid' },
  { id: 'wave-blue', name: 'Wave Blue', description: 'Wave-blue trunks with cream horizontal band.', color: '#0077b6', accent: '#fff8e2', pattern: 'stripes-h' },
  { id: 'cherry-boardies', name: 'Cherry Boardies', description: 'Cherry red boardies with white side stripes.', color: '#ed2939', accent: '#ffffff', pattern: 'stripes-side' },
  { id: 'forest-trunks', name: 'Forest Trunks', description: 'Dark forest trunks speckled with khaki camo.', color: '#355e3b', accent: '#cda63a', pattern: 'spots' },
  { id: 'lavender-shorts', name: 'Lavender Shorts', description: 'Lavender shorts, solid and easy.', color: '#c8a2c8', accent: '#7a4d8a', pattern: 'solid' },
  { id: 'aqua-camo', name: 'Aqua Camo', description: 'Aqua trunks with darker camo dots.', color: '#00cccc', accent: '#0077b6', pattern: 'spots' },
  { id: 'sunset-floral', name: 'Sunset Floral', description: 'Sunset orange trunks blooming with hibiscus.', color: '#ff8a3c', accent: '#c71585', pattern: 'floral' },
  { id: 'salmon-stripes', name: 'Salmon Stripes', description: 'Salmon trunks with white outer stripes.', color: '#fa8072', accent: '#ffffff', pattern: 'stripes-side' },
  { id: 'crimson-trunks', name: 'Crimson Trunks', description: 'Crimson trunks, solid and bold.', color: '#dc143c', accent: '#0a0a0a', pattern: 'solid' },
  { id: 'beach-white', name: 'Beach White', description: 'Crisp white trunks with navy side stripes.', color: '#f5f5f5', accent: '#1f2a55', pattern: 'stripes-side' },
  { id: 'tropical-yellow', name: 'Tropical Yellow', description: 'Yellow trunks bursting with red hibiscus.', color: '#fde047', accent: '#d92b2b', pattern: 'floral' },
  { id: 'mauka-mauka', name: 'Mauka Mauka', description: 'Earthy mauka brown with a red band.', color: '#7a4d24', accent: '#d92b2b', pattern: 'stripes-h' },
];

// ============================================================
//  BOARDS  (30 — existing IDs first)
// ============================================================

export const BOARDS: BoardOption[] = [
  { id: 'classic-cream', name: 'Classic Cream', description: 'Shortboard. Cream deck, single red stripe, blue rails.', deck: '#f8e8b0', stripe: '#e25a3a', rail: '#2898d4', shape: 'shortboard', pattern: 'single-stripe', finColor: '#2898d4' },
  { id: 'tropical-sunset', name: 'Tropical Sunset Longboard', description: 'Longboard with double coral stripes and yellow rails.', deck: '#ffb27f', stripe: '#ff5a5a', rail: '#ffe066', shape: 'longboard', pattern: 'double-stripe', finColor: '#ff5a5a' },
  { id: 'ocean-camo', name: 'Ocean Camo Fish', description: 'Fish tail with a dark spine and aqua-spot camo.', deck: '#6fb8c8', stripe: '#0a3a5c', rail: '#3aa8c0', shape: 'fish', pattern: 'spots', finColor: '#0a3a5c' },
  { id: 'pineapple-express', name: 'Pineapple Express', description: 'Yellow fish tail with green checker pattern.', deck: '#ffe066', stripe: '#4fb56d', rail: '#ff8a3c', shape: 'fish', pattern: 'checker', finColor: '#4fb56d' },
  { id: 'shark-bite', name: 'Shark Bite Gun', description: 'Big-wave gun with a black spine and red flame tip.', deck: '#dfe7ef', stripe: '#1a1a2e', rail: '#d92b2b', shape: 'gun', pattern: 'flame', finColor: '#d92b2b' },
  { id: 'neon-night', name: 'Neon Night', description: 'After-hours shortboard, magenta tip block on a black deck.', deck: '#1a1a2e', stripe: '#ff44dd', rail: '#44ffee', shape: 'shortboard', pattern: 'tip-block', finColor: '#44ffee' },

  { id: 'cosmic-blue', name: 'Cosmic Blue', description: 'Indigo shortboard with cyan tip and white spots.', deck: '#1f3a93', stripe: '#3aa8c0', rail: '#ffffff', shape: 'shortboard', pattern: 'spots', finColor: '#3aa8c0' },
  { id: 'sunset-reef', name: 'Sunset Reef Longboard', description: 'Peach longboard with coral spine and tangerine rails.', deck: '#ffb27f', stripe: '#ff5a5a', rail: '#ff8a3c', shape: 'longboard', pattern: 'single-stripe', finColor: '#ff8a3c' },
  { id: 'aloha-spirit', name: 'Aloha Spirit Fish', description: 'Yellow fish board with a flaming red tip.', deck: '#ffe066', stripe: '#d92b2b', rail: '#4fb56d', shape: 'fish', pattern: 'flame', finColor: '#d92b2b' },
  { id: 'stealth-black', name: 'Stealth Black', description: 'All-black shortboard with subtle grey spine.', deck: '#0a0a0a', stripe: '#5a5a5a', rail: '#2a2a2a', shape: 'shortboard', pattern: 'single-stripe', finColor: '#5a5a5a' },
  { id: 'citrus-splash', name: 'Citrus Splash Fish', description: 'Lime fish with orange checker — sour and loud.', deck: '#c0ff00', stripe: '#ff8a3c', rail: '#ffd166', shape: 'fish', pattern: 'checker', finColor: '#ff8a3c' },
  { id: 'royal-tide', name: 'Royal Tide Longboard', description: 'Navy longboard with twin gold stripes.', deck: '#1f3a93', stripe: '#f1c43c', rail: '#dfe7ef', shape: 'longboard', pattern: 'double-stripe', finColor: '#f1c43c' },
  { id: 'volcano', name: 'Volcano Gun', description: 'Dark red gun with black flame tip — built for size.', deck: '#7a0000', stripe: '#1a1a1a', rail: '#ff4f00', shape: 'gun', pattern: 'flame', finColor: '#ff4f00' },
  { id: 'floral-daze', name: 'Floral Daze Longboard', description: 'Cream longboard scattered with pink blossoms.', deck: '#fff4e6', stripe: '#ff8eb4', rail: '#4fb56d', shape: 'longboard', pattern: 'spots', finColor: '#ff8eb4' },
  { id: 'lightning', name: 'Lightning Shortboard', description: 'White shortboard with a yellow flash on the nose.', deck: '#f8f8ff', stripe: '#f1c43c', rail: '#0077b6', shape: 'shortboard', pattern: 'flame', finColor: '#0077b6' },
  { id: 'ice-cap', name: 'Ice Cap', description: 'Glacier-white shortboard with frozen blue spine.', deck: '#e0f4fc', stripe: '#3aa8c0', rail: '#708090', shape: 'shortboard', pattern: 'single-stripe', finColor: '#3aa8c0' },
  { id: 'forest-wave', name: 'Forest Wave Fish', description: 'Dark green fish with brown spots — woodland surfer.', deck: '#355e3b', stripe: '#7a4d24', rail: '#cda63a', shape: 'fish', pattern: 'spots', finColor: '#7a4d24' },
  { id: 'magenta-dream', name: 'Magenta Dream Gun', description: 'Magenta gun with white tip block and neon rails.', deck: '#c71585', stripe: '#ffffff', rail: '#44ffee', shape: 'gun', pattern: 'tip-block', finColor: '#ffffff' },
  { id: 'sunburst', name: 'Sunburst Longboard', description: 'Yellow longboard with twin orange stripes.', deck: '#ffe066', stripe: '#ff4500', rail: '#d92b2b', shape: 'longboard', pattern: 'double-stripe', finColor: '#ff4500' },
  { id: 'galaxy-surf', name: 'Galaxy Surf Gun', description: 'Deep purple gun with magenta checker — celestial.', deck: '#3a1a5a', stripe: '#ff44dd', rail: '#44ffee', shape: 'gun', pattern: 'checker', finColor: '#ff44dd' },
  { id: 'coral-reef', name: 'Coral Reef Shortboard', description: 'Coral deck with red spine and teal rails.', deck: '#ff7a59', stripe: '#d92b2b', rail: '#3aa8c0', shape: 'shortboard', pattern: 'single-stripe', finColor: '#3aa8c0' },
  { id: 'sea-foam', name: 'Sea Foam Longboard', description: 'Mint longboard with white spots and blue rails.', deck: '#98ff98', stripe: '#ffffff', rail: '#0077b6', shape: 'longboard', pattern: 'spots', finColor: '#0077b6' },
  { id: 'tiger-stripe', name: 'Tiger Stripe Shortboard', description: 'Orange shortboard with black checker tail.', deck: '#ff8a3c', stripe: '#0a0a0a', rail: '#ffffff', shape: 'shortboard', pattern: 'checker', finColor: '#0a0a0a' },
  { id: 'plum-wave', name: 'Plum Wave Fish', description: 'Plum fish with gold tip block and pink rails.', deck: '#8e44ad', stripe: '#f1c43c', rail: '#ffb7c5', shape: 'fish', pattern: 'tip-block', finColor: '#f1c43c' },
  { id: 'sandstorm', name: 'Sandstorm Gun', description: 'Tan gun with twin chocolate stripes — desert sands.', deck: '#d8b777', stripe: '#6a4a25', rail: '#ff8a3c', shape: 'gun', pattern: 'double-stripe', finColor: '#6a4a25' },
  { id: 'bubblegum', name: 'Bubblegum Fish', description: 'Pink fish with white tip block and magenta rails.', deck: '#ff8eb4', stripe: '#ffffff', rail: '#c71585', shape: 'fish', pattern: 'tip-block', finColor: '#ffffff' },
  { id: 'pirate-black', name: 'Pirate Black Gun', description: 'Black gun with red spine and grey rails.', deck: '#0a0a0a', stripe: '#d92b2b', rail: '#5a5a5a', shape: 'gun', pattern: 'single-stripe', finColor: '#d92b2b' },
  { id: 'lemon-shark', name: 'Lemon Shark Shortboard', description: 'Yellow shortboard with black flame tip.', deck: '#fde047', stripe: '#0a0a0a', rail: '#ffffff', shape: 'shortboard', pattern: 'flame', finColor: '#0a0a0a' },
  { id: 'atlantis', name: 'Atlantis Longboard', description: 'Deep blue longboard with gold spots and cyan rails.', deck: '#1f3a93', stripe: '#f1c43c', rail: '#3aa8c0', shape: 'longboard', pattern: 'spots', finColor: '#f1c43c' },
  { id: 'phoenix', name: 'Phoenix Shortboard', description: 'Red shortboard with orange flame tip.', deck: '#d92b2b', stripe: '#ff8a3c', rail: '#f1c43c', shape: 'shortboard', pattern: 'flame', finColor: '#f1c43c' },
];

// ============================================================
//  HATS  (20 — existing IDs first)
// ============================================================

export const HATS: HatOption[] = [
  { id: 'none', name: 'Bare Head', description: 'Let the sea breeze through your hair.', color: null, style: 'none' },
  { id: 'straw-hat', name: 'Straw Hat', description: 'Wide brim with a brown ribbon — beach-bum approved.', color: '#e9c87a', style: 'straw', accent: '#6a4a25' },
  { id: 'bucket-hat', name: 'Bucket Hat', description: 'Teal canvas with a cream band — fishing-village core.', color: '#2faf9e', style: 'bucket', accent: '#fff8e2' },
  { id: 'snapback', name: 'Snapback', description: 'Flat brim, backwards. You know the type.', color: '#d92b2b', style: 'snapback', accent: '#1a1a1a' },
  { id: 'visor', name: 'Sun Visor', description: 'Tangerine band with a white brim. Pure sun-defense.', color: '#ff8a3c', style: 'visor', accent: '#f5f5f5' },

  { id: 'coral-straw', name: 'Coral Straw', description: 'Coral-tinted straw hat for the magic hour.', color: '#ff8eb4', style: 'straw', accent: '#7a3a44' },
  { id: 'lifeguard-cap', name: 'Lifeguard Cap', description: 'Crimson snapback with a white emblem.', color: '#ed2939', style: 'snapback', accent: '#ffffff' },
  { id: 'surf-visor', name: 'Surf Visor', description: 'Royal blue band, white brim. Clean and easy.', color: '#0077b6', style: 'visor', accent: '#ffffff' },
  { id: 'camo-bucket', name: 'Camo Bucket', description: 'Olive bucket hat, ranger-grade.', color: '#6b8e23', style: 'bucket', accent: '#3a2a14' },
  { id: 'magenta-snapback', name: 'Magenta Snapback', description: 'Magenta snapback with a black brim.', color: '#c71585', style: 'snapback', accent: '#0a0a0a' },

  { id: 'black-bucket', name: 'Black Bucket', description: 'Stealth black bucket hat with a grey band.', color: '#0a0a0a', style: 'bucket', accent: '#5a5a5a' },
  { id: 'white-visor', name: 'White Visor', description: 'Pearl-white visor — pure sun-glare defense.', color: '#f8f8ff', style: 'visor', accent: '#3aa8c0' },
  { id: 'coconut-straw', name: 'Coconut Straw', description: 'Cream straw with a coconut-brown ribbon.', color: '#fff4e6', style: 'straw', accent: '#6a4a25' },
  { id: 'forest-snapback', name: 'Forest Snapback', description: 'Forest-green snapback with a gold emblem.', color: '#355e3b', style: 'snapback', accent: '#f1c43c' },
  { id: 'sunset-bucket', name: 'Sunset Bucket', description: 'Sunset-orange bucket with a deep red band.', color: '#ff8a3c', style: 'bucket', accent: '#7a0000' },
  { id: 'royal-snapback', name: 'Royal Snapback', description: 'Royal-blue snapback, gold emblem on the front.', color: '#1f3a93', style: 'snapback', accent: '#f1c43c' },
  { id: 'pink-visor', name: 'Pink Visor', description: 'Bubblegum-pink visor with a cream brim.', color: '#ff8eb4', style: 'visor', accent: '#fff8e2' },
  { id: 'storm-snapback', name: 'Storm Snapback', description: 'Storm-grey snapback, cyan emblem accent.', color: '#708090', style: 'snapback', accent: '#06b6d4' },
  { id: 'lemon-bucket', name: 'Lemon Bucket', description: 'Lemon-yellow bucket with a black band.', color: '#fde047', style: 'bucket', accent: '#0a0a0a' },
  { id: 'cyan-visor', name: 'Cyan Visor', description: 'Cyan band with a navy brim — pop of color.', color: '#06b6d4', style: 'visor', accent: '#1f2a55' },

  // Beanies
  { id: 'classic-beanie', name: 'Classic Beanie', description: 'Charcoal knit cap with a cream pom on top.', color: '#2a2a2a', style: 'beanie', accent: '#fff8e2' },
  { id: 'coral-beanie', name: 'Coral Beanie', description: 'Coral beanie with a creamy folded brim.', color: '#ff7a59', style: 'beanie', accent: '#fff4e6' },
  { id: 'arctic-beanie', name: 'Arctic Beanie', description: 'Ice-blue beanie with a snow-white pom.', color: '#b3e5fc', style: 'beanie', accent: '#ffffff' },
  { id: 'forest-beanie', name: 'Forest Beanie', description: 'Forest-green beanie with a tan brim.', color: '#355e3b', style: 'beanie', accent: '#caa078' },

  // Cowboy hats
  { id: 'rancher-tan', name: 'Rancher Tan', description: 'Tan cowboy with a brown leather band.', color: '#b08968', style: 'cowboy', accent: '#3a2a14' },
  { id: 'black-stetson', name: 'Black Stetson', description: 'All-black cowboy hat — sundown rider.', color: '#0a0a0a', style: 'cowboy', accent: '#7a0000' },
  { id: 'sunset-cowboy', name: 'Sunset Cowboy', description: 'Sunset-orange cowboy with a gold band.', color: '#d35400', style: 'cowboy', accent: '#f1c43c' },

  // Fedoras
  { id: 'beachside-fedora', name: 'Beachside Fedora', description: 'Cream fedora with a brown ribbon.', color: '#fff4e6', style: 'fedora', accent: '#6a4a25' },
  { id: 'noir-fedora', name: 'Noir Fedora', description: 'Black fedora with a red band — mystery.', color: '#0a0a0a', style: 'fedora', accent: '#d92b2b' },
  { id: 'plum-fedora', name: 'Plum Fedora', description: 'Plum fedora with a gold band.', color: '#8e44ad', style: 'fedora', accent: '#f1c43c' },

  // Top hats
  { id: 'classic-tophat', name: 'Classic Top Hat', description: 'Tall black top hat with a red band.', color: '#0a0a0a', style: 'top-hat', accent: '#d92b2b' },
  { id: 'magic-tophat', name: 'Magician’s Top Hat', description: 'Royal-purple top hat with a gold band.', color: '#3a1a5a', style: 'top-hat', accent: '#f1c43c' },

  // Headbands
  { id: 'red-headband', name: 'Red Headband', description: 'Crimson cloth headband, ’80s-aerobics energy.', color: '#d92b2b', style: 'headband', accent: '#ffffff' },
  { id: 'aqua-headband', name: 'Aqua Headband', description: 'Aqua headband with a navy knot.', color: '#3aa8c0', style: 'headband', accent: '#1f2a55' },
  { id: 'shaka-headband', name: 'Shaka Headband', description: 'Yellow headband for the radical days.', color: '#fde047', style: 'headband', accent: '#ff8a3c' },

  // Sombreros
  { id: 'fiesta-sombrero', name: 'Fiesta Sombrero', description: 'Tan sombrero with a multicolor trim.', color: '#d8b777', style: 'sombrero', accent: '#d92b2b' },
  { id: 'midnight-sombrero', name: 'Midnight Sombrero', description: 'Black sombrero with a gold trim.', color: '#0a0a0a', style: 'sombrero', accent: '#f1c43c' },

  // Propeller
  { id: 'rainbow-propeller', name: 'Rainbow Propeller', description: 'Pink beanie with a multicolor spinning prop.', color: '#ff8eb4', style: 'propeller', accent: '#4fb56d' },
  { id: 'classic-propeller', name: 'Classic Propeller', description: 'Yellow propeller cap — peak nerd.', color: '#fde047', style: 'propeller', accent: '#d92b2b' },
];

// ============================================================
//  Store + persistence
// ============================================================

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
