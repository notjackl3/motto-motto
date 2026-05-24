import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

export default function CooldownTimer() {
  const endsAt = useGameStore((s) => s.myCooldownEndsAt);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="bg-black/40 rounded-lg p-3 text-center">
      <div className="text-xs uppercase opacity-70">Cooldown</div>
      <div className="text-2xl font-bold">{seconds > 0 ? `${seconds}s` : 'Ready'}</div>
    </div>
  );
}
