# Tier B card design — locked decisions (2026-05-24)

Master word taxonomy: **10 categories** × **542 words** (4–10 letters).  
Full word lists: [`beach-word-categories.md`](./beach-word-categories.md) · machine-readable: [`client/src/data/beachWordCategories.json`](../../client/src/data/beachWordCategories.json).

Regenerate categories: `node scripts/classify-beach-words.mjs`

---

## Shared categories (all cards)

| Category | Count | Used for |
|----------|------:|----------|
| `marine-animal` | 45 | Sea creatures, birds, crustaceans |
| `marine-flora` | 12 | Algae, coral, kelp, plants |
| `water-weather` | 39 | Tide, waves, currents, water terms |
| `shore-geology` | 102 | Sand, rocks, coast landforms |
| `places-geography` | 83 | Places, regions, proper nouns |
| `boats-nautical` | 39 | Boats, harbors, sailing |
| `beach-gear-activity` | 49 | Swim, surf, gear, beach activity |
| `beach-social-food` | 7 | BBQ, picnic, bonfire |
| `sensory-descriptive` | 12 | Colors, textures, “vibe” words |
| `abstract-generic` | 154 | Fallback / non-thematic |

**Resolver:** `primaryCategory = beachWordCategories.byWord[answer]` → pick random variant from that card’s Tier B table.

**Solo vs multiplayer:** Attacks target **self** in solo, **opponent** in multiplayer unless noted.

---

## 1. `meme-cannon` — Option A (meme stickers)

**Gameplay:** 3s overlay on target board. **Sticker frame** (not full meme API) + caption = last wrong guess (or `???`).

**Solo:** Same overlay on own board.

| Category | Sticker pack (pick 1) | Caption flavor |
|----------|----------------------|----------------|
| `marine-animal` | 🦀 crab claws · 🦈 fin · 🐚 shell border · 🐦 seagull poop splat | “{wrongGuess} ≠ apex predator” |
| `marine-flora` | 🪸 coral frame · 🌿 kelp vines · 🫧 algae bubbles | “Photosynthesis says no to {wrongGuess}” |
| `water-weather` | 🌊 wave crash · 🌧️ rain · 💨 wind lines | “Wiped out: {wrongGuess}” |
| `shore-geology` | 🪨 rocks · 🏖️ sand spray · ⛱️ dune | “Bedrock rejects {wrongGuess}” |
| `places-geography` | 🗺️ map pins · ✈️ tourist stamp · 📍 wrong pin | “Not on this map: {wrongGuess}” |
| `boats-nautical` | ⚓ anchor · 🚢 horn · ⛵ sail | “Port declined: {wrongGuess}” |
| `beach-gear-activity` | 🩴 flip-flop · 🕶️ shades · 🏄 wipeout | “Wrong gear: {wrongGuess}” |
| `beach-social-food` | 🔥 grill · 🌭 hot dog · 🧊 cooler | “Not on the menu: {wrongGuess}” |
| `sensory-descriptive` | 🎨 color splash · 😎 vibe check | “Vibe: {wrongGuess}/10” |
| `abstract-generic` | 🏖️ generic beachball · 📸 impact font box | “BEACH WORDLE / {wrongGuess}” |

---

## 2. `brainrot-glitch` — Green/red tile stickers

**Gameplay:** Scatter **Wordle-colored stickers** (green = correct, yellow = present, red = absent styling) on random tiles for **one guess cycle**. Tiles underneath still accept input; stickers are visual noise only (no false letter values).

**Solo / MP:** Same; on target board.

| Category | Sticker behavior (pick 1) |
|----------|---------------------------|
| `marine-animal` | Stickers shaped like tiny claws / fins |
| `marine-flora` | Green stickers dominant + bubble decals |
| `water-weather` | Stickers “drift” with wave skew animation |
| `shore-geology` | Sandy texture on yellow stickers |
| `places-geography` | Stamp-shaped stickers on corners |
| `boats-nautical` | Rope-border cluster on one row |
| `beach-gear-activity` | Flip-flop icons on red stickers |
| `beach-social-food` | Smoke-wisp on random stickers |
| `sensory-descriptive` | Extra saturation / hue shift on stickers |
| `abstract-generic` | Random 40% green / 35% yellow / 25% red scatter |

**Clear:** On target’s next guess submit.

---

## 3. `status-dog` — Cover tile 10s

**Gameplay:** Dog sticker covers **one tile** for 10s.  
- Covers the **rightmost revealed letter** on the **latest guess row** (or row 0 col 0 if the board is empty).

**Solo / MP:** Same logic on target board.

| Category | Dog sticker (pick 1) |
|----------|---------------------|
| `marine-animal` | Pup in snorkel · seal pup · crab-costume dog |
| `marine-flora` | Dog with seaweed on head |
| `water-weather` | Dog in raincoat |
| `shore-geology` | Dog buried to neck in sand |
| `places-geography` | Dog with suitcase |
| `boats-nautical` | Dog with sailor hat |
| `beach-gear-activity` | Dog with sunglasses |
| `beach-social-food` | Dog with bandana / napkin |
| `sensory-descriptive` | Dog with color glasses |
| `abstract-generic` | Classic golden pup |

---

## 4. `playful-insult` — Keep current

**Gameplay:** 2s PG insult bubble (unchanged).

| Category | Insult pool tone |
|----------|------------------|
| Each category | 4 lines themed to category + `{wrongGuess}` optional |
| `abstract-generic` | Existing global pool |

---

## 5. `forced-break` — Freeze = answer length (seconds)

**Gameplay:** **No modal.** Input + cooldown frozen for **`answer.length` seconds** (e.g. 5-letter word → 5s). Show countdown overlay. Auto-unlock when timer ends.

**Solo / MP:** Target player frozen (self in solo).

| Category | Countdown label (pick 1) |
|----------|-------------------------|
| `marine-animal` | “Hold — wildlife crossing” |
| `marine-flora` | “Don't touch the reef…” |
| `water-weather` | “Wait for the set…” |
| `shore-geology` | “Sandcastle union break” |
| `places-geography` | “Customs delay” |
| `boats-nautical` | “Harbor closed” |
| `beach-gear-activity` | “Sunscreen dry time” |
| `beach-social-food` | “Hydration station” |
| `sensory-descriptive` | “Shade break” |
| `abstract-generic` | “Mandatory beach break” |

---

## 6. `bored-distraction` — Long scroll page

**Gameplay:** Full-screen **scrollable distraction page** (fake article / list). Target must **scroll to bottom** to unlock “Continue”. Blocks input while open. ~8–12 screen heights of fluff.

**Solo / MP:** Self in solo, opponent in MP.

| Category | Page theme (pick 1) |
|----------|---------------------|
| `marine-animal` | “Top 50 tide pool facts” |
| `marine-flora` | “Kelp: superfood or super boring?” |
| `water-weather` | “Surf report scroll (every beach on earth)” |
| `shore-geology` | “Sand grain identification guide” |
| `places-geography` | “TripAdvisor: all coastal towns ranked” |
| `boats-nautical` | “Every knot you'll never tie” |
| `beach-gear-activity` | “100 beach hacks (#47 will shock you)” |
| `beach-social-food` | “S'mores vs hot dogs: 10,000 word debate” |
| `sensory-descriptive` | “What your guess color says about you” |
| `abstract-generic` | “Why you should touch grass (sand edition)” |

---

## 7. `recipe-spam` — Half board + **next-round** mask

**Gameplay (two phases):**

1. **Immediate:** Recipe panel covers **right or left half** of board (category-themed recipe) for ~8s dismissable overlay.
2. **Persistent into next round:** `halfGuessReveal: true` — on every guess **this round and next round until round ends**, only **left OR right half** of each submitted row shows letter colors; other half stays neutral/unknown until round ends or effect cleared.

**Decision:** Mask lasts **until end of the round when card was played** (not entire match).

**Solo / MP:** Affects target only.

| Category | Recipe title (pick 1) | Mask side bias |
|----------|------------------------|----------------|
| `marine-animal` | “Crab cake sliders” | random L/R |
| `marine-flora` | “Seaweed crunch wrap” | random |
| `water-weather` | “Storm chowder” | hide side with more vowels (meaner) |
| `shore-geology` | “Sand dollar cookies (joke)” | random |
| `places-geography` | “Regional coastal stew” | random |
| `boats-nautical` | “Sailor's canned fish bake” | random |
| `beach-gear-activity` | “Post-surf smoothie bowl” | random |
| `beach-social-food` | “Boardwalk BBQ platter” | random |
| `sensory-descriptive` | “Blue lagoon mocktail” | random |
| `abstract-generic` | “Mystery beach potluck” | random |

---

## 8. `rejection-letter` — Bonus probe row

**Decision:** **Extra probe row** (not extra time). Adds **1 bonus guess line** that does **not** count toward win/loss guess limit.

**Gameplay:** Overlay rejection letter → dismiss → bonus row appears. Player must submit one word from pool (pick closest length to `answer.length`):

| Length bucket | Allowed probe words |
|---------------|---------------------|
| 4–5 | `DENY`, `NOPE`, `PASS` |
| 6–7 | `REJECT`, `REGRET`, `SORRY` |
| 8–10 | `REJECTION`, `DECLINED`, `UNLIKELY` |

Probe word gets **normal Wordle coloring** and helps deduce letters. Does **not** win the round if it matches answer. Clears after one submit.

**Solo / MP:** Buff on self only.

| Category | Letterhead (pick 1) |
|----------|---------------------|
| `marine-animal` | Dept. of Marine Resources |
| `marine-flora` | Reef Preservation Society |
| `water-weather` | Coastal Commission |
| `shore-geology` | National Parks — Shore Division |
| `places-geography` | Tourism Board |
| `boats-nautical` | Harbor Master |
| `beach-gear-activity` | Beach Patrol |
| `beach-social-food` | Health Inspector |
| `sensory-descriptive` | Aesthetic Review Board |
| `abstract-generic` | HR — Beach Wordle Division |

---

## 9. `face-swap-glitch` — Board overlay (answer-length seconds)

**Gameplay:** Category cartoon face + glitch overlay on **target Wordle board** for `answer.length` seconds (min 3s). `faceSwap` + `faceSwapImageUrl` still set for Dev B 3D surfer. Tier B taglines use `{wrongGuess}`.

**Solo / MP:** Target board only (self in solo).

---

## 10–14. Buffs — Keep current

| API id | Behavior |
|--------|----------|
| `letter-reveal` | Random unrevealed correct position |
| `cosmic-reset` | Remove last wrong guess |
| `marine-hint` | Vowel count hint |
| `tide-whisper` | First or last letter |
| `forecast` | Random position vowel/consonant |

**Tier B (flavor only):** hint prefix string per category (e.g. marine-animal: “Biologist whispers: …”).

---

## 15. `related-current` — Keep current + category related pools

**Gameplay:** Hint string related word (curated map + category neighbor from word list).

| Category | Related pick strategy |
|----------|----------------------|
| `marine-animal` | Random other `marine-animal` word |
| `marine-flora` | Other flora / reef term |
| `water-weather` | Paired phenomenon (ebb/tide, swell/wave) |
| `shore-geology` | sand↔dune, cliff↔bluff |
| `places-geography` | Same region cluster if tagged |
| `boats-nautical` | dock↔pier, sail↔yacht |
| `beach-gear-activity` | swim↔surf gear term |
| `beach-social-food` | picnic↔bonfire |
| `sensory-descriptive` | opposite sensation word |
| `abstract-generic` | bigram fallback |

---

## 16. `resume-polish` — Keep intended

**Gameplay:** Show letter pattern `_ R _ F` from greens + reveals; if possible, suggest one valid dictionary word from `beachWords` matching pattern.

| Category | Hint prefix |
|----------|-------------|
| Each | “Try a {category label} word:” + pattern |
| `abstract-generic` | “Pattern:” only |

---

## 17. `chess-gambit` — Keep current

**Gameplay:** Blocking chess puzzle modal (unchanged). Category = puzzle title flavor only.

---

## 18. `dice-roll` — Option B (reroll now)

**Gameplay:** Immediately **discard** this draw and **draw + apply** a new random card (one reroll only; no infinite loop).

**Solo / MP:** Same; in MP announce “Dice rerolled!” to room.

| Category | Announcement flavor |
|----------|---------------------|
| Each | 4 short lines (“{category} crabs the dice…”) |
| `abstract-generic` | “Reroll!” |

---

## 19. `beach-playlist` — Keep current

**Gameplay:** `musicSwapActive` 30s (unchanged).

---

## 20. `critics-rating` — Keep current

**Gameplay:** Star efficiency at round end; +25 if card was played (solo: 4+ stars).

---

## New store fields (implementation checklist)

| Field | Cards |
|-------|--------|
| `halfGuessReveal: 'left' \| 'right' \| null` | recipe-spam |
| `bonusProbeRow: boolean` | rejection-letter |
| `forcedBreakEndsAt: number \| null` | forced-break |
| `distractionScrollRequired: boolean` | bored-distraction |
| `brainrotStickers: ActiveEffect[]` | brainrot-glitch |
| `memeStickerPack: string` | meme-cannon |

---

## Summary of your locked choices

| # | API id | Your choice |
|---|--------|-------------|
| 1 | `meme-cannon` | A — meme stickers |
| 2 | `brainrot-glitch` | Green/red tile stickers |
| 3 | `status-dog` | Cover revealed or any tile, 10s |
| 4 | `playful-insult` | Current |
| 5 | `forced-break` | Freeze `answer.length` seconds |
| 6 | `bored-distraction` | Long scroll to dismiss |
| 7 | `recipe-spam` | Half board + half-reveal rest of round |
| 8 | `rejection-letter` | Bonus probe row (decided) |
| 9 | `face-swap-glitch` | Current |
| 10–14 | buffs | Current |
| 15 | `related-current` | Current + category pools |
| 16 | `resume-polish` | Intended pattern + suggestion |
| 17 | `chess-gambit` | Current |
| 18 | `dice-roll` | B — reroll immediately |
| 19 | `beach-playlist` | Current |
| 20 | `critics-rating` | Current |
