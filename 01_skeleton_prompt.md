# Prompt for Claude Code — Project Skeleton Setup

Copy everything below the line into Claude Code as your first message.

---

You are setting up the project skeleton for a game called **Tidal Wordle** — a beach-themed competitive Wordle variant with a 3D wave environment, async cooldown-based multiplayer, and an API-inspired card system. This prompt is for **skeleton setup only**. Do not implement gameplay logic yet. Your job is to create the scaffolding, file structure, stub components, and integration points so two developers can split up feature work in later phases.

## Tech stack

- **Framework:** React + Vite (TypeScript)
- **3D rendering:** react-three-fiber + drei (for the wave/beach scene)
- **State management:** Zustand (one store for game state, one for multiplayer/socket state)
- **Styling:** Tailwind CSS
- **Multiplayer transport:** Socket.IO (client stubbed; server in a separate `/server` folder using Node + Express + Socket.IO)
- **Real APIs to integrate later:** NOAA Tides and Currents (wave data), a beach word list (start with a local JSON file, leave a fetch hook for swapping in a remote source)

## Project structure to create

```
tidal-wordle/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── WordleBoard.tsx        // stub: renders empty grid
│   │   │   │   ├── GuessInput.tsx         // stub: text input + submit
│   │   │   │   ├── CooldownTimer.tsx      // stub: shows seconds remaining
│   │   │   │   ├── CardHand.tsx           // stub: renders player's API cards
│   │   │   │   ├── OpponentBoard.tsx      // stub: read-only view of opponent
│   │   │   │   └── ScorePanel.tsx         // stub: round score + match score
│   │   │   ├── scene/
│   │   │   │   ├── WaveScene.tsx          // stub: r3f Canvas with placeholder wave
│   │   │   │   ├── Wave.tsx               // stub: flat plane (no animation yet)
│   │   │   │   ├── Surfer.tsx             // stub: simple cube as placeholder
│   │   │   │   └── SkyAndLighting.tsx     // stub: basic ambient + directional light
│   │   │   ├── cards/
│   │   │   │   ├── CardDefinitions.ts     // exported array of card metadata (id, name, type, description) — NO effect logic yet
│   │   │   │   └── CardRenderer.tsx       // stub: renders a single card visually
│   │   │   ├── ui/
│   │   │   │   ├── MainMenu.tsx           // stub: Solo / Multiplayer / Settings buttons
│   │   │   │   ├── Lobby.tsx              // stub: room code input + create/join
│   │   │   │   └── GameOverScreen.tsx     // stub: shows winner + replay button
│   │   │   └── layout/
│   │   │       └── GameLayout.tsx         // wraps scene + UI overlay
│   │   ├── stores/
│   │   │   ├── gameStore.ts               // Zustand: current word, guesses, cooldowns, score, active cards
│   │   │   └── multiplayerStore.ts        // Zustand: socket connection, opponent state, room id
│   │   ├── hooks/
│   │   │   ├── useCooldown.ts             // stub: returns {isOnCooldown, remaining, startCooldown}
│   │   │   ├── useTideData.ts             // stub: returns mock tide data, leave TODO for NOAA fetch
│   │   │   └── useSocket.ts               // stub: connect/disconnect, emit/listen helpers
│   │   ├── lib/
│   │   │   ├── wordList.ts                // exports getRandomWord() — pulls from local JSON for now
│   │   │   ├── guessEvaluator.ts          // stub function: evaluateGuess(guess, answer) → letter states
│   │   │   └── api/
│   │   │       └── noaa.ts                // stub: fetchTideData() with TODO
│   │   ├── data/
│   │   │   └── beachWords.json            // ~30 beach-themed words of varying length to start
│   │   ├── types/
│   │   │   └── index.ts                   // shared TS types: Card, Guess, LetterState, GameMode, PlayerState
│   │   ├── App.tsx                        // routes between MainMenu, Lobby, GameLayout, GameOverScreen
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts                       // Express + Socket.IO server, basic room create/join handlers
│   │   ├── rooms.ts                       // in-memory room state map
│   │   └── types.ts                       // shared types (duplicate of client types for now)
│   ├── tsconfig.json
│   └── package.json
├── shared/
│   └── events.ts                          // socket event name constants used by both client and server
├── README.md
└── .gitignore
```

## Specific requirements

1. **Every stub component must render something visible** — even if it's just a placeholder div with the component name and a TODO comment. This makes it obvious what's wired up and what isn't.
2. **CardDefinitions.ts must include all 12 cards as data objects** with these fields: `id`, `name`, `type` ('attack' | 'buff' | 'wildcard'), `description`, `targetSelf` (boolean), `duration` ('instant' | 'persistent'). Do NOT implement the effects — just the metadata. The 12 cards are:
   - Meme Overlay (attack, instant)
   - Insult Popup (attack, instant) — keep wording playful, not profane
   - Status Dog (attack, persistent — covers a revealed letter)
   - Brainrot Jitter (attack, instant — UI shake)
   - Forced Break (attack, instant — popup opponent must dismiss)
   - Bored Suggestion (attack, instant — distraction popup)
   - Related Word Hint (buff, instant)
   - Letter Reveal (buff, instant)
   - Guess Eraser (buff, instant — removes one wrong guess)
   - Vowel Count (buff, instant)
   - Chess Puzzle (wildcard, instant — both players solve mini puzzle)
   - Dice Reroll (wildcard, instant — randomize next card draw)
3. **The gameStore must define this shape** (even if most fields aren't used yet):
   ```ts
   {
     mode: 'solo' | 'multiplayer' | null,
     answer: string | null,
     answerLength: number | null,  // revealed after first guess
     myGuesses: Guess[],
     opponentGuesses: Guess[],
     myCooldownEndsAt: number | null,
     opponentCooldownEndsAt: number | null,
     myHand: Card[],
     activeEffects: Card[],        // persistent cards in play
     roundScore: { me: number, opponent: number },
     matchScore: { me: number, opponent: number },
     roundsToWin: 2,                // best of 3
   }
   ```
4. **The server must support these socket events** (define in `shared/events.ts`, implement basic stubs that just echo or broadcast for now):
   - `room:create`, `room:join`, `room:joined`, `room:full`
   - `game:start`, `game:guess`, `game:cardPlayed`, `game:roundEnd`, `game:matchEnd`
5. **The WaveScene must mount a react-three-fiber Canvas** with a flat blue plane, basic camera, ambient + directional light, and a placeholder cube for the surfer. No animation yet — just confirm 3D renders.
6. **App.tsx must implement basic routing** (you can use react-router-dom or a simple state-based switcher) between: MainMenu → (Solo → GameLayout) or (Multiplayer → Lobby → GameLayout) → GameOverScreen.
7. **README.md must include:** project description, how to run client and server locally, the 12-card list, the phase plan (you'll be told the phases separately), and a "where to find things" map of the folder structure.

## Testing requirements at the end of skeleton setup

Before considering skeleton setup complete, verify:

1. `npm install` succeeds in both `client/` and `server/`
2. `npm run dev` in `client/` boots Vite without errors and the MainMenu renders
3. `npm run dev` in `server/` boots the Socket.IO server without errors
4. Clicking "Solo" from MainMenu navigates to GameLayout and shows: the 3D scene (blue plane + cube), the empty WordleBoard, the GuessInput, an empty CardHand, and the ScorePanel
5. Clicking "Multiplayer" navigates to Lobby and shows room create/join inputs
6. Opening two browser tabs, creating a room in one, and joining with the code in the other results in both clients receiving a `room:joined` event (log to console is fine)
7. TypeScript compiles with no errors in both client and server
8. No console errors in browser on any screen

Report back with: the file tree you created, confirmation that all 7 tests above pass, and any decisions you made that weren't specified above (e.g. which routing approach you chose, exact package versions).

**Do not start on gameplay logic, card effects, wave animation, real NOAA integration, or guess evaluation algorithms.** Those come in later phases. Skeleton only.
