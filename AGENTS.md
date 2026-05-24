# AGENTS.md — Grounding Truth for AI Assistants

This file is the **shared context document** for any AI assistant working on this repo (Claude Code, Cursor, or otherwise). Read it before making changes. If you find this file out of date relative to the code, **update this file as part of your work** — drift here makes both agents less useful.

> Humans: see [`tidal-wordle/README.md`](./tidal-wordle/README.md) for the user-facing project description and how to run things locally. This file is operational guidance for AI tools.

---

## 1. What this project is

**Tidal Wordle** is a beach-themed competitive Wordle variant. Two players race to guess a beach-themed word, with:

- A **3D wave/beach environment** rendered with react-three-fiber (driven by NOAA tide data in a later phase).
- **Async, cooldown-based multiplayer** — players don't take strict turns; each is gated by a per-guess cooldown.
- An **API-inspired card system** — 12 cards (attack / buff / wildcard) that players can play on themselves or their opponent.
- **Best of 3 rounds** per match.

The project is being built by **two developers splitting feature work**, each with an AI assistant (one Claude Code, one Cursor). Stay aligned by treating this file as the contract.

---

## 2. Current phase: SKELETON ONLY

This is **phase 1 of 7**. The skeleton scaffolding exists; **gameplay logic does not**. Specifically:

| ❌ Do NOT implement yet | ✅ Stubs exist for |
|---|---|
| Card effects (any of the 12) | `CardDefinitions.ts` (metadata) + `CardRenderer.tsx` (visual) |
| Wordle guess evaluation algorithm | `lib/guessEvaluator.ts` (returns `'empty'` placeholders) |
| Wave geometry animation | `scene/Wave.tsx` (static flat plane) |
| Real NOAA tide fetch | `lib/api/noaa.ts` (returns mock data, has TODO) |
| Cooldown timing logic | `hooks/useCooldown.ts` (skeleton state machine) |
| Multiplayer sync (game state) | `useSocket.ts` + room create/join only |
| Score tracking, win conditions | `gameStore.ts` fields defined, never updated |
| Settings menu | Disabled button in `MainMenu.tsx` |

If you're tempted to implement something on the left column, **stop and confirm with the human first** — those belong to specific later phases (see §7).

---

## 3. Tech stack at a glance

- **Client:** React 18 + Vite 5 + TypeScript 5.6, Tailwind 3.4, Zustand 5, react-three-fiber 8 + drei 9, socket.io-client 4.8
- **Server:** Node + Express 4 + Socket.IO 4.8, TypeScript 5.6 (via `tsx` for dev)
- **Shared:** A single `shared/events.ts` file of socket event-name constants, imported by both sides
- **External (later):** NOAA Tides and Currents API, remote beach word list

Stick to these versions unless there's a good reason to upgrade. **Do not add new dependencies without flagging it** — small deps are fine, but a third state library or a routing library should be a conversation, not a silent commit.

---

## 4. Folder map (where to find things)

```
motto-motto/                          # git repo root
├── AGENTS.md                         # this file
├── CLAUDE.md                         # pointer to this file (Claude Code reads it)
├── .cursorrules                      # pointer to this file (Cursor reads it)
├── 01_skeleton_prompt.md             # original spec used to scaffold the project
└── tidal-wordle/                     # the actual app
    ├── README.md                     # human-facing docs
    ├── client/                       # Vite + React app (port 5173)
    │   └── src/
    │       ├── App.tsx               # state-based screen router (menu/lobby/game/gameOver)
    │       ├── components/
    │       │   ├── game/             # WordleBoard, GuessInput, CooldownTimer, CardHand, OpponentBoard, ScorePanel
    │       │   ├── scene/            # WaveScene + Wave/Surfer/SkyAndLighting (r3f)
    │       │   ├── cards/            # CardDefinitions.ts (12 cards, metadata only) + CardRenderer.tsx
    │       │   ├── ui/               # MainMenu, Lobby, GameOverScreen
    │       │   └── layout/GameLayout.tsx  # composes scene + HUD
    │       ├── stores/               # gameStore (single source of truth for game state) + multiplayerStore
    │       ├── hooks/                # useCooldown, useTideData, useSocket
    │       ├── lib/                  # wordList, guessEvaluator (stub), api/noaa (stub)
    │       ├── data/beachWords.json  # 30 starter words — replace later with remote source
    │       └── types/index.ts        # shared TS types (Card, Guess, LetterState, GameMode, PlayerState)
    ├── server/                       # Express + Socket.IO (port 3001)
    │   └── src/
    │       ├── index.ts              # socket event wiring (currently mostly echo/broadcast stubs)
    │       ├── rooms.ts              # in-memory room registry (Map<roomId, Room>)
    │       └── types.ts              # server-side types (duplicate of client for now)
    └── shared/events.ts              # event-name constants, used by both client and server
```

---

## 5. Working agreements (rules for both agents)

These keep two AI-assisted devs from stepping on each other.

### State management
- **All game state lives in `gameStore.ts`.** Don't create parallel state in components. If you need a new field, add it to the store shape first, then read it from components.
- **All multiplayer/socket state lives in `multiplayerStore.ts`.** Same rule.
- Both stores use Zustand with the `create(set => ({ ... }))` pattern shown in the existing files. Match that style.

### Socket events
- **Never hardcode an event name string.** Always import from `shared/events.ts`. If you need a new event, add it there *first*, then use it on both sides.
- The server is currently a pile of `broadcast` stubs — when you implement real handlers, scope them to the room (`io.to(roomId).emit(...)`), not global broadcasts.

### Types
- Shared types currently live in `client/src/types/index.ts` and are duplicated in `server/src/types.ts`. When you change one, **update both** until we extract them to a shared package. Adding a comment in both files when you sync them is welcome.

### Stubs
- Every stub renders something visible (a placeholder div with the component name) so it's obvious in the UI what's wired up. **Preserve that pattern** — when you replace a stub, the visual presence should at minimum still be there.
- Stubs have `TODO:` comments marking where real logic goes. When you implement, remove the TODO comment.

### Routing
- We picked a **state-based screen switcher** in `App.tsx` over `react-router-dom`. Don't add a router unless the human asks for deep linking.

### Tailwind
- We added theme colors in `tailwind.config.js`: `sand`, `seafoam`, `ocean`, `deep`. Use these for thematic UI rather than raw hex codes.

### Styling
- Tailwind utility classes inline in JSX. No CSS modules, no styled-components.

### Testing
- No test runner is set up yet. If you add `vitest` or similar, make it a conversation first.

### Commits
- The human is the committer, **not the AI**. Do not create commits with co-author trailers attributing the AI. Stage changes and let the human commit.
- Use small, focused commits. The skeleton commit was one big "initial scaffolding" commit; feature work should not be.

### Imports
- Client imports from `shared/` use a relative path (`../../shared/events`). A Vite alias `@shared` is configured in `vite.config.ts` if you want to use `@shared/events` — either is fine, just be consistent within a file.
- Server imports from `shared/` use relative paths with the `.js` extension (because of the ESM + tsx setup): `import { SocketEvents } from '../../shared/events.js'`. Don't strip the `.js`.

---

## 6. How to verify your work

Before reporting a feature done, run these and confirm all pass:

```bash
# Client
cd tidal-wordle/client
npx tsc --noEmit          # must be clean
npm run dev               # must boot Vite without errors

# Server
cd tidal-wordle/server
npx tsc --noEmit          # must be clean
npm run dev               # must boot Socket.IO without errors
```

For UI work, **open the app in a browser** and click through the flow you changed. Type checking is not a substitute for actually using the feature. If you can't verify visually (no browser access), say so explicitly rather than claiming the UI works.

For multiplayer work, open **two browser tabs**, create a room in one, join from the other. Both tabs should receive `room:joined`.

---

## 7. Phase plan

Each phase should be a separate prompt/branch. Don't roll multiple phases into one PR.

1. **Skeleton** — ✅ done. File structure, stubs, room create/join, 3D scene renders.
2. **Core gameplay** — guess evaluation with duplicate-letter handling, cooldown loop, score tracking, win/loss detection, best-of-3 round flow.
3. **3D scene** — animated wave geometry (vertex displacement), surfer model + ride animation, day/night skybox.
4. **Card system** — implement all 12 card effects, hand management, deck/draw logic, persistent effect tracking (Status Dog).
5. **Multiplayer** — full room lifecycle, opponent state sync via socket events, reconnection handling, server-authoritative answer.
6. **External APIs** — wire NOAA tide data into wave animation amplitude/frequency; swap local word list for a remote source.
7. **Polish** — sound, juice, mobile layout, settings menu, accessibility.

If a task feels like it spans multiple phases, **split it**.

---

## 8. Quick "before you start" checklist

When picking up a task in this repo:

1. Read the task description and identify which phase (§7) it belongs to.
2. Skim the relevant files listed in §4 — don't guess the architecture.
3. Confirm the rules in §5 apply to what you're about to do.
4. If your change crosses client/server, update `shared/events.ts` first and **both** type files.
5. If your change touches `gameStore.ts` shape, mention it in the response — the other developer needs to know.
6. Run the verification steps in §6 before declaring done.
7. Leave a TODO comment for anything you skipped on purpose, with enough context for the next agent to pick it up.

---

*Last updated: 2026-05-24 (67 theme keys for card visuals; v2 `beachWordCategories.json`)*
