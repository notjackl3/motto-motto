# Copy-paste prompt: gather Tidal Wordle card assets

Give everything below the line to your asset-gathering AI (ChatGPT, Claude, Gemini, etc.). When it finishes, send the **folder + `manifest.json`** back to the dev agent for implementation.

---

## PROMPT START

You are sourcing **visual and audio assets** for **Tidal Wordle**, a beach-themed competitive Wordle game (React + Vite web app). Your job is to produce a **complete, organized asset pack** with exact filenames so engineers can drop files into the repo without renaming.

### Legal & quality rules (mandatory)

1. **License:** Only assets that are **public domain**, **CC0**, **CC-BY** (with attribution file), or **explicitly licensed for commercial use**. No “random Google Images” without license proof.
2. **Preferred sources:** Wikimedia Commons, Openverse, Unsplash (license per image), Kenney.nl, itch.io free packs, Freesound (check license), Pixabay, Pexels, USA.gov, NOAA public domain, or **AI-generated** assets the user owns.
3. **Do NOT** scrape meme aggregators, Pinterest, or watermarked stock without license.
4. **Style:** Cohesive **cartoon / flat / playful beach** aesthetic. Bright, readable on dark UI. PG content only.
5. **Format defaults:** PNG with **transparent background** unless noted. Also deliver JPEG only when photo backgrounds are intentional.
6. **Naming:** Use **exact filenames** below. Lowercase, hyphens, no spaces.
7. **Delivery:** One zip or folder tree + **`manifest.json`** (schema below).

### Technical specs

| Asset type | Size | Format | Notes |
|------------|------|--------|-------|
| Board stickers | 128×128 px (min 64) | PNG | Transparent; used on 40×40 tiles scaled up |
| Popup / overlay hero | 512×512 or 400×300 | PNG | Meme cannon center, recipe header |
| Small UI icons | 64×64 | PNG/SVG | Optional |
| Letterhead / panel bg | 800×600 max | PNG/JPEG | Rejection letter, distraction scroll header |
| Audio loops | 15–30 s | MP3 or OGG | &lt; 500 KB each, beach-themed |
| Audio SFX | 0.5–2 s | MP3 or OGG | Card trigger sounds |
| Video (optional) | &lt; 3 s, &lt; 2 MB | WebM or MP4 | Face-swap overlay only if found |

### Visual themes (67) — v2 theming

Each answer word maps to a **theme id** (not one asset per word). Full list: [`THEME_CATALOG.md`](./THEME_CATALOG.md).

**Meme Cannon uses real internet memes** — read [`MEME_SOURCING_GUIDE.md`](./MEME_SOURCING_GUIDE.md) first. Do not use AI placeholders for `meme-{theme}.png`.

Every themed asset uses `{theme-id}` in the filename. If a theme file is missing, the game falls back to the **parent category** (10 legacy ids below).

```
marine-animal | marine-flora | water-weather | shore-geology | places-geography
boats-nautical | beach-gear-activity | beach-social-food | sensory-descriptive | abstract-generic
```

Example theme ids: `crustacean`, `fish-shark`, `sand-dune`, `us-west-coast`, `surf-sport`, `bbq-bonfire`, …

---

## ASSET MANIFEST (produce all files listed)

### Folder: `public/assets/stickers/` (board stickers & meme cannon)

**Already have placeholder SVGs — replace with PNG preferred.**

| Filename | Description |
|----------|-------------|
| `marine-animal.png` | Funny beach sticker: crab, shark, or seagull attitude |
| `marine-flora.png` | Coral, kelp, or seaweed sticker |
| `water-weather.png` | Wave, storm, or wind sticker |
| `shore-geology.png` | Rock, sandcastle, or dune sticker |
| `places-geography.png` | Map pin, passport stamp, or tourist postcard |
| `boats-nautical.png` | Anchor, sailboat, or buoy sticker |
| `beach-gear-activity.png` | Flip-flop, surfboard, or sunglasses sticker |
| `beach-social-food.png` | Grill, hot dog, or cooler sticker |
| `sensory-descriptive.png` | Color splash, vibe, or “aesthetic” sticker |
| `abstract-generic.png` | Beach ball or generic “BEACH” sticker |
| `brainrot-correct.png` | Green Wordle-style tile with check vibe |
| `brainrot-present.png` | Yellow/amber “close” tile |
| `brainrot-absent.png` | Gray “wrong” tile |

**Optional brainrot category flair (10 files):**  
`brainrot-marine-animal.png` … `brainrot-abstract-generic.png` — small claw/fin/sand/etc. overlay on corner of tile.

---

### Folder: `public/assets/cards/status-dog/`

Dog face/sticker covering a letter tile (10 files).

| Filename | Description |
|----------|-------------|
| `dog-marine-animal.png` | Dog in snorkel or with crab theme |
| `dog-marine-flora.png` | Dog with seaweed on head |
| `dog-water-weather.png` | Dog in yellow raincoat |
| `dog-shore-geology.png` | Dog buried in sand (face only) |
| `dog-places-geography.png` | Dog with suitcase |
| `dog-boats-nautical.png` | Dog with sailor hat |
| `dog-beach-gear-activity.png` | Dog with sunglasses |
| `dog-beach-social-food.png` | Dog with bandana / picnic |
| `dog-sensory-descriptive.png` | Dog with rainbow glasses |
| `dog-abstract-generic.png` | Golden retriever pup, neutral |

---

### Folder: `public/assets/cards/meme-cannon/` — **REAL MEMES REQUIRED**

See [`MEME_SOURCING_GUIDE.md`](./MEME_SOURCING_GUIDE.md). One **funny user-made or properly licensed** meme per theme (67 files).

| Filename pattern | Size | Description |
|------------------|------|-------------|
| `meme-{theme-id}.png` | 480×320 min | Actual meme image — Drake, reaction, beach humor, etc. |
| Optional: `meme-word-{word}.png` | | Flagship word override (e.g. `meme-word-shark.png`) |

Log **source URL + license** for every meme in `manifest.json`. Include `permissions/` for creator DMs.

---

### Folder: `public/assets/cards/recipe-spam/`

Half-screen food blog overlay (10 header images + optional texture).

| Filename | Description |
|----------|-------------|
| `recipe-header-marine-animal.png` | Seafood recipe hero image |
| `recipe-header-marine-flora.png` | Seaweed salad aesthetic |
| `recipe-header-water-weather.png` | Soup/storm food styling |
| `recipe-header-shore-geology.png` | “Sand dollar cookie” joke baking |
| `recipe-header-places-geography.png` | Regional coastal dish |
| `recipe-header-boats-nautical.png` | Canned fish / sailor stew |
| `recipe-header-beach-gear-activity.png` | Smoothie bowl |
| `recipe-header-beach-social-food.png` | BBQ spread |
| `recipe-header-sensory-descriptive.png` | Blue mocktail |
| `recipe-header-abstract-generic.png` | Generic beach potluck |
| `recipe-sidebar-texture.png` | Seamless parchment/paper tile (optional) |

---

### Folder: `public/assets/cards/rejection-letter/`

| Filename | Description |
|----------|-------------|
| `letterhead-marine-animal.png` | Official letter logo — marine dept |
| `letterhead-marine-flora.png` | Reef preservation letterhead |
| … (one per category, 10 total) | Tourism board, harbor master, etc. |
| `letterhead-abstract-generic.png` | Generic corporate HR |
| `paper-texture.png` | Optional cream paper background |

---

### Folder: `public/assets/cards/bored-distraction/`

Header banner for scroll distraction page (10 wide images, ~1200×400 crop-safe center).

| Filename | Description |
|----------|-------------|
| `distraction-marine-animal.png` | Tide pool / aquarium article vibe |
| … (10 categories) | Match tier-b-spec themes |
| `distraction-abstract-generic.png` | “Touch grass” nature article |

---

### Folder: `public/assets/cards/forced-break/`

Small icon or illustration shown during countdown (optional, 10 or 1 generic).

| Filename | Description |
|----------|-------------|
| `break-icon-generic.png` | Beach chair / umbrella / clock |
| `break-icon-{category}.png` | Optional per-category (10) |

---

### Folder: `public/assets/cards/face-swap/`

Cartoon face overlays for 3D surfer (Dev B integrates on `faceSwap` flag). Transparent PNG.

| Filename | Description |
|----------|-------------|
| `face-crab.png` | Cartoon crab face |
| `face-shark.png` | Shark grin |
| `face-sunglasses.png` | Deal-with-it sunglasses |
| `face-clownfish.png` | Fish face |
| `face-surfer-wipeout.png` | Silly grimace |
| `face-{category}.png` | Optional: 10 category faces |

Sizes: ~256×256, face centered.

---

### Folder: `public/assets/cards/chess-gambit/`

| Filename | Description |
|----------|-------------|
| `chess-board-mini.png` | Top-down board fragment for modal (~300×300) |
| `chess-piece-sprites.png` | Optional sprite sheet |

---

### Folder: `public/assets/cards/critics-rating/`

| Filename | Description |
|----------|-------------|
| `star-filled.png` | 32×32 gold star |
| `star-empty.png` | 32×32 outline star |
| `critic-silhouette-marine.png` | Optional critic avatar (5–10 styles) |

---

### Folder: `public/assets/audio/playlists/` (beach-playlist card, 30s loops)

| Filename | Description | License note required |
|----------|-------------|----------------------|
| `loop-marine-animal.mp3` | Playful tropical | |
| `loop-water-weather.mp3` | Ocean waves + light music | |
| `loop-shore-geology.mp3` | Chill acoustic | |
| `loop-beach-social-food.mp3` | Ukulele / BBQ vibe | |
| `loop-abstract-generic.mp3` | Generic lo-fi surf | |
| … optional: one per category (10) | | |

### Folder: `public/assets/audio/sfx/`

Short sounds on card fire (optional but desired).

| Filename | Trigger |
|----------|---------|
| `sfx-meme-cannon.mp3` | Boing / airhorn lite |
| `sfx-brainrot.mp3` | Glitch static blip |
| `sfx-status-dog.mp3` | Bark |
| `sfx-forced-break.mp3` | Foghorn or whistle |
| `sfx-recipe-spam.mp3` | Sizzle |
| `sfx-rejection-letter.mp3` | Paper rustle |
| `sfx-dice-roll.mp3` | Dice rattle |
| `sfx-critics-rating.mp3` | Ding / applause |

---

## Cards that need NO assets (text/CSS only)

Confirm in manifest as `"assets": []`:

- `playful-insult` — text only
- `letter-reveal`, `cosmic-reset`, `marine-hint`, `tide-whisper`, `forecast`, `related-current`, `resume-polish` — hints only
- `dice-roll` — logic only (optional sfx above)

---

## Required deliverable: `manifest.json`

Place at zip root. Example:

```json
{
  "version": 1,
  "project": "tidal-wordle",
  "generatedAt": "2026-05-24",
  "styleGuide": "Flat cartoon beach, PG, transparent PNGs",
  "assets": [
    {
      "path": "public/assets/stickers/marine-animal.png",
      "cardIds": ["meme-cannon"],
      "theme": "crustacean",
      "parentCategory": "marine-animal",
      "type": "image/png",
      "width": 128,
      "height": 128,
      "source": "https://openverse.org/...",
      "license": "CC0",
      "attribution": "Optional Artist Name"
    }
  ],
  "missing": [
    {
      "path": "public/assets/audio/playlists/loop-boats-nautical.mp3",
      "reason": "No suitable CC0 loop found; suggest AI generation"
    }
  ]
}
```

Every file you deliver MUST appear in `assets[]`. Every file you could not source MUST appear in `missing[]` with reason.

---

## Sourcing workflow you should follow

1. **Inventory** — List all filenames above; mark must-have vs optional.
2. **Style board** — Generate or find 1 reference image; match all assets to it.
3. **Batch download** — Per category, find 1 sticker + 1 meme + 1 dog + 1 recipe header (efficient).
4. **Normalize** — Resize, remove backgrounds (rembg or similar), export PNG.
5. **Audio** — Trim loops to 15–30s, normalize volume, export MP3 128kbps.
6. **Validate** — Check transparency, file size &lt; 300 KB per PNG when possible.
7. **Zip** — Preserve folder structure exactly as `public/assets/...`.
8. **Attribution** — Include `ATTRIBUTION.md` if any CC-BY assets.

### If scraping / searching the web

- Log **source URL** and **license** per file in manifest.
- Prefer bulk open packs (e.g. “beach UI kit CC0”) over 100 individual searches.
- If using AI generation, note `license: "User-owned AI generated"` and include prompts in `AI_PROMPTS.md`.

### If generating with AI

Use consistent prompt suffix:  
`flat cartoon beach game asset, transparent background, centered, no text, PG, vector style, single object`

---

## Priority order (if time-limited)

1. **P0 — Memes:** Top 15 themes by word frequency (see `THEME_CATALOG.md`) — **real licensed memes**
2. **P0** — Stickers `public/assets/stickers/{theme-id}.png` for same top 15
3. **P1** — Status dog `dog-{theme-id}.png` (top 15, then rest)
4. **P1** — Remaining meme + sticker themes
5. **P2** — Recipe headers, rejection letterheads, distraction headers
6. **P2** — Audio loops (10 parent-category loops still work) + SFX
7. **P3** — Face-swap, brainrot flair, forced-break icons, chess, critics

---

## What the implementation agent needs from the user

When you finish, the user will say:

> “Here is the asset pack” + attach zip or path.

Include:

1. Zip with `public/` tree intact  
2. `manifest.json`  
3. `ATTRIBUTION.md` (if needed)  
4. Short note on anything in `missing[]`

The agent will wire paths in `stickerAssets.ts` and card components — **do not rename files** after delivery.

## PROMPT END

---

## After you get the pack

Tell Cursor/Claude Code:

```
Implement the Tidal Wordle asset pack from [zip path].
Use manifest.json for paths. Update stickerAssets.ts and card overlays to use PNGs/audio.
See docs/card-design/sticker-assets.md
```
