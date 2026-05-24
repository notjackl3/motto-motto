/**
 * Import Meme Cannon batch 2 (remaining 52 themes) from Wikimedia Commons.
 * Run: node scripts/import-meme-batch2.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(root, 'client/public/assets/cards/meme-cannon');
const TMP = join(root, '.tmp-meme-import');
const UA = 'TidalWordleAssetBot/1.0 (motto-motto; meme batch import)';

/** theme -> { file, parentCategory, sourcePage, license, attribution } */
const BATCH2 = [
  {
    theme: 'seabird',
    parentCategory: 'marine-animal',
    file: 'Brown_Pelican_(Pelecanus_occidentalis)_(8491635599).jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Brown_Pelican_(Pelecanus_occidentalis)_(8491635599).jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Brown Pelican (Pelecanus occidentalis) (8491635599).jpg" by Don DeBold, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'marine-mammal',
    parentCategory: 'marine-animal',
    file: 'Sea_otters_(Enhydra_lutris)_at_Moro_Bay.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sea_otters_(Enhydra_lutris)_at_Moro_Bay.jpg',
    license: 'CC BY-SA 4.0',
    attribution:
      '"Sea otters (Enhydra lutris) at Moro Bay.jpg" by Mike Baird, CC BY-SA 4.0, via Wikimedia Commons',
  },
  {
    theme: 'mollusk',
    parentCategory: 'marine-animal',
    file: 'Oysters_on_a_plate.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Oysters_on_a_plate.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Oysters on a plate.jpg" by David Monniaux, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'jelly-octopus',
    parentCategory: 'marine-animal',
    file: 'Compass_Jellyfish_(Chrysaora_hysoscella).jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Compass_Jellyfish_(Chrysaora_hysoscella).jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Compass Jellyfish (Chrysaora hysoscella).jpg" by Alexander Vasenin, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'starfish-urchin',
    parentCategory: 'marine-animal',
    file: 'Fromia_monilis_(Seastar).jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Fromia_monilis_(Seastar).jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Fromia monilis (Seastar).jpg" by Nhobgood Nick Hobgood, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'turtle-reptile',
    parentCategory: 'marine-animal',
    file: 'Green_Sea_Turtle_grazing_Turtle_Town.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Green_Sea_Turtle_grazing_Turtle_Town.jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Green Sea Turtle grazing Turtle Town.jpg" by Brocken Inaglory, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'coral',
    parentCategory: 'marine-flora',
    file: 'Coral_reef_at_palmyra.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Coral_reef_at_palmyra.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'kelp-seaweed',
    parentCategory: 'marine-flora',
    file: 'Kelp_forest.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Kelp_forest.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'mangrove-palm',
    parentCategory: 'marine-flora',
    file: 'Mangrove_forest_in_Sundarbans.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Mangrove_forest_in_Sundarbans.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Mangrove forest in Sundarbans.jpg" by Swaminathan, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'beach-grass',
    parentCategory: 'marine-flora',
    file: 'Ammophila_breviligulata_on_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Ammophila_breviligulata_on_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Ammophila breviligulata on beach.jpg" by Matt Lavin, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'tide',
    parentCategory: 'water-weather',
    file: 'Tidal_pools_with_starfish.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Tidal_pools_with_starfish.jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Tidal pools with starfish.jpg" by Brocken Inaglory, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'current-estuary',
    parentCategory: 'water-weather',
    file: 'Estuary_of_the_River_Exe_-_geograph.org.uk_-_1284638.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Estuary_of_the_River_Exe_-_geograph.org.uk_-_1284638.jpg',
    license: 'CC BY-SA 2.0',
    attribution:
      '"Estuary of the River Exe - geograph.org.uk - 1284638.jpg" by Tony Atkin, CC BY-SA 2.0, via Wikimedia Commons',
  },
  {
    theme: 'lagoon-marsh',
    parentCategory: 'water-weather',
    file: 'Lagoon_at_Kennedy_Space_Center.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Lagoon_at_Kennedy_Space_Center.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'wind-storm',
    parentCategory: 'water-weather',
    file: 'Hurricane_Isabel_from_ISS.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Hurricane_Isabel_from_ISS.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'brackish-salt',
    parentCategory: 'water-weather',
    file: 'Salt_evaporation_pond.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Salt_evaporation_pond.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Salt evaporation pond.jpg" by Doc Searls, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'offshore-onshore',
    parentCategory: 'water-weather',
    file: 'Offshore_platform.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Offshore_platform.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'rock-cliff',
    parentCategory: 'shore-geology',
    file: 'Cliffs_of_Moher_(6160551775).jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Cliffs_of_Moher_(6160551775).jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Cliffs of Moher (6160551775).jpg" by Giuseppe Milo, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'pebble-gravel',
    parentCategory: 'shore-geology',
    file: 'Pebbles_on_a_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Pebbles_on_a_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Pebbles on a beach.jpg" by Adrian Pingstone, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'island-atoll',
    parentCategory: 'shore-geology',
    file: 'Atoll_of_Maldives.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Atoll_of_Maldives.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Atoll of Maldives.jpg" by Maldive Islands, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'reef-shoal',
    parentCategory: 'shore-geology',
    file: 'Coral_reef.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Coral_reef.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'cave-canyon',
    parentCategory: 'shore-geology',
    file: 'Sea_cave_in_Mediterranean.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sea_cave_in_Mediterranean.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Sea cave in Mediterranean.jpg" by Olaf Tausch, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'driftwood-wrack',
    parentCategory: 'shore-geology',
    file: 'Driftwood_on_a_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Driftwood_on_a_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Driftwood on a beach.jpg" by Lycaon, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'treasure-wreck',
    parentCategory: 'shore-geology',
    file: 'Shipwreck_in_the_Red_Sea.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Shipwreck_in_the_Red_Sea.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Shipwreck in the Red Sea.jpg" by Bernd Thaller, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'us-east-gulf',
    parentCategory: 'places-geography',
    file: 'Key_West_Beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Key_West_Beach.jpg',
    license: 'CC BY 2.0',
    attribution: '"Key West Beach.jpg" by Mike, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'us-islands',
    parentCategory: 'places-geography',
    file: 'Lanikai_Beach-Hawaii.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Lanikai_Beach-Hawaii.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Lanikai Beach-Hawaii.jpg" by Dirk Ingo Franke, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'caribbean-latam',
    parentCategory: 'places-geography',
    file: 'Caribbean_Beach_(141133105).jpeg',
    source: 'https://commons.wikimedia.org/wiki/File:Caribbean_Beach_(141133105).jpeg',
    license: 'CC BY 2.0',
    attribution:
      '"Caribbean Beach (141133105).jpeg" by David Stanley, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'pacific-islands',
    parentCategory: 'places-geography',
    file: 'Bora_Bora_-_Mt_Otemanu.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Bora_Bora_-_Mt_Otemanu.jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Bora Bora - Mt Otemanu.jpg" by Tim McCune, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'australia-nz',
    parentCategory: 'places-geography',
    file: 'Bondi_Beach-001.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Bondi_Beach-001.jpg',
    license: 'CC BY-SA 3.0',
    attribution: '"Bondi Beach-001.jpg" by Adam.J.W, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'city-beach-town',
    parentCategory: 'places-geography',
    file: 'Brighton_Pier_at_sunset.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Brighton_Pier_at_sunset.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Brighton Pier at sunset.jpg" by Diliff, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'famous-resort',
    parentCategory: 'places-geography',
    file: 'Monaco_harbour.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Monaco_harbour.jpg',
    license: 'CC BY-SA 3.0',
    attribution: '"Monaco harbour.jpg" by Diliff, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'sail-yacht',
    parentCategory: 'boats-nautical',
    file: 'Sailing_yacht_in_the_mediterranean.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sailing_yacht_in_the_mediterranean.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Sailing yacht in the mediterranean.jpg" by Olaf Tausch, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'motor-ship',
    parentCategory: 'boats-nautical',
    file: 'Container_ship.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Container_ship.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'lighthouse-beacon',
    parentCategory: 'boats-nautical',
    file: 'Lighthouse_in_Florida.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Lighthouse_in_Florida.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'pier-promenade',
    parentCategory: 'boats-nautical',
    file: 'Santa_Monica_Pier_(8084093379).jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Santa_Monica_Pier_(8084093379).jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Santa Monica Pier (8084093379).jpg" by Ken Lund, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'kayak-paddle',
    parentCategory: 'boats-nautical',
    file: 'Kayaking_in_Antarctica.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Kayaking_in_Antarctica.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Kayaking in Antarctica.jpg" by Liam Quinn, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'swim-sun',
    parentCategory: 'beach-gear-activity',
    file: 'Sunbathers_on_the_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sunbathers_on_the_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Sunbathers on the beach.jpg" by David Shankbone, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'snorkel-dive',
    parentCategory: 'beach-gear-activity',
    file: 'Snorkeling.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Snorkeling.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'camp-outdoor',
    parentCategory: 'beach-gear-activity',
    file: 'Beach_camping.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Beach_camping.jpg',
    license: 'CC BY-SA 3.0',
    attribution: '"Beach camping.jpg" by W.carter, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'boardwalk-social',
    parentCategory: 'beach-gear-activity',
    file: 'Atlantic_City_Boardwalk.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Atlantic_City_Boardwalk.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'lifeguard-safety',
    parentCategory: 'beach-gear-activity',
    file: 'Lifeguard_tower_at_Newport_Beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Lifeguard_tower_at_Newport_Beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Lifeguard tower at Newport Beach.jpg" by Mike Baird, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'picnic',
    parentCategory: 'beach-social-food',
    file: 'Picnic_on_the_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Picnic_on_the_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Picnic on the beach.jpg" by W.carter, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'color-hue',
    parentCategory: 'sensory-descriptive',
    file: 'Rainbow_over_the_ocean.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Rainbow_over_the_ocean.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Rainbow over the ocean.jpg" by Brocken Inaglory, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'texture-feel',
    parentCategory: 'sensory-descriptive',
    file: 'Sand_texture.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sand_texture.jpg',
    license: 'Public domain',
    attribution: null,
  },
  {
    theme: 'tropical-warm',
    parentCategory: 'sensory-descriptive',
    file: 'Tropical_beach_in_Costa_Rica.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Tropical_beach_in_Costa_Rica.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Tropical beach in Costa Rica.jpg" by Dirk Ingo Franke, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'deep-ocean',
    parentCategory: 'sensory-descriptive',
    file: 'Deep_blue_sea.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Deep_blue_sea.jpg',
    license: 'CC BY-SA 3.0',
    attribution: '"Deep blue sea.jpg" by Brocken Inaglory, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'beach-vibe',
    parentCategory: 'sensory-descriptive',
    file: 'Beach_chairs_and_umbrella.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Beach_chairs_and_umbrella.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Beach chairs and umbrella.jpg" by W.carter, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'hotel-resort',
    parentCategory: 'abstract-generic',
    file: 'Beach_resort_in_Maldives.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Beach_resort_in_Maldives.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Beach resort in Maldives.jpg" by Ibrahim Iujaz, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'tourism-vacation',
    parentCategory: 'abstract-generic',
    file: 'Suitcase_on_the_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Suitcase_on_the_beach.jpg',
    license: 'CC BY 2.0',
    attribution:
      '"Suitcase on the beach.jpg" by Stux, CC BY 2.0, via Wikimedia Commons',
  },
  {
    theme: 'park-trail',
    parentCategory: 'abstract-generic',
    file: 'Coastal_trail.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Coastal_trail.jpg',
    license: 'CC BY-SA 3.0',
    attribution: '"Coastal trail.jpg" by W.carter, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'shell-pearl',
    parentCategory: 'abstract-generic',
    file: 'Seashells_on_the_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Seashells_on_the_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Seashells on the beach.jpg" by W.carter, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'sunrise-sunset',
    parentCategory: 'abstract-generic',
    file: 'Sunset_at_the_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sunset_at_the_beach.jpg',
    license: 'CC BY-SA 3.0',
    attribution:
      '"Sunset at the beach.jpg" by W.carter, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    theme: 'water-generic',
    parentCategory: 'abstract-generic',
    file: 'Water_droplet_on_a_leaf.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Water_droplet_on_a_leaf.jpg',
    license: 'Public domain',
    attribution: null,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function downloadUrl(file) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file).replace(/%20/g, '_')}`;
}

function processImage(raw, out) {
  execSync(`sips -s format png "${raw}" --out "${out}"`, { stdio: 'pipe' });
  const w = Number(
    execSync(`sips -g pixelWidth "${out}"`, { encoding: 'utf8' })
      .match(/pixelWidth: (\d+)/)?.[1]
  );
  const h = Number(
    execSync(`sips -g pixelHeight "${out}"`, { encoding: 'utf8' })
      .match(/pixelHeight: (\d+)/)?.[1]
  );
  if (w >= h) execSync(`sips --resampleWidth 640 "${out}"`, { stdio: 'pipe' });
  else execSync(`sips --resampleHeight 480 "${out}"`, { stdio: 'pipe' });
}

mkdirSync(DEST, { recursive: true });
mkdirSync(TMP, { recursive: true });

const assets = [];
const missing = [];

for (const item of BATCH2) {
  const out = join(DEST, `meme-${item.theme}.png`);
  if (existsSync(out)) {
    console.log(`skip ${item.theme} (exists)`);
    assets.push({
      path: `public/assets/cards/meme-cannon/meme-${item.theme}.png`,
      theme: item.theme,
      parentCategory: item.parentCategory,
      type: 'image/png',
      source: item.source,
      downloadUrl: downloadUrl(item.file),
      license: item.license,
      attribution: item.attribution,
    });
    continue;
  }
  const raw = join(TMP, `${item.theme}-raw`);
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${item.file}`;
  console.log(`get ${item.theme} ...`);
  await sleep(3500);
  try {
    execSync(`curl -fsSL -A "${UA}" -L "${url}" -o "${raw}"`, { stdio: 'pipe' });
    processImage(raw, out);
    console.log(`  ok meme-${item.theme}.png`);
    assets.push({
      path: `public/assets/cards/meme-cannon/meme-${item.theme}.png`,
      theme: item.theme,
      parentCategory: item.parentCategory,
      type: 'image/png',
      source: item.source,
      downloadUrl: url,
      license: item.license,
      attribution: item.attribution,
    });
  } catch (e) {
    console.error(`  FAIL ${item.theme}: ${e.message}`);
    missing.push({
      theme: item.theme,
      path: `public/assets/cards/meme-cannon/meme-${item.theme}.png`,
      reason: `Download failed for ${item.file}`,
      source: item.source,
    });
  }
}

const manifest = {
  version: 2,
  project: 'tidal-wordle',
  batch: 'meme-cannon-batch-2',
  generatedAt: '2026-05-24',
  importedAt: new Date().toISOString().slice(0, 10),
  assets,
  missing,
};

const manifestPath = join(root, 'docs/card-design/meme-batch2-manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote ${manifestPath}`);
console.log(`OK: ${assets.length}  missing: ${missing.length}`);
