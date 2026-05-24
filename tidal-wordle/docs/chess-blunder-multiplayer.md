# Chess Gambit blunder — multiplayer (Dev B)

Solo penalties are implemented in `applyChessBlunderPenalty` when `mode === 'solo'`.

Multiplayer uses **information leak**: when a player picks the wrong move, the opponent gains one entry in `revealedLetters` (same data model as `letter-reveal` / `tide-whisper`).

## Socket event

Added to `shared/events.ts`:

- `SocketEvents.GameChessBlunderInfoLeak` → `'game:chessBlunderInfoLeak'`

## Client API (`client/src/lib/chessBlunderPenalties.ts`)

| Function | Who calls it |
|----------|----------------|
| `applyChessBlunderPenalty(mode)` | Already called from `answerChessPuzzle` on wrong answer |
| `buildChessInfoLeakPayload(roomId, fromPlayerId, answer, revealedLetters)` | Optional; used internally |
| `emitChessBlunderInfoLeak(payload)` | Called automatically in multiplayer blunder path |
| `applyOpponentChessInfoLeak(payload)` | **Dev B:** opponent client when event received |
| `registerChessBlunderInfoLeakListener(socket)` | **Dev B:** register in `useSocket` on connect; return cleanup on disconnect |

### Payload shape

```ts
interface ChessInfoLeakPayload {
  roomId: string;
  fromPlayerId: string; // blundering player's socket.id
  position: number;     // 0-based answer index
  letter: string;
}
```

## Server (stub in `server/src/index.ts`)

Forwards `GameChessBlunderInfoLeak` to everyone else in the room via `socket.to(roomId)`. **Dev B should:**

1. Validate `roomId` and that sender is in that room.
2. Emit only to the **other** player (not broadcast to spectators if added later).
3. Optionally strip `letter` from the blunderer's echo if they rejoin the same event.

## Wiring checklist for Dev B

1. In `useSocket`, after `RoomJoined`:

   ```ts
   import { registerChessBlunderInfoLeakListener } from '../lib/chessBlunderPenalties';

   const offChessLeak = registerChessBlunderInfoLeakListener(socket);
   // on cleanup: offChessLeak();
   ```

2. When starting a match, ensure `gameStore.mode` is `'multiplayer'` and `multiplayerStore.roomId` is set.

3. Opponent UI: `KnowledgePanel` already reads `revealedLetters` — no UI change required unless you want a toast (“Opponent blundered — you gained a letter!”).

4. Sync: if `revealedLetters` becomes authoritative on the server later, persist leak there and broadcast state instead of trusting client-chosen positions.

## Solo (already done)

Wrong answer sets `chessWordleTaxPending` (`left` | `right`). The next `submitGuess` attaches `halfMaskSide` to that guess row; `WordleBoard` hides half the tiles via `isGuessRowHalfMasked`.
