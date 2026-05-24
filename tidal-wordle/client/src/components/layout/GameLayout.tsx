import { useCallback, useEffect, useRef, useState } from 'react';
import PlayScene from '../scene/PlayScene';
import IpadUI from './IpadUI';
import EffectOverlays from '../game/EffectOverlays';
import RoundBanner from '../game/RoundBanner';
import CardDetailPopup from '../game/CardDetailPopup';
import DevCardFilterPanel from '../dev/DevCardFilterPanel';
import { useEffectExpiry } from '../../hooks/useEffectExpiry';
import { useGameStore } from '../../stores/gameStore';
import { playSfx } from '../../lib/audio';

interface GameLayoutProps {
  onQuit: () => void;
}

type ControlMode = 'ipad' | 'look';

export default function GameLayout({ onQuit }: GameLayoutProps) {
  const matchScore = useGameStore((s) => s.matchScore);
  const myGuessCount = useGameStore((s) => s.myGuesses.length);
  const opponentGuessCount = useGameStore((s) => s.opponentGuesses.length);

  useEffectExpiry();

  const [controlMode, setControlMode] = useState<ControlMode>('ipad');
  const [crashKey, setCrashKey] = useState<number | null>(null);
  const prevMatchScoreRef = useRef(matchScore);
  const prevMyGuessRef = useRef(myGuessCount);
  const prevOppGuessRef = useRef(opponentGuessCount);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key.toLowerCase() === 'e') {
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        setControlMode((m) => (m === 'ipad' ? 'look' : 'ipad'));
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    onQuit();
  }, [onQuit]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden text-white select-none ${
        controlMode === 'look' ? 'cursor-none' : ''
      }`}
    >
      <PlayScene lookMode={controlMode === 'look'} />

      {/* Gameplay UI projected onto the iPad screen face. */}
      <IpadOverlay controlMode={controlMode} onQuit={handleQuit} />

      {/* Screen-level gameplay overlays (card effects, popups, round banner) */}
      <EffectOverlays />
      <CardDetailPopup />
      <RoundBanner />
      {import.meta.env.DEV && <DevCardFilterPanel />}

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

      {controlMode === 'look' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
        </div>
      )}
    </div>
  );
}

// ---------- IpadOverlay ----------

const IPAD_SCREEN_W = 0.72;
const IPAD_SCREEN_H = 0.49;
const HALF_FOV_Y = (70 * Math.PI) / 180 / 2;
const TAN_HALF_FOV_Y = Math.tan(HALF_FOV_Y);

const IPAD_CAM_IPAD: [number, number, number] = [0, 0, -0.7];
const IPAD_CAM_LOOK: [number, number, number] = [0.7, -0.5, -1.25];
const IPAD_TILT_LOOK = 0.32;
const IPAD_YAW_LOOK = -0.48;

function useWindowAspect() {
  const [aspect, setAspect] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9,
  );
  useEffect(() => {
    function onResize() {
      setAspect(window.innerWidth / window.innerHeight);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return aspect;
}

function IpadOverlay({
  controlMode,
  onQuit,
}: {
  controlMode: ControlMode;
  onQuit: () => void;
}) {
  const aspect = useWindowAspect();
  const isLook = controlMode === 'look';

  const [xCam, yCam, zCam] = isLook ? IPAD_CAM_LOOK : IPAD_CAM_IPAD;
  const tiltX = isLook ? IPAD_TILT_LOOK : 0;
  const yawY = isLook ? IPAD_YAW_LOOK : 0;

  const distance = -zCam;
  const tanHfovX = aspect * TAN_HALF_FOV_Y;

  const ndcX = xCam / (distance * tanHfovX);
  const ndcY = yCam / (distance * TAN_HALF_FOV_Y);
  const leftPct = ((1 + ndcX) / 2) * 100;
  const topPct = ((1 - ndcY) / 2) * 100;

  const widthVw = ((IPAD_SCREEN_W * Math.cos(yawY)) / (2 * distance * tanHfovX)) * 100;
  const heightVh = ((IPAD_SCREEN_H * Math.cos(tiltX)) / (2 * distance * TAN_HALF_FOV_Y)) * 100;

  return (
    <div
      className="ipad-screen-overlay"
      style={{
        position: 'absolute',
        left: `${leftPct}vw`,
        top: `${topPct}vh`,
        width: `${widthVw}vw`,
        height: `${heightVh}vh`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: isLook ? 'none' : 'auto',
        transition:
          'opacity 180ms ease, left 240ms ease, top 240ms ease, width 240ms ease, height 240ms ease',
        opacity: isLook ? 0 : 1,
        visibility: isLook ? 'hidden' : 'visible',
      }}
    >
      <IpadUI onQuit={onQuit} />
    </div>
  );
}
