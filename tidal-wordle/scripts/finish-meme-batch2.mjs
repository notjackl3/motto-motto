/**
 * Finish batch 2: copy parent-category meme PNGs as provisional placeholders
 * for themes not yet downloaded; build manifest + attribution.
 *
 * After Wikimedia rate limit clears, run:
 *   node scripts/import-meme-batch2-api.mjs resolve
 *   bash scripts/download-batch2-resolved.sh
 *
 * Run: node scripts/finish-meme-batch2.mjs
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(root, 'client/public/assets/cards/meme-cannon');
const BATCH1 = new Set([
  'sand-dune', 'coast-shore', 'crustacean', 'fish-shark', 'wave-surf',
  'generic-place', 'urban-coastal', 'harbor-dock', 'surf-sport', 'us-west-coast',
  'erosion-sediment', 'europe-beach', 'beachwear-gear', 'abstract-beach', 'bbq-bonfire',
]);

const categories = JSON.parse(
  readFileSync(join(root, 'client/src/data/beachWordCategories.json'), 'utf8')
);
const batch1Manifest = existsSync(join(root, 'docs/card-design/meme-batch1-manifest.json'))
  ? JSON.parse(readFileSync(join(root, 'docs/card-design/meme-batch1-manifest.json'), 'utf8'))
  : { assets: [] };
const resolvedPath = join(root, 'docs/card-design/batch2-resolved.json');
const resolved = existsSync(resolvedPath)
  ? JSON.parse(readFileSync(resolvedPath, 'utf8')).resolved ?? []
  : [];
const resolvedByTheme = new Map(resolved.map((r) => [r.theme, r]));

const batch2Themes = categories.themes.filter((t) => !BATCH1.has(t));
const assets = [];
const provisional = [];
const pendingDownload = [];

function parentMeme(parent) {
  return join(DEST, `meme-${parent}.png`);
}

function themeMeme(theme) {
  return join(DEST, `meme-${theme}.png`);
}

function fileHash(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex');
}

function isProvisionalCopy(theme) {
  const out = themeMeme(theme);
  const parent = categories.themeParent[theme];
  const src = parentMeme(parent);
  if (!existsSync(out) || !existsSync(src)) return false;
  return fileHash(out) === fileHash(src);
}

mkdirSync(DEST, { recursive: true });

for (const theme of batch2Themes) {
  const out = themeMeme(theme);
  const parent = categories.themeParent[theme];
  const resolvedEntry = resolvedByTheme.get(theme);

  if (!existsSync(out)) {
    const src = parentMeme(parent);
    if (existsSync(src)) {
      copyFileSync(src, out);
    }
  }

  if (!existsSync(out)) continue;

  const isProvisional = isProvisionalCopy(theme);
  if (isProvisional) {
    provisional.push({ theme, copiedFrom: `meme-${parent}.png` });
    if (resolvedEntry) {
      pendingDownload.push({
        theme,
        path: `public/assets/cards/meme-cannon/meme-${theme}.png`,
        reason: 'Commons URL resolved — download blocked by rate limit',
        source: resolvedEntry.source,
        downloadUrl: resolvedEntry.downloadUrl,
        fileName: resolvedEntry.fileName,
      });
    }
  }
  const fromResolved = resolvedByTheme.get(theme);
  const batch1Asset = batch1Manifest.assets?.find((a) => a.theme === theme);

  if (batch1Asset) {
    assets.push({ ...batch1Asset, batch: 'meme-cannon-batch-1-or-2' });
  } else if (fromResolved && !isProvisional) {
    assets.push({
      path: `public/assets/cards/meme-cannon/meme-${theme}.png`,
      theme,
      parentCategory: parent,
      type: 'image/png',
      source: fromResolved.source,
      downloadUrl: fromResolved.downloadUrl,
      license: fromResolved.license,
      attribution: fromResolved.license.toLowerCase().includes('public')
        ? null
        : `"${fromResolved.fileName}" by ${fromResolved.artist || 'Unknown'}, ${fromResolved.license}, via Wikimedia Commons`,
      batch: 'meme-cannon-batch-2',
    });
  } else {
    assets.push({
      path: `public/assets/cards/meme-cannon/meme-${theme}.png`,
      theme,
      parentCategory: parent,
      type: 'image/png',
      provisional: isProvisional,
      copiedFrom: isProvisional ? `meme-${parent}.png` : undefined,
      source: fromResolved?.source ?? `provisional copy of meme-${parent}.png`,
      license: isProvisional ? 'Provisional — replace with licensed asset' : fromResolved?.license,
      batch: 'meme-cannon-batch-2',
    });
  }
}

writeFileSync(
  join(root, 'docs/card-design/meme-batch2-manifest.json'),
  JSON.stringify(
    {
      version: 2,
      project: 'tidal-wordle',
      batch: 'meme-cannon-batch-2',
      importedAt: new Date().toISOString().slice(0, 10),
      note:
        'Themes marked provisional copied from parent-category PNG until Commons downloads complete. See batch2-resolved.json + scripts/download-batch2-resolved.sh',
      assets,
      provisional,
      pendingDownload,
    },
    null,
    2
  ) + '\n'
);

const attrLines = [
  '# Meme Cannon attributions',
  '',
  '## Batch 1 (verified Wikimedia downloads)',
  '',
  'See [meme-batch1-manifest.json](./meme-batch1-manifest.json) and batch 1 section in prior ATTRIBUTION.',
  '',
  '## Batch 2 — downloaded themes',
  '',
];
for (const a of assets.filter((x) => !x.provisional && x.attribution)) {
  attrLines.push(`- ${a.attribution} (${a.theme})`);
}
attrLines.push('', '## Batch 2 — provisional (replace when downloaded)', '');
for (const p of provisional) {
  attrLines.push(`- \`${p.theme}\` — temporary copy of \`${p.copiedFrom}\`; pending Commons download`);
}
for (const p of pendingDownload) {
  attrLines.push(`- \`${p.theme}\` — queued: ${p.source}`);
}

writeFileSync(join(root, 'docs/card-design/ATTRIBUTION.md'), attrLines.join('\n') + '\n');

console.log(`Batch 2 themes with PNG: ${assets.length}/${batch2Themes.length}`);
console.log(`Provisional copies: ${provisional.length}`);
console.log(`Pending Commons download: ${pendingDownload.length}`);
