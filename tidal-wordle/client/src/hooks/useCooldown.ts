import { useEffect, useState } from 'react';

interface CooldownState {
  isOnCooldown: boolean;
  remaining: number;
  startCooldown: (durationMs: number) => void;
}

// TODO: integrate with gameStore cooldown fields
export function useCooldown(): CooldownState {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [endsAt]);

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const isOnCooldown = remaining > 0;

  return {
    isOnCooldown,
    remaining,
    startCooldown: (durationMs: number) => setEndsAt(Date.now() + durationMs),
  };
}
