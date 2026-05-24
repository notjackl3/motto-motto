# Copy-paste prompt: find Meme Cannon assets (Batch 1+)

Give everything below the line to an AI with **web search**. When it finishes, paste results back to the dev agent or run the import yourself.

See also: [`MEME_SOURCING_GUIDE.md`](./MEME_SOURCING_GUIDE.md) · [`THEME_CATALOG.md`](./THEME_CATALOG.md)

---

## PROMPT START

You are a **meme research assistant** for **Tidal Wordle**, a beach-themed Wordle web game. Find **real, funny internet memes** (not AI art) we can legally use.

[Use the full prompt from the conversation — Batch 1 table + manifest schema + legal rules.]

After Batch 1, say **"continue"** for the remaining 52 theme ids in `THEME_CATALOG.md`.

## PROMPT END

---

## After the AI responds

1. Verify licenses on each **source page URL** yourself.
2. Download PNGs to `tidal-wordle/client/public/assets/cards/meme-cannon/meme-{theme-id}.png`
3. Save manifest as `docs/card-design/meme-batchN-manifest.json` and credits in `ATTRIBUTION.md`.
4. Tell Cursor: *"Batch N memes imported"* — or run downloads yourself (see batch 1 in repo).

**Batch 1** is already imported (2026-05-24): 15 PNGs + `meme-batch1-manifest.json`.
