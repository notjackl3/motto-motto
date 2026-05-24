import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useImpactStore } from '../../stores/impactStore';

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

// Wrap a base z (initial offset) by the global drift so the object cycles
// from SPAWN_FAR_Z → PASS_THRESHOLD continuously.
function driftedZ(baseZ: number, t: number): number {
  const raw = baseZ + t * FORWARD_DRIFT;
  // Positive-modulo to keep negative numbers well-behaved.
  const m = ((raw - SPAWN_FAR_Z) % CYCLE + CYCLE) % CYCLE;
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

const ROCKS: Rock[] = [
  { baseZ: -18, laneX: -12, scale: 2.2, rot: 0.4, color: '#4a4a4a' },
  { baseZ: -45, laneX: 14, scale: 1.6, rot: 1.2, color: '#525252' },
  { baseZ: -90, laneX: -22, scale: 3.0, rot: -0.7, color: '#3f3f3f' },
  { baseZ: -130, laneX: 24, scale: 2.4, rot: 2.1, color: '#4f4f4f' },
  { baseZ: -170, laneX: -8, scale: 1.8, rot: 0.9, color: '#5a5a5a' },
  { baseZ: -205, laneX: 18, scale: 2.6, rot: 1.6, color: '#444' },
];

function Rock({ rock }: { rock: Rock }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.z = driftedZ(rock.baseZ, state.clock.elapsedTime);
  });
  return (
    <group ref={ref} position={[rock.laneX, -1.3, rock.baseZ]} rotation={[0, rock.rot, 0]}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[rock.scale, 0]} />
        <meshStandardMaterial color={rock.color} flatShading roughness={0.9} />
      </mesh>
      <mesh position={[0, rock.scale * 0.5, 0]} castShadow>
        <dodecahedronGeometry args={[rock.scale * 0.55, 0]} />
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
  { baseZ: -60, laneX: 16, cycle: 8, jumpStart: 3, jumpDuration: 2.0, peakY: 1.3, side: 1 },
  { baseZ: -110, laneX: -10, cycle: 9, jumpStart: 6, jumpDuration: 2.5, peakY: 1.8, side: -1 },
  { baseZ: -160, laneX: 20, cycle: 7.5, jumpStart: 2, jumpDuration: 2.1, peakY: 1.4, side: 1 },
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

// ---------- Flying fish ----------

interface FishTrack {
  baseZ: number;
  laneX: number;
  cycle: number;
  phase: number;
  peakY: number;
  color: string;
}

const FISH: FishTrack[] = [
  { baseZ: -10, laneX: 7, cycle: 5, phase: 0, peakY: 0.6, color: '#d4b06a' },
  { baseZ: -35, laneX: -11, cycle: 6.5, phase: 1.5, peakY: 0.55, color: '#c7a04f' },
  { baseZ: -70, laneX: 12, cycle: 4.5, phase: 3, peakY: 0.7, color: '#e0c075' },
  { baseZ: -120, laneX: -16, cycle: 7, phase: 5, peakY: 0.55, color: '#b89146' },
  { baseZ: -180, laneX: 9, cycle: 5.5, phase: 2, peakY: 0.65, color: '#d4b06a' },
];

function Fish({ track }: { track: FishTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const baseZ = driftedZ(track.baseZ, t);
    const cyclePos = (t + track.phase) % track.cycle;
    const arcDur = 1.2;
    if (cyclePos > arcDur) {
      ref.current.position.set(track.laneX, -5, baseZ);
      return;
    }
    const u = cyclePos / arcDur;
    const y = -1.2 + Math.sin(u * Math.PI) * track.peakY;
    const localDz = (u - 0.5) * 3;
    ref.current.position.set(track.laneX, y, baseZ + localDz);
    const pitch = Math.cos(u * Math.PI) * 0.5;
    ref.current.rotation.set(pitch, 0, 0);
  });

  return (
    <group ref={ref} position={[track.laneX, -5, track.baseZ]}>
      <mesh scale={[0.18, 0.18, 0.4]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial
          color={track.color}
          flatShading
          emissive={track.color}
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.14, 3]} />
        <meshStandardMaterial color={track.color} flatShading />
      </mesh>
    </group>
  );
}

// ---------- Sailboats ----------

interface BoatTrack {
  baseZ: number;
  laneX: number;
}

const BOATS: BoatTrack[] = [
  { baseZ: -75, laneX: 35 },
  { baseZ: -150, laneX: -40 },
];

function Boat({ track }: { track: BoatTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX;
    ref.current.position.y = -0.6 + Math.sin(t * 0.4 + track.laneX * 0.1) * 0.3;
    ref.current.position.z = driftedZ(track.baseZ, t);
    ref.current.rotation.z = Math.sin(t * 0.35) * 0.08;
  });

  return (
    <group ref={ref} position={[track.laneX, -0.6, track.baseZ]}>
      <mesh castShadow>
        <boxGeometry args={[4, 0.8, 1.4]} />
        <meshStandardMaterial color="#8a4a2a" flatShading />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.9, 1.4, 4]} />
        <meshStandardMaterial color="#6a3820" flatShading />
      </mesh>
      <mesh position={[-0.3, 0.7, 0]} castShadow>
        <boxGeometry args={[1.6, 0.7, 1.0]} />
        <meshStandardMaterial color="#f0e0c0" flatShading />
      </mesh>
      <mesh position={[0.4, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3.4, 8]} />
        <meshStandardMaterial color="#5a3520" flatShading />
      </mesh>
      <mesh position={[0.4, 2.4, 0]} castShadow>
        <coneGeometry args={[1.1, 2.6, 3]} />
        <meshStandardMaterial color="#ffffff" flatShading side={THREE.DoubleSide} />
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
  { baseZ: -25, centerX: -8, radius: 6, height: 7, speed: 0.4, phase: 0 },
  { baseZ: -55, centerX: 15, radius: 8, height: 9, speed: 0.3, phase: 1.5 },
  { baseZ: -95, centerX: 0, radius: 5, height: 8, speed: 0.5, phase: 3 },
  { baseZ: -155, centerX: -18, radius: 7, height: 10, speed: 0.35, phase: 2 },
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
  { baseZ: -50, laneX: -18, phase: 0 },
  { baseZ: -125, laneX: 22, phase: 2.5 },
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
    const t = state.clock.elapsedTime + track.phase;
    ref.current.position.x = track.laneX + Math.sin(t * 0.4) * 0.6;
    ref.current.position.y = -1.4 + Math.sin(t * 0.9) * 0.2;
    ref.current.position.z = driftedZ(track.baseZ, state.clock.elapsedTime);
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.25;
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
    ref.current.position.x = track.laneX;
    ref.current.position.z = driftedZ(track.baseZ, t);
    const cyclePos = ((t + track.phase) % track.cycle) / track.cycle;
    const arc = cyclePos < 0.18 ? cyclePos / 0.18 : -1;
    ref.current.children.forEach((c, i) => {
      const m = members[i];
      if (!m) return;
      if (arc < 0) {
        c.visible = false;
        return;
      }
      const u = Math.min(Math.max(arc - m.delay, 0), 1);
      const y = -1.4 + Math.sin(u * Math.PI) * (0.4 + m.dy);
      c.position.set(m.dx, y, m.dz);
      c.rotation.x = Math.cos(u * Math.PI) * 0.4;
      c.visible = u > 0;
    });
  });

  return (
    <group ref={ref} position={[track.laneX, -1.4, track.baseZ]}>
      {members.map((_, i) => (
        <mesh key={i} scale={[0.12, 0.12, 0.28]} castShadow>
          <sphereGeometry args={[0.4, 6, 6]} />
          <meshStandardMaterial
            color={track.color}
            flatShading
            emissive={track.color}
            emissiveIntensity={0.15}
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
  { baseZ: -32, laneX: 9, phase: 0, color: '#f0a4d0' },
  { baseZ: -78, laneX: -9, phase: 1.5, color: '#c8a4f0' },
  { baseZ: -140, laneX: 13, phase: 3, color: '#f0b8c0' },
  { baseZ: -200, laneX: -11, phase: 0.7, color: '#a4d8f0' },
];

function Jelly({ track }: { track: JellyTrack }) {
  const ref = useRef<THREE.Group>(null);
  const bellRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + track.phase;
    ref.current.position.x = track.laneX + Math.sin(t * 0.25) * 0.3;
    ref.current.position.y = -1.7 + Math.sin(t * 0.6) * 0.25;
    ref.current.position.z = driftedZ(track.baseZ, state.clock.elapsedTime);
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
  { baseZ: -85, laneX: 26, flashRate: 1.0, color: '#e85a4a' },
  { baseZ: -165, laneX: -28, flashRate: 0.8, color: '#f0c040' },
];

function Buoy({ track }: { track: BuoyTrack }) {
  const ref = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX;
    ref.current.position.y = -1.4 + Math.sin(t * 1.2 + track.laneX * 0.1) * 0.4;
    ref.current.position.z = driftedZ(track.baseZ, t);
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.18;
    ref.current.rotation.x = Math.sin(t * 0.7) * 0.12;
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
  { baseZ: -42, laneX: 21, rot: 0.6, withGull: true },
  { baseZ: -118, laneX: -19, rot: 1.4, withGull: false },
  { baseZ: -188, laneX: 23, rot: -0.8, withGull: true },
];

function Driftwood({ track }: { track: DriftTrack }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = track.laneX;
    ref.current.position.y = -1.7 + Math.sin(t * 0.8 + track.laneX * 0.2) * 0.2;
    ref.current.position.z = driftedZ(track.baseZ, t);
    ref.current.rotation.z = track.rot + Math.sin(t * 0.5) * 0.1;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.08;
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
  { baseZ: -28, laneX: -21 },
  { baseZ: -82, laneX: 19 },
  { baseZ: -148, laneX: -24 },
  { baseZ: -198, laneX: 21 },
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
  { baseZ: -52, laneX: 17, cycle: 7, phase: 2.5 },
  { baseZ: -98, laneX: -13, cycle: 5.5, phase: 1.2 },
  { baseZ: -142, laneX: 14, cycle: 8, phase: 4 },
  { baseZ: -178, laneX: -10, cycle: 6.5, phase: 3.3 },
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
  { baseZ: -70, laneX: -0.8, scale: 0.9, variant: 'jagged', color: '#5a5a5a' },
  { baseZ: -135, laneX: 1.2, scale: 1.0, variant: 'boulder', color: '#4a4a4a' },
  { baseZ: -210, laneX: -0.3, scale: 1.2, variant: 'spire', color: '#3f3f3f' },
  { baseZ: -45, laneX: 1.6, scale: 0.8, variant: 'jagged', color: '#525252' },
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

// ---------- Combined export ----------

export default function EnvironmentObjects() {
  void PLAYER_SAFE_RADIUS; // kept for documentation / future collision logic

  const rocks = useMemo(() => ROCKS, []);
  const dolphins = useMemo(() => DOLPHINS, []);
  const fish = useMemo(() => FISH, []);
  const boats = useMemo(() => BOATS, []);
  const gulls = useMemo(() => GULLS, []);
  const whales = useMemo(() => WHALES, []);
  const turtles = useMemo(() => TURTLES, []);
  const sharks = useMemo(() => SHARKS, []);
  const pelicans = useMemo(() => PELICANS, []);
  const schools = useMemo(() => SCHOOLS, []);
  const jellies = useMemo(() => JELLIES, []);
  const buoys = useMemo(() => BUOYS, []);
  const driftwood = useMemo(() => DRIFTWOOD, []);
  const kelp = useMemo(() => KELP, []);
  const splashes = useMemo(() => SPLASHES, []);

  return (
    <group>
      {rocks.map((r, i) => (
        <Rock key={`r${i}`} rock={r} />
      ))}
      {dolphins.map((d, i) => (
        <Dolphin key={`d${i}`} track={d} />
      ))}
      {fish.map((f, i) => (
        <Fish key={`f${i}`} track={f} />
      ))}
      {boats.map((b, i) => (
        <Boat key={`b${i}`} track={b} />
      ))}
      {gulls.map((g, i) => (
        <Gull key={`g${i}`} track={g} />
      ))}
      {whales.map((w, i) => (
        <Whale key={`w${i}`} track={w} />
      ))}
      {turtles.map((t, i) => (
        <Turtle key={`t${i}`} track={t} />
      ))}
      {sharks.map((s, i) => (
        <Shark key={`sh${i}`} track={s} />
      ))}
      {pelicans.map((p, i) => (
        <Pelican key={`p${i}`} track={p} />
      ))}
      {schools.map((s, i) => (
        <School key={`sc${i}`} track={s} />
      ))}
      {jellies.map((j, i) => (
        <Jelly key={`j${i}`} track={j} />
      ))}
      {buoys.map((b, i) => (
        <Buoy key={`bu${i}`} track={b} />
      ))}
      {driftwood.map((d, i) => (
        <Driftwood key={`dw${i}`} track={d} />
      ))}
      {kelp.map((k, i) => (
        <KelpPatch key={`k${i}`} track={k} />
      ))}
      {splashes.map((s, i) => (
        <Splash key={`sp${i}`} track={s} />
      ))}
    </group>
  );
}
