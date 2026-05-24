# Chess Gambit — offline puzzle catalog

The **Chess Gambit** card uses a bundled JSON catalog (`client/src/data/chessPuzzles.catalog.json`), not live API calls at runtime.

## Sources

- **Curated (5):** Hand-written puzzles with custom `wrongFeedback` copy.
- **Imported (115+):** Mate-in-one positions from the [Lichess open puzzle database](https://database.lichess.org/#puzzles) (CC0). Filtered by rating, popularity, and validated with [chess.js](https://github.com/jhlywa/chess.js).

## Refresh the catalog

1. Download the dump (once):

   ```bash
   mkdir -p tidal-wordle/.cache
   curl -L -o tidal-wordle/.cache/lichess_db_puzzle.csv.zst \
     https://database.lichess.org/lichess_db_puzzle.csv.zst
   zstd -d tidal-wordle/.cache/lichess_db_puzzle.csv.zst
   ```

2. Regenerate JSON:

   ```bash
   cd tidal-wordle/client
   npm run import-chess-puzzles -- --csv ../.cache/lichess_db_puzzle.csv --count 115
   ```

   Or from the repo root:

   ```bash
   node tidal-wordle/scripts/import-lichess-puzzles.mjs \
     --csv tidal-wordle/.cache/lichess_db_puzzle.csv --count 115
   ```

3. Run tests: `npm run test -- src/lib/chessPuzzles.test.ts`

The CSV is gitignored under `.cache/`; only `chessPuzzles.catalog.json` is committed.

## Dev-only bootstrap

If you do not have the CSV, the script can fetch a small batch from `lichess.org/api/puzzle/next` (rate-limited — prefer the CSV):

```bash
node tidal-wordle/scripts/import-lichess-puzzles.mjs --bootstrap 50
```

## Blunder penalties

| Mode | Penalty |
|------|---------|
| Solo | **Wordle tax** — next guess row shows only left or right half of each tile |
| Multiplayer | **Info leak** — opponent gets one `revealedLetters` entry (see [chess-blunder-multiplayer.md](./chess-blunder-multiplayer.md)) |

Implementation: `client/src/lib/chessBlunderPenalties.ts`, wired from `answerChessPuzzle` in `cardEffects.ts`.

## Code map

| File | Role |
|------|------|
| `client/src/data/chessPuzzles.catalog.json` | Shipped puzzle data |
| `client/src/lib/chessPuzzles.ts` | Types, FEN board parse, random pick |
| `client/src/lib/chessBlunderPenalties.ts` | Solo tax + MP leak API for Dev B |
| `scripts/import-lichess-puzzles.mjs` | CSV → JSON builder |
