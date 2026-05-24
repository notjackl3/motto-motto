/**
 * Download resolved batch-2 memes, overwriting provisional parent copies.
 * Uses Special:FilePath (more reliable than upload.wikimedia.org direct URLs).
 *
 * Run: node scripts/download-batch2-real.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(root, 'client/public/assets/cards/meme-cannon');
const TMP = join(root, '.tmp-meme-import');
const RESOLVED_PATH = join(root, 'docs/card-design/batch2-resolved.json');
const MANIFEST_PATH = join(root, 'docs/card-design/meme-batch2-manifest.json');
const UA = 'TidalWordleAssetBot/1.0 (motto-motto; batch2 download)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function filePathUrl(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName.replace(/ /g, '_'))}`;
}

function processImage(raw, out) {
  execSync(`sips -s format png "${raw}" --out "${out}"`, { stdio: 'pipe' });
  const w = Number(
    execSync(`sips -g pixelWidth "${out}"`, { encoding: 'utf8' }).match(/pixelWidth: (\d+)/)?.[1]
  );
  const h = Number(
    execSync(`sips -g pixelHeight "${out}"`, { encoding: 'utf8' }).match(/pixelHeight: (\d+)/)?.[1]
  );
  if (w >= h) execSync(`sips --resampleWidth 640 "${out}"`, { stdio: 'pipe' });
  else execSync(`sips --resampleHeight 480 "${out}"`, { stdio: 'pipe' });
}

function attribution(entry) {
  if (/public domain|^pd$|cc0/i.test(entry.license)) return null;
  const who = (entry.artist ?? '').replace(/<[^>]+>/g, '').slice(0, 120) || 'Unknown author';
  return `"${entry.fileName}" by ${who}, ${entry.license}, via Wikimedia Commons`;
}

mkdirSync(DEST, { recursive: true });
mkdirSync(TMP, { recursive: true });

const { resolved } = JSON.parse(readFileSync(RESOLVED_PATH, 'utf8'));
const downloaded = [];
const failed = [];

for (const entry of resolved) {
  const out = join(DEST, `meme-${entry.theme}.png`);
  const raw = join(TMP, `${entry.theme}-raw`);
  const url = filePathUrl(entry.fileName);
  console.log(`download ${entry.theme} (${entry.fileName}) ...`);
  await sleep(18000);
  try {
    execSync(`curl -fsSL -A "${UA}" -L "${url}" -o "${raw}"`, { stdio: 'pipe', timeout: 120000 });
    processImage(raw, out);
    downloaded.push({
      path: `public/assets/cards/meme-cannon/meme-${entry.theme}.png`,
      theme: entry.theme,
      parentCategory: entry.parentCategory,
      type: 'image/png',
      source: entry.source,
      downloadUrl: entry.downloadUrl,
      license: entry.license,
      attribution: attribution(entry),
      batch: 'meme-cannon-batch-2',
    });
    console.log('  ok');
  } catch (e) {
    failed.push(entry.theme);
    console.log(`  FAIL: ${e.message?.slice(0, 80)}`);
  }
}

const existingManifest = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  : { assets: [] };

const byTheme = new Map(existingManifest.assets.map((a) => [a.theme, a]));
for (const a of downloaded) byTheme.set(a.theme, { ...a, provisional: false });

writeFileSync(
  MANIFEST_PATH,
  JSON.stringify(
    {
      version: 2,
      project: 'tidal-wordle',
      batch: 'meme-cannon-batch-2',
      importedAt: new Date().toISOString().slice(0, 10),
      note: 'Real Wikimedia downloads overwrite provisional copies where successful.',
      assets: [...byTheme.values()].sort((a, b) => a.theme.localeCompare(b.theme)),
      downloaded: downloaded.map((d) => d.theme),
      failed,
    },
    null,
    2
  ) + '\n'
);

console.log(`\nDownloaded ${downloaded.length}/${resolved.length}, failed: ${failed.join(', ') || 'none'}`);
