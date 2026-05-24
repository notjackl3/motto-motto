import { useEffect, useMemo } from 'react';
import WaveScene from '../scene/WaveScene';
import { useGameStore } from '../../stores/gameStore';
import { playSfx } from '../../lib/audio';

interface GameOverScreenProps {
  onReplay: () => void;
  onMainMenu?: () => void;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  flag: string; // emoji nationality / vibe tag
  roundsWon: number;
  totalGuesses: number;
  timeSec: number;
  score: number;
  isPlayer?: boolean;
}

// Hardcoded fictional surfers. Stats fall in a realistic band so the
// player's actual run usually slots into the middle of the board.
const FICTIONAL_BOARD: Omit<LeaderboardEntry, 'rank' | 'isPlayer'>[] = [
  { name: 'Kahi Makoa',  flag: '🇭🇮', roundsWon: 3, totalGuesses: 11, timeSec: 184, score: 2880 },
  { name: 'Noa Pereira', flag: '🇧🇷', roundsWon: 3, totalGuesses: 14, timeSec: 215, score: 2710 },
  { name: 'Alani Reef',  flag: '🇦🇺', roundsWon: 2, totalGuesses: 12, timeSec: 240, score: 2160 },
  { name: 'Marco Ríos',  flag: '🇪🇸', roundsWon: 2, totalGuesses: 16, timeSec: 287, score: 1990 },
  { name: 'Lila Sato',   flag: '🇯🇵', roundsWon: 2, totalGuesses: 19, timeSec: 322, score: 1830 },
  { name: 'Pono Iona',   flag: '🇼🇸', roundsWon: 1, totalGuesses: 17, timeSec: 305, score: 1240 },
  { name: 'Reef Walsh',  flag: '🇿🇦', roundsWon: 1, totalGuesses: 22, timeSec: 412, score: 940  },
  { name: 'Mika Stone',  flag: '🇳🇿', roundsWon: 0, totalGuesses: 18, timeSec: 365, score: 380  },
];

// Score formula: heavy weight on wins, penalty on extra guesses + time.
// Designed so a 3-win run typically lands ≈ 2400–3000.
function computePlayerScore(
  roundsWon: number,
  totalGuesses: number,
  seconds: number,
): number {
  const winBonus = roundsWon * 800;
  const guessPenalty = totalGuesses * 35;
  const timePenalty = Math.floor(seconds / 3);
  return Math.max(0, winBonus - guessPenalty - timePenalty + 1200);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameOverScreen({
  onReplay,
  onMainMenu,
}: GameOverScreenProps) {
  const winner = useGameStore((s) => s.matchWinner);
  const roundsWon = useGameStore((s) => s.roundsWon);
  const mode = useGameStore((s) => s.mode);
  const roundHistory = useGameStore((s) => s.roundHistory);
  const matchStartedAt = useGameStore((s) => s.matchStartedAt);
  const setFaceSwap = useGameStore((s) => s.setFaceSwap);
  const setMusicSwapActive = useGameStore((s) => s.setMusicSwapActive);

  useEffect(() => {
    setFaceSwap(false);
    setMusicSwapActive(false);
  }, [setFaceSwap, setMusicSwapActive]);

  useEffect(() => {
    if (winner === 'me') playSfx('win');
    else if (winner === 'opponent') playSfx('lose');
  }, [winner]);

  // Player stats, derived from the round history.
  const stats = useMemo(() => {
    const totalGuesses = roundHistory.reduce(
      (sum, r) => sum + r.myGuessCount,
      0,
    );
    const roundsPlayed = roundHistory.length;
    const winningRounds = roundHistory.filter((r) => r.winner === 'me');
    const bestRoundGuesses =
      winningRounds.length > 0
        ? Math.min(...winningRounds.map((r) => r.myGuessCount))
        : null;
    const seconds = matchStartedAt
      ? Math.max(1, Math.floor((Date.now() - matchStartedAt) / 1000))
      : 0;
    const avgGuessesPerWin =
      winningRounds.length > 0
        ? totalGuesses / winningRounds.length
        : null;
    const score = computePlayerScore(roundsWon.me, totalGuesses, seconds);
    return {
      totalGuesses,
      roundsPlayed,
      bestRoundGuesses,
      seconds,
      avgGuessesPerWin,
      score,
    };
  }, [roundHistory, matchStartedAt, roundsWon.me]);

  // Build the ranked leaderboard with the player slotted in.
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const playerEntry = {
      name: 'You',
      flag: '🏄',
      roundsWon: roundsWon.me,
      totalGuesses: stats.totalGuesses,
      timeSec: stats.seconds,
      score: stats.score,
      isPlayer: true,
    };
    const all = [...FICTIONAL_BOARD, playerEntry];
    all.sort((a, b) => b.score - a.score);
    return all.map((entry, i) => ({ ...entry, rank: i + 1 }));
  }, [roundsWon.me, stats]);

  const playerRank = leaderboard.find((e) => e.isPlayer)?.rank ?? null;
  const headline =
    winner === 'me'
      ? 'You ride the wave!'
      : winner === 'opponent'
        ? 'Wiped out.'
        : 'Heat complete';
  const subline =
    mode === 'solo'
      ? winner === 'me'
        ? 'A flawless run on the break.'
        : winner === 'opponent'
          ? 'There’s always the next swell.'
          : '3 rounds, logged and sealed.'
      : '';

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <WaveScene />
      <div className="absolute inset-0 bg-gradient-to-b from-deep/70 via-deep/40 to-deep/85 pointer-events-none" />

      {/* Wave-crash flourish */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="wave-crash absolute -left-1/3 top-1/4 h-1/3 w-[150%] bg-gradient-to-r from-transparent via-seafoam/35 to-transparent blur-sm" />
      </div>

      <div className="relative h-full w-full flex flex-col items-center justify-center gap-4 px-4 py-6 overflow-y-auto">
        <div className="text-center">
          <p className="label-instrument mb-1">Solo · 3 rounds · Final report</p>
          <h2 className="text-4xl md:text-5xl font-extrabold drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] text-sand">
            {headline}
          </h2>
          {subline && (
            <p className="text-sm md:text-base opacity-75 italic mt-1">
              {subline}
            </p>
          )}
        </div>

        {/* === Player stats card === */}
        <div className="instrument-panel bracket-corners w-full max-w-3xl px-5 py-4 relative">
          <span className="bracket-bl" />
          <span className="bracket-br" />
          <p className="label-instrument mb-3 text-center">Your run</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <StatTile
              label="Rounds won"
              value={`${roundsWon.me}/${stats.roundsPlayed || 3}`}
              accent="text-seafoam"
            />
            <StatTile
              label="Total guesses"
              value={String(stats.totalGuesses)}
            />
            <StatTile
              label="Time"
              value={formatTime(stats.seconds)}
              accent="text-sand"
            />
            <StatTile
              label="Best round"
              value={
                stats.bestRoundGuesses !== null
                  ? `${stats.bestRoundGuesses} guess${stats.bestRoundGuesses === 1 ? '' : 'es'}`
                  : '—'
              }
            />
          </div>

          {/* Per-round mini-table */}
          {roundHistory.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="label-instrument mb-2">Round breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                {roundHistory.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-md border px-2 py-2 text-center text-xs ${
                      r.winner === 'me'
                        ? 'border-emerald-400/40 bg-emerald-900/30'
                        : 'border-red-400/30 bg-red-900/25'
                    }`}
                  >
                    <div className="label-instrument">R{i + 1}</div>
                    <div className="text-base font-bold uppercase tracking-wider mt-0.5">
                      {r.answer}
                    </div>
                    <div className="text-[10px] opacity-80 mt-1">
                      {r.myGuessCount} guess{r.myGuessCount === 1 ? '' : 'es'} ·{' '}
                      {r.winner === 'me' ? 'WON' : 'LOST'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === Leaderboard === */}
        <div className="instrument-panel bracket-corners w-full max-w-3xl px-5 py-4 relative">
          <span className="bracket-bl" />
          <span className="bracket-br" />
          <div className="flex items-baseline justify-between mb-3">
            <p className="label-instrument">Tidal Wordle · all-time leaderboard</p>
            {playerRank && (
              <span className="status-pill text-seafoam">Rank #{playerRank}</span>
            )}
          </div>
          <div className="grid grid-cols-[2rem_2rem_1fr_3rem_3.5rem_3.5rem_4rem] gap-x-2 gap-y-1 text-[11px]">
            <div className="label-instrument text-right pr-1">#</div>
            <div />
            <div className="label-instrument">Surfer</div>
            <div className="label-instrument text-right">Won</div>
            <div className="label-instrument text-right">Guesses</div>
            <div className="label-instrument text-right">Time</div>
            <div className="label-instrument text-right">Score</div>
            {leaderboard.map((e) => (
              <LeaderboardRow key={`${e.name}-${e.rank}`} entry={e} />
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={onReplay}
            className="bg-seafoam text-deep font-bold px-6 py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition shadow-lg"
          >
            New heat
          </button>
          {onMainMenu && (
            <button
              onClick={onMainMenu}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition border border-white/15"
            >
              Main menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 px-2 py-2">
      <div className="label-instrument">{label}</div>
      <div
        className={`display-numeral text-2xl md:text-3xl mt-0.5 ${
          accent ?? 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const trophy = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
  return (
    <>
      <div
        className={`text-right pr-1 tabular-nums ${
          entry.isPlayer
            ? 'text-seafoam font-bold'
            : entry.rank <= 3
              ? 'text-sand font-semibold'
              : 'text-white/70'
        }`}
      >
        {entry.rank}
      </div>
      <div className="text-center">{trophy || entry.flag}</div>
      <div
        className={`truncate ${
          entry.isPlayer
            ? 'text-seafoam font-bold'
            : 'text-white/90'
        }`}
      >
        {entry.isPlayer ? '★ You' : entry.name}
      </div>
      <div className="text-right tabular-nums opacity-90">{entry.roundsWon}</div>
      <div className="text-right tabular-nums opacity-90">{entry.totalGuesses}</div>
      <div className="text-right tabular-nums opacity-90">
        {formatTime(entry.timeSec)}
      </div>
      <div
        className={`text-right tabular-nums font-bold ${
          entry.isPlayer ? 'text-seafoam' : 'text-sand'
        }`}
      >
        {entry.score}
      </div>
    </>
  );
}
