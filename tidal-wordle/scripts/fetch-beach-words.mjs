/**
 * Fetches beach-related terms from relatedwords.io and writes client/src/data/beachWords.json.
 * API: https://relatedwords.io/api/relatedTerms?term=beach
 * @see https://relatedwords.io/beach
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../client/src/data/beachWords.json');
const API_URL = 'https://relatedwords.io/api/relatedTerms?term=beach';

const MIN_LENGTH = 4;
const MAX_LENGTH = 10;

/** Terms to exclude from a casual beach Wordle game. */
const BLOCKLIST = new Set([
  'bitch',
  'feces',
  'nakedness',
  'nude',
  'nudists',
  'toplessness',
]);

function tokenize(term) {
  return term
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 0);
}

function isPlayable(word) {
  return (
    /^[a-z]+$/.test(word) &&
    word.length >= MIN_LENGTH &&
    word.length <= MAX_LENGTH &&
    !BLOCKLIST.has(word)
  );
}

function extractWords(terms) {
  const words = new Set();
  for (const { term } of terms) {
    for (const token of tokenize(term)) {
      if (isPlayable(token)) words.add(token);
    }
  }
  return words;
}

async function main() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`relatedwords.io API failed: ${res.status} ${res.statusText}`);
  }
  const terms = await res.json();
  if (!Array.isArray(terms) || terms.some((t) => typeof t?.term !== 'string')) {
    throw new Error('Unexpected API response shape');
  }

  const words = extractWords(terms);

  // Keep any existing playable words not returned by the API (e.g. mussel, squid).
  try {
    const existing = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
    if (Array.isArray(existing)) {
      for (const w of existing) {
        const lower = String(w).toLowerCase();
        if (isPlayable(lower)) words.add(lower);
      }
    }
  } catch {
    // No existing file — API-only list.
  }

  const sorted = [...words].sort((a, b) => a.localeCompare(b));
  writeFileSync(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`);

  console.log(`Fetched ${terms.length} related terms from relatedwords.io`);
  console.log(`Wrote ${sorted.length} playable words (${MIN_LENGTH}–${MAX_LENGTH} letters) to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
