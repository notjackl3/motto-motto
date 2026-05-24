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
// obstacle in EnvironmentObjects drifts through the player's lane. Spikes a
// high-frequency multi-octave shake on pitch and roll that decays over
// ~0.7s. Waves themselves no longer trigger any extra tilt or shake — the
// only motion from the swell is the steady slope-based pitch/roll below.
const SHAKE_DURATION = 0.7;
const SHAKE_AMP = 0.22; // rad — pronounced jolt

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

    // Solid-object shake: pulled from the impact store. Fades linearly over
    // SHAKE_DURATION starting when the impact was triggered. Multi-octave
    // so it feels chaotic rather than sinusoidal. Gated by tilt intensity
    // so iPad mode stays rock-steady even if an obstacle drifts past.
    const impact = useImpactStore.getState();
    const sinceHit = t - impact.lastImpactAt;
    const shakeEnvelope =
      sinceHit >= 0 && sinceHit < SHAKE_DURATION
        ? (1 - sinceHit / SHAKE_DURATION) * impact.lastImpactStrength
        : 0;
    const shakeStrength = shakeEnvelope * SHAKE_AMP * easedTiltIntensity.current;
    const pitchShake =
      (Math.sin(t * 41.3) * 0.6 + Math.sin(t * 73.7) * 0.3 + Math.sin(t * 113) * 0.2) *
      shakeStrength;
    const rollShake =
      (Math.sin(t * 53.1) * 0.55 + Math.sin(t * 89.3) * 0.35 + Math.sin(t * 127) * 0.2) *
      shakeStrength;

    camera.rotation.order = 'YXZ';
    camera.rotation.x +=
      easedPitchOffset.current * easedTiltIntensity.current + pitchShake;
    camera.rotation.z =
      easedRoll.current * easedTiltIntensity.current + rollShake;
  });

  return null;
}
