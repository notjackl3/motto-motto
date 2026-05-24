import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

// Match the server-side GUESS_COOLDOWN_MS for the progress denominator.
const COOLDOWN_MS = 3000;

const RADIUS = 36;
const CIRC = 2 * Math.PI * RADIUS;

export default function CooldownTimer() {
  const endsAt = useGameStore((s) => s.myCooldownEndsAt);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const seconds = remaining / 1000;
  const progress = remaining > 0 ? Math.min(1, remaining / COOLDOWN_MS) : 0;
  const ready = remaining === 0;

  return (
    <div className="relative w-28 h-28 select-none">
      <svg viewBox="0 0 90 90" className="absolute inset-0 -rotate-90">
        <circle
          cx="45"
          cy="45"
          r={RADIUS}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="45"
          cy="45"
          r={RADIUS}
          stroke={ready ? '#9ad4d6' : '#f4e1c1'}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 120ms linear, stroke 300ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest opacity-70">
          Cooldown
        </div>
        <div className={`text-2xl font-bold ${ready ? 'text-seafoam' : 'text-sand'}`}>
          {ready ? 'Ready' : `${seconds.toFixed(1)}s`}
        </div>
      </div>
    </div>
  );
}
