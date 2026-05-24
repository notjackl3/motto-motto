/**
 * Assigns each playable beach word a visual theme key (~65) + legacy parent category.
 * Run: node scripts/classify-beach-words.mjs
 * Output:
 *   client/src/data/beachWordCategories.json
 *   client/src/data/themeContent.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const words = JSON.parse(
  readFileSync(join(root, 'client/src/data/beachWords.json'), 'utf8')
).filter((w) => w.length >= 4 && w.length <= 10);

/** @type {Record<string, { parent: string, label: string, emoji: string, voice: string }>} */
const THEME_META = {
  crustacean: {
    parent: 'marine-animal',
    label: 'crustacean',
    emoji: '🦀',
    voice: 'Crustacean council',
  },
  'fish-shark': {
    parent: 'marine-animal',
    label: 'fish or shark',
    emoji: '🦈',
    voice: 'Reef ranger',
  },
  seabird: {
    parent: 'marine-animal',
    label: 'seabird',
    emoji: '🐦',
    voice: 'Seagull tribunal',
  },
  'marine-mammal': {
    parent: 'marine-animal',
    label: 'marine mammal',
    emoji: '🦭',
    voice: 'Marine biologist',
  },
  mollusk: {
    parent: 'marine-animal',
    label: 'mollusk',
    emoji: '🐚',
    voice: 'Shell society',
  },
  'jelly-octopus': {
    parent: 'marine-animal',
    label: 'jellyfish or cephalopod',
    emoji: '🪼',
    voice: 'Deep sea desk',
  },
  'starfish-urchin': {
    parent: 'marine-animal',
    label: 'echinoderm',
    emoji: '⭐',
    voice: 'Tide pool club',
  },
  'turtle-reptile': {
    parent: 'marine-animal',
    label: 'turtle',
    emoji: '🐢',
    voice: 'Slow coast patrol',
  },
  coral: {
    parent: 'marine-flora',
    label: 'coral reef',
    emoji: '🪸',
    voice: 'Reef keeper',
  },
  'kelp-seaweed': {
    parent: 'marine-flora',
    label: 'kelp or seaweed',
    emoji: '🌿',
    voice: 'Kelp forest FM',
  },
  'mangrove-palm': {
    parent: 'marine-flora',
    label: 'mangrove or palm',
    emoji: '🌴',
    voice: 'Coastal botanist',
  },
  'beach-grass': {
    parent: 'marine-flora',
    label: 'dune grass',
    emoji: '🌾',
    voice: 'Dune ecologist',
  },
  tide: {
    parent: 'water-weather',
    label: 'tide',
    emoji: '🌊',
    voice: 'Tide table',
  },
  'wave-surf': {
    parent: 'water-weather',
    label: 'wave or surf',
    emoji: '🏄',
    voice: 'Surf report',
  },
  'current-estuary': {
    parent: 'water-weather',
    label: 'current or estuary',
    emoji: '🌀',
    voice: 'Estuary office',
  },
  'lagoon-marsh': {
    parent: 'water-weather',
    label: 'lagoon or marsh',
    emoji: '🦆',
    voice: 'Wetlands desk',
  },
  'wind-storm': {
    parent: 'water-weather',
    label: 'wind or storm',
    emoji: '💨',
    voice: 'Storm watch',
  },
  'brackish-salt': {
    parent: 'water-weather',
    label: 'salt water',
    emoji: '🧂',
    voice: 'Salinity lab',
  },
  'offshore-onshore': {
    parent: 'water-weather',
    label: 'offshore direction',
    emoji: '🧭',
    voice: 'Coastal compass',
  },
  'sand-dune': {
    parent: 'shore-geology',
    label: 'sand or dune',
    emoji: '🏜️',
    voice: 'Dune patrol',
  },
  'rock-cliff': {
    parent: 'shore-geology',
    label: 'rock or cliff',
    emoji: '🪨',
    voice: 'Cliff ranger',
  },
  'pebble-gravel': {
    parent: 'shore-geology',
    label: 'pebble or gravel',
    emoji: '⚪',
    voice: 'Pebble counter',
  },
  'coast-shore': {
    parent: 'shore-geology',
    label: 'coast or shore',
    emoji: '🏖️',
    voice: 'Shoreline guide',
  },
  'island-atoll': {
    parent: 'shore-geology',
    label: 'island or atoll',
    emoji: '🏝️',
    voice: 'Island hopper',
  },
  'reef-shoal': {
    parent: 'shore-geology',
    label: 'reef or shoal',
    emoji: '🐠',
    voice: 'Reef map',
  },
  'erosion-sediment': {
    parent: 'shore-geology',
    label: 'erosion or sediment',
    emoji: '📉',
    voice: 'Geology dept',
  },
  'cave-canyon': {
    parent: 'shore-geology',
    label: 'cave or canyon',
    emoji: '🕳️',
    voice: 'Cave tour',
  },
  'driftwood-wrack': {
    parent: 'shore-geology',
    label: 'driftwood or wrack',
    emoji: '🪵',
    voice: 'Beachcomber',
  },
  'treasure-wreck': {
    parent: 'shore-geology',
    label: 'wreck or treasure',
    emoji: '💎',
    voice: 'Salvage crew',
  },
  'us-west-coast': {
    parent: 'places-geography',
    label: 'US west coast',
    emoji: '🌉',
    voice: 'West coast guide',
  },
  'us-east-gulf': {
    parent: 'places-geography',
    label: 'US east or gulf',
    emoji: '🌴',
    voice: 'East coast atlas',
  },
  'us-islands': {
    parent: 'places-geography',
    label: 'US islands',
    emoji: '🌺',
    voice: 'Island passport',
  },
  'europe-beach': {
    parent: 'places-geography',
    label: 'European beach',
    emoji: '🇪🇺',
    voice: 'Euro travel desk',
  },
  'caribbean-latam': {
    parent: 'places-geography',
    label: 'Caribbean or Latin America',
    emoji: '🏝️',
    voice: 'Caribbean brochure',
  },
  'pacific-islands': {
    parent: 'places-geography',
    label: 'Pacific islands',
    emoji: '🌺',
    voice: 'Pacific atlas',
  },
  'australia-nz': {
    parent: 'places-geography',
    label: 'Australia or NZ',
    emoji: '🦘',
    voice: 'Down under guide',
  },
  'city-beach-town': {
    parent: 'places-geography',
    label: 'beach town',
    emoji: '🏘️',
    voice: 'Town welcome sign',
  },
  'famous-resort': {
    parent: 'places-geography',
    label: 'resort destination',
    emoji: '✨',
    voice: 'Resort concierge',
  },
  'generic-place': {
    parent: 'places-geography',
    label: 'place name',
    emoji: '📍',
    voice: 'Travel guide',
  },
  'sail-yacht': {
    parent: 'boats-nautical',
    label: 'sailboat or yacht',
    emoji: '⛵',
    voice: 'Sail club',
  },
  'motor-ship': {
    parent: 'boats-nautical',
    label: 'ship or steamer',
    emoji: '🚢',
    voice: 'Fleet radio',
  },
  'harbor-dock': {
    parent: 'boats-nautical',
    label: 'harbor or dock',
    emoji: '⚓',
    voice: 'Harbor master',
  },
  'lighthouse-beacon': {
    parent: 'boats-nautical',
    label: 'lighthouse or beacon',
    emoji: '🗼',
    voice: 'Beacon keeper',
  },
  'pier-promenade': {
    parent: 'boats-nautical',
    label: 'pier or promenade',
    emoji: '🎣',
    voice: 'Pier attendant',
  },
  'kayak-paddle': {
    parent: 'boats-nautical',
    label: 'kayak or paddle craft',
    emoji: '🛶',
    voice: 'Paddle shop',
  },
  'surf-sport': {
    parent: 'beach-gear-activity',
    label: 'surf sport',
    emoji: '🏄',
    voice: 'Surf shack',
  },
  'swim-sun': {
    parent: 'beach-gear-activity',
    label: 'swim or sun',
    emoji: '☀️',
    voice: 'Sun deck',
  },
  'beachwear-gear': {
    parent: 'beach-gear-activity',
    label: 'beach gear',
    emoji: '🩴',
    voice: 'Gear rental',
  },
  'snorkel-dive': {
    parent: 'beach-gear-activity',
    label: 'snorkel or dive',
    emoji: '🤿',
    voice: 'Dive shop',
  },
  'camp-outdoor': {
    parent: 'beach-gear-activity',
    label: 'camp or outdoor',
    emoji: '⛺',
    voice: 'Camp host',
  },
  'boardwalk-social': {
    parent: 'beach-gear-activity',
    label: 'boardwalk',
    emoji: '🎡',
    voice: 'Boardwalk buzz',
  },
  'lifeguard-safety': {
    parent: 'beach-gear-activity',
    label: 'lifeguard',
    emoji: '🛟',
    voice: 'Lifeguard tower',
  },
  'bbq-bonfire': {
    parent: 'beach-social-food',
    label: 'BBQ or bonfire',
    emoji: '🔥',
    voice: 'Grill master',
  },
  picnic: {
    parent: 'beach-social-food',
    label: 'picnic',
    emoji: '🧺',
    voice: 'Picnic committee',
  },
  'color-hue': {
    parent: 'sensory-descriptive',
    label: 'color',
    emoji: '🎨',
    voice: 'Color wheel',
  },
  'texture-feel': {
    parent: 'sensory-descriptive',
    label: 'texture',
    emoji: '✋',
    voice: 'Touch test',
  },
  'tropical-warm': {
    parent: 'sensory-descriptive',
    label: 'tropical vibe',
    emoji: '🌺',
    voice: 'Tropical mood',
  },
  'deep-ocean': {
    parent: 'sensory-descriptive',
    label: 'deep blue',
    emoji: '🌊',
    voice: 'Deep blue desk',
  },
  'beach-vibe': {
    parent: 'sensory-descriptive',
    label: 'beach aesthetic',
    emoji: '😎',
    voice: 'Vibe check',
  },
  'hotel-resort': {
    parent: 'abstract-generic',
    label: 'hotel or resort',
    emoji: '🏨',
    voice: 'Front desk',
  },
  'tourism-vacation': {
    parent: 'abstract-generic',
    label: 'vacation',
    emoji: '🧳',
    voice: 'Travel agent',
  },
  'park-trail': {
    parent: 'abstract-generic',
    label: 'park or trail',
    emoji: '🥾',
    voice: 'Park ranger',
  },
  'shell-pearl': {
    parent: 'abstract-generic',
    label: 'shell or pearl',
    emoji: '🐚',
    voice: 'Shell shop',
  },
  'sunrise-sunset': {
    parent: 'abstract-generic',
    label: 'sunrise or sunset',
    emoji: '🌅',
    voice: 'Golden hour',
  },
  'water-generic': {
    parent: 'abstract-generic',
    label: 'water',
    emoji: '💧',
    voice: 'Hydration station',
  },
  'urban-coastal': {
    parent: 'abstract-generic',
    label: 'urban coast',
    emoji: '🏙️',
    voice: 'City planner',
  },
  'abstract-beach': {
    parent: 'abstract-generic',
    label: 'beach',
    emoji: '🏖️',
    voice: 'Beach Wordle HQ',
  },
};

/** Ordered rules — first match wins. */
const RULES = [
  {
    theme: 'crustacean',
    re: /^(crab|lobster|shrimp|barnacle|abalone|scallop|conch|dungeness|donax|pompano|crabstick)$/,
  },
  {
    theme: 'fish-shark',
    re: /^(fish|shark|dolphin|bottlenose|seahorse|pompano|squid|starfish|pathogen)$/,
  },
  { theme: 'seabird', re: /^(gull|pelican|heron|egret|tern|albatross|cormorant|sandpiper|plover|shorebird)$/ },
  { theme: 'marine-mammal', re: /^(seal|otter|manatee|turtle|whale|porpoise|narwhal)$/ },
  { theme: 'mollusk', re: /^(clam|mussel|oyster|conch|scallop|abalone|nautilus)$/ },
  { theme: 'jelly-octopus', re: /^(jellyfish|squid)$/ },
  { theme: 'starfish-urchin', re: /^(starfish|urchin)$/ },
  { theme: 'turtle-reptile', re: /^turtle$/ },
  { theme: 'coral', re: /^(coral|coralline|anemone|fringing)$/ },
  { theme: 'kelp-seaweed', re: /^(kelp|seaweed|seagrass|algae)$/ },
  { theme: 'mangrove-palm', re: /^(mangrove|palm|ipomoea)$/ },
  { theme: 'beach-grass', re: /^(beachgrass|dunegrass)$/ },
  { theme: 'tide', re: /^(tide|tidepool|thalassic)$/ },
  { theme: 'wave-surf', re: /^(wave|swell|breaker|surf|foam|seabreeze)$/ },
  {
    theme: 'current-estuary',
    re: /^(current|estuary|brackish|pelagic|overflow|springs|hydraulic|hydrolic|freshwater|saltwater|drift|longshore|alongshore)$/,
  },
  { theme: 'lagoon-marsh', re: /^(lagoon|marsh|inshore|foreshore)$/ },
  { theme: 'wind-storm', re: /^(wind|snow|flood|sandstorm|saltation)$/ },
  {
    theme: 'brackish-salt',
    re: /^(saltwater|freshwater|brackish|salt|seawater|saltation|nonocean|oceanic|oceanless|oceanward|superocean|asea|pelagic)$/,
  },
  {
    theme: 'offshore-onshore',
    re: /^(offshore|onshore|ashore|seaward|alongshore|inshore|noshore|oceanfront|oceanside|oceanview)$/,
  },
  {
    theme: 'sand-dune',
    re: /^(sand|dune|dunes|dunesand|sandbox|sandbar|sandbank|sandpit|sandpile|sandspit|sandridge|sandcastle|sandblast|sandbur|sandglass|sandpaper|sandsoap|sandshoe|sandy|quicksand|hourglass|sandpaper|sandboy|sandbur|sandglass|sanditon|sander|sanderdust|sandblast|sandpile|sandridge|sandspit|sandpit|sandbank|sandbar)$/,
  },
  {
    theme: 'rock-cliff',
    re: /^(rock|stone|cliff|bluff|clifftop|ophiolite|peperino|scree|granite)$/,
  },
  { theme: 'pebble-gravel', re: /^(pebble|gravel|shingle|grit|grain|emery)$/ },
  {
    theme: 'coast-shore',
    re: /^(beach|beaches|beachy|shore|shores|coast|coastal|coastline|seashore|seaside|seacoast|seafront|shoreline|shoreland|shorefront|littoral|strand|seabeach|bayside|lakeshore|riverside|caprae)$/,
  },
  {
    theme: 'island-atoll',
    re: /^(island|isle|atoll|peninsula|headland|cove|gulf|valley|canyon)$/,
  },
  { theme: 'reef-shoal', re: /^(reef|shoal|barrier|breakwater|groyne)$/ },
  {
    theme: 'erosion-sediment',
    re: /^(erosion|sediment|alluvium|arenaceous|arkose|loess|marl|loam|soil|silt|silica|silicon|deposition|landform|culch|cusps|slumping|geological|formation|foundation|fracture)$/,
  },
  { theme: 'cave-canyon', re: /^(cave|canyon)$/ },
  { theme: 'driftwood-wrack', re: /^(driftwood|wrack|flotsam|jetsam|grainy|gritty)$/ },
  { theme: 'treasure-wreck', re: /^(treasure|shipwreck)$/ },
  {
    theme: 'us-west-coast',
    re: /^(calif|california|hawaii|nevada|austin|sanibel|sarasota|monterey|beverly|lauderdale|miami)$/,
  },
  {
    theme: 'us-east-gulf',
    re: /^(florida|virginia|louisiana|texas|orleans|pensacola|chesapeake|savannah|charles|george|henry|edward|thomas|prince|dominical|caprae)$/,
  },
  { theme: 'us-islands', re: /^(aruba|bermuda|lanai|jamaica|hudson|jersey|sanibel)$/ },
  {
    theme: 'europe-beach',
    re: /^(brighton|blackpool|nottingham|yorkshire|wight|monaco|monte|nice|paris|london|rotterdam|copenhagen|ramsgate|wentworth|austen|fran|french|british|irish|caprae)$/,
  },
  {
    theme: 'caribbean-latam',
    re: /^(caribbean|mexico|brazil|aruba|dominical|jamaica|riviera|cinque|carlo|phuket)$/,
  },
  {
    theme: 'pacific-islands',
    re: /^(hawaii|lanai|timor|japan|zealand|australia|aruba|phuket)$/,
  },
  { theme: 'australia-nz', re: /^(australia|zealand|timor)$/ },
  {
    theme: 'city-beach-town',
    re: /^(blackpool|brighton|nottingham|ramsgate|newport|toronto|kingston|santa|austin|miami|beverly|lauderdale|savannah|pensacola|sanibel|sarasota)$/,
  },
  {
    theme: 'famous-resort',
    re: /^(riviera|monaco|monte|nice|paradise|vegas|caprae|phuket|aruba|bermuda|lanai)$/,
  },
  {
    theme: 'generic-place',
    re: /^(africa|antarctic|arabian|atlantic|central|countries|empire|equator|kingdom|latitude|longitude|north|south|southern|united|world|area|zone|located|near|nearby|outside|down|along)$/,
  },
  {
    theme: 'generic-place',
    words: new Set(
      `africa angeles antarctic arabian aruba atlantic austen austin australia baffin bermuda
      beverly blackpool brazil brighton british canada caprae caribbean carlo central charles
      chesapeake cinque copenhagen colorado dominical edward empire florida fran french george
      hawaii henry hong hudson irish jamaica jane japan jersey kent kingston kong lanai lauderdale
      london louisiana manhattan martin mexico miami monaco monte nevada newport nice nottingham
      orleans paris pensacola phuket prince ramsgate rotterdam sanibel santa sarasota savannah
      texas thomas timor toronto united vegas victoria virginia wentworth wight yorkshire zealand
      antarctic arabian atlantic australia baffin brazil canada caribbean colorado dominical
      florida george hawaii hong hudson irish jamaica japan jersey kent kingston london louisiana
      manhattan martin mexico miami monaco nevada orleans paris texas toronto united victoria
      virginia zealand`.trim().split(/\s+/)
    ),
  },
  { theme: 'sail-yacht', re: /^(yacht|sail|catamaran|seafaring|seagoing|nautical|maritime)$/ },
  { theme: 'motor-ship', re: /^(ship|steamship|frigate|expedition|seaborne|shortsea|voyage)$/ },
  {
    theme: 'harbor-dock',
    re: /^(harbor|harborside|marina|mooring|anchorage|wharf|dock|docks|ports|waterfront|waterside|waterway)$/,
  },
  { theme: 'lighthouse-beacon', re: /^(lighthouse|beacon|seamark|signal)$/ },
  { theme: 'pier-promenade', re: /^(pier|promenade|boardwalk|jetty|causeway|groyne|breakwater)$/ },
  { theme: 'kayak-paddle', re: /^(kayak|canoe|paddle|boat)$/ },
  {
    theme: 'surf-sport',
    re: /^(surf|surfing|surfers|surfrider|surfboard|billabong|ride|surface)$/,
  },
  {
    theme: 'swim-sun',
    re: /^(swim|swimming|sunbath|sunbathers|sunbathing|suntanning|sunscreen|sunbake|bathers|bathing)$/,
  },
  {
    theme: 'beachwear-gear',
    re: /^(bikini|wetsuit|swimsuit|towel|umbrella|parasol|hammock|flipflop|beachwear|beachboy|beachcast|beachfront|beachside|beachhead|beachgrass|sandcastle|sandshoe|shemagh|lilo|outdoor|naturists)$/,
  },
  { theme: 'snorkel-dive', re: /^(snorkel|snorkeling|motion|diving|dive)$/ },
  { theme: 'camp-outdoor', re: /^(campground|campsite|campfire|outdoor)$/ },
  { theme: 'boardwalk-social', re: /^(boardwalk|promenade|playground|pleasure|lido|corniche|plage)$/ },
  { theme: 'lifeguard-safety', re: /^(lifeguard)$/ },
  { theme: 'bbq-bonfire', re: /^(barbecue|bonfire|luaus)$/ },
  { theme: 'picnic', re: /^(picnic|picnickers|cooler)$/ },
  { theme: 'color-hue', re: /^(blue|beige|yellow|emerald|blanc|glas|glass|deep)$/ },
  { theme: 'texture-feel', re: /^(grainy|gritty|sandy|rocky|grain|grit)$/ },
  { theme: 'tropical-warm', re: /^(tropical|warm|nice)$/ },
  { theme: 'deep-ocean', re: /^(deep|ocean|pacific|atlantic|superocean|oceanic)$/ },
  { theme: 'beach-vibe', re: /^(open|bright|artificial)$/ },
  {
    theme: 'hotel-resort',
    re: /^(hotel|motel|resort|casino|gambling|waterpark|lodge|cabana|lanai)$/,
  },
  {
    theme: 'tourism-vacation',
    re: /^(tourism|vacation|recreation|patronage|market|playground|pleasure|trail|drag)$/,
  },
  { theme: 'park-trail', re: /^(park|parks|trail|garden|gardens|forest|woods|meadows|prairie|campground|campsite)$/ },
  { theme: 'shell-pearl', re: /^(shell|seashell|pearl|nautilus)$/ },
  { theme: 'sunrise-sunset', re: /^(sunrise|sunset|wakes)$/ },
  { theme: 'water-generic', re: /^(water|pool|lake|river|springs|sink|sewer|sanitary)$/ },
  {
    theme: 'urban-coastal',
    re: /^(urban|suburban|downtown|industrial|developed|road|railway|railways|platform|terrace|street|lane|line|level|scale|signal|ghost|hotel|motel|casino|market|mill|factory|machine|macadam|rocket|room|rooms|week|your|zero|zone|where|with|many|make|find|fill|full|entry|open|near|nearby|north|south|southern|central|area|along|down|bite|branch|bottom|bluff|artificial|abradant|billabong|cannon|cape|castle|cayes|cleaner|cotton|cycle|desertland|dioxide|dollar|earth|exoscopy|flag|formation|foundation|fracture|geological|golf|great|harp|high|hill|hills|home|horizon|huzza|industrial|jonah|jungle|kelvin|king|langmuir|latitude|lawn|longitude|macadam|machine|make|many|meadows|mill|mountain|oats|ogin|outside|park|parks|patronage|piping|prairie|railway|railways|revolution|road|rocket|room|sanitary|scale|sewer|seven|shoe|signal|sink|suit|suspension|trap|urban|viii|waste|week|where|with|woods|your|zero|zone)$/,
  },
];

function classifyTheme(word) {
  const lower = word.toLowerCase();
  for (const rule of RULES) {
    if (rule.words?.has(lower)) return rule.theme;
    if (rule.re?.test(lower)) return rule.theme;
  }
  return 'abstract-beach';
}

const byWord = {};
const byTheme = {};
const themeParent = {};
const themeLabels = {};

for (const [theme, meta] of Object.entries(THEME_META)) {
  themeParent[theme] = meta.parent;
  themeLabels[theme] = meta.label;
}

for (const w of words) {
  const theme = classifyTheme(w);
  byWord[w] = theme;
  (byTheme[theme] ||= []).push(w);
}
for (const t of Object.keys(byTheme)) byTheme[t].sort();

const legacyCategories = [
  'marine-animal',
  'marine-flora',
  'water-weather',
  'shore-geology',
  'places-geography',
  'boats-nautical',
  'beach-gear-activity',
  'beach-social-food',
  'sensory-descriptive',
  'abstract-generic',
];

const byCategory = {};
for (const w of words) {
  const theme = byWord[w];
  const parent = themeParent[theme] ?? 'abstract-generic';
  (byCategory[parent] ||= []).push(w);
}
for (const c of Object.keys(byCategory)) byCategory[c].sort();

/** Generate per-theme text content for card flavor. */
function buildThemeContent() {
  const themes = {};
  for (const [theme, meta] of Object.entries(THEME_META)) {
    const { emoji, voice, label } = meta;
    themes[theme] = {
      hintPrefix: `${voice}:`,
      memeCaptions: [
        `${emoji} ${voice}: hard no on {wrongGuess}`,
        `{wrongGuess} is not a ${label} word`,
        `${emoji} Wrong ${label}: {wrongGuess}`,
        `${voice} rejects {wrongGuess}`,
      ],
      insults: [
        `That guess has ${label} energy — wrong energy.`,
        `${emoji} My ${label} sources say no.`,
        `Even the ${label} club voted against {wrongGuess}.`,
      ],
      forcedBreakLabels: [
        `${emoji} ${label} break — hold up`,
        `Mandatory ${label} timeout`,
      ],
      diceFlavor: [`${emoji} ${label} dice roll…`, `${voice} says reroll!`],
      faceSwapTaglines: [
        `${emoji} ${label} face-swap: not {wrongGuess}`,
        `${voice} glitch — {wrongGuess}`,
      ],
    };
  }
  return { version: 1, themes };
}

const categoriesOut = {
  version: 2,
  themes: Object.keys(THEME_META),
  categories: legacyCategories,
  themeParent,
  themeLabels,
  byWord,
  byTheme,
  byCategory,
  counts: Object.fromEntries(
    Object.entries(byTheme).map(([k, v]) => [k, v.length])
  ),
  categoryCounts: Object.fromEntries(
    Object.entries(byCategory).map(([k, v]) => [k, v.length])
  ),
};

const categoriesPath = join(root, 'client/src/data/beachWordCategories.json');
const themeContentPath = join(root, 'client/src/data/themeContent.json');

writeFileSync(categoriesPath, JSON.stringify(categoriesOut, null, 2) + '\n');
writeFileSync(themeContentPath, JSON.stringify(buildThemeContent(), null, 2) + '\n');

console.log('Wrote', categoriesPath);
console.log('Wrote', themeContentPath);
console.log('Theme count:', Object.keys(byTheme).length);
console.log('Theme distribution (top 15):');
console.log(
  Object.fromEntries(
    Object.entries(categoriesOut.counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
  )
);
console.log('Total words:', words.length);
const tiny = Object.entries(categoriesOut.counts).filter(([, n]) => n < 3);
if (tiny.length) console.log('Themes with <3 words:', Object.fromEntries(tiny));
