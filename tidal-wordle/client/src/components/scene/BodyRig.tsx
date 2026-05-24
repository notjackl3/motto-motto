import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMovementStore } from '../../stores/movementStore';

// The player's lower body + surfboard + foam wake. Yaw + roll attachment to
// the camera (so the body turns with your head and leans with A/D) but
// never pitches — that way the legs and board hide below view when you
// look forward, and roll into sight when you look down. The iPad + hands
// live in IpadRig (camera-locked) so they sit at a fixed screen position.
//
// No torso / shoulders / chest. From a first-person POV looking down you
// should see your legs and surfboard with foam beneath, not a wall of shirt.

const PANTS_COLOR = '#1f2a55';
const SKIN_COLOR = '#f0caa0';
const SHIRT_COLOR = '#e25a3a';

export default function BodyRig() {
  const groupRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const cam = state.camera;
    groupRef.current.position.copy(cam.position);
    const e = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
    // Yaw with the camera, lean with A/D (Z roll). No pitch — body stays
    // upright when you tilt your head up/down.
    const lean = useMovementStore.getState().lateralLean;
    groupRef.current.rotation.set(0, e.y, lean);

    // Board exaggerates the lean so the surf feels alive when carving.
    if (boardRef.current) {
      boardRef.current.rotation.z = lean * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hips — visible only when you pitch the camera way down. */}
      <mesh position={[0, -0.95, -0.15]} castShadow>
        <boxGeometry args={[0.52, 0.2, 0.36]} />
        <meshStandardMaterial color={PANTS_COLOR} flatShading />
      </mesh>

      {/* Legs angled forward + outward toward the feet on the board. */}
      <Leg side="left" />
      <Leg side="right" />

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
        <Surfboard />
      </group>

      {/* Foam wake bursting from the board nose. */}
      <FoamSpray />
    </group>
  );
}

function Leg({ side }: { side: 'left' | 'right' }) {
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
      <meshStandardMaterial color={PANTS_COLOR} flatShading />
    </mesh>
  );
}

function Surfboard() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.85, 0.1, 2.6]} />
        <meshStandardMaterial color="#f8e8b0" flatShading />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.12, 0.012, 2.5]} />
        <meshStandardMaterial color={SHIRT_COLOR} flatShading />
      </mesh>
      <mesh position={[0, 0, -1.45]}>
        <coneGeometry args={[0.42, 0.7, 4]} />
        <meshStandardMaterial color="#f8e8b0" flatShading />
      </mesh>
      <mesh position={[-0.28, 0.055, 0]}>
        <boxGeometry args={[0.04, 0.013, 2.0]} />
        <meshStandardMaterial color="#2898d4" flatShading />
      </mesh>
      <mesh position={[0.28, 0.055, 0]}>
        <boxGeometry args={[0.04, 0.013, 2.0]} />
        <meshStandardMaterial color="#2898d4" flatShading />
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
