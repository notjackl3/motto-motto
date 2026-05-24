import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BoardOption } from '../../stores/appearanceStore';

// Per-board particle effect. Used in two places:
//   - WardrobeScene (welcome screen) when the BOARD tab is focused
//   - BodyRig (in-game first-person body+board) — always active so the
//     player's chosen board carries its visual flavor into gameplay
//
// Particles spawn around the parent group's local origin and drift along
// local +Y. The parent is whoever places this component — board's local
// frame in both cases — so the rising motion shows above the deck.

interface ParticleSeed {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  amplitude: number;
  phase: number;
  size: number;
  color: string;
}

interface Props {
  board: BoardOption;
  active: boolean;
  /** Optional spread override — default 0.7×0.4×1.6 box around origin. */
  scale?: number;
}

export default function BoardParticles({ board, active, scale = 1 }: Props) {
  const refs = useRef<THREE.Mesh[]>([]);
  const ref = useRef<THREE.Group>(null);
  const visRef = useRef(0);

  const config = useMemo(() => boardParticleConfig(board), [board]);

  const seeds = useMemo<ParticleSeed[]>(
    () =>
      Array.from({ length: config.count }).map(() => ({
        baseX: (Math.random() - 0.5) * 0.7 * scale,
        baseY: (-0.9 + Math.random() * 1.6) * scale,
        baseZ: (Math.random() - 0.5) * 0.4 * scale,
        speed: 0.4 + Math.random() * 0.6,
        amplitude: (0.15 + Math.random() * 0.4) * scale,
        phase: Math.random() * Math.PI * 2,
        size:
          (config.minSize + Math.random() * (config.maxSize - config.minSize)) *
          scale,
        color:
          config.palette[Math.floor(Math.random() * config.palette.length)],
      })),
    [config, scale],
  );

  useFrame((state) => {
    if (!ref.current) return;
    visRef.current += ((active ? 1 : 0) - visRef.current) * 0.1;
    ref.current.visible = visRef.current > 0.01;
    const t = state.clock.elapsedTime;
    seeds.forEach((p, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const phase = (t * p.speed + p.phase) % 1.6;
      const lifeT = phase / 1.6;
      const y = p.baseY + lifeT * config.rise * scale;
      const x = p.baseX + Math.sin(t * 1.5 + p.phase) * p.amplitude;
      const z = p.baseZ + Math.cos(t * 1.2 + p.phase) * p.amplitude * 0.5;
      mesh.position.set(x, y, z);
      const s = visRef.current * p.size * (1 - lifeT * 0.4);
      mesh.scale.setScalar(Math.max(0.001, s));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = visRef.current * (1 - lifeT) * config.opacity;
    });
  });

  return (
    <group ref={ref}>
      {seeds.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          position={[p.baseX, p.baseY, p.baseZ]}
        >
          {config.shape === 'sphere' ? (
            <sphereGeometry args={[1, 8, 8]} />
          ) : (
            <boxGeometry args={[1, 1, 1]} />
          )}
          <meshStandardMaterial
            color={p.color}
            transparent
            opacity={config.opacity}
            emissive={config.emissive ?? '#000000'}
            emissiveIntensity={config.emissiveIntensity ?? 0}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

export function boardParticleConfig(board: BoardOption): {
  count: number;
  palette: string[];
  shape: 'sphere' | 'box';
  minSize: number;
  maxSize: number;
  rise: number;
  opacity: number;
  emissive?: string;
  emissiveIntensity?: number;
} {
  switch (board.id) {
    case 'tropical-sunset':
      return {
        count: 28,
        palette: ['#ff8a3c', '#ffd166', '#ff5a5a'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.09,
        rise: 1.8,
        opacity: 0.85,
        emissive: '#ff8a3c',
        emissiveIntensity: 0.35,
      };
    case 'ocean-camo':
      return {
        count: 30,
        palette: ['#3aa8c0', '#6fb8c8', '#ffffff'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.4,
        opacity: 0.7,
        emissive: '#3aa8c0',
        emissiveIntensity: 0.2,
      };
    case 'pineapple-express':
      return {
        count: 26,
        palette: ['#ffe066', '#4fb56d', '#ff8a3c'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.6,
        opacity: 0.9,
      };
    case 'shark-bite':
      return {
        count: 32,
        palette: ['#dfe7ef', '#9aa3ad', '#5a5a5a'],
        shape: 'sphere',
        minSize: 0.06,
        maxSize: 0.14,
        rise: 1.2,
        opacity: 0.55,
      };
    case 'neon-night':
      return {
        count: 36,
        palette: ['#ff44dd', '#44ffee', '#a070ff'],
        shape: 'box',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 2.0,
        opacity: 0.95,
        emissive: '#ff44dd',
        emissiveIntensity: 0.9,
      };
    case 'classic-cream':
    default:
      return {
        count: 22,
        palette: ['#ffffff', '#f4e1c1', '#caa078'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.5,
        opacity: 0.7,
      };
  }
}
