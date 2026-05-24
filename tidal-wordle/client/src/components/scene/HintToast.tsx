import { useEffect, useState } from 'react';
import { useViewStore } from '../../stores/viewStore';

// Transient on-screen popup shown when a mystery-box hint is collected.
// Watches viewStore.hintToast.tick (monotonic) so the same hint text can
// retrigger if popped twice. Auto-dismisses after DURATION_MS.

const DURATION_MS = 4500;

interface Active {
  text: string;
  tick: number;
}

export default function HintToast() {
  const toast = useViewStore((s) => s.hintToast);
  const [active, setActive] = useState<Active | null>(null);

  useEffect(() => {
    if (!toast || toast.tick === 0) return;
    setActive({ text: toast.text, tick: toast.tick });
    const id = window.setTimeout(() => {
      setActive((curr) => (curr && curr.tick === toast.tick ? null : curr));
    }, DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!active) return null;

  return (
    <div
      key={active.tick}
      className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-50 hint-toast"
    >
      <div className="px-5 py-3 max-w-sm rounded-xl border border-emerald-300/50 bg-emerald-900/85 text-white shadow-2xl backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/80 mb-1">
          Hint
        </div>
        <div className="text-sm leading-snug">{active.text}</div>
      </div>
    </div>
  );
}
