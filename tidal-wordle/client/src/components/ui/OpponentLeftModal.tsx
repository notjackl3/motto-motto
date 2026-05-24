import { useEffect, useState } from 'react';
import { DISCONNECT_GRACE_MS } from '../../../../shared/events';

interface Props {
  onReturnToMenu: () => void;
}

/**
 * Shown when the server emits opponent:left during a match. Counts down the
 * grace window; if the opponent doesn't reconnect, returns the player to the
 * menu. User can also click through immediately.
 */
export default function OpponentLeftModal({ onReturnToMenu }: Props) {
  const [remaining, setRemaining] = useState(Math.floor(DISCONNECT_GRACE_MS / 1000));

  useEffect(() => {
    if (remaining <= 0) {
      onReturnToMenu();
      return;
    }
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onReturnToMenu]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-sm w-[90%] bg-deep/90 border border-coral/50 rounded-xl p-6 text-center shadow-2xl">
        <div className="font-display font-bold text-2xl text-coral mb-2">
          Opponent disconnected
        </div>
        <div className="text-sm opacity-80 mb-4">
          Waiting <span className="font-mono text-sand">{remaining}s</span> for
          them to reconnect…
        </div>
        <button
          onClick={onReturnToMenu}
          className="bg-sand text-deep font-bold px-6 py-2 rounded-lg hover:bg-white transition shadow-lg"
        >
          Return to menu
        </button>
      </div>
    </div>
  );
}
