import { useCallback, useEffect, useRef, useState } from 'react';
import PlayScene from '../scene/PlayScene';
import IpadUI from './IpadUI';
import EffectOverlays from '../game/EffectOverlays';
import RoundBanner from '../game/RoundBanner';
import DevCardFilterPanel from '../dev/DevCardFilterPanel';
import PhoneShell from '../storyboard/PhoneShell';
import WordLexiconButton from '../game/WordLexiconButton';
import WordLexiconOverlay from '../game/WordLexiconOverlay';
import { useEffectExpiry } from '../../hooks/useEffectExpiry';
import { useGameStore } from '../../stores/gameStore';
import { playSfx } from '../../lib/audio';

interface GameLayoutProps {
  onQuit: () => void;
}

type ControlMode = 'ipad' | 'look';

export default function GameLayout({ onQuit }: GameLayoutProps) {
  const mode = useGameStore((s) => s.mode);
  const roundsWon = useGameStore((s) => s.roundsWon);
  const soloCompletedCount = useGameStore((s) => s.soloCompletedWords.length);
  const myGuessCount = useGameStore((s) => s.myGuesses.length);
  const opponentGuessCount = useGameStore((s) => s.opponentGuesses.length);
  const phoneOpen = useGameStore((s) => s.phoneOpen);
  const togglePhone = useGameStore((s) => s.togglePhone);
  const isSolo = mode === 'solo';

  useEffectExpiry();

  const [controlMode, setControlMode] = useState<ControlMode>('ipad');
  const [lexiconOpen, setLexiconOpen] = useState(false);
  const [crashKey, setCrashKey] = useState<number | null>(null);
  const prevRoundsWonRef = useRef(roundsWon);
  const prevSoloCompletedRef = useRef(soloCompletedCount);
  const prevMyGuessRef = useRef(myGuessCount);
  const prevOppGuessRef = useRef(opponentGuessCount);

  const handleQuit = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    onQuit();
  }, [onQuit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const typing = tag === 'input' || tag === 'textarea';

      if (e.key.toLowerCase() === 'e') {
        if (typing) return;
        setControlMode((m) => (m === 'ipad' ? 'look' : 'ipad'));
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'q') {
        if (typing) return;
        handleQuit();
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'p') {
        if (typing) return;
        if (controlMode === 'ipad') {
          togglePhone();
          e.preventDefault();
        }
      }
      if (e.key.toLowerCase() === 'l') {
        if (typing) return;
        if (controlMode === 'ipad' && isSolo) {
          setLexiconOpen((open) => !open);
          e.preventDefault();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [controlMode, handleQuit, togglePhone, isSolo]);

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
    if (mode === 'solo') {
      if (soloCompletedCount > prevSoloCompletedRef.current) {
        setCrashKey(Date.now());
        playSfx('correct');
      }
      prevSoloCompletedRef.current = soloCompletedCount;
      return;
    }
    const prev = prevRoundsWonRef.current;
    if (prev.me !== roundsWon.me || prev.opponent !== roundsWon.opponent) {
      setCrashKey(Date.now());
      if (roundsWon.me > prev.me) playSfx('correct');
      else if (roundsWon.opponent > prev.opponent) playSfx('lose');
    }
    prevRoundsWonRef.current = roundsWon;
  }, [mode, roundsWon, soloCompletedCount]);

  useEffect(() => {
    if (myGuessCount > prevMyGuessRef.current) playSfx('guessSubmit');
    prevMyGuessRef.current = myGuessCount;
  }, [myGuessCount]);

  useEffect(() => {
    if (opponentGuessCount > prevOppGuessRef.current) playSfx('tick');
    prevOppGuessRef.current = opponentGuessCount;
  }, [opponentGuessCount]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden text-white select-none ${
        controlMode === 'look' ? 'cursor-none' : ''
      }`}
    >
      <PlayScene lookMode={controlMode === 'look'} />

      <button
        type="button"
        onClick={handleQuit}
        className="absolute top-3 right-3 z-30 pointer-events-auto font-mono text-[10px] tracking-[0.18em] uppercase text-white/55 hover:text-coral transition-colors px-2.5 py-1.5 border border-white/10 hover:border-coral/60 rounded backdrop-blur-sm bg-black/40"
      >
        Quit
      </button>

      {isSolo && controlMode === 'ipad' && (
        <div className="absolute top-3 left-3 z-30">
          <WordLexiconButton onClick={() => setLexiconOpen((open) => !open)} />
        </div>
      )}

      {lexiconOpen && isSolo && (
        <WordLexiconOverlay onClose={() => setLexiconOpen(false)} />
      )}

      {/* Gameplay UI projected onto the iPad screen face. */}
      <IpadOverlay controlMode={controlMode} />

      {/* Pull-out phone — manga storyboard, separate from iPad */}
      {controlMode === 'ipad' && (
        <PhoneShell open={phoneOpen} onToggle={togglePhone} />
      )}

      {/* Screen-level gameplay overlays (card effects, popups, round banner) */}
      <EffectOverlays />
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
            look around ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
              P
            </kbd>{' '}
            manga
            {isSolo && (
              <>
                {' '}
                ·{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
                  L
                </kbd>{' '}
                lexicon
              </>
            )}{' '}
            ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
              Q
            </kbd>{' '}
            quit
          </>
        ) : (
          <>
            Looking around · press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
              E
            </kbd>{' '}
            (or Esc) to use the iPad ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">
              Q
            </kbd>{' '}
            quit
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

function IpadOverlay({ controlMode }: { controlMode: ControlMode }) {
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
      <IpadUI />
    </div>
  );
}
