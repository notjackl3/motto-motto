import { useEffect, useState } from 'react';
import { useViewStore } from '../../stores/viewStore';

// Full-screen rainbow burst that fires whenever a mystery-box hint is
// collected. Listens to viewStore.rainbowFlashTick — a monotonic counter
// bumped by MysteryBoxes on hit — and plays a ~1.2s animation each tick.

const DURATION_MS = 1200;

export default function RainbowFlash() {
  const tick = useViewStore((s) => s.rainbowFlashTick);
  const [activeKey, setActiveKey] = useState<number | null>(null);

  useEffect(() => {
    if (tick === 0) return;
    setActiveKey(tick);
    const id = window.setTimeout(() => setActiveKey(null), DURATION_MS);
    return () => window.clearTimeout(id);
  }, [tick]);

  if (activeKey === null) return null;

  return (
    <div
      key={activeKey}
      className="pointer-events-none absolute inset-0 z-40 rainbow-flash"
    />
  );
}
