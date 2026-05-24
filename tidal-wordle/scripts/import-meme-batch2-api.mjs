/**
 * Phase 1: resolve Commons URLs -> batch2-resolved.json
 * Phase 2: download resolved -> meme-{theme}.png
 *
 * Run phase 1: node scripts/import-meme-batch2-api.mjs resolve
 * Run phase 2: node scripts/import-meme-batch2-api.mjs download
 * Run both:    node scripts/import-meme-batch2-api.mjs all
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(root, 'client/public/assets/cards/meme-cannon');
const TMP = join(root, '.tmp-meme-import');
const RESOLVED_PATH = join(root, 'docs/card-design/batch2-resolved.json');
const MANIFEST_PATH = join(root, 'docs/card-design/meme-batch2-manifest.json');
const UA = 'TidalWordleAssetBot/1.0 (contact: local-dev; motto-motto meme import)';

const BATCH1 = new Set([
  'sand-dune', 'coast-shore', 'crustacean', 'fish-shark', 'wave-surf',
  'generic-place', 'urban-coastal', 'harbor-dock', 'surf-sport', 'us-west-coast',
  'erosion-sediment', 'europe-beach', 'beachwear-gear', 'abstract-beach', 'bbq-bonfire',
]);

const SEARCH = {
  seabird: 'gull seabird',
  'marine-mammal': 'sea otter morro bay',
  mollusk: 'oyster beach shell',
  'turtle-reptile': 'green sea turtle hawaii',
  'mangrove-palm': 'mangrove forest coast',
  'beach-grass': 'ammophila dune grass beach',
  tide: 'tidal pool starfish',
  'current-estuary': 'estuary aerial coast',
  'lagoon-marsh': 'lagoon marsh coast',
  'offshore-onshore': 'offshore platform north sea',
  'rock-cliff': 'cliffs of moher',
  'pebble-gravel': 'pebble beach stones',
  'island-atoll': 'maldives atoll aerial',
  'cave-canyon': 'blue grotto sea cave',
  'driftwood-wrack': 'driftwood sand beach',
  'treasure-wreck': 'shipwreck coast',
  'us-east-gulf': 'miami beach florida',
  'us-islands': 'hawaii lanikai beach',
  'caribbean-latam': 'caribbean beach palm',
  'australia-nz': 'bondi beach sydney',
  'famous-resort': 'monaco monte carlo harbour',
  'sail-yacht': 'yacht sailing mediterranean',
  'lighthouse-beacon': 'lighthouse pacific coast',
  'pier-promenade': 'santa monica pier',
  'kayak-paddle': 'sea kayak paddling',
  'swim-sun': 'sunbather beach towel',
  'camp-outdoor': 'tent camping beach',
  'boardwalk-social': 'atlantic city boardwalk',
  'lifeguard-safety': 'lifeguard stand beach',
  picnic: 'picnic blanket beach',
  'color-hue': 'rainbow beach ocean',
  'tropical-warm': 'tropical palm beach',
  'deep-ocean': 'open ocean deep blue',
  'beach-vibe': 'beach chair umbrella',
  'hotel-resort': 'maldives beach resort',
  'tourism-vacation': 'tourist suitcase vacation',
  'park-trail': 'coastal path trail ocean',
  'shell-pearl': 'seashell sand beach',
  'sunrise-sunset': 'sunset over ocean beach',
  'water-generic': 'ocean surface waves',
};

const categories = JSON.parse(
  readFileSync(join(root, 'client/src/data/beachWordCategories.json'), 'utf8')
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function okLicense(license) {
  const l = license.toLowerCase();
  return (
    l.includes('public domain') ||
    l.includes('cc0') ||
    l.includes('cc by') ||
    l.includes('cc-by') ||
    l === 'pd'
  );
}

function stripHtml(s) {
  return s?.replace(/<[^>]+>/g, '')?.replace(/\s+/g, ' ')?.trim() ?? '';
}

async function api(params) {
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function resolveTheme(theme, query) {
  const search = await api(
    new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      list: 'search',
      srsearch: `filetype:bitmap ${query}`,
      srnamespace: '6',
      srlimit: '10',
    })
  );
  for (const hit of search.query?.search ?? []) {
    await sleep(800);
    const meta = await api(
      new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        titles: hit.title,
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size',
      })
    );
    const page = Object.values(meta.query?.pages ?? {})[0];
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const license = stripHtml(info.extmetadata?.LicenseShortName?.value ?? '');
    if (!okLicense(license)) continue;
    if (info.width < 480 && info.height < 320) continue;
    const fileName = hit.title.replace(/^File:/, '');
    return {
      theme,
      parentCategory: categories.themeParent[theme],
      fileName,
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
      downloadUrl: info.url,
      thumbUrl: `https://commons.wikimedia.org/w/thumb.php?width=800&f=${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
      license,
      artist: stripHtml(info.extmetadata?.Artist?.value ?? ''),
      width: info.width,
      height: info.height,
    };
  }
  return null;
}

function processImage(raw, out) {
  execSync(`sips -s format png "${raw}" --out "${out}"`, { stdio: 'pipe' });
  const w = Number(
    execSync(`sips -g pixelWidth "${out}"`, { encoding: 'utf8' }).match(
      /pixelWidth: (\d+)/
    )?.[1]
  );
  const h = Number(
    execSync(`sips -g pixelHeight "${out}"`, { encoding: 'utf8' }).match(
      /pixelHeight: (\d+)/
    )?.[1]
  );
  if (w >= h) execSync(`sips --resampleWidth 640 "${out}"`, { stdio: 'pipe' });
  else execSync(`sips --resampleHeight 480 "${out}"`, { stdio: 'pipe' });
}

function attribution(entry) {
  if (/public domain|^pd$/i.test(entry.license)) return null;
  const who = entry.artist || 'Unknown author';
  return `"${entry.fileName}" by ${who}, ${entry.license}, via Wikimedia Commons`;
}

async function resolveAll() {
  const themes = categories.themes.filter((t) => !BATCH1.has(t));
  let resolved = [];
  if (existsSync(RESOLVED_PATH)) {
    resolved = JSON.parse(readFileSync(RESOLVED_PATH, 'utf8')).resolved ?? [];
  }
  const have = new Set(resolved.map((r) => r.theme));
  for (const theme of themes) {
    if (have.has(theme)) continue;
    const out = join(DEST, `meme-${theme}.png`);
    if (existsSync(out)) continue;
    const query = SEARCH[theme] ?? theme.replace(/-/g, ' ');
    console.log(`resolve ${theme} ...`);
    await sleep(5000);
    try {
      const r = await resolveTheme(theme, query);
      if (r) {
        resolved.push(r);
        console.log(`  -> ${r.fileName} (${r.license})`);
      } else console.log('  -> none');
    } catch (e) {
      console.log(`  -> error ${e.message}`);
    }
    writeFileSync(
      RESOLVED_PATH,
      JSON.stringify({ updated: new Date().toISOString(), resolved }, null, 2) + '\n'
    );
  }
}

async function downloadAll() {
  if (!existsSync(RESOLVED_PATH)) {
    console.error('Run resolve first');
    process.exit(1);
  }
  mkdirSync(DEST, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  const { resolved } = JSON.parse(readFileSync(RESOLVED_PATH, 'utf8'));
  const assets = [];

  for (const entry of resolved) {
    const out = join(DEST, `meme-${entry.theme}.png`);
    if (existsSync(out)) {
      assets.push({
        path: `public/assets/cards/meme-cannon/meme-${entry.theme}.png`,
        theme: entry.theme,
        parentCategory: entry.parentCategory,
        type: 'image/png',
        source: entry.source,
        downloadUrl: entry.downloadUrl,
        license: entry.license,
        attribution: attribution(entry),
      });
      continue;
    }
    const raw = join(TMP, `${entry.theme}-raw`);
    console.log(`download ${entry.theme} ...`);
    await sleep(12000);
    const urls = [entry.thumbUrl, entry.downloadUrl];
    let ok = false;
    for (const url of urls) {
      try {
        execSync(`curl -fsSL -A "${UA}" -L "${url}" -o "${raw}"`, { stdio: 'pipe' });
        processImage(raw, out);
        console.log(`  ok`);
        ok = true;
        break;
      } catch {
        await sleep(5000);
      }
    }
    if (ok) {
      assets.push({
        path: `public/assets/cards/meme-cannon/meme-${entry.theme}.png`,
        theme: entry.theme,
        parentCategory: entry.parentCategory,
        type: 'image/png',
        source: entry.source,
        downloadUrl: entry.downloadUrl,
        license: entry.license,
        attribution: attribution(entry),
      });
    } else {
      console.log(`  FAIL`);
    }
  }

  const themes = categories.themes.filter((t) => !BATCH1.has(t));
  const finalMissing = themes.filter((t) => !existsSync(join(DEST, `meme-${t}.png`)));
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        version: 2,
        project: 'tidal-wordle',
        batch: 'meme-cannon-batch-2',
        importedAt: new Date().toISOString().slice(0, 10),
        assets,
        missing: finalMissing.map((t) => ({
          theme: t,
          path: `public/assets/cards/meme-cannon/meme-${t}.png`,
          reason: 'Not downloaded',
        })),
      },
      null,
      2
    ) + '\n'
  );
  console.log(`\nDownloaded ${assets.length}/${themes.length} batch-2 themes`);
}

const mode = process.argv[2] ?? 'all';
if (mode === 'resolve') await resolveAll();
else if (mode === 'download') await downloadAll();
else {
  await resolveAll();
  await downloadAll();
}
