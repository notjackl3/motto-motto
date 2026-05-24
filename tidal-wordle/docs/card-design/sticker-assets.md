# Sticker & meme assets

## Where files live

**Production pack (PNG + audio)** — copied from user asset pack into:

```
tidal-wordle/client/public/assets/
  stickers/           ← category + brainrot PNGs
  cards/              ← per-card art (meme, dog, recipe, …)
  audio/sfx/          ← card sound effects
  audio/playlists/    ← beach-playlist loops
```

Manifest: [`client/src/data/assetManifest.json`](../../client/src/data/assetManifest.json)  
Attribution: [`ATTRIBUTION.md`](./ATTRIBUTION.md)

URL helpers: [`client/src/lib/cardAssets.ts`](../../client/src/lib/cardAssets.ts)  
Audio: [`client/src/lib/cardAudio.ts`](../../client/src/lib/cardAudio.ts)

Vite serves `public/` at the site root, e.g. `/assets/stickers/marine-animal.png`.

## What you see in-game

| Card | Visual |
|------|--------|
| **Meme Cannon** | Large sticker in center popup (3s) + smaller stickers on board tiles |
| **Brainrot Glitch** | Green / yellow / gray mini-tiles on random cells (one guess) |
| **Status Dog** | Still emoji on covered tile (no image file yet) |

## Adding your own art

1. Drop **SVG or PNG** into `public/assets/stickers/` (keep filenames or update `stickerAssets.ts`).
2. Recommended size: **80×80** (SVG) or **128×128** PNG with transparent background.
3. No new npm packages required.

### Optional: real meme images

If you want photo memes later:

- Use **royalty-free** sources (Unsplash, your own art, commissioned).
- Add `public/assets/memes/{id}.png` and extend `MemeCannonVariant` with `imageUrl`.
- Avoid scraping meme APIs (licensing + breakage).

### Optional: AI-generated pack

Generate a consistent beach sticker set, export PNG/SVG, name by category id, replace the placeholder SVGs.

## Troubleshooting

- **Nothing shows:** Hard-refresh the browser. Confirm files exist under `client/public/assets/stickers/`.
- **Popup hidden:** Meme overlay is `z-[55]` (above card detail popup).
- **Stickers tiny on board:** They attach to guess tiles; make a guess first, or trigger before first guess to see floating large stickers.

## Dev test

```js
__testCard('meme-cannon')
__testCard('brainrot-glitch')
```
