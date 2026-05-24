# Tidal Wordle

A beach-themed competitive Wordle variant with a 3D wave environment, async cooldown-based multiplayer, and an API-inspired card system.

This repo currently contains the **skeleton only** — file structure, stub components, and integration points ready for two developers to split feature work.

## Tech stack

- **Client:** React + Vite (TypeScript), Tailwind CSS, Zustand, react-three-fiber + drei, socket.io-client
- **Server:** Node + Express + Socket.IO (TypeScript)
- **External APIs (later):** NOAA Tides and Currents, remote beach word list

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
```

Open the URL and you should see the MainMenu. Click **Solo** to drop into the GameLayout (3D scene + board), or **Multiplayer** to open the Lobby and create/join a room.

To test multiplayer locally, open two browser tabs: create a room in one, copy the code, join from the other. Both tabs will log `room:joined` to the console.

## The 12 cards

| Card | Type | Duration | Description |
|------|------|----------|-------------|
| Meme Overlay | attack | instant | Drops a goofy meme image over the opponent board briefly. |
| Insult Popup | attack | instant | A playful jab pops up in front of the opponent. |
| Status Dog | attack | persistent | A loyal pup sits on one of the opponent's revealed letters, covering it. |
| Brainrot Jitter | attack | instant | Shakes the opponent's UI for a few seconds. |
| Forced Break | attack | instant | Opens a popup the opponent must manually dismiss. |
| Bored Suggestion | attack | instant | A "you might also like..." distraction popup. |
| Related Word Hint | buff | instant | Reveals a thematic hint related to the answer. |
| Letter Reveal | buff | instant | Reveals one letter in the answer at its correct position. |
| Guess Eraser | buff | instant | Removes one wrong guess from your board. |
| Vowel Count | buff | instant | Tells you how many vowels are in the answer. |
| Chess Puzzle | wildcard | instant | Both players must solve a quick chess puzzle before continuing. |
| Dice Reroll | wildcard | instant | Randomizes the next card draw for both players. |

All 12 are defined as data only in `client/src/components/cards/CardDefinitions.ts`. Effect logic is intentionally not implemented yet.

## Phase plan

Phases will be detailed separately. At a high level:

1. **Skeleton (this commit)** — structure, stubs, no gameplay logic.
2. **Core gameplay** — guess evaluation, cooldown loop, score tracking, win conditions.
3. **3D scene** — animated wave geometry driven by tide data, surfer model + animation.
4. **Card system** — implement the 12 card effects, hand management, deck/draw logic.
5. **Multiplayer** — full room lifecycle, opponent state sync, reconnection.
6. **External APIs** — wire NOAA tide data into wave animation, swap local word list for remote source.
7. **Polish** — sound, juice, mobile layout, settings menu.

## Where to find things

```
tidal-wordle/
├── client/                          # Vite + React app
│   └── src/
│       ├── components/
│       │   ├── game/                # Board, input, cooldown, hand, score (2D HUD)
│       │   ├── scene/               # react-three-fiber 3D scene (wave, surfer, sky)
│       │   ├── cards/               # Card definitions + renderer
│       │   ├── ui/                  # MainMenu, Lobby, GameOverScreen
│       │   └── layout/              # GameLayout composes scene + HUD
│       ├── stores/                  # Zustand stores (game + multiplayer)
│       ├── hooks/                   # useCooldown, useTideData, useSocket
│       ├── lib/                     # wordList, guessEvaluator, api/noaa
│       ├── data/beachWords.json     # local word list (swap out for remote later)
│       ├── types/                   # shared TS types
│       ├── App.tsx                  # routes between menu/lobby/game/gameOver
│       └── main.tsx
├── server/                          # Express + Socket.IO server
│   └── src/
│       ├── index.ts                 # entrypoint, socket event wiring
│       ├── rooms.ts                 # in-memory room registry
│       └── types.ts                 # server-side types (duplicate of client for now)
├── shared/
│   └── events.ts                    # socket event name constants (used by both)
├── README.md
└── .gitignore
```

## Decisions made during skeleton setup

- **Routing:** state-based screen switcher in `App.tsx` rather than `react-router-dom`. The app only has four flat screens (menu → lobby → game → gameOver), so a dependency wasn't worth it. Easy to swap later if deep linking is needed.
- **Shared types:** `shared/events.ts` holds only the event name constants. Payload types are duplicated for now in `client/src/types/index.ts` and `server/src/types.ts` so each side can evolve independently during early development.
- **Word list:** `data/beachWords.json` is loaded at build time via JSON import. A remote source will plug into `lib/wordList.ts` via the same `getRandomWord()` API.
- **Card metadata only:** `CardDefinitions.ts` exports the 12 cards as plain data. Effects are explicitly deferred to a later phase.
