import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMovementStore } from '../../stores/movementStore';
import {
  getBoard,
  getShorts,
  useAppearanceStore,
} from '../../stores/appearanceStore';

// The player's lower body + surfboard + foam wake. Yaw + roll attachment to
// the camera (so the body turns with your head and leans with A/D) but
// never pitches — that way the legs and board hide below view when you
// look forward, and roll into sight when you look down. The iPad + hands
// live in IpadRig (camera-locked) so they sit at a fixed screen position.
//
// No torso / shoulders / chest. From a first-person POV looking down you
// should see your legs and surfboard with foam beneath, not a wall of shirt.

// Defaults that match the original look. Colors flowing in from the wardrobe
// (appearanceStore) override these via props/context to the children below.
const SKIN_COLOR = '#f0caa0';

export default function BodyRig() {
  const shortsColor = getShorts(useAppearanceStore((s) => s.shortsId)).color;
  const board = getBoard(useAppearanceStore((s) => s.boardId));

  const groupRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const cam = state.camera;
    groupRef.current.position.copy(cam.position);
    const mv = useMovementStore.getState();
    const lean = mv.lateralLean;
    const speedDelta = mv.forwardSpeedMul - 1.0; // +ve = accelerating, -ve = braking

    // Body + surfboard always face world-forward — looking around with the
    // mouse moves the camera/head only, never the board. Lean (A/D) rolls
    // the body around the rider's spine so the carve is felt.
    groupRef.current.rotation.set(0, 0, lean);

    if (boardRef.current) {
      // Board carves harder than the body — lean × 1.4 total when combined
      // with the body roll.
      boardRef.current.rotation.z = lean * 0.7;
      // W tips the nose into the wave, S kicks it up for a brake. Multiplier
      // pushes ~18° of nose drop at full accel.
      boardRef.current.rotation.x = -speedDelta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* No hips box — when the player looks down they should see two
          distinct legs over the board, not a single broad pelvis silhouette
          that reads as "looking at your own butt". */}

      {/* Legs angled forward + outward toward the feet on the board. */}
      <Leg side="left" pantsColor={shortsColor} />
      <Leg side="right" pantsColor={shortsColor} />

      {/* Feet planted on the board, in front of the rider. */}
      <mesh position={[-0.2, -1.5, -0.55]} castShadow>
        <boxGeometry args={[0.2, 0.09, 0.45]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
      <mesh position={[0.2, -1.5, -0.55]} castShadow>
        <boxGeometry args={[0.2, 0.09, 0.45]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>

      {/* Surfboard — center under the feet, extending forward into the wave. */}
      <group ref={boardRef} position={[0, -1.6, -1.1]}>
        <Surfboard deck={board.deck} stripe={board.stripe} rail={board.rail} />
      </group>

      {/* Foam wake bursting from the board nose. */}
      <FoamSpray />
    </group>
  );
}

function Leg({
  side,
  pantsColor,
}: {
  side: 'left' | 'right';
  pantsColor: string;
}) {
  // Single cylinder hip → foot so the leg cleanly bridges the two.
  const sign = side === 'left' ? -1 : 1;
  const hip: [number, number, number] = [sign * 0.13, -0.85, -0.2];
  const foot: [number, number, number] = [sign * 0.2, -1.45, -0.5];

  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...hip);
    const e = new THREE.Vector3(...foot);
    const dir = e.clone().sub(s);
    const len = dir.length();
    dir.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir,
    );
    const eu = new THREE.Euler().setFromQuaternion(q);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    return {
      position: mid.toArray() as [number, number, number],
      rotation: [eu.x, eu.y, eu.z] as [number, number, number],
      length: len,
    };
  }, [hip, foot]);

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.11, 0.09, length, 10]} />
      <meshStandardMaterial color={pantsColor} flatShading />
    </mesh>
  );
}

function Surfboard({
  deck,
  stripe,
  rail,
}: {
  deck: string;
  stripe: string;
  rail: string;
}) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.85, 0.1, 2.6]} />
        <meshStandardMaterial color={deck} flatShading />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.12, 0.012, 2.5]} />
        <meshStandardMaterial color={stripe} flatShading />
      </mesh>
      <mesh position={[0, 0, -1.45]}>
        <coneGeometry args={[0.42, 0.7, 4]} />
        <meshStandardMaterial color={deck} flatShading />
      </mesh>
      <mesh position={[-0.28, 0.055, 0]}>
        <boxGeometry args={[0.04, 0.013, 2.0]} />
        <meshStandardMaterial color={rail} flatShading />
      </mesh>
      <mesh position={[0.28, 0.055, 0]}>
        <boxGeometry args={[0.04, 0.013, 2.0]} />
        <meshStandardMaterial color={rail} flatShading />
      </mesh>
      <mesh position={[0, -0.13, 1.15]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
    </group>
  );
}

interface SprayParticle {
  key: number;
  spawnX: number;
  seed: number;
  drift: number;
  side: 1 | -1;
}

function FoamSpray() {
  const refs = useRef<THREE.Mesh[]>([]);

  const particles = useMemo<SprayParticle[]>(
    () =>
      new Array(36).fill(0).map((_, i) => ({
        key: i,
        spawnX: (Math.random() - 0.5) * 0.85,
        seed: Math.random(),
        drift: 0.5 + Math.random() * 0.55,
        side: (i % 2 === 0 ? 1 : -1) as 1 | -1,
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Spray speed tracks player forward speed — faster surfer = bigger wake.
    const speedMul = useMovementStore.getState().forwardSpeedMul;
    particles.forEach((p, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const phase = (t * 1.9 * speedMul + p.seed * 4) % 1;
      const x = p.spawnX + p.side * phase * p.drift * 0.95;
      const y = -1.5 + Math.sin(phase * Math.PI) * 0.55 - phase * 0.3;
      const z = -2.5 + phase * 3.3;
      mesh.position.set(x, y, z);
      const size = (1 - phase) * 0.28 + 0.08;
      mesh.scale.setScalar(size);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.95 * (1 - phase * phase);
    });
  });

  return (
    <group>
      {particles.map((p, i) => (
        <mesh
          key={p.key}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.85}
            flatShading
            emissive="#e0eaff"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
