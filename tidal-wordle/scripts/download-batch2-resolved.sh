#!/usr/bin/env bash
# Download batch-2 memes from batch2-resolved.json (run after Wikimedia rate limit cools off).
# Usage: bash scripts/download-batch2-resolved.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/client/public/assets/cards/meme-cannon"
TMP="$ROOT/.tmp-meme-import"
UA="TidalWordleAssetBot/1.0 (motto-motto; batch2 download)"
mkdir -p "$DEST" "$TMP"

node -e "
const r=require('$ROOT/docs/card-design/batch2-resolved.json').resolved;
for (const e of r) console.log(e.theme+'|'+e.fileName);
" | while IFS='|' read -r theme file; do
  out="$DEST/meme-${theme}.png"
  echo "=== $theme ==="
  sleep 20
  url="https://commons.wikimedia.org/wiki/Special:FilePath/${file// /_}"
  raw="$TMP/${theme}-raw"
  if curl -fsSL -A "$UA" -L "$url" -o "$raw"; then
    sips -s format png "$raw" --out "$out" >/dev/null
    w=$(sips -g pixelWidth "$out" | awk '/pixelWidth/{print $2}')
    h=$(sips -g pixelHeight "$out" | awk '/pixelHeight/{print $2}')
    if [ "$w" -ge "$h" ]; then sips --resampleWidth 640 "$out" >/dev/null; else sips --resampleHeight 480 "$out" >/dev/null; fi
    echo "ok meme-${theme}.png"
  else
    echo "FAIL (429? wait and retry)"
  fi
done

echo "Done. Re-run: node scripts/finish-meme-batch2.mjs"
