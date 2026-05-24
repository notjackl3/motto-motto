# Real meme sourcing guide (Tidal Wordle)

This game uses **actual funny memes from the internet** for Meme Cannon — not AI-generated placeholder art. You curate them; the game displays them with `{wrongGuess}` as the caption overlay.

## Legal rules (non-negotiable)

1. **Every meme file needs documented license + source URL** in `manifest.json`.
2. **Allowed:**
   - Memes you created yourself (you own the copyright)
   - CC0 / public domain meme templates (Wikimedia Commons, some Openverse results)
   - CC-BY memes (with attribution in `ATTRIBUTION.md`)
   - Creator gave **written permission** (save email/DM screenshot in `permissions/`)
3. **Not allowed without permission:**
   - Random Reddit/imgur/imgflip downloads
   - Know Your Meme screenshots (reference only — not a license)
   - Watermarked stock, Pinterest scrapes, Disney/NBC/etc. character stills
   - Tenor/GIPHY clips (their ToS usually blocks embedding in commercial games)

**When in doubt, skip the file and log it in `manifest.json` → `missing[]`.**

---

## What to collect (65 themes)

Filename pattern (exact):

```
public/assets/cards/meme-cannon/meme-{theme-id}.png
```

Example: `meme-crustacean.png`, `meme-us-west-coast.png`, `meme-sand-dune.png`

Full theme list: [`THEME_CATALOG.md`](./THEME_CATALOG.md)

**Size:** min 480×320, landscape preferred. Impact-font memes, reaction images, and classic templates all work.

**Caption area:** The game draws `{wrongGuess}` in HTML below the image — pick memes that still read funny **without** baked-in bottom text, OR crop text and leave space.

---

## Recommended workflow

### Phase A — Meme templates (fastest legal path)

1. Browse [Wikimedia Commons meme templates](https://commons.wikimedia.org/wiki/Category:Meme_templates) and [Openverse](https://openverse.org/) (filter: **Commercial use** + **Modifications allowed**).
2. Pick **recognizable formats** (Drake, Distracted Boyfriend, Expanding Brain, etc.) only if license is clear.
3. Download → crop to ~480×320 → save as `meme-{theme}.png`.
4. Log source + license in manifest.

### Phase B — Community memes (funniest, more work)

1. Search Reddit subs: r/memes, r/ProgrammerHumor beach posts, r/surfing — sort by top / year.
2. **Contact the poster** for permission to use in a free web game. Template:

   > Hi — I'm building a beach Wordle fan game (non-commercial / small indie). Can I use your post [link] as an in-game meme overlay? I'll credit you in ATTRIBUTION.md.

3. Only add after **yes**. Save proof in `permissions/{reddit-username}.txt`.

### Phase C — Make your own (100% safe)

1. Take a licensed photo (Unsplash/Pexels with license logged).
2. Add impact font in Figma/Canva — **you** are the author.
3. Beach-themed jokes per theme (crab judging a word, surfer wipeout, etc.).

---

## Priority order (if time-limited)

| Priority | Themes | Why |
|----------|--------|-----|
| P0 | Top 15 by word count: `urban-coastal`, `generic-place`, `sand-dune`, `coast-shore`, `crustacean`, `fish-shark`, `wave-surf`, `us-west-coast`, `surf-sport`, `harbor-dock`, `bbq-bonfire`, `abstract-beach` | Most common answers |
| P1 | Remaining marine + water + geology themes | Visual variety |
| P2 | Place themes + misc | Travel humor |
| P3 | Rare themes (<3 words) | Can share parent fallback art |

Until a theme file exists, the game **falls back** to the old 10-category parent PNG (e.g. `meme-marine-animal.png` for all `crustacean` / `fish-shark`).

---

## Optional: word-specific meme overrides

For ~40 flagship words (`shark`, `california`, …), you can add **one extra meme** without reclassifying:

1. Save as `public/assets/cards/meme-cannon/meme-word-{word}.png` (e.g. `meme-word-shark.png`)
2. Add to `wordThemeOverrides.json`:

```json
"shark": {
  "memeCaption": "Jaws declined: {wrongGuess}",
  "memeHeroPath": "public/assets/cards/meme-cannon/meme-word-shark.png"
}
```

(Engine support for `memeHeroPath` can be wired when you deliver the first batch.)

---

## Deliverable checklist

When you're done sourcing, give the dev agent:

- [ ] Zip with `public/assets/...` tree intact
- [ ] `manifest.json` — every file with `source`, `license`, `theme` field
- [ ] `ATTRIBUTION.md` — all CC-BY / permission credits
- [ ] `permissions/` folder — screenshots of DMs if applicable
- [ ] `missing[]` — themes you couldn't source (with reason)

**Do not rename files** after delivery — paths are hard-coded by theme id.

---

## Good sources (starting points)

| Source | Use for | Check |
|--------|---------|-------|
| [Openverse](https://openverse.org/) | Meme templates, reaction PNGs | License filter |
| [Wikimedia Commons](https://commons.wikimedia.org/) | Classic templates, public figures (careful) | File page license |
| [Internet Archive](https://archive.org/) | Old public-domain humor | Item license |
| Your own Reddit posts / friends | Original memes | You own it |
| Unsplash / Pexels | Background photo → meme text overlay | Per-image license |

**Avoid:** Google Images, Pinterest, Know Your Meme “download” buttons, iFunny, 9GAG (no clear license).
