import { useGameStore } from '../../stores/gameStore';
import PhoneStoryboardUI from './PhoneStoryboardUI';

interface PhoneShellProps {
  open: boolean;
  onToggle: () => void;
}

/** Pull-out phone overlay — manga storyboard lives here, separate from the iPad. */
export default function PhoneShell({ open, onToggle }: PhoneShellProps) {
  const pageCount = useGameStore((s) => s.storyboardPages.length);
  const hasUnread = useGameStore((s) => s.storyboardHasUnread);

  return (
    <>
      {/* Tab to pull the phone out */}
      {!open && (
        <button
          type="button"
          onClick={onToggle}
          className={`phone-pull-tab pointer-events-auto absolute z-[28] right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 px-2 py-3 rounded-l-xl border border-r-0 border-white/15 bg-black/55 backdrop-blur-md hover:bg-black/70 hover:border-seafoam/40 transition-colors ${
            hasUnread ? 'phone-pull-tab-unread' : ''
          }`}
          aria-label="Pull out manga phone"
        >
          <span className="text-lg leading-none" aria-hidden>
            📱
          </span>
          <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-white/60 [writing-mode:vertical-rl] rotate-180">
            Manga
          </span>
          {pageCount > 0 && (
            <span className="font-mono text-[9px] tabular-nums text-seafoam bg-seafoam/15 border border-seafoam/30 rounded-full min-w-[18px] px-1 py-0.5">
              {pageCount}
            </span>
          )}
        </button>
      )}

      {/* Phone slides in from the right */}
      <div
        className={`phone-shell pointer-events-auto absolute z-[29] top-1/2 -translate-y-1/2 transition-[right,opacity] duration-300 ease-out ${
          open ? 'right-4 opacity-100' : '-right-[min(92vw,320px)] opacity-0 pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        <div className="phone-bezel">
          <div className="phone-notch" aria-hidden />
          <div className="phone-screen">
            <PhoneStoryboardUI onClose={onToggle} />
          </div>
        </div>
      </div>
    </>
  );
}
