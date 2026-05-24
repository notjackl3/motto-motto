import { useCallback, useEffect, useRef, useState } from 'react';
import PlayScene from '../scene/PlayScene';
import IpadUI from './IpadUI';
import { useGameStore } from '../../stores/gameStore';
import { playSfx } from '../../lib/audio';

interface GameLayoutProps {
  onBackToMenu: () => void;
}

type ControlMode = 'ipad' | 'look';

export default function GameLayout({ onBackToMenu }: GameLayoutProps) {
  const matchScore = useGameStore((s) => s.matchScore);
  const myGuessCount = useGameStore((s) => s.myGuesses.length);
  const opponentGuessCount = useGameStore((s) => s.opponentGuesses.length);

  const [controlMode, setControlMode] = useState<ControlMode>('ipad');
  const [crashKey, setCrashKey] = useState<number | null>(null);
  const prevMatchScoreRef = useRef(matchScore);
  const prevMyGuessRef = useRef(myGuessCount);
  const prevOppGuessRef = useRef(opponentGuessCount);

  // E key toggles between ipad-interact and free-look. We also let Escape
  // exit look mode for users who hit the browser's built-in pointer-lock
  // exit before the toggle fires.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key.toLowerCase() === 'e') {
        // Don't hijack E while the user is typing a guess.
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        setControlMode((m) => (m === 'ipad' ? 'look' : 'ipad'));
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // When the browser drops pointer lock (Escape, focus loss), reflect that
  // in our control mode so the cursor reappears.
  useEffect(() => {
    function onLockChange() {
      if (!document.pointerLockElement) {
        setControlMode('ipad');
      }
    }
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  useEffect(() => {
    const prev = prevMatchScoreRef.current;
    if (prev.me !== matchScore.me || prev.opponent !== matchScore.opponent) {
      setCrashKey(Date.now());
      if (matchScore.me > prev.me) playSfx('correct');
      else if (matchScore.opponent > prev.opponent) playSfx('lose');
    }
    prevMatchScoreRef.current = matchScore;
  }, [matchScore]);

  useEffect(() => {
    if (myGuessCount > prevMyGuessRef.current) playSfx('guessSubmit');
    prevMyGuessRef.current = myGuessCount;
  }, [myGuessCount]);

  useEffect(() => {
    if (opponentGuessCount > prevOppGuessRef.current) playSfx('tick');
    prevOppGuessRef.current = opponentGuessCount;
  }, [opponentGuessCount]);

  const handleQuit = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    onBackToMenu();
  }, [onBackToMenu]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden text-white select-none ${
        controlMode === 'look' ? 'cursor-none' : ''
      }`}
    >
      <PlayScene lookMode={controlMode === 'look'} />

      {/* Gameplay UI projected onto the iPad screen face. The iPad mesh in
          IpadRig is camera-locked at IPAD_POS_IPAD (centered) in focus mode
          and IPAD_POS_LOOK (pinned to the bottom + tilted back) in look
          mode. The DOM overlay below mirrors those two poses, so the UI
          always lands exactly on top of the 3D screen. */}
      <IpadOverlay controlMode={controlMode} onQuit={handleQuit} />

      {/* Wave-crash transition between rounds */}
      {crashKey !== null && (
        <div
          key={crashKey}
          className="pointer-events-none absolute inset-0 overflow-hidden z-20"
          onAnimationEnd={() => setCrashKey(null)}
        >
          <div className="wave-crash absolute -left-1/2 top-1/2 -translate-y-1/2 h-1/2 w-[200%] bg-gradient-to-r from-transparent via-seafoam/60 to-transparent blur-md" />
        </div>
      )}

      {/* Mode hint */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[12px] tracking-wide opacity-70 backdrop-blur-sm bg-black/30 px-3 py-1 rounded-full border border-white/10">
        {controlMode === 'ipad' ? (
          <>
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
              E
            </kbd>{' '}
            look around
          </>
        ) : (
          <>
            Looking around · press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
              E
            </kbd>{' '}
            (or Esc) to use the iPad
          </>
        )}
      </div>

      {/* Center reticle while looking around — small dot so the player has a
          fixed point of reference. */}
      {controlMode === 'look' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
        </div>
      )}
    </div>
  );
}

// ---------- IpadOverlay ----------
//
// The iPad mesh in IpadRig is camera-locked, so its screen-space position
// depends ONLY on its camera-local (xCam, yCam, zCam) — pitch from
// mouse-look doesn't move it. We mirror the two iPad poses from IpadRig
// here and project them with the standard NDC formula:
//
//   ndc_y = yCam / (|zCam| · tan(half_fov_y))
//   top%  = (1 - ndc_y) / 2 · 100
//
// In look (driving) mode the iPad drops to the bottom of view and tilts
// back; the height shrinks by cos(tilt) due to foreshortening.

const IPAD_SCREEN_W = 0.72;
const IPAD_SCREEN_H = 0.49;
const HALF_FOV_Y = (70 * Math.PI) / 180 / 2; // 35° in radians
const TAN_HALF_FOV_Y = Math.tan(HALF_FOV_Y);

// Keep these in sync with IPAD_POS_IPAD / IPAD_POS_LOOK / IPAD_TILT_LOOK in
// IpadRig.tsx.
const IPAD_CAM_IPAD: [number, number, number] = [0, 0, -0.7];
const IPAD_CAM_LOOK: [number, number, number] = [0, -0.55, -0.85];
const IPAD_TILT_LOOK = 0.55;

function IpadOverlay({
  controlMode,
  onQuit,
}: {
  controlMode: ControlMode;
  onQuit: () => void;
}) {
  const isLook = controlMode === 'look';
  const [, yCam, zCam] = isLook ? IPAD_CAM_LOOK : IPAD_CAM_IPAD;
  const tilt = isLook ? IPAD_TILT_LOOK : 0;

  const distance = -zCam;
  const ndcY = yCam / (distance * TAN_HALF_FOV_Y);
  const topPct = ((1 - ndcY) / 2) * 100;

  // Foreshortening from the tilt-back collapses the screen height a bit.
  const heightVh =
    ((IPAD_SCREEN_H * Math.cos(tilt)) / (2 * distance * TAN_HALF_FOV_Y)) * 100;
  const widthVh = (IPAD_SCREEN_W / (2 * distance * TAN_HALF_FOV_Y)) * 100;

  return (
    <div
      className="ipad-screen-overlay"
      style={{
        position: 'absolute',
        top: `${topPct}vh`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${widthVh}vh`,
        height: `${heightVh}vh`,
        maxWidth: '92vw',
        pointerEvents: controlMode === 'ipad' ? 'auto' : 'none',
        transition:
          'opacity 180ms ease, top 240ms ease, width 240ms ease, height 240ms ease',
        opacity: 1,
      }}
    >
      <IpadUI onQuit={onQuit} />
    </div>
  );
}
