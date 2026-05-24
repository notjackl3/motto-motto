/**
 * iPad screen content — rendered inside the held-iPad in PlayScene.
 *
 * The screen now mimics nytimes.com/games/wordle: white background, big
 * "WORDLE" header, centered board, light guess input, recent-cards strip
 * at the bottom. The `.wordle-nyt-theme` wrapper triggers the palette
 * overrides in styles.css (NYT tile colours, light input form, light
 * card history, NYT-coloured opponent tiles).
 *
 * In multiplayer the opponent board sits to the right of the player
 * board, sized to fit the iPad screen. Full-screen effect overlays and
 * the round banner remain mounted at GameLayout level.
 */
import WordleBoard from '../game/WordleBoard';
import GuessInput from '../game/GuessInput';
import CardHand from '../game/CardHand';
import OpponentBoard from '../game/OpponentBoard';
import CardDetailPopup from '../game/CardDetailPopup';
import ActiveEffectTimers from '../game/ActiveEffectTimers';
import KnowledgePanel from '../game/KnowledgePanel';
import { useGameStore } from '../../stores/gameStore';

export default function IpadUI() {
  const mode = useGameStore((s) => s.mode);
  const roomCode = useGameStore((s) => s.roomCode);
  const roundsWon = useGameStore((s) => s.roundsWon);
  const roundsToWin = useGameStore((s) => s.roundsToWin);
  const matchScore = useGameStore((s) => s.matchScore);
  const activeEffectsCount = useGameStore((s) => s.activeEffects.length);

  const totalRounds = roundsToWin * 2 - 1;
  const roundNumber = Math.min(
    totalRounds,
    roundsWon.me + roundsWon.opponent + 1
  );

  return (
    <div className="ipad-tablet wordle-nyt-theme font-body w-full h-full flex flex-col">
      {/* ── Title bar (mimics NYT Wordle header) ─────────────────── */}
      <header className="shrink-0 border-b border-black/10 px-3 py-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[8px] tracking-[0.22em] uppercase text-black/55 w-[28%] truncate">
          {mode === 'solo'
            ? 'Solo'
            : `MP${roomCode ? ` · ${roomCode}` : ''}`}
        </span>
        <h1 className="font-display font-extrabold tracking-[0.34em] uppercase text-[16px] leading-none text-[#1a1a1b] select-none">
          Wordle
        </h1>
        <span className="font-mono text-[8px] tabular-nums tracking-[0.22em] uppercase text-black/55 w-[28%] text-right truncate">
          R{roundNumber}/{totalRounds} · {roundsWon.me}:{roundsWon.opponent}
          <span className="ml-1 text-emerald-700 font-bold">
            · {matchScore}
          </span>
        </span>
      </header>

      {/* ── Main play area ───────────────────────────────────────────
          Board sits centered; the Intel (buff output) aside is pinned
          to the right edge of the iPad screen via `ml-auto`. */}
      <main className="flex-1 min-h-0 flex items-stretch gap-2 px-3 py-2 overflow-hidden">
        <section className="flex-1 min-w-0 max-w-[420px] mx-auto flex flex-col items-stretch justify-center gap-2">
          <div className="flex-1 min-h-0 flex flex-col items-stretch justify-center overflow-hidden">
            <WordleBoard boardTarget="self" />
          </div>
          {activeEffectsCount > 0 && (
            <div className="shrink-0">
              <ActiveEffectTimers />
            </div>
          )}
          <div className="shrink-0">
            <GuessInput />
          </div>
        </section>

        {mode === 'multiplayer' ? (
          <aside className="w-[30%] max-w-[200px] shrink-0 ml-auto min-h-0 flex flex-col gap-2 overflow-hidden">
            <div className="shrink-0 min-h-0 overflow-hidden">
              <OpponentBoard />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <KnowledgePanel />
            </div>
          </aside>
        ) : (
          <aside className="w-[30%] max-w-[200px] shrink-0 ml-auto min-h-0 overflow-hidden">
            <KnowledgePanel />
          </aside>
        )}
      </main>

      {/* ── Bottom: recent cards ─────────────────────────────────── */}
      <footer className="shrink-0 border-t border-black/10 px-3 py-1.5 z-[4]">
        <div className="relative">
          <CardDetailPopup />
          <CardHand solo={mode === 'solo'} />
        </div>
      </footer>
    </div>
  );
}
