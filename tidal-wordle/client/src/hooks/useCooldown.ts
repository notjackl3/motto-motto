import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface CooldownState {
  isOnCooldown: boolean;
  remainingMs: number;
  startCooldown: (durationMs: number) => void;
}

export function useCooldown(): CooldownState {
  const endsAt = useGameStore((s) => s.myCooldownEndsAt);
  const cooldownFrozen = useGameStore((s) => s.cooldownFrozen);
  const setMyCooldownEndsAt = useGameStore((s) => s.setMyCooldownEndsAt);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const remainingMs =
    endsAt && !cooldownFrozen ? Math.max(0, endsAt - now) : 0;
  const isOnCooldown = remainingMs > 0;

  return {
    isOnCooldown,
    remainingMs,
    startCooldown: (durationMs: number) =>
      setMyCooldownEndsAt(Date.now() + durationMs),
  };
}
