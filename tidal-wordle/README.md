# Tidal Wordle

A beach-themed competitive Wordle variant with a 3D wave environment, async cooldown-based multiplayer, and an API-inspired card system.

## Tech stack

- **Client:** React + Vite (TypeScript), Tailwind CSS, Zustand, react-three-fiber + drei, socket.io-client
- **Server:** Node + Express + Socket.IO (TypeScript)
- **Word list:** [relatedwords.io/beach](https://relatedwords.io/beach) via `GET /api/relatedTerms?term=beach` (regenerate with `npm run fetch-words` in `client/`)
- **External APIs (later):** NOAA Tides and Currents

## How to run locally

You will need Node 18+ and npm.

### Server

```bash
cd server
npm install
npm run dev
# Socket.IO server boots on http://localhost:3001
```

### Client

```bash
cd client
npm install
npm run dev
# Vite dev server boots on http://localhost:5173
npm test          # unit tests (evaluator, scoring, word list)
npm run fetch-words  # refresh beachWords.json from relatedwords.io
```

Open the URL and click **Solo** for a full best-of-3 match with variable-length guesses, cooldowns, and auto-fired cards.

## The 20 cards

| Card | Type | Description |
|------|------|-------------|
| Meme Cannon | attack | Meme overlay with last wrong guess as caption |
| Brainrot Glitch | attack | Glitch animation on board for one guess cycle |
| Status Dog | attack | Covers a revealed tile for 10s |
| Playful Insult | attack | Short PG insult bubble |
| Forced Break | attack | Delays green/yellow tile colors on next guess (answer-length seconds) |
| Bored Distraction | attack | Corner distraction popup |
| Recipe Spam | attack | Scrolling recipe overlay |
| Rejection Letter | attack | Formal rejection email overlay |
| Face Swap Glitch | attack | Board face overlay for `answer.length` s; `faceSwap` for 3D scene |
| Letter Reveal | buff | Reveals one answer position |
| Cosmic Reset | buff | Removes last wrong guess |
| Marine Hint | buff | Vowel count hint |
| Tide Whisper | buff | First or last letter hint |
| Forecast | buff | Vowel/consonant at random position |
| Related Current | buff | Thematically related word |
| Resume Polish | buff | Pattern hint from correct letters |
| Chess Gambit | wildcard | Mini chess puzzle locks input |
| Dice Roll | wildcard | Instant reroll — play a random card from the deck instead |
| Beach Playlist | wildcard | Toggles `musicSwapActive` (30s) |
| Critic's Rating | wildcard | End-of-round efficiency bonus (+25) |

Definitions: `client/src/components/cards/CardDefinitions.ts`  
Effects: `client/src/lib/cardEffects.ts`

### Dev console

```js
__testCard('meme-cannon')
__testCardList()  // all card ids
```

## Multiplayer (Dev B)

Card socket integration: `client/src/lib/mpCardIntegration.ts`  
Payload type: `GameCardPlayedPayload` in `client/src/types/index.ts`

## Where to find things

```
tidal-wordle/
├── client/src/
│   ├── components/game/     # Board, input, cards, overlays
│   ├── components/scene/    # 3D (Dev B)
│   ├── lib/                 # guessEvaluator, scoring, cardEffects, wordList
│   ├── stores/gameStore.ts  # gameplay state
│   └── data/beachWords.json
├── server/                  # Socket.IO (Dev B)
└── shared/events.ts
```

## Phase status

1. **Skeleton** — done  
2. **Core gameplay** — done (Dev A)  
3. **3D scene** — Dev B  
4. **Card system** — done (Dev A logic; Dev B polish)  
5. **Multiplayer** — Dev B  
6. **External APIs** — Dev B / later  
7. **Polish** — Dev B  
