import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useTideData } from '../../hooks/useTideData';
import { useGameStore } from '../../stores/gameStore';
import { waveHeightAt } from './waveFunction';

const SURFER_X = 0;
const SURFER_Z = 0;
const WAVE_BASE_Y = -1; // matches the Wave mesh y-position

export default function Surfer() {
  const groupRef = useRef<THREE.Group>(null);
  const sprayRefs = useRef<THREE.Mesh[]>([]);
  const { waveHeight, waveSpeed } = useTideData();
  const faceSwap = useGameStore((s) => s.faceSwap);

  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });

  const sprayParticles = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => ({
        key: i,
        offset: {
          x: (Math.random() - 0.5) * 2.4,
          z: (Math.random() - 0.5) * 2.4,
        },
        seed: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame((state) => {
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;

    const t = state.clock.elapsedTime;
    const amp = animState.current.amplitude;
    const spd = animState.current.speed;

    if (groupRef.current) {
      const y = WAVE_BASE_Y + waveHeightAt(SURFER_X, SURFER_Z, t, amp, spd);
      groupRef.current.position.y = y;

      // Tilt the surfer along the wave slope so it looks like it's riding, not levitating.
      const dx =
        waveHeightAt(SURFER_X + 0.5, SURFER_Z, t, amp, spd) -
        waveHeightAt(SURFER_X - 0.5, SURFER_Z, t, amp, spd);
      const dz =
        waveHeightAt(SURFER_X, SURFER_Z + 0.5, t, amp, spd) -
        waveHeightAt(SURFER_X, SURFER_Z - 0.5, t, amp, spd);
      groupRef.current.rotation.z = -dx * 0.6;
      groupRef.current.rotation.x = dz * 0.6;
    }

    // Animate spray: each particle drifts up and resets.
    sprayRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const p = sprayParticles[idx];
      const phase = (t * 1.5 * spd + p.seed) % 1.5;
      const lifeT = phase / 1.5;
      const baseY = WAVE_BASE_Y + waveHeightAt(p.offset.x, p.offset.z, t, amp, spd);
      mesh.position.set(
        SURFER_X + p.offset.x,
        baseY + lifeT * 1.4,
        SURFER_Z + p.offset.z,
      );
      const scale = (1 - lifeT) * 0.18 + 0.04;
      mesh.scale.setScalar(scale);
      (mesh.material as THREE.MeshStandardMaterial).opacity = 0.7 * (1 - lifeT);
    });
  });

  return (
    <group>
      <group ref={groupRef} position={[SURFER_X, WAVE_BASE_Y, SURFER_Z]}>
        {/* Surfboard */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.7, 0.08, 2.2]} />
          <meshStandardMaterial color="#f0e0a8" />
        </mesh>
        {/* Board stripe */}
        <mesh position={[0, 0.045, 0]} castShadow>
          <boxGeometry args={[0.12, 0.01, 2.0]} />
          <meshStandardMaterial color="#d04848" />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.12, 0.25, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.4, 12]} />
          <meshStandardMaterial color="#2a3f57" />
        </mesh>
        <mesh position={[0.12, 0.25, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.4, 12]} />
          <meshStandardMaterial color="#2a3f57" />
        </mesh>
        {/* Body */}
        <mesh position={[0, 0.7, 0.05]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.55, 14]} />
          <meshStandardMaterial color="#ff7a59" />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.32, 0.7, 0]} rotation={[0, 0, 0.6]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 10]} />
          <meshStandardMaterial color="#ff7a59" />
        </mesh>
        <mesh position={[0.32, 0.7, 0]} rotation={[0, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 10]} />
          <meshStandardMaterial color="#ff7a59" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.15, 0.05]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#f4cfa5" />
        </mesh>

        {/* Cartoon face overlay — billboards toward the camera, only when faceSwap is on. */}
        {faceSwap && (
          <Html position={[0, 1.15, 0.05]} center distanceFactor={4} zIndexRange={[10, 0]}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ffe17a 0%, #f6a500 80%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '52px',
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none',
                boxShadow: '0 0 20px rgba(255, 200, 50, 0.8)',
                transform: 'translateZ(0)',
              }}
            >
              🤪
            </div>
          </Html>
        )}
      </group>

      {/* Foam/spray particles in world space — they reference the wave surface, not the surfer. */}
      {sprayParticles.map((p, i) => (
        <mesh
          key={p.key}
          ref={(el) => {
            if (el) sprayRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}
