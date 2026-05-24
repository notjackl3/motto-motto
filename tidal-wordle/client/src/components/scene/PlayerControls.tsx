import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMovementStore } from '../../stores/movementStore';

// WASD movement.
//   W: accelerate (forwardSpeedMul → ~1.8)
//   S: brake (→ ~0.4)
//   A / D: lean left / right (lateralLean → -0.35 / +0.35)
// Neither / released: ease back to baseline (mul=1.0, lean=0).
//
// We accumulate a `driftDistance` from delta·speedMul so environment objects
// can wrap their z continuously even when the player's speed changes — they
// never jump when you tap W or S.
//
// WASD is suppressed while focus is in a text input so the Wordle guess
// box can take W/A/S/D as letters.

const FORWARD_MAX = 1.8;
const FORWARD_MIN = 0.4;
const LEAN_ABS = 0.38;
const SPEED_EASE = 0.08;
const LEAN_EASE = 0.12;

export default function PlayerControls() {
  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    function isInTextField(el: EventTarget | null): boolean {
      const t = el as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || t?.isContentEditable === true;
    }
    function onDown(e: KeyboardEvent) {
      if (isInTextField(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
        keysRef.current[k] = true;
        e.preventDefault();
      }
    }
    function onUp(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
        keysRef.current[k] = false;
      }
    }
    function onBlur() {
      keysRef.current = { w: false, a: false, s: false, d: false };
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useFrame((_, delta) => {
    const keys = keysRef.current;
    const targetSpeed = keys.w ? FORWARD_MAX : keys.s ? FORWARD_MIN : 1.0;
    const targetLean = keys.a ? -LEAN_ABS : keys.d ? LEAN_ABS : 0;

    const cur = useMovementStore.getState();
    const newSpeed = cur.forwardSpeedMul + (targetSpeed - cur.forwardSpeedMul) * SPEED_EASE;
    const newLean = cur.lateralLean + (targetLean - cur.lateralLean) * LEAN_EASE;
    const newDistance = cur.driftDistance + delta * newSpeed;

    useMovementStore.setState({
      forwardSpeedMul: newSpeed,
      lateralLean: newLean,
      driftDistance: newDistance,
    });
  });

  return null;
}
