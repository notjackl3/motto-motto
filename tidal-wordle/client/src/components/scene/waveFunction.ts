// Shared wave-surface function so Wave.tsx (vertex displacement) and Surfer.tsx
// (object placement) agree on the height at any given point.
//
// amplitude is in world units (1 in-game unit ≈ 1m).
// speed is a multiplier on time; 1.0 is the baseline.
export function waveHeightAt(
  x: number,
  z: number,
  timeSeconds: number,
  amplitude: number,
  speed: number,
): number {
  const t = timeSeconds * speed;
  const a = amplitude;
  // Two crossed sines + a higher-frequency ripple for character.
  const primary = Math.sin(x * 0.35 + t * 0.9) * a * 0.55;
  const secondary = Math.sin(z * 0.45 - t * 0.7) * a * 0.4;
  const ripple = Math.sin((x + z) * 0.9 + t * 1.8) * a * 0.08;
  return primary + secondary + ripple;
}

// First-person variant: long-wavelength swells that scroll toward the camera
// to sell "we're surfing forward through the wave". The wave pattern itself
// is static in world space — `timeSeconds * forwardSpeed` shifts the phase so
// it appears to roll past.
//
// Amplitude is tuned low enough that wave peaks can never climb above the
// player's eye height (which itself bobs up with the swell). Forward speed
// is high enough that the swell visibly rushes past the camera.
export const PLAY_FORWARD_SPEED = 14.0;
export const PLAY_AMPLITUDE_MULT = 3.4;

export function playWaveHeightAt(
  x: number,
  z: number,
  timeSeconds: number,
  amplitude: number,
  speed: number,
): number {
  const a = amplitude * PLAY_AMPLITUDE_MULT;
  const forward = timeSeconds * PLAY_FORWARD_SPEED * speed;
  const zEff = z + forward;
  // Big, slow primary swell — longer wavelength + stronger amplitude so the
  // surfer climbs tall crests and drops into real troughs.
  const swell = Math.sin(zEff * 0.085 + Math.sin(x * 0.05) * 0.8) * a * 0.95;
  // Cross-pattern secondary swell so the surface isn't a straight ridge.
  const cross = Math.sin(x * 0.16 + zEff * 0.2) * a * 0.4;
  // Higher-frequency chop for character on top of the swell.
  const chop = Math.sin(zEff * 0.55 + x * 0.7 + timeSeconds * 0.6) * a * 0.12;
  return swell + cross + chop;
}
