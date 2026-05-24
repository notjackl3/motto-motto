import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTideData } from '../../hooks/useTideData';
import { useImpactStore } from '../../stores/impactStore';
import { playWaveHeightAt } from './waveFunction';

// Drives the camera's Y position + pitch + roll so the player rides the wave
// instead of the wave climbing into their face.
//
// Y tracks the local-neighborhood max of the swell so the surfer is always
// above any nearby crest — they never dip into a trough or get swallowed by
// a wave passing right next to them. Pitch and roll are driven from the
// wave slope (forward/back and left/right), giving real surf physics —
// nose-up climbing crests, nose-down dropping in, leaning into the side of
// the wave.
//
// IMPORTANT: this component must mount *after* MouseLookControls in the
// scene graph so its rotation writes win the frame (MouseLookControls sets
// rotation.z = 0 every frame and that would otherwise wipe our roll).

const BASE_EYE_Y = 1.8;
// In iPad mode the player has "stopped surfing" to focus on the screen,
// so we ease everything physical to ~0 — the world holds still while
// reading. In look mode the full surf physics kick in.
const BOB_INTENSITY_IPAD = 0.0;
const BOB_INTENSITY_LOOK = 0.78;
const TILT_INTENSITY_IPAD = 0.0;
const TILT_INTENSITY_LOOK = 1.0;
// How far ahead/behind/sides we sample the wave to estimate slope.
const SLOPE_PROBE = 2.5;
// Pitch/roll gains converting (meters of height / meter horizontal) to radians.
// Tuned gentler than before — most of the ride is a calm cruise; the drama
// comes from the impact spike below.
const PITCH_GAIN = 0.38;
const ROLL_GAIN = 0.5;
// Cap the steady tilt so the camera never flips into something disorienting.
const MAX_PITCH_OFFSET = 0.22; // ~13°
const MAX_ROLL = 0.26; // ~15°

// Object-collision shake: triggered via useImpactStore when a rock or other
// obstacle in EnvironmentObjects drifts through the player's lane.
//
// Notes on smoothness: the previous version used very high sine frequencies
// (40–127 rad/s) which alias at 60fps — each frame the sin value jumped by
// nearly a full cycle, producing visible glitchiness. We now combine
// lower-frequency sines (well under Nyquist) AND low-pass filter the result
// with a per-frame ease, so the shake reads as motion-blurred camera judder
// instead of teleporting rotations. Amplitude is reduced too so the impact
// is felt rather than seizure-inducing.
const SHAKE_DURATION = 0.9;
const SHAKE_AMP = 0.085; // rad — felt but smooth
const SHAKE_EASE = 0.32; // low-pass filter on the per-frame shake delta

interface Props {
  lookMode: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export default function SurfingMotion({ lookMode }: Props) {
  const { camera } = useThree();
  const { waveHeight, waveSpeed } = useTideData();
  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });
  const easedY = useRef(BASE_EYE_Y);
  const easedBobIntensity = useRef(BOB_INTENSITY_IPAD);
  const easedTiltIntensity = useRef(TILT_INTENSITY_IPAD);
  const easedPitchOffset = useRef(0);
  const easedRoll = useRef(0);
  const easedShakePitch = useRef(0);
  const easedShakeRoll = useRef(0);

  useFrame((state) => {
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;

    const t = state.clock.elapsedTime;
    const amp = animState.current.amplitude;
    const sp = animState.current.speed;

    // Sample wave at the player + 4 neighbors so we both ride the local max
    // (no sinking) and can estimate the slope under the board.
    const w = playWaveHeightAt(0, 0, t, amp, sp);
    const wF = playWaveHeightAt(0, SLOPE_PROBE, t, amp, sp);
    const wB = playWaveHeightAt(0, -SLOPE_PROBE, t, amp, sp);
    const wR = playWaveHeightAt(SLOPE_PROBE, 0, t, amp, sp);
    const wL = playWaveHeightAt(-SLOPE_PROBE, 0, t, amp, sp);
    const localMax = Math.max(w, wF, wB, wR, wL);

    const targetBob = lookMode ? BOB_INTENSITY_LOOK : BOB_INTENSITY_IPAD;
    const targetTilt = lookMode ? TILT_INTENSITY_LOOK : TILT_INTENSITY_IPAD;
    easedBobIntensity.current += (targetBob - easedBobIntensity.current) * 0.06;
    easedTiltIntensity.current += (targetTilt - easedTiltIntensity.current) * 0.06;

    // Y target: ride the neighborhood crest, never go below baseline. Plus a
    // small safety margin (0.4m) so even when smoothing lags behind a rapid
    // crest the player still clears it.
    const targetY = BASE_EYE_Y + Math.max(0, localMax) * easedBobIntensity.current + 0.4;
    easedY.current += (targetY - easedY.current) * 0.18;
    camera.position.y = easedY.current;

    // Slope estimates (height change per meter).
    const slopeZ = (wF - wB) / (2 * SLOPE_PROBE);
    const slopeX = (wR - wL) / (2 * SLOPE_PROBE);

    // Steady slope-based tilt only — no extra wave-hit boost.
    const targetPitch = clamp(
      slopeZ * PITCH_GAIN,
      -MAX_PITCH_OFFSET,
      MAX_PITCH_OFFSET,
    );
    const targetRoll = clamp(slopeX * ROLL_GAIN, -MAX_ROLL, MAX_ROLL);

    const tiltEase = lookMode ? 0.14 : 0.08;
    easedPitchOffset.current += (targetPitch - easedPitchOffset.current) * tiltEase;
    easedRoll.current += (targetRoll - easedRoll.current) * tiltEase;

    // Solid-object shake from the impact store. Smoothed via a per-frame
    // ease so even GPU stutter doesn't make the shake teleport — the
    // raw multi-sine target rides under Nyquist, and `easedShake` low-pass
    // filters whatever's left.
    const impact = useImpactStore.getState();
    const sinceHit = t - impact.lastImpactAt;
    // Quadratic envelope: hits hard immediately, eases out gently instead
    // of a hard linear cutoff.
    const fade =
      sinceHit >= 0 && sinceHit < SHAKE_DURATION
        ? Math.pow(1 - sinceHit / SHAKE_DURATION, 2) * impact.lastImpactStrength
        : 0;
    const shakeStrength = fade * SHAKE_AMP * easedTiltIntensity.current;

    // Lower-frequency oscillators (3–11 Hz), comfortably below Nyquist at 60fps.
    const rawShakePitch =
      (Math.sin(t * 19.2) * 0.55 +
        Math.sin(t * 38.4) * 0.3 +
        Math.sin(t * 67.1) * 0.18) *
      shakeStrength;
    const rawShakeRoll =
      (Math.cos(t * 21.1) * 0.55 +
        Math.cos(t * 41.7) * 0.3 +
        Math.cos(t * 72.3) * 0.18) *
      shakeStrength;

    easedShakePitch.current += (rawShakePitch - easedShakePitch.current) * SHAKE_EASE;
    easedShakeRoll.current += (rawShakeRoll - easedShakeRoll.current) * SHAKE_EASE;

    camera.rotation.order = 'YXZ';
    camera.rotation.x +=
      easedPitchOffset.current * easedTiltIntensity.current + easedShakePitch.current;
    camera.rotation.z =
      easedRoll.current * easedTiltIntensity.current + easedShakeRoll.current;
  });

  return null;
}
