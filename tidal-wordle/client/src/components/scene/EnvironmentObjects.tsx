import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useImpactStore } from '../../stores/impactStore';
import { useMovementStore } from '../../stores/movementStore';
import { useTideData } from '../../hooks/useTideData';
import { playWaveHeightAt } from './waveFunction';

// Water plane sits at this Y (matches PlayWave).
const WATER_LEVEL = -2.0;

// Shared wave parameters, updated each frame by <WaveSync/> at the root of
// EnvironmentObjects. Surface-floating children sample playWaveHeightAt
// with these so they ride the actual swell instead of an arbitrary sine.
const waveParams = { amplitude: 1.0, speed: 1.0 };

// Sample the wave Y in world coords at a given XZ. Caps amplitude on the
// trough side so a low buoy doesn't drop below the plane.
function waveYAt(x: number, z: number, t: number): number {
  return (
    WATER_LEVEL +
    playWaveHeightAt(x, z, t, waveParams.amplitude, waveParams.speed)
  );
}

// Ambient ocean life: rocks, dolphins, fish, sailboats, gulls.
//
// The player is stationary at world origin, but visually "moving forward".
// We sell that by drifting every environment object toward +Z (backward
// past the player) at a steady forward speed and wrapping objects back to
// far-ahead (-FAR_Z) once they slip past the camera. The player never
// touches any of these — spawn lanes are always at least PLAYER_SAFE_RADIUS
// away in XZ.

const FORWARD_DRIFT = 8.0; // m/s, matches the feel of the wave phase scroll
const PASS_THRESHOLD = 25; // z at which an object has gone behind the player
const SPAWN_FAR_Z = -220; // re-spawn here, far ahead of the player
const CYCLE = PASS_THRESHOLD - SPAWN_FAR_Z; // 245 m round-trip
const PLAYER_SAFE_RADIUS = 5;

// Wrap a base z (initial offset) by the global player drift so the object
// cycles from SPAWN_FAR_Z → PASS_THRESHOLD continuously.
//
// Reads `driftDistance` from the movement store (advanced each frame by
// PlayerControls at delta·forwardSpeedMul). The `_t` argument is kept so
// the dozens of existing callers don't need rewriting — its value is
// ignored. With this, pressing W actually moves the player past objects
// faster, and S slows the world to a crawl.
function driftedZ(baseZ: number, _t: number): number {
  const drift = useMovementStore.getState().driftDistance;
  const raw = baseZ + drift * FORWARD_DRIFT;
  const m = (((raw - SPAWN_FAR_Z) % CYCLE) + CYCLE) % CYCLE;
  return SPAWN_FAR_Z + m;
}

// ---------- Rocks ----------

interface Rock {
  baseZ: number;
  laneX: number;
  scale: number;
  rot: number;
  color: string;
}

// Mix of medium and large rocks — varied sizes so the seascape doesn't read
// as a uniform row of identical landmarks. Z and X spread so they never
// stack on top of each other in the viewport.
const ROCKS: Rock[] = [
  { baseZ: -22, laneX: -26, scale: 2.2, rot: 0.4, color: '#404040' },  // medium
  { baseZ: -50, laneX: 18, scale: 3.8, rot: 1.2, color: '#525252' },  // large
  { baseZ: -78, laneX: -34, scale: 2.4, rot: 0.8, color: '#3a3a3a' },  // medium
  { baseZ: -105, laneX: 28, scale: 4.2, rot: 1.5, color: '#484848' }, // large
  { baseZ: -130, laneX: -16, scale: 2.0, rot: -0.7, color: '#3f3f3f' }, // medium
  { baseZ: -158, laneX: 36, scale: 3.5, rot: 0.5, color: '#555' },    // large
  { baseZ: -182, laneX: -10, scale: 2.8, rot: 2.1, color: '#4f4f4f' }, // medium-large
  { baseZ: -210, laneX: 22, scale: 4.0, rot: 0.3, color: '#3a3a3a' }, // large
];

// Rocks sit on bedrock far below the water and DO NOT bob with the swell.
// The base extends far enough below WATER_LEVEL that it never floats —
// even when the player is deep in a wave trough. The base is also wider
// than the visible cap so the rock looks like a real outcropping rooted
// to the seafloor. Splash effects fire on whichever face the wave is
// hitting from.
const ROCK_BASE_Y = -22; // bedrock anchor — deep enough that even the lowest wave trough never exposes the base
const ROCK_SPLASH_PROBE = 1.6;
const ROCK_SPLASH_THRESHOLD = 0.45;

function Rock({ rock }: { rock: Rock }) {
  const ref = useRef<THREE.Group>(null);
  const splashFrontRef = useRef<THREE.Mesh>(null);
  const splashBackRef = useRef<THREE.Mesh>(null);
  const splashLeftRef = useRef<THREE.Mesh>(null);
  const splashRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(rock.baseZ, t);
    ref.current.position.x = rock.laneX;
    ref.current.position.z = z;
    ref.current.position.y = ROCK_BASE_Y;

    const sides: Array<[THREE.Mesh | null, number, number]> = [
      [splashFrontRef.current, 0, ROCK_SPLASH_PROBE],
      [splashBackRef.current, 0, -ROCK_SPLASH_PROBE],
      [splashRightRef.current, ROCK_SPLASH_PROBE, 0],
      [splashLeftRef.current, -ROCK_SPLASH_PROBE, 0],
    ];
    for (const [mesh, dx, dz] of sides) {
      if (!mesh) continue;
      const localWave = waveYAt(rock.laneX + dx, z + dz, t) - WATER_LEVEL;
      const over = localWave - ROCK_SPLASH_THRESHOLD;
      if (over > 0) {
        mesh.visible = true;
        const s = rock.scale * (0.5 + Math.min(1.4, over) * 0.7);
        mesh.scale.set(s, s * 0.6, s);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.min(0.85, 0.35 + over * 0.6);
      } else {
        mesh.visible = false;
      }
    }
  });

  // Single tapered rock body — wide base narrowing to a peak — so the rock
  // reads as ONE outcropping rather than three boulders stacked on top of
  // each other. A small outcropping fragment provides asymmetric character
  // without breaking the unified silhouette.
  const visibleAbove = rock.scale * 1.6 + 1.0;
  const topWorldY = WATER_LEVEL + visibleAbove;
  const totalH = topWorldY - ROCK_BASE_Y;
  const radiusTop = rock.scale * 0.7;
  const radiusMid = rock.scale * 1.4; // used for splash anchoring
  const radiusBase = rock.scale * 2.4;

  return (
    <group ref={ref} position={[rock.laneX, ROCK_BASE_Y, rock.baseZ]} rotation={[0, rock.rot, 0]}>
      {/* Single tapered body — chunky low-poly cylinder, wide base → narrow
          top. One mesh, no stacked pieces. */}
      <mesh castShadow receiveShadow position={[0, totalH / 2, 0]}>
        <cylinderGeometry args={[radiusTop, radiusBase, totalH, 7, 1]} />
        <meshStandardMaterial color={rock.color} flatShading roughness={0.92} />
      </mesh>
      {/* Asymmetric outcropping fragment near the top — breaks the symmetry
          of the main cylinder without adding a separate "stacked" silhouette. */}
      <mesh
        castShadow
        position={[radiusTop * 0.9, totalH - rock.scale * 0.9, rock.scale * 0.2]}
        rotation={[0.3, 0.7, 0.2]}
      >
        <dodecahedronGeometry args={[rock.scale * 0.55, 0]} />
        <meshStandardMaterial color={rock.color} flatShading roughness={0.9} />
      </mesh>
      {/* Mossy crown — sits at the top above any wave peak. */}
      <mesh position={[0, totalH - rock.scale * 0.25, 0]} castShadow>
        <dodecahedronGeometry args={[rock.scale * 0.5, 0]} />
        <meshStandardMaterial color="#2c5e36" flatShading />
      </mesh>
      {/* Splash foam on whichever face the wave is hitting. Anchored at the
          local water surface and at the rock's mid-radius (which is the
          width at the waterline). */}
      <mesh
        ref={splashFrontRef}
        position={[0, WATER_LEVEL - ROCK_BASE_Y + 0.3, radiusMid * 1.0]}
        visible={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.7} />
      </mesh>
      <mesh
        ref={splashBackRef}
        position={[0, WATER_LEVEL - ROCK_BASE_Y + 0.3, -radiusMid * 1.0]}
        visible={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.7} />
      </mesh>
      <mesh
        ref={splashRightRef}
        position={[radiusMid * 1.0, WATER_LEVEL - ROCK_BASE_Y + 0.3, 0]}
        visible={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.7} />
      </mesh>
      <mesh
        ref={splashLeftRef}
        position={[-radiusMid * 1.0, WATER_LEVEL - ROCK_BASE_Y + 0.3, 0]}
        visible={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ---------- Small floating rocks (boulders that bob on the wave surface) ----------

interface SmallRockTrack {
  baseZ: number;
  laneX: number;
  scale: number; // 0.4–1.0
  rot: number;
  color: string;
}

const SMALL_ROCKS: SmallRockTrack[] = [
  { baseZ: -14, laneX: 12, scale: 0.7, rot: 0.5, color: '#4a4a4a' },
  { baseZ: -32, laneX: -15, scale: 0.9, rot: 1.2, color: '#525252' },
  { baseZ: -62, laneX: 22, scale: 0.5, rot: 0.3, color: '#484848' },
  { baseZ: -88, laneX: -8, scale: 0.85, rot: -0.6, color: '#3f3f3f' },
  { baseZ: -115, laneX: 14, scale: 0.6, rot: 1.5, color: '#4f4f4f' },
  { baseZ: -142, laneX: -24, scale: 0.95, rot: 0.9, color: '#3a3a3a' },
  { baseZ: -168, laneX: 18, scale: 0.55, rot: 2.1, color: '#525252' },
  { baseZ: -195, laneX: -12, scale: 0.8, rot: 0.4, color: '#4a4a4a' },
];

function SmallRock({ rock }: { rock: SmallRockTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(rock.baseZ, t);
    ref.current.position.x = rock.laneX;
    ref.current.position.z = z;
    // Float partially submerged — origin sits a hair BELOW the water surface
    // so the bottom half of the boulder is always underwater. Top half is
    // visible.
    ref.current.position.y = waveYAt(rock.laneX, z, t) - rock.scale * 0.15;
    // Tilt slightly with the wave slope so the boulder rolls in the swell.
    const slopeX = waveYAt(rock.laneX + 0.5, z, t) - waveYAt(rock.laneX - 0.5, z, t);
    const slopeZ = waveYAt(rock.laneX, z + 0.5, t) - waveYAt(rock.laneX, z - 0.5, t);
    ref.current.rotation.z = rock.rot * 0.3 - slopeX * 0.4;
    ref.current.rotation.x = -slopeZ * 0.3;
    ref.current.rotation.y = rock.rot;
  });

  return (
    <group ref={ref} position={[rock.laneX, WATER_LEVEL, rock.baseZ]} rotation={[0, rock.rot, 0]}>
      <mesh castShadow>
        <dodecahedronGeometry args={[rock.scale, 0]} />
        <meshStandardMaterial color={rock.color} flatShading roughness={0.95} />
      </mesh>
      {/* Small mossy cap on top */}
      <mesh position={[0, rock.scale * 0.4, 0]} castShadow>
        <dodecahedronGeometry args={[rock.scale * 0.45, 0]} />
        <meshStandardMaterial color="#2c5e36" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Dolphins (jump arcs on top of the global drift) ----------

interface DolphinTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  jumpStart: number;
  jumpDuration: number;
  peakY: number;
  side: 1 | -1;
}

const DOLPHINS: DolphinTrack[] = [
  { baseZ: -25, laneX: -14, cycle: 7, jumpStart: 0, jumpDuration: 2.2, peakY: 1.6, side: -1 },
  { baseZ: -55, laneX: 16, cycle: 8, jumpStart: 3, jumpDuration: 2.0, peakY: 1.3, side: 1 },
  { baseZ: -80, laneX: -18, cycle: 6.5, jumpStart: 1, jumpDuration: 2.1, peakY: 1.5, side: -1 },
  { baseZ: -110, laneX: -10, cycle: 9, jumpStart: 6, jumpDuration: 2.5, peakY: 1.8, side: -1 },
  { baseZ: -135, laneX: 14, cycle: 7.8, jumpStart: 4, jumpDuration: 2.2, peakY: 1.5, side: 1 },
  { baseZ: -160, laneX: 20, cycle: 7.5, jumpStart: 2, jumpDuration: 2.1, peakY: 1.4, side: 1 },
  { baseZ: -195, laneX: -22, cycle: 8.5, jumpStart: 5, jumpDuration: 2.4, peakY: 1.7, side: -1 },
];

function Dolphin({ track }: { track: DolphinTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const baseZ = driftedZ(track.baseZ, t);
    const cyclePos = (t - track.jumpStart) % track.cycle;
    if (cyclePos < 0 || cyclePos > track.jumpDuration) {
      ref.current.position.set(track.laneX, -8, baseZ);
      return;
    }
    const u = cyclePos / track.jumpDuration;
    const y = -1.0 + Math.sin(u * Math.PI) * track.peakY;
    // Local arc along Z so the dolphin moves through its jump.
    const localDz = (u - 0.5) * 6;
    ref.current.position.set(track.laneX, y, baseZ + localDz);
    const pitch = Math.cos(u * Math.PI) * 0.7;
    ref.current.rotation.set(pitch, track.side === 1 ? 0 : Math.PI, 0);
  });

  return (
    <group ref={ref} position={[track.laneX, -8, track.baseZ]}>
      <mesh scale={[0.55, 0.55, 1.4]} castShadow>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshStandardMaterial color="#5a7a92" flatShading />
      </mesh>
      <mesh position={[0, -0.15, 0]} scale={[0.45, 0.35, 1.2]}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshStandardMaterial color="#c5d8e5" flatShading />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <coneGeometry args={[0.18, 0.5, 4]} />
        <meshStandardMaterial color="#445f78" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.32, 0.4, 4]} />
        <meshStandardMaterial color="#445f78" flatShading />
      </mesh>
      <mesh position={[0, -0.08, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.35, 8]} />
        <meshStandardMaterial color="#5a7a92" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Underwater fish (always submerged, cast a surface shadow) ----------

interface FishTrack {
  baseZ: number;
  laneX: number;
  depth: number; // meters below WATER_LEVEL
  swayAmp: number; // lateral sway amplitude in meters
  swaySpeed: number;
  color: string;
}

const FISH: FishTrack[] = [
  { baseZ: -10, laneX: 7, depth: 0.8, swayAmp: 1.2, swaySpeed: 1.1, color: '#d4b06a' },
  { baseZ: -22, laneX: -8, depth: 1.0, swayAmp: 1.0, swaySpeed: 1.3, color: '#a86c5a' },
  { baseZ: -35, laneX: -11, depth: 1.3, swayAmp: 0.9, swaySpeed: 0.9, color: '#c7a04f' },
  { baseZ: -50, laneX: 15, depth: 0.7, swayAmp: 1.4, swaySpeed: 1.4, color: '#e0c075' },
  { baseZ: -70, laneX: 12, depth: 0.6, swayAmp: 1.6, swaySpeed: 1.3, color: '#e0c075' },
  { baseZ: -85, laneX: -19, depth: 1.1, swayAmp: 1.2, swaySpeed: 1.0, color: '#5a8aa8' },
  { baseZ: -100, laneX: 18, depth: 0.9, swayAmp: 1.0, swaySpeed: 1.2, color: '#a86c5a' },
  { baseZ: -115, laneX: -6, depth: 1.4, swayAmp: 0.8, swaySpeed: 0.8, color: '#b89146' },
  { baseZ: -120, laneX: -16, depth: 1.0, swayAmp: 1.1, swaySpeed: 1.0, color: '#b89146' },
  { baseZ: -145, laneX: 9, depth: 1.2, swayAmp: 1.3, swaySpeed: 1.1, color: '#d4b06a' },
  { baseZ: -165, laneX: -14, depth: 0.8, swayAmp: 1.5, swaySpeed: 1.5, color: '#7898b8' },
  { baseZ: -180, laneX: 9, depth: 1.5, swayAmp: 1.4, swaySpeed: 0.95, color: '#5a8aa8' },
  { baseZ: -198, laneX: -10, depth: 1.0, swayAmp: 1.1, swaySpeed: 1.2, color: '#c7a04f' },
];

function Fish({ track }: { track: FishTrack }) {
  const ref = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    const x = track.laneX + Math.sin(t * track.swaySpeed) * track.swayAmp;
    // Stay below the wave surface — depth is below the local wave height.
    const surfaceY = waveYAt(x, z, t);
    const y = surfaceY - track.depth - Math.abs(Math.sin(t * 0.7)) * 0.2;
    ref.current.position.set(x, y, z);
    // Face the direction of lateral motion.
    const dxds = Math.cos(t * track.swaySpeed) * track.swayAmp * track.swaySpeed;
    ref.current.rotation.y = Math.atan2(dxds, 1);
    const tailWiggle = Math.sin(t * 6) * 0.25;
    ref.current.rotation.z = tailWiggle * 0.4;
    // Project a shadow ellipse onto the wave surface above the fish. Larger
    // and fainter the deeper the fish is.
    if (shadowRef.current) {
      shadowRef.current.position.set(x, surfaceY - 0.02, z);
      const spread = 0.35 + track.depth * 0.25;
      shadowRef.current.scale.set(spread, 1, spread * 1.8);
      const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.08, 0.4 - track.depth * 0.12);
    }
  });

  return (
    <>
      <group ref={ref} position={[track.laneX, -3, track.baseZ]}>
        <mesh scale={[0.22, 0.22, 0.5]}>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial
            color={track.color}
            flatShading
            emissive={track.color}
            emissiveIntensity={0.18}
          />
        </mesh>
        {/* Tail fin */}
        <mesh position={[0, 0, -0.22]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.12, 0.18, 3]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        {/* Top dorsal fin */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.05, 0.12, 3]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
      </group>
      {/* Surface shadow — a dark ellipse on the water plane above. */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[track.laneX, WATER_LEVEL, track.baseZ]}
      >
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#0a1822" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

// ---------- Sailboats (scale-varied) ----------

interface BoatTrack {
  baseZ: number;
  laneX: number;
  scale: number;
  hullColor: string;
  sailColor: string;
}

const BOATS: BoatTrack[] = [
  { baseZ: -75, laneX: 35, scale: 1.0, hullColor: '#8a4a2a', sailColor: '#ffffff' },
  { baseZ: -150, laneX: -40, scale: 0.7, hullColor: '#6a3a22', sailColor: '#f5e9d0' },
  { baseZ: -110, laneX: 52, scale: 1.4, hullColor: '#a85a30', sailColor: '#e8d8b0' },
];

function Boat({ track }: { track: BoatTrack }) {
  const ref = useRef<THREE.Group>(null);
  const s = track.scale;
  // Hull half-submerged: center sits just above water so the bottom of the
  // hull (and the keel cone) are underwater while deck + cabin stay visible.
  const DRAFT = 0.25 * s;
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    ref.current.position.y = waveYAt(track.laneX, z, t) + DRAFT;
    const slopeX =
      waveYAt(track.laneX + 1.5, z, t) - waveYAt(track.laneX - 1.5, z, t);
    const slopeZ = waveYAt(track.laneX, z + 1.5, t) - waveYAt(track.laneX, z - 1.5, t);
    ref.current.rotation.z = -slopeX * 0.25;
    ref.current.rotation.x = -slopeZ * 0.18;
  });

  return (
    <group ref={ref} position={[track.laneX, -0.6, track.baseZ]}>
      <mesh castShadow>
        <boxGeometry args={[4 * s, 0.8 * s, 1.4 * s]} />
        <meshStandardMaterial color={track.hullColor} flatShading />
      </mesh>
      <mesh position={[0, -0.5 * s, 0]}>
        <coneGeometry args={[0.9 * s, 1.4 * s, 4]} />
        <meshStandardMaterial color="#6a3820" flatShading />
      </mesh>
      <mesh position={[-0.3 * s, 0.7 * s, 0]} castShadow>
        <boxGeometry args={[1.6 * s, 0.7 * s, 1.0 * s]} />
        <meshStandardMaterial color="#f0e0c0" flatShading />
      </mesh>
      <mesh position={[0.4 * s, 2.4 * s, 0]} castShadow>
        <cylinderGeometry args={[0.06 * s, 0.06 * s, 3.4 * s, 8]} />
        <meshStandardMaterial color="#5a3520" flatShading />
      </mesh>
      <mesh position={[0.4 * s, 2.4 * s, 0]} castShadow>
        <coneGeometry args={[1.1 * s, 2.6 * s, 3]} />
        <meshStandardMaterial color={track.sailColor} flatShading side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---------- Speedboats (small, fast, with wake) ----------

interface SpeedboatTrack {
  baseZ: number;
  laneX: number;
  color: string;
}

const SPEEDBOATS: SpeedboatTrack[] = [
  { baseZ: -30, laneX: -26, color: '#e8c84a' },
  { baseZ: -140, laneX: 28, color: '#3a8ad0' },
];

function Speedboat({ track }: { track: SpeedboatTrack }) {
  const ref = useRef<THREE.Group>(null);
  const wakeRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Half-submerged speedboat: capsule center sits just above water.
    ref.current.position.y = waveYAt(track.laneX, z, t) + 0.05;
    const slopeX = waveYAt(track.laneX + 1, z, t) - waveYAt(track.laneX - 1, z, t);
    ref.current.rotation.z = -slopeX * 0.4;
    // Nose-up planing pose — boats run with the bow lifted at speed.
    ref.current.rotation.y = Math.PI / 2; // orient along Z so bow faces +Z
    ref.current.rotation.x = -0.15;
    if (wakeRef.current) {
      wakeRef.current.position.set(track.laneX, WATER_LEVEL + 0.02, z + 2.5);
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      wakeRef.current.scale.set(2.4 * pulse, 1, 5 * pulse);
    }
  });

  return (
    <>
      <group ref={ref} position={[track.laneX, -0.6, track.baseZ]}>
        {/* Curved hull — capsule lying horizontally along Z. */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.32, 2.0, 4, 12]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        {/* Sharper bow taper extending forward. */}
        <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.32, 0.7, 12]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        {/* Hull dark waterline stripe */}
        <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.33, 2.0, 4, 12]} />
          <meshStandardMaterial color="#1a1a1a" flatShading />
        </mesh>
        {/* Flat deck on top of the hull */}
        <mesh position={[0, 0.2, -0.1]}>
          <boxGeometry args={[0.78, 0.04, 1.8]} />
          <meshStandardMaterial color="#e8e0c8" flatShading />
        </mesh>
        {/* Windshield wrapping over the cockpit */}
        <mesh position={[0, 0.45, 0.4]} rotation={[0.4, 0, 0]} scale={[0.85, 0.6, 1.0]}>
          <sphereGeometry args={[0.4, 10, 8]} />
          <meshStandardMaterial
            color="#5a8ab0"
            transparent
            opacity={0.5}
            flatShading
          />
        </mesh>
        {/* Driver figure */}
        <mesh position={[0, 0.5, 0.1]} castShadow>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial color="#f0caa0" flatShading />
        </mesh>
        {/* Outboard motor mounted on the transom */}
        <mesh position={[0, 0.15, -1.2]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.25, 0.45, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" flatShading />
        </mesh>
        {/* Propeller shaft below motor */}
        <mesh position={[0, -0.05, -1.25]}>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 6]} />
          <meshStandardMaterial color="#3a3a3a" flatShading />
        </mesh>
      </group>
      {/* Foam wake trail behind the boat */}
      <mesh ref={wakeRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45} />
      </mesh>
    </>
  );
}

// ---------- Kayaks (small single-person craft) ----------

interface KayakTrack {
  baseZ: number;
  laneX: number;
  color: string;
}

const KAYAKS: KayakTrack[] = [
  { baseZ: -25, laneX: 9, color: '#c8552a' },
  { baseZ: -95, laneX: -11, color: '#5ac850' },
  { baseZ: -180, laneX: 11, color: '#3a78d0' },
];

function Kayak({ track }: { track: KayakTrack }) {
  const ref = useRef<THREE.Group>(null);
  const paddleRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Half-submerged kayak: capsule sits with bottom under water.
    ref.current.position.y = waveYAt(track.laneX, z, t) - 0.02;
    const slopeX = waveYAt(track.laneX + 0.6, z, t) - waveYAt(track.laneX - 0.6, z, t);
    const slopeZ = waveYAt(track.laneX, z + 0.6, t) - waveYAt(track.laneX, z - 0.6, t);
    ref.current.rotation.z = -slopeX * 0.6;
    ref.current.rotation.x = -slopeZ * 0.4;
    if (paddleRef.current) {
      paddleRef.current.rotation.z = Math.sin(t * 2.4) * 0.9;
    }
  });

  return (
    <group ref={ref} position={[track.laneX, -1.5, track.baseZ]}>
      {/* Narrow hull — capsule shape */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.22, 1.6, 4, 8]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
      {/* Cockpit hole */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
        <meshStandardMaterial color="#1a1a1a" flatShading />
      </mesh>
      {/* Paddler torso */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color="#e25a3a" flatShading />
      </mesh>
      {/* Paddler head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#f0caa0" flatShading />
      </mesh>
      {/* Paddle */}
      <mesh ref={paddleRef} position={[0, 0.4, 0]}>
        <boxGeometry args={[0.05, 1.4, 0.05]} />
        <meshStandardMaterial color="#5a3520" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Gulls (circle pattern + drift) ----------

interface GullTrack {
  baseZ: number;
  centerX: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

const GULLS: GullTrack[] = [
  { baseZ: -15, centerX: -10, radius: 5, height: 6, speed: 0.5, phase: 0.5 },
  { baseZ: -25, centerX: -8, radius: 6, height: 7, speed: 0.4, phase: 0 },
  { baseZ: -55, centerX: 15, radius: 8, height: 9, speed: 0.3, phase: 1.5 },
  { baseZ: -70, centerX: -22, radius: 6, height: 8, speed: 0.45, phase: 2.2 },
  { baseZ: -95, centerX: 0, radius: 5, height: 8, speed: 0.5, phase: 3 },
  { baseZ: -120, centerX: 22, radius: 7, height: 11, speed: 0.32, phase: 1.0 },
  { baseZ: -155, centerX: -18, radius: 7, height: 10, speed: 0.35, phase: 2 },
  { baseZ: -180, centerX: 16, radius: 9, height: 9, speed: 0.28, phase: 0.7 },
  { baseZ: -210, centerX: -12, radius: 6, height: 11, speed: 0.42, phase: 2.7 },
];

function Gull({ track }: { track: GullTrack }) {
  const ref = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + track.phase;
    const angle = t * track.speed;
    const centerZ = driftedZ(track.baseZ, state.clock.elapsedTime);
    const x = track.centerX + Math.cos(angle) * track.radius;
    const z = centerZ + Math.sin(angle) * track.radius;
    ref.current.position.set(x, track.height + Math.sin(t * 0.7) * 0.4, z);
    ref.current.rotation.y = -angle - Math.PI / 2;
    const flap = Math.sin(t * 5) * 0.6;
    if (wingLRef.current) wingLRef.current.rotation.z = flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -flap;
  });

  return (
    <group ref={ref} position={[track.centerX, track.height, track.baseZ]}>
      <mesh scale={[0.3, 0.25, 0.6]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
      <mesh position={[0, 0.05, -0.35]} scale={[0.18, 0.18, 0.2]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
      <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshStandardMaterial color="#ffb84a" flatShading />
      </mesh>
      <mesh ref={wingLRef} position={[-0.05, 0, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.25]} />
        <meshStandardMaterial color="#f4f4f4" flatShading />
      </mesh>
      <mesh ref={wingRRef} position={[0.05, 0, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.25]} />
        <meshStandardMaterial color="#f4f4f4" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Whales (slow surface swim, rare breach) ----------

interface WhaleTrack {
  baseZ: number;
  laneX: number;
  breachCycle: number;
  breachPhase: number;
  scale: number;
}

const WHALES: WhaleTrack[] = [
  { baseZ: -100, laneX: -32, breachCycle: 22, breachPhase: 4, scale: 1.0 },
  { baseZ: -185, laneX: 30, breachCycle: 26, breachPhase: 12, scale: 1.2 },
];

function Whale({ track }: { track: WhaleTrack }) {
  const ref = useRef<THREE.Group>(null);
  const sprayRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const baseZ = driftedZ(track.baseZ, t);
    const cyclePos = (t + track.breachPhase) % track.breachCycle;
    const breachDur = 3.0;
    let y = -1.6;
    let pitch = 0;
    if (cyclePos < breachDur) {
      const u = cyclePos / breachDur;
      y = -1.6 + Math.sin(u * Math.PI) * 3.0;
      pitch = Math.cos(u * Math.PI) * 0.9;
    }
    ref.current.position.set(track.laneX, y, baseZ);
    ref.current.rotation.x = pitch;
    if (tailRef.current) {
      tailRef.current.rotation.x = Math.sin(t * 1.6) * 0.25;
    }
    // Blow-hole spray pulses every few seconds while at surface.
    const sprayPhase = (t * 0.5) % 1;
    if (sprayRef.current) {
      const surfacing = cyclePos > breachDur;
      const visible = surfacing && sprayPhase < 0.3;
      sprayRef.current.visible = visible;
      sprayRef.current.scale.setScalar(visible ? 0.4 + sprayPhase * 2 : 0.01);
    }
  });

  const s = track.scale;
  return (
    <group ref={ref} position={[track.laneX, -1.6, track.baseZ]}>
      <mesh scale={[1.5 * s, 1.1 * s, 4.2 * s]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#3a4a5a" flatShading roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.4 * s, 0]} scale={[1.3 * s, 0.7 * s, 3.6 * s]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#9ab1be" flatShading />
      </mesh>
      <mesh ref={tailRef} position={[0, 0.1 * s, -2.4 * s]}>
        <boxGeometry args={[2.4 * s, 0.15 * s, 0.6 * s]} />
        <meshStandardMaterial color="#3a4a5a" flatShading />
      </mesh>
      <mesh position={[0, 0.8 * s, 1.6 * s]} ref={sprayRef}>
        <coneGeometry args={[0.4, 1.6, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.55}
          flatShading
        />
      </mesh>
    </group>
  );
}

// ---------- Sea turtles ----------

interface TurtleTrack {
  baseZ: number;
  laneX: number;
  phase: number;
}

const TURTLES: TurtleTrack[] = [
  { baseZ: -30, laneX: 16, phase: 1.2 },
  { baseZ: -50, laneX: -18, phase: 0 },
  { baseZ: -75, laneX: 24, phase: 3.5 },
  { baseZ: -125, laneX: 22, phase: 2.5 },
  { baseZ: -150, laneX: -14, phase: 1.7 },
  { baseZ: -178, laneX: 12, phase: 0.8 },
  { baseZ: -195, laneX: -26, phase: 4 },
];

function Turtle({ track }: { track: TurtleTrack }) {
  const ref = useRef<THREE.Group>(null);
  const flipperFL = useRef<THREE.Mesh>(null);
  const flipperFR = useRef<THREE.Mesh>(null);
  const flipperBL = useRef<THREE.Mesh>(null);
  const flipperBR = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const ct = state.clock.elapsedTime;
    const t = ct + track.phase;
    const x = track.laneX + Math.sin(t * 0.4) * 0.6;
    const z = driftedZ(track.baseZ, ct);
    ref.current.position.x = x;
    ref.current.position.z = z;
    // Half-submerged turtle — shell visible above water, body below.
    ref.current.position.y = waveYAt(x, z, ct) + 0.1;
    const slopeX = waveYAt(x + 0.7, z, ct) - waveYAt(x - 0.7, z, ct);
    const slopeZ = waveYAt(x, z + 0.7, ct) - waveYAt(x, z - 0.7, ct);
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.25;
    ref.current.rotation.z = -slopeX * 0.4;
    ref.current.rotation.x = -slopeZ * 0.4;
    const paddle = Math.sin(t * 2.2) * 0.6;
    if (flipperFL.current) flipperFL.current.rotation.z = paddle;
    if (flipperFR.current) flipperFR.current.rotation.z = -paddle;
    if (flipperBL.current) flipperBL.current.rotation.z = -paddle * 0.6;
    if (flipperBR.current) flipperBR.current.rotation.z = paddle * 0.6;
  });

  return (
    <group ref={ref} position={[track.laneX, -1.4, track.baseZ]}>
      <mesh castShadow>
        <sphereGeometry args={[0.7, 12, 8]} />
        <meshStandardMaterial color="#3d6b4a" flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0]} scale={[1.05, 0.35, 1.1]}>
        <sphereGeometry args={[0.7, 12, 8]} />
        <meshStandardMaterial color="#5a8a55" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.75]} scale={[0.35, 0.3, 0.45]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color="#6a8a4a" flatShading />
      </mesh>
      <mesh ref={flipperFL} position={[-0.55, 0, 0.4]}>
        <boxGeometry args={[0.6, 0.08, 0.3]} />
        <meshStandardMaterial color="#3d6b4a" flatShading />
      </mesh>
      <mesh ref={flipperFR} position={[0.55, 0, 0.4]}>
        <boxGeometry args={[0.6, 0.08, 0.3]} />
        <meshStandardMaterial color="#3d6b4a" flatShading />
      </mesh>
      <mesh ref={flipperBL} position={[-0.45, 0, -0.45]}>
        <boxGeometry args={[0.4, 0.08, 0.25]} />
        <meshStandardMaterial color="#3d6b4a" flatShading />
      </mesh>
      <mesh ref={flipperBR} position={[0.45, 0, -0.45]}>
        <boxGeometry args={[0.4, 0.08, 0.25]} />
        <meshStandardMaterial color="#3d6b4a" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Shark fins (just the dorsal slicing through water) ----------

interface SharkTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  phase: number;
  amplitude: number;
}

const SHARKS: SharkTrack[] = [
  { baseZ: -65, laneX: 11, cycle: 14, phase: 0, amplitude: 4 },
  { baseZ: -145, laneX: -13, cycle: 16, phase: 5, amplitude: 5 },
];

function Shark({ track }: { track: SharkTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const baseZ = driftedZ(track.baseZ, t);
    // S-curve weave on top of forward drift.
    const wPos = ((t + track.phase) % track.cycle) / track.cycle;
    const x = track.laneX + Math.sin(wPos * Math.PI * 2) * track.amplitude;
    const yaw = Math.cos(wPos * Math.PI * 2) * 0.35;
    ref.current.position.set(x, -1.55 + Math.sin(t * 1.4) * 0.04, baseZ);
    ref.current.rotation.y = yaw;
  });

  return (
    <group ref={ref} position={[track.laneX, -1.55, track.baseZ]}>
      {/* Dorsal fin — the only visible part above water. */}
      <mesh castShadow>
        <coneGeometry args={[0.18, 0.65, 3]} />
        <meshStandardMaterial color="#3a4754" flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.6, 0.55, 0.2]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color="#3a4754" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Pelicans (descend from sky, dive into water) ----------

interface PelicanTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  phase: number;
}

const PELICANS: PelicanTrack[] = [
  { baseZ: -40, laneX: 18, cycle: 11, phase: 0 },
  { baseZ: -115, laneX: -22, cycle: 13, phase: 4 },
];

function Pelican({ track }: { track: PelicanTrack }) {
  const ref = useRef<THREE.Group>(null);
  const splashRef = useRef<THREE.Mesh>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const baseZ = driftedZ(track.baseZ, t);
    const cyclePos = ((t + track.phase) % track.cycle) / track.cycle;
    // Hover high, then dive at u=0.5..0.7, then climb out.
    let y: number;
    let pitch = 0;
    if (cyclePos < 0.5) {
      y = 8 + Math.sin(t * 1.5) * 0.4;
    } else if (cyclePos < 0.7) {
      const u = (cyclePos - 0.5) / 0.2;
      y = 8 - u * 9.5;
      pitch = -1.1;
    } else {
      const u = (cyclePos - 0.7) / 0.3;
      y = -1.5 + u * 9.5;
      pitch = 0.5 + (1 - u) * 0.4;
    }
    ref.current.position.set(track.laneX, y, baseZ);
    ref.current.rotation.x = pitch;
    const flap = Math.sin(t * 6) * 0.5;
    if (wingLRef.current) wingLRef.current.rotation.z = flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -flap;
    // Splash ring at the dive impact.
    if (splashRef.current) {
      const impactPhase = Math.abs(cyclePos - 0.7);
      if (impactPhase < 0.05) {
        splashRef.current.visible = true;
        splashRef.current.position.set(track.laneX, -1.95, baseZ);
        const s = 0.3 + impactPhase * 14;
        splashRef.current.scale.set(s, 1, s);
      } else {
        splashRef.current.visible = false;
      }
    }
  });

  return (
    <>
      <group ref={ref} position={[track.laneX, 8, track.baseZ]}>
        <mesh scale={[0.4, 0.35, 0.9]} castShadow>
          <sphereGeometry args={[0.5, 10, 8]} />
          <meshStandardMaterial color="#d9c8a0" flatShading />
        </mesh>
        <mesh position={[0, 0.05, 0.6]} scale={[0.3, 0.3, 0.4]}>
          <sphereGeometry args={[0.4, 10, 8]} />
          <meshStandardMaterial color="#e8d8b0" flatShading />
        </mesh>
        <mesh position={[0, -0.05, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.5, 4]} />
          <meshStandardMaterial color="#ffae4a" flatShading />
        </mesh>
        <mesh ref={wingLRef} position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.9, 0.04, 0.4]} />
          <meshStandardMaterial color="#b5a070" flatShading />
        </mesh>
        <mesh ref={wingRRef} position={[0.1, 0, 0]}>
          <boxGeometry args={[0.9, 0.04, 0.4]} />
          <meshStandardMaterial color="#b5a070" flatShading />
        </mesh>
      </group>
      <mesh ref={splashRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} flatShading />
      </mesh>
    </>
  );
}

// ---------- Big fish (tuna / marlin-sized, swim singly under surface) ----------

interface BigFishTrack {
  baseZ: number;
  laneX: number;
  depth: number;
  swayAmp: number;
  swaySpeed: number;
  scale: number;
  color: string;
}

const BIG_FISH: BigFishTrack[] = [
  { baseZ: -60, laneX: 6, depth: 1.6, swayAmp: 2.2, swaySpeed: 0.7, scale: 1.0, color: '#3a6a8a' },
  { baseZ: -150, laneX: -10, depth: 2.2, swayAmp: 1.8, swaySpeed: 0.55, scale: 1.4, color: '#2c5078' },
  { baseZ: -210, laneX: 12, depth: 1.8, swayAmp: 2.0, swaySpeed: 0.6, scale: 0.9, color: '#4a7898' },
];

function BigFish({ track }: { track: BigFishTrack }) {
  const ref = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    const x = track.laneX + Math.sin(t * track.swaySpeed) * track.swayAmp;
    const surfaceY = waveYAt(x, z, t);
    ref.current.position.set(x, surfaceY - track.depth, z);
    const dxds = Math.cos(t * track.swaySpeed) * track.swayAmp * track.swaySpeed;
    ref.current.rotation.y = Math.atan2(dxds, 1);
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 5) * 0.4;
    if (shadowRef.current) {
      shadowRef.current.position.set(x, surfaceY - 0.02, z);
      const spread = track.scale * (0.7 + track.depth * 0.25);
      shadowRef.current.scale.set(spread, 1, spread * 2.2);
      const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.12, 0.45 - track.depth * 0.1);
    }
  });

  const s = track.scale;
  return (
    <>
      <group ref={ref} position={[track.laneX, -4, track.baseZ]}>
        {/* Streamlined body */}
        <mesh scale={[0.45 * s, 0.4 * s, 1.2 * s]}>
          <sphereGeometry args={[0.7, 10, 8]} />
          <meshStandardMaterial color={track.color} flatShading roughness={0.6} />
        </mesh>
        {/* Pale belly */}
        <mesh position={[0, -0.15 * s, 0]} scale={[0.42 * s, 0.18 * s, 1.1 * s]}>
          <sphereGeometry args={[0.7, 10, 8]} />
          <meshStandardMaterial color="#c8d8e0" flatShading />
        </mesh>
        {/* Dorsal fin */}
        <mesh position={[0, 0.35 * s, 0.1 * s]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.08 * s, 0.45 * s, 3]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        {/* Tail */}
        <mesh ref={tailRef} position={[0, 0, -0.85 * s]}>
          <coneGeometry args={[0.3 * s, 0.5 * s, 3]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        {/* Pectoral fins */}
        <mesh position={[-0.35 * s, -0.1 * s, 0.2 * s]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.35 * s, 0.04 * s, 0.18 * s]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        <mesh position={[0.35 * s, -0.1 * s, 0.2 * s]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.35 * s, 0.04 * s, 0.18 * s]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
      </group>
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[track.laneX, WATER_LEVEL, track.baseZ]}
      >
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#0a1822" transparent opacity={0.4} />
      </mesh>
    </>
  );
}

// ---------- Tropical fish (small bright reef fish near surface) ----------

interface TropicalFishTrack {
  baseZ: number;
  laneX: number;
  depth: number;
  swayAmp: number;
  swaySpeed: number;
  body: string;
  stripe: string;
}

const TROPICAL_FISH: TropicalFishTrack[] = [
  { baseZ: -20, laneX: -7, depth: 0.7, swayAmp: 0.8, swaySpeed: 1.6, body: '#f0a838', stripe: '#202020' },
  { baseZ: -85, laneX: 14, depth: 0.6, swayAmp: 0.9, swaySpeed: 1.8, body: '#e84a78', stripe: '#fff080' },
  { baseZ: -160, laneX: -13, depth: 0.8, swayAmp: 0.7, swaySpeed: 1.4, body: '#5ad0a8', stripe: '#1a3a3a' },
  { baseZ: -195, laneX: 6, depth: 0.5, swayAmp: 1.0, swaySpeed: 2.0, body: '#a868f0', stripe: '#fff8f8' },
];

function TropicalFish({ track }: { track: TropicalFishTrack }) {
  const ref = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    const x = track.laneX + Math.sin(t * track.swaySpeed) * track.swayAmp;
    const surfaceY = waveYAt(x, z, t);
    ref.current.position.set(x, surfaceY - track.depth, z);
    const dxds = Math.cos(t * track.swaySpeed) * track.swayAmp * track.swaySpeed;
    ref.current.rotation.y = Math.atan2(dxds, 1);
    ref.current.rotation.z = Math.sin(t * 8) * 0.2;
    if (shadowRef.current) {
      shadowRef.current.position.set(x, surfaceY - 0.02, z);
      const spread = 0.2 + track.depth * 0.2;
      shadowRef.current.scale.set(spread, 1, spread * 1.4);
      const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.1, 0.32 - track.depth * 0.12);
    }
  });

  return (
    <>
      <group ref={ref} position={[track.laneX, -3, track.baseZ]}>
        {/* Disc-shaped body */}
        <mesh scale={[0.18, 0.22, 0.08]}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial
            color={track.body}
            flatShading
            emissive={track.body}
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Vertical stripe down the side */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.08, 0.25, 0.02]} />
          <meshStandardMaterial color={track.stripe} flatShading />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[0.08, 0.25, 0.02]} />
          <meshStandardMaterial color={track.stripe} flatShading />
        </mesh>
        {/* Tail */}
        <mesh position={[0, 0, -0.2]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.1, 0.16, 3]} />
          <meshStandardMaterial color={track.body} flatShading />
        </mesh>
      </group>
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[track.laneX, WATER_LEVEL, track.baseZ]}
      >
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#0a1822" transparent opacity={0.25} />
      </mesh>
    </>
  );
}

// ---------- Sardine swarms (cloud of tiny fish glittering near surface) ----------

interface SwarmTrack {
  baseZ: number;
  laneX: number;
  depth: number;
}

const SWARMS: SwarmTrack[] = [
  { baseZ: -50, laneX: 16, depth: 0.5 },
  { baseZ: -190, laneX: -16, depth: 0.6 },
];

function Swarm({ track }: { track: SwarmTrack }) {
  const ref = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const members = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        ox: (Math.random() - 0.5) * 2.6,
        oy: (Math.random() - 0.5) * 0.4,
        oz: (Math.random() - 0.5) * 2.0,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    const cx = track.laneX + Math.sin(t * 0.4) * 1.5;
    const surfaceY = waveYAt(cx, z, t);
    ref.current.position.set(cx, surfaceY - track.depth, z);
    ref.current.children.forEach((c, i) => {
      const m = members[i];
      if (!m) return;
      c.position.set(
        m.ox + Math.sin(t * 2 + m.phase) * 0.2,
        m.oy + Math.cos(t * 1.5 + m.phase) * 0.1,
        m.oz + Math.sin(t * 1.8 + m.phase * 0.5) * 0.2,
      );
      c.rotation.y = Math.sin(t * 3 + m.phase) * 0.5;
    });
    if (shadowRef.current) {
      shadowRef.current.position.set(cx, surfaceY - 0.02, z);
      const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18;
    }
  });

  return (
    <>
      <group ref={ref} position={[track.laneX, -3, track.baseZ]}>
        {members.map((_, i) => (
          <mesh key={i} scale={[0.06, 0.06, 0.16]}>
            <sphereGeometry args={[0.4, 5, 4]} />
            <meshStandardMaterial
              color="#d8e0e8"
              flatShading
              emissive="#b8c8d8"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[track.laneX, WATER_LEVEL, track.baseZ]}
        scale={[2.6, 1, 2.0]}
      >
        <circleGeometry args={[1, 18]} />
        <meshBasicMaterial color="#0a1822" transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// ---------- Albatrosses (huge wingspan, soars low over water) ----------

interface AlbatrossTrack {
  baseZ: number;
  centerX: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

const ALBATROSSES: AlbatrossTrack[] = [
  { baseZ: -45, centerX: 20, radius: 14, height: 5, speed: 0.18, phase: 0 },
  { baseZ: -140, centerX: -22, radius: 18, height: 6, speed: 0.15, phase: 2.5 },
];

function Albatross({ track }: { track: AlbatrossTrack }) {
  const ref = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + track.phase;
    const angle = t * track.speed;
    const centerZ = driftedZ(track.baseZ, state.clock.elapsedTime);
    const x = track.centerX + Math.cos(angle) * track.radius;
    const z = centerZ + Math.sin(angle) * track.radius;
    ref.current.position.set(x, track.height + Math.sin(t * 0.4) * 0.6, z);
    ref.current.rotation.y = -angle - Math.PI / 2;
    // Slow, deep wing beats unlike the rapid gull flap.
    const flap = Math.sin(t * 1.4) * 0.35;
    if (wingLRef.current) wingLRef.current.rotation.z = flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -flap;
  });

  return (
    <group ref={ref} position={[track.centerX, track.height, track.baseZ]}>
      {/* Long slender body */}
      <mesh scale={[0.45, 0.4, 1.4]} castShadow>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#f4f4f4" flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.08, -0.7]} scale={[0.28, 0.26, 0.35]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#f4f4f4" flatShading />
      </mesh>
      {/* Beak — long and hooked */}
      <mesh position={[0, 0.06, -0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.22, 4]} />
        <meshStandardMaterial color="#ffa64a" flatShading />
      </mesh>
      {/* Black wing tips */}
      <mesh ref={wingLRef} position={[-0.1, 0, 0]}>
        <boxGeometry args={[1.8, 0.03, 0.35]} />
        <meshStandardMaterial color="#f4f4f4" flatShading />
      </mesh>
      <mesh ref={wingRRef} position={[0.1, 0, 0]}>
        <boxGeometry args={[1.8, 0.03, 0.35]} />
        <meshStandardMaterial color="#f4f4f4" flatShading />
      </mesh>
      {/* Wing tips dark */}
      <mesh position={[-0.95, 0.01, 0]} scale={[0.5, 0.05, 0.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2a2a2a" flatShading />
      </mesh>
      <mesh position={[0.95, 0.01, 0]} scale={[0.5, 0.05, 0.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2a2a2a" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Geese in V-formation (squadron flying past in formation) ----------

interface GooseFormationTrack {
  baseZ: number;
  laneX: number;
  height: number;
  direction: 1 | -1; // +1 = flying same direction as drift, -1 = against
}

const GOOSE_FORMATIONS: GooseFormationTrack[] = [
  { baseZ: -100, laneX: -8, height: 14, direction: 1 },
  { baseZ: -200, laneX: 10, height: 16, direction: -1 },
];

function GooseFormation({ track }: { track: GooseFormationTrack }) {
  const ref = useRef<THREE.Group>(null);
  const members = useMemo(
    () => [
      { dx: 0, dz: 0 }, // leader
      { dx: -0.9, dz: 1.2 },
      { dx: 0.9, dz: 1.2 },
      { dx: -1.8, dz: 2.4 },
      { dx: 1.8, dz: 2.4 },
      { dx: -2.7, dz: 3.6 },
      { dx: 2.7, dz: 3.6 },
    ],
    [],
  );
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX + Math.sin(t * 0.2) * 1.5;
    ref.current.position.y = track.height + Math.sin(t * 0.35) * 0.4;
    ref.current.position.z = driftedZ(track.baseZ, t);
    ref.current.rotation.y = track.direction === -1 ? Math.PI : 0;
    // Synchronized wing flap propagates back through the V.
    ref.current.children.forEach((c, i) => {
      const phase = t * 4 - i * 0.25;
      c.rotation.z = Math.sin(phase) * 0.2;
      // y bob per goose to break sync slightly
      const m = members[i];
      if (m) c.position.set(m.dx, Math.sin(phase * 0.5) * 0.15, m.dz);
    });
  });

  return (
    <group ref={ref} position={[track.laneX, track.height, track.baseZ]}>
      {members.map((m, i) => (
        <group key={i} position={[m.dx, 0, m.dz]}>
          {/* Body */}
          <mesh scale={[0.22, 0.2, 0.45]} castShadow>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color="#5a5040" flatShading />
          </mesh>
          {/* Long neck */}
          <mesh position={[0, 0.03, -0.3]} scale={[0.08, 0.08, 0.35]}>
            <sphereGeometry args={[0.4, 6, 6]} />
            <meshStandardMaterial color="#3a3020" flatShading />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.05, -0.45]} scale={[0.12, 0.12, 0.14]}>
            <sphereGeometry args={[0.4, 6, 6]} />
            <meshStandardMaterial color="#2a2418" flatShading />
          </mesh>
          {/* Wings — single bar across the body, will get flap rotation */}
          <mesh scale={[0.9, 0.02, 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4a4030" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Schools of fish (cluster jumps together) ----------

interface SchoolTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  phase: number;
  color: string;
}

const SCHOOLS: SchoolTrack[] = [
  { baseZ: -55, laneX: 5, cycle: 9, phase: 0, color: '#a0c4e8' },
  { baseZ: -135, laneX: -7, cycle: 10, phase: 4, color: '#b5d4f0' },
];

function School({ track }: { track: SchoolTrack }) {
  const ref = useRef<THREE.Group>(null);
  // Pre-compute member offsets so the cluster has a shape.
  const members = useMemo(() => {
    const arr: { dx: number; dz: number; dy: number; delay: number }[] = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        dx: (Math.random() - 0.5) * 1.4,
        dz: (Math.random() - 0.5) * 1.4,
        dy: Math.random() * 0.2,
        delay: Math.random() * 0.25,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Schools stay underwater — the cluster center hovers ~1m below the
    // local wave surface and individual members swim in a tight formation
    // with a slow oscillating depth.
    const surfaceY = waveYAt(track.laneX, z, t);
    ref.current.position.y = surfaceY - 1.0;
    ref.current.children.forEach((c, i) => {
      const m = members[i];
      if (!m) return;
      const depthOsc = Math.sin(t * 1.5 + m.delay * 10) * 0.25;
      c.position.set(m.dx, depthOsc + m.dy, m.dz);
      c.rotation.y = Math.sin(t * 1.2 + i) * 0.4;
      c.visible = true;
    });
  });

  return (
    <group ref={ref} position={[track.laneX, -3, track.baseZ]}>
      {members.map((_, i) => (
        <mesh key={i} scale={[0.14, 0.14, 0.32]}>
          <sphereGeometry args={[0.4, 6, 6]} />
          <meshStandardMaterial
            color={track.color}
            flatShading
            emissive={track.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Jellyfish (pulsing bells near surface) ----------

interface JellyTrack {
  baseZ: number;
  laneX: number;
  phase: number;
  color: string;
}

const JELLIES: JellyTrack[] = [
  { baseZ: -18, laneX: -16, phase: 2.1, color: '#f0a4d0' },
  { baseZ: -32, laneX: 9, phase: 0, color: '#f0a4d0' },
  { baseZ: -55, laneX: 18, phase: 1.0, color: '#c8a4f0' },
  { baseZ: -78, laneX: -9, phase: 1.5, color: '#c8a4f0' },
  { baseZ: -98, laneX: 22, phase: 0.4, color: '#f0c8a4' },
  { baseZ: -118, laneX: -12, phase: 2.8, color: '#a4d8f0' },
  { baseZ: -140, laneX: 13, phase: 3, color: '#f0b8c0' },
  { baseZ: -165, laneX: 8, phase: 1.9, color: '#f0a4d0' },
  { baseZ: -185, laneX: -7, phase: 0.3, color: '#c8a4f0' },
  { baseZ: -200, laneX: -11, phase: 0.7, color: '#a4d8f0' },
];

function Jelly({ track }: { track: JellyTrack }) {
  const ref = useRef<THREE.Group>(null);
  const bellRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const ct = state.clock.elapsedTime;
    const t = ct + track.phase;
    const x = track.laneX + Math.sin(t * 0.25) * 0.3;
    const z = driftedZ(track.baseZ, ct);
    ref.current.position.x = x;
    ref.current.position.z = z;
    // Half-submerged jellyfish — bell breaks the surface, tentacles dangle.
    ref.current.position.y = waveYAt(x, z, ct) - 0.05 + Math.sin(t * 0.6) * 0.1;
    const pulse = 1 + Math.sin(t * 1.8) * 0.18;
    if (bellRef.current) {
      bellRef.current.scale.set(pulse, 1 / pulse, pulse);
    }
  });

  return (
    <group ref={ref} position={[track.laneX, -1.7, track.baseZ]}>
      <mesh ref={bellRef} scale={[1, 1, 1]}>
        <sphereGeometry args={[0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={track.color}
          transparent
          opacity={0.55}
          flatShading
          emissive={track.color}
          emissiveIntensity={0.35}
        />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 6) * Math.PI * 2) * 0.25,
            -0.35,
            Math.sin((i / 6) * Math.PI * 2) * 0.25,
          ]}
        >
          <cylinderGeometry args={[0.02, 0.01, 0.5, 4]} />
          <meshStandardMaterial
            color={track.color}
            transparent
            opacity={0.5}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Buoys (bobbing markers with flashing light) ----------

interface BuoyTrack {
  baseZ: number;
  laneX: number;
  flashRate: number;
  color: string;
}

const BUOYS: BuoyTrack[] = [
  { baseZ: -42, laneX: 28, flashRate: 0.9, color: '#f0c040' },
  { baseZ: -85, laneX: 26, flashRate: 1.0, color: '#e85a4a' },
  { baseZ: -125, laneX: -30, flashRate: 1.2, color: '#3a8ad0' },
  { baseZ: -165, laneX: -28, flashRate: 0.8, color: '#f0c040' },
  { baseZ: -200, laneX: 32, flashRate: 1.1, color: '#e85a4a' },
];

function Buoy({ track }: { track: BuoyTrack }) {
  const ref = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Half-submerged buoy — float body straddles the water surface, stand
    // and flashing light visible above.
    ref.current.position.y = waveYAt(track.laneX, z, t) + 0.0;
    const slopeX = waveYAt(track.laneX + 0.5, z, t) - waveYAt(track.laneX - 0.5, z, t);
    const slopeZ = waveYAt(track.laneX, z + 0.5, t) - waveYAt(track.laneX, z - 0.5, t);
    ref.current.rotation.z = -slopeX * 0.6;
    ref.current.rotation.x = -slopeZ * 0.5;
    if (lightRef.current) {
      const on = Math.sin(t * track.flashRate * Math.PI) > 0.7;
      lightRef.current.emissiveIntensity = on ? 2.0 : 0.1;
    }
  });

  return (
    <group ref={ref} position={[track.laneX, -1.4, track.baseZ]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.55, 1.0, 10]} />
        <meshStandardMaterial color={track.color} flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 6]} />
        <meshStandardMaterial color="#2a2a2a" flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial
          ref={lightRef}
          color="#fff8a0"
          emissive="#fff080"
          emissiveIntensity={0.1}
          flatShading
        />
      </mesh>
    </group>
  );
}

// ---------- Driftwood logs ----------

interface DriftTrack {
  baseZ: number;
  laneX: number;
  rot: number;
  withGull: boolean;
}

const DRIFTWOOD: DriftTrack[] = [
  { baseZ: -22, laneX: -15, rot: 1.0, withGull: false },
  { baseZ: -42, laneX: 21, rot: 0.6, withGull: true },
  { baseZ: -78, laneX: -23, rot: -0.3, withGull: false },
  { baseZ: -118, laneX: -19, rot: 1.4, withGull: false },
  { baseZ: -145, laneX: 18, rot: 0.9, withGull: true },
  { baseZ: -188, laneX: 23, rot: -0.8, withGull: true },
  { baseZ: -212, laneX: -16, rot: 0.4, withGull: false },
];

function Driftwood({ track }: { track: DriftTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Half-submerged log — sits along the waterline, slightly sunk in.
    ref.current.position.y = waveYAt(track.laneX, z, t) - 0.05;
    const slopeX = waveYAt(track.laneX + 0.6, z, t) - waveYAt(track.laneX - 0.6, z, t);
    const slopeZ = waveYAt(track.laneX, z + 0.6, t) - waveYAt(track.laneX, z - 0.6, t);
    ref.current.rotation.z = track.rot - slopeX * 0.5;
    ref.current.rotation.x = -slopeZ * 0.4;
  });

  return (
    <group ref={ref} position={[track.laneX, -1.7, track.baseZ]} rotation={[0, track.rot, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.28, 2.6, 6]} />
        <meshStandardMaterial color="#6b4a2a" flatShading roughness={0.95} />
      </mesh>
      <mesh position={[0.6, 0.1, 0.1]} castShadow rotation={[0.3, 0.4, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.08, 0.6, 5]} />
        <meshStandardMaterial color="#5a3e22" flatShading />
      </mesh>
      {track.withGull && (
        <group position={[0.3, 0.32, 0]}>
          <mesh scale={[0.18, 0.16, 0.32]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
          <mesh position={[0, 0.06, -0.18]} scale={[0.1, 0.1, 0.12]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
          <mesh position={[0, 0.04, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.03, 0.08, 4]} />
            <meshStandardMaterial color="#ffb84a" flatShading />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---------- Kelp patches (swaying seaweed stalks) ----------

interface KelpTrack {
  baseZ: number;
  laneX: number;
}

const KELP: KelpTrack[] = [
  { baseZ: -15, laneX: 25 },
  { baseZ: -28, laneX: -21 },
  { baseZ: -52, laneX: 30 },
  { baseZ: -75, laneX: -29 },
  { baseZ: -82, laneX: 19 },
  { baseZ: -110, laneX: 28 },
  { baseZ: -148, laneX: -24 },
  { baseZ: -172, laneX: 30 },
  { baseZ: -198, laneX: 21 },
  { baseZ: -215, laneX: -27 },
];

function KelpPatch({ track }: { track: KelpTrack }) {
  const ref = useRef<THREE.Group>(null);
  const stalks = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        dx: (Math.random() - 0.5) * 1.4,
        dz: (Math.random() - 0.5) * 1.4,
        height: 1.0 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX;
    ref.current.position.z = driftedZ(track.baseZ, t);
    ref.current.children.forEach((c, i) => {
      const s = stalks[i];
      if (!s) return;
      c.rotation.z = Math.sin(t * 1.2 + s.phase) * 0.35;
      c.rotation.x = Math.cos(t * 0.9 + s.phase) * 0.25;
    });
  });

  return (
    <group ref={ref} position={[track.laneX, -2.0, track.baseZ]}>
      {stalks.map((s, i) => (
        <group key={i} position={[s.dx, 0, s.dz]}>
          <mesh position={[0, s.height * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.08, s.height, 5]} />
            <meshStandardMaterial color="#2a4a2a" flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0.08, s.height * 0.4, 0]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.25, 0.04, 0.12]} />
            <meshStandardMaterial color="#3a5e2a" flatShading />
          </mesh>
          <mesh position={[-0.08, s.height * 0.7, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.25, 0.04, 0.12]} />
            <meshStandardMaterial color="#3a5e2a" flatShading />
          </mesh>
          <mesh position={[0, s.height + 0.05, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#6b8a3a" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Splash bursts (random foam pops on the wave surface) ----------

interface SplashTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  phase: number;
}

const SPLASHES: SplashTrack[] = [
  { baseZ: -20, laneX: -16, cycle: 6, phase: 0 },
  { baseZ: -38, laneX: 11, cycle: 5, phase: 1.7 },
  { baseZ: -52, laneX: 17, cycle: 7, phase: 2.5 },
  { baseZ: -72, laneX: -22, cycle: 6.5, phase: 0.8 },
  { baseZ: -98, laneX: -13, cycle: 5.5, phase: 1.2 },
  { baseZ: -120, laneX: 19, cycle: 7.5, phase: 3 },
  { baseZ: -142, laneX: 14, cycle: 8, phase: 4 },
  { baseZ: -160, laneX: -8, cycle: 5.8, phase: 2 },
  { baseZ: -178, laneX: -10, cycle: 6.5, phase: 3.3 },
  { baseZ: -205, laneX: 16, cycle: 7, phase: 1.4 },
];

function Splash({ track }: { track: SplashTrack }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const dropRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.x = track.laneX;
    groupRef.current.position.z = driftedZ(track.baseZ, t);
    const cyclePos = ((t + track.phase) % track.cycle) / track.cycle;
    if (cyclePos > 0.18) {
      if (ringRef.current) ringRef.current.visible = false;
      if (dropRef.current) dropRef.current.visible = false;
      return;
    }
    const u = cyclePos / 0.18;
    if (ringRef.current) {
      ringRef.current.visible = true;
      const s = 0.2 + u * 2.8;
      ringRef.current.scale.set(s, 1, s);
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity = (1 - u) * 0.7;
    }
    if (dropRef.current) {
      dropRef.current.visible = u < 0.7;
      const y = -1.9 + Math.sin(u * Math.PI) * 0.8;
      dropRef.current.position.y = y;
      const s = (1 - u) * 0.25 + 0.1;
      dropRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef} position={[track.laneX, -1.95, track.baseZ]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.3, 0.5, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          flatShading
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={dropRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ---------- Hazard rocks (trigger impact shake on collision) ----------
//
// Unlike the ambient rocks above (which spawn well outside the player's
// safe radius), hazard rocks drift in a narrow lane around X=0 so they
// collide with the player. When a hazard crosses z=0 from in-front (-z) to
// behind (+z), we fire useImpactStore.triggerImpact with a strength based
// on how close the lane was to the player center.

interface HazardTrack {
  baseZ: number;
  laneX: number;
  scale: number;
  variant: 'jagged' | 'boulder' | 'spire';
  color: string;
}

const HAZARD_ROCKS: HazardTrack[] = [
  { baseZ: -40, laneX: 1.6, scale: 0.8, variant: 'jagged', color: '#525252' },
  { baseZ: -70, laneX: -0.8, scale: 0.9, variant: 'jagged', color: '#5a5a5a' },
  { baseZ: -100, laneX: 1.4, scale: 0.7, variant: 'boulder', color: '#4a4a4a' },
  { baseZ: -135, laneX: 1.2, scale: 1.0, variant: 'boulder', color: '#4a4a4a' },
  { baseZ: -165, laneX: -1.2, scale: 0.9, variant: 'spire', color: '#3a3a3a' },
  { baseZ: -188, laneX: 0.9, scale: 0.8, variant: 'jagged', color: '#4f4f4f' },
  { baseZ: -210, laneX: -0.3, scale: 1.2, variant: 'spire', color: '#3f3f3f' },
];

const HIT_RADIUS = 2.2; // lateral distance under which a pass counts as a hit
const HIT_STRENGTH_BASE = 0.6;

function HazardRock({ track }: { track: HazardTrack }) {
  const ref = useRef<THREE.Group>(null);
  const prevZ = useRef(track.baseZ);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    // Detect zero-crossing from -z (ahead) to +z (behind). The cycle wraps
    // SPAWN_FAR_Z → PASS_THRESHOLD; a normal pass moves z monotonically
    // upward through 0. Skip the giant jump that happens when the rock
    // wraps from past-player back to far-ahead.
    const dz = z - prevZ.current;
    if (prevZ.current < 0 && z >= 0 && dz > 0 && dz < 20) {
      const lateral = Math.abs(track.laneX);
      if (lateral < HIT_RADIUS) {
        const closeness = 1 - lateral / HIT_RADIUS; // 0..1
        const strength = HIT_STRENGTH_BASE + closeness * (1 - HIT_STRENGTH_BASE);
        useImpactStore.getState().triggerImpact(t, strength * track.scale);
      }
    }
    prevZ.current = z;
    ref.current.position.set(
      track.laneX,
      -1.7 + Math.sin(t * 1.0 + track.laneX * 0.3) * 0.15,
      z,
    );
  });

  const s = track.scale;
  if (track.variant === 'jagged') {
    return (
      <group ref={ref} position={[track.laneX, -1.7, track.baseZ]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[s, 0]} />
          <meshStandardMaterial color={track.color} flatShading roughness={0.95} />
        </mesh>
        <mesh position={[s * 0.3, s * 0.4, 0]} rotation={[0.3, 0.5, 0.2]} castShadow>
          <dodecahedronGeometry args={[s * 0.5, 0]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
      </group>
    );
  }
  if (track.variant === 'boulder') {
    return (
      <group ref={ref} position={[track.laneX, -1.7, track.baseZ]} rotation={[0, 0.6, 0]}>
        <mesh castShadow scale={[1.2, 0.9, 1.1]}>
          <dodecahedronGeometry args={[s * 0.95, 0]} />
          <meshStandardMaterial color={track.color} flatShading roughness={0.9} />
        </mesh>
        <mesh position={[0, s * 0.5, 0]} castShadow>
          <dodecahedronGeometry args={[s * 0.55, 0]} />
          <meshStandardMaterial color="#2c5e36" flatShading />
        </mesh>
      </group>
    );
  }
  // spire
  return (
    <group ref={ref} position={[track.laneX, -1.7, track.baseZ]}>
      <mesh castShadow>
        <coneGeometry args={[s * 0.7, s * 2.2, 5]} />
        <meshStandardMaterial color={track.color} flatShading roughness={0.95} />
      </mesh>
      <mesh position={[s * 0.4, -s * 0.4, 0]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[s * 0.35, s * 1.2, 5]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
    </group>
  );
}

// ---------- Lighthouse on a far rock (stationary in lane, drifts past) ----------

interface LighthouseTrack {
  baseZ: number;
  laneX: number;
}

const LIGHTHOUSES: LighthouseTrack[] = [
  { baseZ: -190, laneX: 48 },
];

function Lighthouse({ track }: { track: LighthouseTrack }) {
  const ref = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX;
    ref.current.position.z = driftedZ(track.baseZ, t);
    if (beamRef.current) {
      beamRef.current.emissiveIntensity = (Math.sin(t * 1.4) + 1) * 1.2;
    }
  });

  return (
    <group ref={ref} position={[track.laneX, -1.8, track.baseZ]}>
      {/* Rocky base */}
      <mesh castShadow scale={[3.5, 1.0, 3.5]}>
        <dodecahedronGeometry args={[1.6, 0]} />
        <meshStandardMaterial color="#4a4a4a" flatShading />
      </mesh>
      {/* Tower */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1.1, 8.0, 10]} />
        <meshStandardMaterial color="#f4f1ea" flatShading />
      </mesh>
      {/* Red horizontal stripes */}
      {[2.0, 4.0, 6.0].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[1.0, 1.0, 0.6, 10]} />
          <meshStandardMaterial color="#c83a2a" flatShading />
        </mesh>
      ))}
      {/* Light room */}
      <mesh position={[0, 9.0, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 1.2, 8]} />
        <meshStandardMaterial color="#1a1a1a" flatShading />
      </mesh>
      {/* Beacon */}
      <mesh position={[0, 9.0, 0]}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshStandardMaterial
          ref={beamRef}
          color="#fff6a0"
          emissive="#fff080"
          emissiveIntensity={0.8}
          flatShading
        />
      </mesh>
      {/* Roof cone */}
      <mesh position={[0, 10.0, 0]}>
        <coneGeometry args={[0.95, 0.9, 8]} />
        <meshStandardMaterial color="#5a2418" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Stingrays (glide under the surface) ----------

interface RayTrack {
  baseZ: number;
  laneX: number;
  phase: number;
}

const RAYS: RayTrack[] = [
  { baseZ: -38, laneX: 16, phase: 0 },
  { baseZ: -108, laneX: -19, phase: 2.0 },
  { baseZ: -185, laneX: 17, phase: 4.5 },
];

function Ray({ track }: { track: RayTrack }) {
  const ref = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + track.phase;
    ref.current.position.x = track.laneX + Math.sin(t * 0.3) * 1.2;
    ref.current.position.y = -2.2 + Math.sin(t * 0.7) * 0.15;
    ref.current.position.z = driftedZ(track.baseZ, state.clock.elapsedTime);
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.2;
    const flap = Math.sin(t * 1.8) * 0.5;
    if (wingLRef.current) wingLRef.current.rotation.z = flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -flap;
  });

  return (
    <group ref={ref} position={[track.laneX, -2.2, track.baseZ]}>
      <mesh scale={[1.3, 0.18, 1.0]} castShadow>
        <sphereGeometry args={[0.85, 12, 8]} />
        <meshStandardMaterial color="#3a4754" flatShading />
      </mesh>
      <mesh ref={wingLRef} position={[-0.9, 0, 0]} scale={[0.8, 0.08, 0.7]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshStandardMaterial color="#3a4754" flatShading />
      </mesh>
      <mesh ref={wingRRef} position={[0.9, 0, 0]} scale={[0.8, 0.08, 0.7]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshStandardMaterial color="#3a4754" flatShading />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 1.2, 5]} />
        <meshStandardMaterial color="#3a4754" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Sea lions (pop up out of water occasionally) ----------

interface SealTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  phase: number;
}

const SEALS: SealTrack[] = [
  { baseZ: -48, laneX: -14, cycle: 9, phase: 0 },
  { baseZ: -120, laneX: 18, cycle: 11, phase: 4 },
];

function Seal({ track }: { track: SealTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    const cyclePos = ((t + track.phase) % track.cycle) / track.cycle;
    let y = -3.5;
    let pitch = 0;
    if (cyclePos < 0.25) {
      // Surfaced: ride on the wave with the head and back exposed.
      const u = cyclePos / 0.25;
      const popUp = Math.sin(u * Math.PI) * 0.9;
      y = waveYAt(track.laneX, z, t) + 0.2 + popUp;
      pitch = Math.cos(u * Math.PI) * 0.4;
    }
    ref.current.position.set(track.laneX, y, z);
    ref.current.rotation.x = pitch;
  });

  return (
    <group ref={ref} position={[track.laneX, -3, track.baseZ]}>
      <mesh scale={[0.45, 0.4, 1.0]} castShadow>
        <sphereGeometry args={[0.6, 12, 10]} />
        <meshStandardMaterial color="#4a3a2a" flatShading roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.15, 0.55]} scale={[0.32, 0.3, 0.42]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color="#4a3a2a" flatShading />
      </mesh>
      {/* Whiskers / snout */}
      <mesh position={[0, 0.05, 0.78]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#2a1a14" flatShading />
      </mesh>
      {/* Flippers */}
      <mesh position={[-0.32, -0.1, 0.1]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.35, 0.06, 0.2]} />
        <meshStandardMaterial color="#3a2c1e" flatShading />
      </mesh>
      <mesh position={[0.32, -0.1, 0.1]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.35, 0.06, 0.2]} />
        <meshStandardMaterial color="#3a2c1e" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Beach floaties (inflatables drifting past) ----------

interface FloatieTrack {
  baseZ: number;
  laneX: number;
  variant: 'ring' | 'ball' | 'duck';
  color: string;
}

const FLOATIES: FloatieTrack[] = [
  { baseZ: -15, laneX: 14, variant: 'ball', color: '#7acff0' },
  { baseZ: -22, laneX: 12, variant: 'ring', color: '#f0a8b0' },
  { baseZ: -45, laneX: -14, variant: 'duck', color: '#f0d038' },
  { baseZ: -60, laneX: 16, variant: 'ring', color: '#5aa8f0' },
  { baseZ: -88, laneX: -17, variant: 'ball', color: '#f0c040' },
  { baseZ: -110, laneX: 8, variant: 'ring', color: '#e85a78' },
  { baseZ: -132, laneX: -10, variant: 'ball', color: '#5ad078' },
  { baseZ: -155, laneX: 14, variant: 'duck', color: '#f0d038' },
  { baseZ: -178, laneX: 10, variant: 'ring', color: '#f0a8b0' },
  { baseZ: -205, laneX: -12, variant: 'ring', color: '#7acff0' },
];

function Floatie({ track }: { track: FloatieTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Half-submerged inflatable — bottom dips into the water, top above.
    ref.current.position.y = waveYAt(track.laneX, z, t) + 0.0;
    const slopeX = waveYAt(track.laneX + 0.4, z, t) - waveYAt(track.laneX - 0.4, z, t);
    const slopeZ = waveYAt(track.laneX, z + 0.4, t) - waveYAt(track.laneX, z - 0.4, t);
    ref.current.rotation.y = t * 0.5;
    ref.current.rotation.z = -slopeX * 0.6 + Math.sin(t * 0.9) * 0.08;
    ref.current.rotation.x = -slopeZ * 0.5;
  });

  if (track.variant === 'ring') {
    return (
      <group ref={ref} position={[track.laneX, -1.65, track.baseZ]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.5, 0.18, 6, 16]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        <mesh>
          <torusGeometry args={[0.5, 0.04, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#ffffff" flatShading />
        </mesh>
      </group>
    );
  }
  if (track.variant === 'ball') {
    return (
      <group ref={ref} position={[track.laneX, -1.65, track.baseZ]}>
        <mesh castShadow>
          <sphereGeometry args={[0.45, 12, 10]} />
          <meshStandardMaterial color={track.color} flatShading />
        </mesh>
        {/* colored band */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.05, 6, 16]} />
          <meshStandardMaterial color="#e8345a" flatShading />
        </mesh>
        <mesh>
          <torusGeometry args={[0.45, 0.05, 6, 16]} />
          <meshStandardMaterial color="#2a78c8" flatShading />
        </mesh>
      </group>
    );
  }
  // duck (rubber duck)
  return (
    <group ref={ref} position={[track.laneX, -1.65, track.baseZ]}>
      <mesh castShadow scale={[1.0, 0.7, 1.3]}>
        <sphereGeometry args={[0.45, 10, 8]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0.35]} castShadow>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0.25, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.16, 4]} />
        <meshStandardMaterial color="#e88a20" flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.4, 0.45]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 0.4, 0.45]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// ---------- Crabs (cling to driftwood / float past on small platforms) ----------

interface CrabTrack {
  baseZ: number;
  laneX: number;
  color: string;
}

const CRABS: CrabTrack[] = [
  { baseZ: -65, laneX: 19, color: '#d0502a' },
  { baseZ: -175, laneX: -22, color: '#c83a48' },
];

function Crab({ track }: { track: CrabTrack }) {
  const ref = useRef<THREE.Group>(null);
  const clawLRef = useRef<THREE.Mesh>(null);
  const clawRRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    ref.current.position.x = track.laneX;
    ref.current.position.z = z;
    // Crab on a half-submerged driftwood raft — log sits in water, crab on top.
    ref.current.position.y = waveYAt(track.laneX, z, t) + 0.1;
    const slopeX = waveYAt(track.laneX + 0.4, z, t) - waveYAt(track.laneX - 0.4, z, t);
    const slopeZ = waveYAt(track.laneX, z + 0.4, t) - waveYAt(track.laneX, z - 0.4, t);
    ref.current.rotation.y = Math.sin(t * 0.7) * 0.3;
    ref.current.rotation.z = -slopeX * 0.6;
    ref.current.rotation.x = -slopeZ * 0.5;
    const wave = Math.sin(t * 3.5);
    if (clawLRef.current) clawLRef.current.rotation.z = 0.4 + wave * 0.4;
    if (clawRRef.current) clawRRef.current.rotation.z = -0.4 - wave * 0.4;
  });

  return (
    <group ref={ref} position={[track.laneX, -1.5, track.baseZ]}>
      {/* Driftwood platform */}
      <mesh position={[0, -0.05, 0]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.18, 1.2, 6]} />
        <meshStandardMaterial color="#6b4a2a" flatShading roughness={0.95} />
      </mesh>
      {/* Crab body */}
      <mesh position={[0, 0.15, 0]} scale={[1, 0.5, 0.85]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial color={track.color} flatShading roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.06, 0.27, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.06, 0.27, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Claws */}
      <mesh ref={clawLRef} position={[-0.22, 0.16, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.16, 0.06, 0.08]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
      <mesh ref={clawRRef} position={[0.22, 0.16, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.16, 0.06, 0.08]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
    </group>
  );
}

// ---------- Shipwreck mast (jutting from the water on the horizon) ----------

interface WreckTrack {
  baseZ: number;
  laneX: number;
}

const WRECKS: WreckTrack[] = [
  { baseZ: -130, laneX: -45 },
];

function Wreck({ track }: { track: WreckTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX;
    ref.current.position.z = driftedZ(track.baseZ, t);
    ref.current.rotation.z = 0.35 + Math.sin(t * 0.3) * 0.04;
  });

  return (
    <group ref={ref} position={[track.laneX, -2.0, track.baseZ]}>
      {/* Mast */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 5.5, 6]} />
        <meshStandardMaterial color="#3a2818" flatShading roughness={0.95} />
      </mesh>
      {/* Crossbeam */}
      <mesh position={[0, 4.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 2.4, 5]} />
        <meshStandardMaterial color="#3a2818" flatShading />
      </mesh>
      {/* Tattered sail rag */}
      <mesh position={[0.2, 3.4, 0.05]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[1.2, 1.0, 0.03]} />
        <meshStandardMaterial color="#a89878" flatShading side={THREE.DoubleSide} />
      </mesh>
      {/* Hull poking out of water */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[3, 0.4, 0.8]} />
        <meshStandardMaterial color="#4a3220" flatShading roughness={0.95} />
      </mesh>
    </group>
  );
}

// ---------- Big breaking waves (dramatic curling waves around the player) ----------
//
// Discrete wave models that drift past at various distances and sizes —
// close, mid-range, and far on the horizon — to make the ocean feel busy
// and dramatic instead of a flat plane. Each wave has a leaning wall,
// foamy curl on top, scattered foam blobs along the crest, and a base
// foam line where it's breaking against the surface.

interface BigWaveTrack {
  baseZ: number;
  laneX: number;
  scale: number;
  width: number;
  hue: string;
  faceAngle: number;
  phase: number;
  // Cycle of build-up + break for animation
  breakCycle: number;
}

const BIG_WAVES: BigWaveTrack[] = [
  // Close waves (laneX 25–35, near player)
  { baseZ: -28, laneX: -28, scale: 0.9, width: 12, hue: '#2c8ac8', faceAngle: 0.5, phase: 0, breakCycle: 9 },
  { baseZ: -52, laneX: 32, scale: 1.1, width: 16, hue: '#1a78b8', faceAngle: -0.7, phase: 2.0, breakCycle: 11 },
  { baseZ: -78, laneX: -34, scale: 1.0, width: 14, hue: '#2898d4', faceAngle: 0.4, phase: 4.0, breakCycle: 10 },

  // Mid-distance waves
  { baseZ: -110, laneX: 42, scale: 1.5, width: 22, hue: '#1a78b8', faceAngle: -0.5, phase: 1.5, breakCycle: 12 },
  { baseZ: -135, laneX: -45, scale: 1.4, width: 20, hue: '#2c8ac8', faceAngle: 0.4, phase: 3.0, breakCycle: 13 },
  { baseZ: -158, laneX: 36, scale: 1.6, width: 24, hue: '#1a68a8', faceAngle: -0.3, phase: 0.5, breakCycle: 11 },

  // Distant horizon waves (bigger to read at distance)
  { baseZ: -185, laneX: -58, scale: 2.2, width: 32, hue: '#2898d4', faceAngle: 0.3, phase: 5.0, breakCycle: 14 },
  { baseZ: -205, laneX: 55, scale: 2.0, width: 28, hue: '#1a78b8', faceAngle: -0.4, phase: 1.2, breakCycle: 15 },
  { baseZ: -220, laneX: -40, scale: 2.4, width: 36, hue: '#1a68a8', faceAngle: 0.2, phase: 3.6, breakCycle: 16 },
];

function BigWave({ track }: { track: BigWaveTrack }) {
  const ref = useRef<THREE.Group>(null);
  const crestRef = useRef<THREE.Group>(null);
  const foamRefs = useRef<THREE.Mesh[]>([]);
  const s = track.scale;
  const H = 3.2 * s;
  const W = track.width;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const z = driftedZ(track.baseZ, t);
    const x = track.laneX;
    ref.current.position.x = x;
    ref.current.position.z = z;
    // Anchor base at the live wave surface so the wave foot sits on water.
    ref.current.position.y = waveYAt(x, z, t);

    // Build-up + break cycle. Wave grows for 70% of cycle, peaks, breaks for
    // remaining 30% — foam blobs spray harder during the break window.
    const cyclePos = ((t + track.phase) % track.breakCycle) / track.breakCycle;
    const buildup =
      cyclePos < 0.7
        ? 0.5 + (cyclePos / 0.7) * 0.5 // ramp 0.5 → 1.0
        : 1.0 - (cyclePos - 0.7) / 0.3 * 0.3; // collapse 1.0 → 0.7
    const breaking = cyclePos > 0.7 ? (cyclePos - 0.7) / 0.3 : 0;

    if (crestRef.current) {
      crestRef.current.scale.set(1, buildup, 1);
      crestRef.current.rotation.z = Math.sin(t * 0.45 + track.phase) * 0.04;
    }
    // Foam blobs spread + scatter during the break.
    foamRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const localT = t * 1.5 + i * 0.7 + track.phase;
      const sprayOut = breaking * (0.5 + (i % 3) * 0.3);
      mesh.position.y = H * 1.05 + Math.sin(localT) * 0.25 + sprayOut * 0.4;
      mesh.position.z = 0.5 * s + sprayOut * 0.8;
      const sz = (0.5 + Math.sin(localT * 1.3) * 0.15) * s * (1 + breaking * 0.7);
      mesh.scale.setScalar(sz);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.7 + breaking * 0.25;
    });
  });

  // Spread of foam-blob X positions along the crest.
  const foamPositions = useMemo(
    () => [-0.42, -0.22, -0.05, 0.12, 0.3, 0.45].map((p) => p * W),
    [W],
  );

  return (
    <group
      ref={ref}
      position={[track.laneX, WATER_LEVEL, track.baseZ]}
      rotation={[0, track.faceAngle, 0]}
    >
      <group ref={crestRef}>
        {/* Wave wall — tall mass leaning forward to suggest the curl. */}
        <mesh position={[0, H * 0.5, 0]} rotation={[-0.35, 0, 0]} castShadow>
          <boxGeometry args={[W, H, 1.4 * s]} />
          <meshStandardMaterial color={track.hue} flatShading roughness={0.5} metalness={0.08} />
        </mesh>
        {/* Darker stripe down the face — gives depth to the wave wall. */}
        <mesh position={[0, H * 0.25, 0.72 * s]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[W * 0.98, H * 0.5, 0.04]} />
          <meshStandardMaterial color="#0e4a78" flatShading />
        </mesh>
        {/* Translucent green underside — the light coming through the wave face. */}
        <mesh position={[0, H * 0.7, 0.74 * s]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[W * 0.92, H * 0.25, 0.04]} />
          <meshStandardMaterial
            color="#5ad0c8"
            flatShading
            transparent
            opacity={0.55}
            emissive="#3aa8a0"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Foam lip / crest — long cylinder along the top edge. */}
        <mesh position={[0, H * 1.0, 0.35 * s]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55 * s, 0.65 * s, W, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            flatShading
            emissive="#e8f0ff"
            emissiveIntensity={0.35}
          />
        </mesh>
        {/* Curl tube — forward of the crest, the lip starting to spill. */}
        <mesh position={[0, H * 0.75, 0.95 * s]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35 * s, 0.35 * s, W * 0.92, 6]} />
          <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.7} />
        </mesh>
        {/* Foam splash blobs along the crest — animated for crash drama. */}
        {foamPositions.map((px, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) foamRefs.current[i] = el;
            }}
            position={[px, H * 1.1, 0.5 * s]}
          >
            <sphereGeometry args={[0.55, 8, 6]} />
            <meshStandardMaterial
              color="#ffffff"
              flatShading
              transparent
              opacity={0.85}
              emissive="#e0e8f0"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
        {/* Base foam line — where the wave is breaking against the surface. */}
        <mesh position={[0, 0.25, 0.3 * s]}>
          <boxGeometry args={[W * 1.05, 0.35 * s, 1.5 * s]} />
          <meshStandardMaterial
            color="#ffffff"
            flatShading
            transparent
            opacity={0.55}
          />
        </mesh>
        {/* Back side of the wave — gentler hump fading away. */}
        <mesh position={[0, H * 0.4, -0.7 * s]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[W * 0.95, H * 0.7, 0.9 * s]} />
          <meshStandardMaterial color="#1a5878" flatShading roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- Combined export ----------

// Invisible utility component: reads the live tide and writes amp/speed
// into the shared module-scoped `waveParams`. Mounted at the top of
// EnvironmentObjects so all the surface-bobbing children stay in sync.
function WaveSync() {
  const { waveHeight, waveSpeed } = useTideData();
  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });
  useFrame(() => {
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;
    waveParams.amplitude = animState.current.amplitude;
    waveParams.speed = animState.current.speed;
  });
  return null;
}

export default function EnvironmentObjects() {
  void PLAYER_SAFE_RADIUS; // kept for documentation / future collision logic

  return (
    <group>
      <WaveSync />
      {ROCKS.map((r, i) => (
        <Rock key={`r${i}`} rock={r} />
      ))}
      {SMALL_ROCKS.map((r, i) => (
        <SmallRock key={`sr${i}`} rock={r} />
      ))}
      {DOLPHINS.map((d, i) => (
        <Dolphin key={`d${i}`} track={d} />
      ))}
      {FISH.map((f, i) => (
        <Fish key={`f${i}`} track={f} />
      ))}
      {BOATS.map((b, i) => (
        <Boat key={`b${i}`} track={b} />
      ))}
      {GULLS.map((g, i) => (
        <Gull key={`g${i}`} track={g} />
      ))}
      {WHALES.map((w, i) => (
        <Whale key={`w${i}`} track={w} />
      ))}
      {TURTLES.map((t, i) => (
        <Turtle key={`t${i}`} track={t} />
      ))}
      {SHARKS.map((s, i) => (
        <Shark key={`sh${i}`} track={s} />
      ))}
      {PELICANS.map((p, i) => (
        <Pelican key={`p${i}`} track={p} />
      ))}
      {SCHOOLS.map((s, i) => (
        <School key={`sc${i}`} track={s} />
      ))}
      {JELLIES.map((j, i) => (
        <Jelly key={`j${i}`} track={j} />
      ))}
      {BUOYS.map((b, i) => (
        <Buoy key={`bu${i}`} track={b} />
      ))}
      {DRIFTWOOD.map((d, i) => (
        <Driftwood key={`dw${i}`} track={d} />
      ))}
      {KELP.map((k, i) => (
        <KelpPatch key={`k${i}`} track={k} />
      ))}
      {SPLASHES.map((s, i) => (
        <Splash key={`sp${i}`} track={s} />
      ))}
      {HAZARD_ROCKS.map((h, i) => (
        <HazardRock key={`hz${i}`} track={h} />
      ))}
      {LIGHTHOUSES.map((l, i) => (
        <Lighthouse key={`lh${i}`} track={l} />
      ))}
      {RAYS.map((r, i) => (
        <Ray key={`ry${i}`} track={r} />
      ))}
      {SEALS.map((s, i) => (
        <Seal key={`se${i}`} track={s} />
      ))}
      {FLOATIES.map((f, i) => (
        <Floatie key={`fl${i}`} track={f} />
      ))}
      {CRABS.map((c, i) => (
        <Crab key={`cb${i}`} track={c} />
      ))}
      {WRECKS.map((w, i) => (
        <Wreck key={`wk${i}`} track={w} />
      ))}
      {SPEEDBOATS.map((b, i) => (
        <Speedboat key={`sb${i}`} track={b} />
      ))}
      {KAYAKS.map((k, i) => (
        <Kayak key={`kk${i}`} track={k} />
      ))}
      {BIG_FISH.map((f, i) => (
        <BigFish key={`bf${i}`} track={f} />
      ))}
      {TROPICAL_FISH.map((f, i) => (
        <TropicalFish key={`tf${i}`} track={f} />
      ))}
      {SWARMS.map((s, i) => (
        <Swarm key={`sw${i}`} track={s} />
      ))}
      {ALBATROSSES.map((a, i) => (
        <Albatross key={`al${i}`} track={a} />
      ))}
      {GOOSE_FORMATIONS.map((g, i) => (
        <GooseFormation key={`gf${i}`} track={g} />
      ))}
      {BIG_WAVES.map((w, i) => (
        <BigWave key={`bw${i}`} track={w} />
      ))}
    </group>
  );
}
