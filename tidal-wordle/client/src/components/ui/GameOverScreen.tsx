import { useEffect, useMemo } from 'react';
import WaveScene from '../scene/WaveScene';
import { useGameStore } from '../../stores/gameStore';
import { playSfx } from '../../lib/audio';

interface GameOverScreenProps {
  onReplay: () => void;
  onMainMenu?: () => void;
}

// Pre-generate a stable confetti pattern so each render isn't a new fountain.
function buildConfetti(count: number) {
  return new Array(count).fill(0).map((_, i) => ({
    key: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 1.8 + Math.random() * 1.6,
    color: ['#9ad4d6', '#f4e1c1', '#ff7a59', '#ffd166', '#ef476f'][
      Math.floor(Math.random() * 5)
    ],
    rotate: Math.random() * 360,
  }));
}

export default function GameOverScreen({ onReplay, onMainMenu }: GameOverScreenProps) {
  const winner = useGameStore((s) => s.matchWinner);
  const roundsWon = useGameStore((s) => s.roundsWon);
  const mode = useGameStore((s) => s.mode);
  const setFaceSwap = useGameStore((s) => s.setFaceSwap);
  const setMusicSwapActive = useGameStore((s) => s.setMusicSwapActive);

  const opponentLeft = false;
  const confetti = useMemo(() => buildConfetti(36), []);

  // Clean up any lingering visual effects when this screen mounts.
  useEffect(() => {
    setFaceSwap(false);
    setMusicSwapActive(false);
  }, [setFaceSwap, setMusicSwapActive]);

  useEffect(() => {
    if (winner === 'me') playSfx('win');
    else if (winner === 'opponent') playSfx('lose');
  }, [winner]);

  const headline =
    winner === 'me'
      ? 'You ride the wave! 🏄'
      : winner === 'opponent'
        ? 'Wiped out.'
        : mode === 'solo'
          ? 'Round complete'
          : 'Match ended';

  const subline = opponentLeft
    ? 'Your opponent left the match.'
    : winner === 'me'
      ? 'A flawless run on the break.'
      : winner === 'opponent'
        ? 'There’s always the next swell.'
        : '';

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <WaveScene />
      <div className="absolute inset-0 bg-gradient-to-b from-deep/60 via-transparent to-deep/80 pointer-events-none" />

      {/* Wave-crash flourish: a horizontal sheet that sweeps across once. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="wave-crash absolute -left-1/3 top-1/3 h-1/3 w-[150%] bg-gradient-to-r from-transparent via-seafoam/40 to-transparent blur-sm" />
      </div>

      {winner === 'me' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((c) => (
            <span
              key={c.key}
              className="absolute top-0 block confetti-piece"
              style={{
                left: `${c.left}%`,
                width: '8px',
                height: '14px',
                background: c.color,
                transform: `rotate(${c.rotate}deg)`,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative h-full w-full flex flex-col items-center justify-center gap-6 px-6">
        <h2 className="text-5xl font-extrabold drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] text-sand">
          {headline}
        </h2>
        {subline && <p className="text-lg opacity-85 italic">{subline}</p>}

        {winner !== null && (
          <div className="backdrop-blur-md bg-deep/40 border border-white/15 rounded-xl px-6 py-4 shadow-2xl">
            <div className="text-xs uppercase tracking-widest opacity-70 mb-1 text-center">
              Rounds Won
            </div>
            <div className="text-3xl font-bold flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs uppercase opacity-70">You</div>
                <div className="text-4xl text-seafoam">{roundsWon.me}</div>
              </div>
              <span className="opacity-50">—</span>
              <div className="text-center">
                <div className="text-xs uppercase opacity-70">Opponent</div>
                <div className="text-4xl text-sand">{roundsWon.opponent}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onReplay}
            className="bg-seafoam text-deep font-bold px-6 py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition shadow-lg"
          >
            Play Again
          </button>
          {onMainMenu && (
            <button
              onClick={onMainMenu}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
