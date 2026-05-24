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
  /** Per-particle opacity multiplier. White/near-white particles render
   *  more translucent so the board's signature palette colours read
   *  more clearly against the rest of the scene. */
  opacityFactor: number;
}

/** ~0.35 for white-ish particles (R,G,B all >= 0xe0), 1.0 otherwise. */
function whiteOpacityFactor(hex: string): number {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return r >= 0xe0 && g >= 0xe0 && b >= 0xe0 ? 0.35 : 1;
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
      Array.from({ length: config.count }).map(() => {
        const color =
          config.palette[Math.floor(Math.random() * config.palette.length)];
        return {
          baseX: (Math.random() - 0.5) * 0.7 * scale,
          baseY: (-0.9 + Math.random() * 1.6) * scale,
          baseZ: (Math.random() - 0.5) * 0.4 * scale,
          speed: 0.4 + Math.random() * 0.6,
          amplitude: (0.15 + Math.random() * 0.4) * scale,
          phase: Math.random() * Math.PI * 2,
          size:
            (config.minSize +
              Math.random() * (config.maxSize - config.minSize)) *
            scale,
          color,
          opacityFactor: whiteOpacityFactor(color),
        };
      }),
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
      mat.opacity =
        visRef.current * (1 - lifeT) * config.opacity * p.opacityFactor;
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
      return {
        count: 22,
        palette: ['#ffffff', '#f4e1c1', '#caa078'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.5,
        opacity: 0.7,
      };

    case 'cosmic-blue':
      return {
        count: 30,
        palette: ['#1f3a93', '#3aa8c0', '#ffffff'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.7,
        opacity: 0.8,
        emissive: '#3aa8c0',
        emissiveIntensity: 0.4,
      };
    case 'sunset-reef':
      return {
        count: 26,
        palette: ['#ffb27f', '#ff5a5a', '#ff8a3c'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.6,
        opacity: 0.85,
        emissive: '#ff8a3c',
        emissiveIntensity: 0.3,
      };
    case 'aloha-spirit':
      return {
        count: 28,
        palette: ['#ffe066', '#d92b2b', '#4fb56d'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.7,
        opacity: 0.9,
      };
    case 'stealth-black':
      return {
        count: 30,
        palette: ['#0a0a0a', '#5a5a5a', '#2a2a2a'],
        shape: 'sphere',
        minSize: 0.06,
        maxSize: 0.13,
        rise: 1.2,
        opacity: 0.55,
      };
    case 'citrus-splash':
      return {
        count: 28,
        palette: ['#c0ff00', '#ff8a3c', '#ffd166'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.09,
        rise: 1.8,
        opacity: 0.9,
        emissive: '#c0ff00',
        emissiveIntensity: 0.35,
      };
    case 'royal-tide':
      return {
        count: 26,
        palette: ['#1f3a93', '#f1c43c', '#dfe7ef'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.09,
        rise: 1.5,
        opacity: 0.8,
        emissive: '#f1c43c',
        emissiveIntensity: 0.3,
      };
    case 'volcano':
      return {
        count: 34,
        palette: ['#7a0000', '#ff4f00', '#1a1a1a'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.12,
        rise: 2.0,
        opacity: 0.85,
        emissive: '#ff4f00',
        emissiveIntensity: 0.6,
      };
    case 'floral-daze':
      return {
        count: 28,
        palette: ['#ff8eb4', '#fff4e6', '#4fb56d'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.4,
        opacity: 0.9,
      };
    case 'lightning':
      return {
        count: 32,
        palette: ['#f1c43c', '#ffffff', '#0077b6'],
        shape: 'box',
        minSize: 0.03,
        maxSize: 0.07,
        rise: 2.2,
        opacity: 0.95,
        emissive: '#f1c43c',
        emissiveIntensity: 0.8,
      };
    case 'ice-cap':
      return {
        count: 30,
        palette: ['#e0f4fc', '#3aa8c0', '#ffffff'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.3,
        opacity: 0.7,
        emissive: '#e0f4fc',
        emissiveIntensity: 0.25,
      };
    case 'forest-wave':
      return {
        count: 26,
        palette: ['#355e3b', '#7a4d24', '#cda63a'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.4,
        opacity: 0.75,
      };
    case 'magenta-dream':
      return {
        count: 34,
        palette: ['#c71585', '#ffffff', '#44ffee'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.8,
        opacity: 0.9,
        emissive: '#c71585',
        emissiveIntensity: 0.55,
      };
    case 'sunburst':
      return {
        count: 30,
        palette: ['#ffe066', '#ff4500', '#d92b2b'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.8,
        opacity: 0.92,
        emissive: '#ff4500',
        emissiveIntensity: 0.5,
      };
    case 'galaxy-surf':
      return {
        count: 40,
        palette: ['#3a1a5a', '#ff44dd', '#44ffee'],
        shape: 'box',
        minSize: 0.03,
        maxSize: 0.07,
        rise: 2.2,
        opacity: 0.95,
        emissive: '#ff44dd',
        emissiveIntensity: 0.85,
      };
    case 'coral-reef':
      return {
        count: 26,
        palette: ['#ff7a59', '#d92b2b', '#3aa8c0'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.5,
        opacity: 0.85,
      };
    case 'sea-foam':
      return {
        count: 28,
        palette: ['#98ff98', '#ffffff', '#0077b6'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.4,
        opacity: 0.75,
      };
    case 'tiger-stripe':
      return {
        count: 28,
        palette: ['#ff8a3c', '#0a0a0a', '#ffffff'],
        shape: 'box',
        minSize: 0.04,
        maxSize: 0.09,
        rise: 1.6,
        opacity: 0.85,
      };
    case 'plum-wave':
      return {
        count: 26,
        palette: ['#8e44ad', '#f1c43c', '#ffb7c5'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.1,
        rise: 1.5,
        opacity: 0.85,
        emissive: '#8e44ad',
        emissiveIntensity: 0.3,
      };
    case 'sandstorm':
      return {
        count: 36,
        palette: ['#d8b777', '#6a4a25', '#ff8a3c'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.12,
        rise: 1.3,
        opacity: 0.65,
      };
    case 'bubblegum':
      return {
        count: 26,
        palette: ['#ff8eb4', '#ffffff', '#c71585'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.11,
        rise: 1.5,
        opacity: 0.92,
      };
    case 'pirate-black':
      return {
        count: 30,
        palette: ['#0a0a0a', '#d92b2b', '#5a5a5a'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.12,
        rise: 1.3,
        opacity: 0.7,
      };
    case 'lemon-shark':
      return {
        count: 28,
        palette: ['#fde047', '#0a0a0a', '#ffffff'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.09,
        rise: 1.6,
        opacity: 0.9,
        emissive: '#fde047',
        emissiveIntensity: 0.3,
      };
    case 'atlantis':
      return {
        count: 32,
        palette: ['#1f3a93', '#f1c43c', '#3aa8c0'],
        shape: 'sphere',
        minSize: 0.04,
        maxSize: 0.08,
        rise: 1.7,
        opacity: 0.85,
        emissive: '#3aa8c0',
        emissiveIntensity: 0.4,
      };
    case 'phoenix':
      return {
        count: 36,
        palette: ['#d92b2b', '#ff8a3c', '#f1c43c'],
        shape: 'sphere',
        minSize: 0.05,
        maxSize: 0.11,
        rise: 2.0,
        opacity: 0.92,
        emissive: '#ff4500',
        emissiveIntensity: 0.7,
      };

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
