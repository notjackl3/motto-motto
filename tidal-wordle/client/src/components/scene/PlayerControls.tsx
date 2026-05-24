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
// Steering: how fast the player slides sideways when fully leaned, and how
// far they can drift from the centerline before being held back. The clamp
// keeps the player well inside PLAYER_SAFE_RADIUS / smallest env lane (7m).
const LATERAL_VEL_AT_FULL_LEAN = 7.0; // m/s
const LATERAL_OFFSET_CLAMP = 4.0; // m from centerline
// While focused on the iPad we ease the rider back to the centerline.
const RECENTER_EASE = 0.04;

interface Props {
  // True when the player is in look-mode (free-look). WASD only affects the
  // rider when active; in iPad mode keys are ignored and everything eases
  // back to baseline so the UI is calm.
  active: boolean;
}

export default function PlayerControls({ active }: Props) {
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

  useFrame((state, delta) => {
    // Only honor key state when in look mode. In iPad mode keys are
    // ignored entirely — everything eases back to baseline and the rider
    // re-centers so the focused UI isn't disturbed by stray key presses.
    const keys = active
      ? keysRef.current
      : { w: false, a: false, s: false, d: false };
    const targetSpeed = keys.w ? FORWARD_MAX : keys.s ? FORWARD_MIN : 1.0;
    const targetLean = keys.a ? -LEAN_ABS : keys.d ? LEAN_ABS : 0;

    const cur = useMovementStore.getState();
    const newSpeed = cur.forwardSpeedMul + (targetSpeed - cur.forwardSpeedMul) * SPEED_EASE;
    const newLean = cur.lateralLean + (targetLean - cur.lateralLean) * LEAN_EASE;
    const newDistance = cur.driftDistance + delta * newSpeed;

    let newLateral: number;
    if (active) {
      // Lean → lateral velocity → integrated lateral position.
      const lateralVel = (newLean / LEAN_ABS) * LATERAL_VEL_AT_FULL_LEAN;
      newLateral = cur.lateralPosition + lateralVel * delta;
      if (newLateral > LATERAL_OFFSET_CLAMP) newLateral = LATERAL_OFFSET_CLAMP;
      else if (newLateral < -LATERAL_OFFSET_CLAMP) newLateral = -LATERAL_OFFSET_CLAMP;
    } else {
      // Ease back to the centerline so the iPad UI is settled.
      newLateral = cur.lateralPosition + (0 - cur.lateralPosition) * RECENTER_EASE;
    }

    useMovementStore.setState({
      forwardSpeedMul: newSpeed,
      lateralLean: newLean,
      lateralPosition: newLateral,
      driftDistance: newDistance,
    });

    state.camera.position.x = newLateral;
  });

  return null;
}
