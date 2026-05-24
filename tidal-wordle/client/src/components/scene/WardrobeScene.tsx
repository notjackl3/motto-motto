import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SkyAndLighting from './SkyAndLighting';
import Wave from './Wave';
import {
  getBoard,
  getHat,
  getShirt,
  getShorts,
  useAppearanceStore,
  type BoardOption,
  type HatOption,
  type ShirtOption,
  type ShortsOption,
} from '../../stores/appearanceStore';
import { useGameStore } from '../../stores/gameStore';
import { ambientMusic, unlockAudio } from '../../lib/audio';

// Welcome-screen 3D scene. Mirrors the proven WaveScene layout: peach/blue
// gradient skybox, animated wave plane, soft fog. On top of that we render:
//   - 3 palm trees on a small sandy island
//   - a standing mannequin who reflects the appearance store (shirt/shorts/
//     board/hat) — slowly rotating turntable
//   - a wooden sign post on the LEFT side of the island (3D meshes only;
//     the HTML wooden buttons in MainMenu sit on top of these so the labels
//     are crisp and clickable)
//
// Camera is fixed (no OrbitControls) so the 3D signs stay where the HTML
// buttons can be placed on top. No drei <Text>, no <Html> inside the Canvas
// — that combination broke the previous attempt.

export default function WardrobeScene() {
  const musicSwapActive = useGameStore((s) => s.musicSwapActive);
  const musicMuted = useGameStore((s) => s.musicMuted);

  useEffect(() => {
    ambientMusic()?.start();
  }, []);
  useEffect(() => {
    ambientMusic()?.setSwapped(musicSwapActive);
  }, [musicSwapActive]);
  useEffect(() => {
    ambientMusic()?.setMuted(musicMuted);
  }, [musicMuted]);
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows="soft"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 3.5, 9.5], fov: 50 }}
      >
        <SkyAndLighting />
        <Wave />
        <Clouds />
        <DistantSailboat />

        {/* Sandy island the mannequin stands on. */}
        <Island />

        {/* Palm trees flanking the island. */}
        <PalmTree position={[-5.5, -1, 0]} sway={0.05} />
        <PalmTree position={[5.0, -1, -0.5]} sway={-0.07} />
        <PalmTree position={[-3.0, -1, 3.0]} sway={0.04} />

        {/* Mannequin centered on the island. */}
        <Mannequin />

        {/* Wooden sign post on the LEFT — 3D backing for the HTML buttons. */}
        <SignPost />

        {/* Wardrobe display frame on the RIGHT — 3D backing for the panel. */}
        <DisplayFrame />
      </Canvas>
    </div>
  );
}

// ---------- Island ----------

function Island() {
  return (
    <group position={[0, -0.95, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[5, 6, 0.3, 32]} />
        <meshStandardMaterial color="#f4d9a4" flatShading />
      </mesh>
      {/* Wet-sand ring */}
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <cylinderGeometry args={[6.4, 7, 0.05, 40]} />
        <meshStandardMaterial color="#d8b777" flatShading />
      </mesh>
      {/* Small sand piles around the edges. */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 3.8 + (i % 2) * 0.6;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        return (
          <mesh key={i} position={[x, 0.16, z]} castShadow rotation={[0, i, 0]}>
            <coneGeometry args={[0.3, 0.18, 6]} />
            <meshStandardMaterial color="#e7c887" flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- Clouds (sphere clusters) ----------

function Clouds() {
  const clouds = useMemo(
    () => [
      { x: -12, y: 8, z: -22, s: 2.2 },
      { x: 14, y: 10, z: -26, s: 2.8 },
      { x: 2, y: 12, z: -40, s: 3.4 },
      { x: -22, y: 9, z: -34, s: 2.0 },
      { x: 24, y: 13, z: -48, s: 2.6 },
    ],
    [],
  );
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      c.position.x = clouds[i].x + Math.sin(t * 0.05 + i) * 0.6;
    });
  });
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]}>
          <mesh>
            <sphereGeometry args={[c.s, 10, 10]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
          <mesh position={[c.s * 0.8, -c.s * 0.15, 0]}>
            <sphereGeometry args={[c.s * 0.75, 10, 10]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
          <mesh position={[-c.s * 0.8, -c.s * 0.1, 0.2]}>
            <sphereGeometry args={[c.s * 0.65, 10, 10]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Distant sailboat ----------

function DistantSailboat() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = -20 + ((t * 0.6) % 50) - 5;
    ref.current.position.y = -0.8 + Math.sin(t * 1.5) * 0.06;
    ref.current.rotation.z = Math.sin(t * 1.5) * 0.04;
  });
  return (
    <group ref={ref} position={[-20, -0.8, -28]}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.3, 0.5]} />
        <meshStandardMaterial color="#d6553a" flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
        <meshStandardMaterial color="#3a2a1a" flatShading />
      </mesh>
      <mesh position={[0.3, 1.0, 0]} castShadow>
        <coneGeometry args={[0.55, 1.4, 3]} />
        <meshStandardMaterial color="#fff8e2" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Palm tree ----------

function PalmTree({
  position,
  sway = 0.05,
}: {
  position: [number, number, number];
  sway?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.7 + position[0]) * sway;
  });
  const segs = 5;
  return (
    <group ref={ref} position={position}>
      {Array.from({ length: segs }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 0.4) * 0.1, i * 0.85, 0]}
          rotation={[0, 0, Math.sin(i * 0.4) * 0.05]}
          castShadow
        >
          <cylinderGeometry args={[0.16 - i * 0.015, 0.18 - i * 0.015, 0.9, 8]} />
          <meshStandardMaterial color="#7a4d24" flatShading />
        </mesh>
      ))}
      {/* Crown */}
      <group position={[0, segs * 0.85 + 0.05, 0]}>
        {/* Coconuts */}
        {[
          [-0.12, 0, 0.05],
          [0.12, 0, -0.05],
          [0, 0.05, -0.12],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#3a2a1a" flatShading />
          </mesh>
        ))}
        {/* Fronds */}
        {Array.from({ length: 7 }).map((_, i) => {
          const angle = (i / 7) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.4, 0.05, Math.sin(angle) * 0.4]}
              rotation={[Math.sin(angle) * 0.6, angle, Math.cos(angle) * 0.6 - 0.5]}
              castShadow
            >
              <coneGeometry args={[0.22, 1.4, 4]} />
              <meshStandardMaterial color="#3a8a3a" flatShading />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ---------- Mannequin (standing, holding upright board) ----------

function Mannequin() {
  const ref = useRef<THREE.Group>(null);

  const shirt = getShirt(useAppearanceStore((s) => s.shirtId));
  const shorts = getShorts(useAppearanceStore((s) => s.shortsId));
  const board = getBoard(useAppearanceStore((s) => s.boardId));
  const hat = getHat(useAppearanceStore((s) => s.hatId));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.25;
      ref.current.position.y = 0.6 + Math.sin(t * 1.0) * 0.02;
    }
  });

  const SKIN = '#f0caa0';

  return (
    <group ref={ref} position={[0, 0.6, 0]}>
      {/* Wooden turntable */}
      <mesh position={[0, -1.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.12, 24]} />
        <meshStandardMaterial color="#a06a3a" flatShading />
      </mesh>
      <mesh position={[0, -0.99, 0]} receiveShadow>
        <cylinderGeometry args={[0.93, 0.93, 0.02, 24]} />
        <meshStandardMaterial color="#c4884c" flatShading />
      </mesh>

      <Legs shorts={shorts} skin={SKIN} />

      {/* Waistband */}
      <mesh position={[0, -0.16, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.26, 0.16, 14]} />
        <meshStandardMaterial color={shorts.color} flatShading />
      </mesh>

      <Torso shirt={shirt} />

      {/* Head + neck */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 10]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <sphereGeometry args={[0.23, 18, 16]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.95, 0.2]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.08, 0.95, 0.2]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* Smile */}
      <mesh position={[0, 0.83, 0.21]}>
        <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#3a2a1a" />
      </mesh>
      {/* Hair if no hat / visor */}
      {(hat.style === 'none' || hat.style === 'visor') && (
        <mesh position={[0, 1.06, -0.02]} castShadow>
          <sphereGeometry args={[0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2a1a0a" flatShading />
        </mesh>
      )}
      <Hat hat={hat} />

      <Arms shirt={shirt} skin={SKIN} />

      {/* Surfboard upright next to surfer */}
      <group position={[0.9, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <BoardMesh board={board} />
      </group>
    </group>
  );
}

function Legs({ shorts, skin }: { shorts: ShortsOption; skin: string }) {
  const isLong = shorts.id === 'black-wetsuit';
  const legHeight = isLong ? 1.3 : 0.85;
  const legY = isLong ? -0.85 : -0.6;
  return (
    <group>
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <mesh position={[sign * 0.18, legY, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, legHeight, 12]} />
            <meshStandardMaterial color={shorts.color} flatShading />
          </mesh>
          {!isLong && (
            <mesh position={[sign * 0.18, legY - 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.115, 0.115, 0.6, 12]} />
              <meshStandardMaterial color={skin} flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function Torso({ shirt }: { shirt: ShirtOption }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.7, 16]} />
        <meshStandardMaterial color={shirt.color} flatShading />
      </mesh>
      <TorsoPattern shirt={shirt} />
    </group>
  );
}

function TorsoPattern({ shirt }: { shirt: ShirtOption }) {
  if (shirt.pattern === 'solid') return null;
  if (shirt.pattern === 'stripes-h') {
    return (
      <group>
        {[0.5, 0.34, 0.18].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[0.273, 0.282, 0.06, 16]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'stripes-v') {
    return (
      <group>
        {[-0.06, 0.06].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.28]} castShadow>
            <boxGeometry args={[0.035, 0.65, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'spots') {
    const spots: Array<[number, number, number]> = [];
    [0.5, 0.34, 0.18, 0.02].forEach((y, idx) => {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + (idx % 2) * (Math.PI / 5);
        const r = 0.285;
        spots.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
      }
    });
    return (
      <group>
        {spots.map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'emblem') {
    return (
      <group position={[0, 0.4, 0.27]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.18, 0.02]} />
          <meshStandardMaterial color={shirt.accent} flatShading />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.05, 0.02]} />
          <meshStandardMaterial color={shirt.accent} flatShading />
        </mesh>
      </group>
    );
  }
  if (shirt.pattern === 'racing') {
    return (
      <group>
        {[-0.09, 0.09].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.28]} castShadow>
            <boxGeometry args={[0.08, 0.7, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

function Arms({ shirt, skin }: { shirt: ShirtOption; skin: string }) {
  const isTank = shirt.cut === 'tank';
  const isRashguard = shirt.cut === 'rashguard';
  return (
    <group>
      {/* LEFT arm, hangs at side */}
      <mesh position={[-0.32, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {!isTank && (
        <mesh position={[-0.34, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.08, isRashguard ? 0.55 : 0.3, 10]} />
          <meshStandardMaterial color={shirt.color} flatShading />
        </mesh>
      )}
      <mesh
        position={[-0.36, isRashguard ? -0.18 : isTank ? 0.18 : -0.05, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.08, 0.078, isRashguard ? 0.32 : isTank ? 0.7 : 0.4, 10]}
        />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[-0.36, -0.42, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>

      {/* RIGHT arm bent up, hand on top of vertical board */}
      <mesh position={[0.32, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {/* Upper arm angled out */}
      <mesh position={[0.44, 0.4, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.085, 0.08, 0.3, 10]} />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {/* Elbow */}
      <mesh position={[0.6, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial
          color={isRashguard ? shirt.color : skin}
          flatShading
        />
      </mesh>
      {/* Forearm up-out */}
      <mesh position={[0.75, 0.55, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.5, 10]} />
        <meshStandardMaterial
          color={isRashguard ? shirt.color : skin}
          flatShading
        />
      </mesh>
      <mesh position={[0.88, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
    </group>
  );
}

function Hat({ hat }: { hat: HatOption }) {
  if (hat.style === 'none' || hat.color === null) return null;
  if (hat.style === 'straw') {
    return (
      <group position={[0, 1.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.18, 18]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        {hat.accent && (
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.245, 0.245, 0.03, 18]} />
            <meshStandardMaterial color={hat.accent} flatShading />
          </mesh>
        )}
      </group>
    );
  }
  if (hat.style === 'bucket') {
    return (
      <group position={[0, 1.08, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.05, 22]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.27, 0.22, 22]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
      </group>
    );
  }
  if (hat.style === 'snapback') {
    return (
      <group position={[0, 1.06, 0]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0.02, -0.32]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.3]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
      </group>
    );
  }
  // visor
  return (
    <group position={[0, 1.05, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.24, 0.04, 8, 18]} />
        <meshStandardMaterial color={hat.color} flatShading />
      </mesh>
    </group>
  );
}

// ---------- Surfboard ----------

function BoardMesh({ board }: { board: BoardOption }) {
  const isLong = board.shape === 'longboard';
  const isFish = board.shape === 'fish';
  const isGun = board.shape === 'gun';
  const width = isFish ? 0.62 : isGun ? 0.42 : isLong ? 0.55 : 0.5;
  const length = isLong ? 2.4 : isGun ? 2.3 : 1.9;
  const noseLen = isLong ? 0.4 : isGun ? 0.7 : 0.55;
  const noseRadius = isGun ? 0.13 : isLong ? 0.3 : 0.26;
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[width, 0.07, length]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>
      <mesh position={[-(width / 2 - 0.04), 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.85]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      <mesh position={[width / 2 - 0.04, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.85]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      <mesh position={[0, 0, -(length / 2 + noseLen / 2 - 0.05)]}>
        <coneGeometry args={[noseRadius, noseLen, 4]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.08, 0.012, length * 0.9]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
      <BoardAccent board={board} length={length} width={width} />
      {isFish ? (
        <group position={[0, -0.04, length / 2 - 0.05]}>
          <mesh position={[-0.12, 0, 0.08]} rotation={[0, 0.4, 0]}>
            <coneGeometry args={[0.08, 0.24, 4]} />
            <meshStandardMaterial color={board.finColor} flatShading />
          </mesh>
          <mesh position={[0.12, 0, 0.08]} rotation={[0, -0.4, 0]}>
            <coneGeometry args={[0.08, 0.24, 4]} />
            <meshStandardMaterial color={board.finColor} flatShading />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, -0.1, length / 2 - 0.1]}>
          <coneGeometry args={[0.08, 0.22, 4]} />
          <meshStandardMaterial color={board.finColor} flatShading />
        </mesh>
      )}
    </group>
  );
}

function BoardAccent({
  board,
  length,
  width,
}: {
  board: BoardOption;
  length: number;
  width: number;
}) {
  if (board.pattern === 'double-stripe') {
    return (
      <group>
        <mesh position={[-0.08, 0.041, 0]}>
          <boxGeometry args={[0.04, 0.012, length * 0.9]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
        <mesh position={[0.08, 0.041, 0]}>
          <boxGeometry args={[0.04, 0.012, length * 0.9]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
      </group>
    );
  }
  if (board.pattern === 'tip-block') {
    return (
      <mesh position={[0, 0.041, -length / 3]}>
        <boxGeometry args={[width * 0.7, 0.012, length / 3]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
    );
  }
  if (board.pattern === 'spots') {
    return (
      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const z = -length / 2 + 0.2 + i * (length / 9);
          const x = i % 2 === 0 ? -0.1 : 0.1;
          return (
            <mesh key={i} position={[x, 0.041, z]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={board.stripe} flatShading />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (board.pattern === 'flame') {
    return (
      <mesh position={[0, 0.041, -length / 2 + 0.2]}>
        <coneGeometry args={[0.15, 0.4, 5]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
    );
  }
  if (board.pattern === 'checker') {
    return (
      <group>
        {Array.from({ length: 12 }).map((_, i) => {
          const row = Math.floor(i / 2);
          const col = i % 2;
          if ((row + col) % 2 !== 0) return null;
          const z = -length / 2 + 0.25 + row * (length / 7);
          const x = (col - 0.5) * 0.18;
          return (
            <mesh key={i} position={[x, 0.042, z]}>
              <boxGeometry args={[0.16, 0.012, length / 8]} />
              <meshStandardMaterial color={board.stripe} flatShading />
            </mesh>
          );
        })}
      </group>
    );
  }
  return null;
}

// ---------- 3D sign post (decorative — HTML buttons sit on top) ----------

function SignPost() {
  return (
    <group position={[-4.5, 0, 1.5]}>
      {/* Vertical post */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 4.0, 8]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      {/* Top crossbar */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[1.8, 0.14, 0.14]} />
        <meshStandardMaterial color="#5a3a1a" flatShading />
      </mesh>
      {/* Three plank signs hanging in column */}
      {[2.7, 1.7, 0.7].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.55, 0.08]} />
            <meshStandardMaterial color="#c08a52" flatShading />
          </mesh>
          {/* Rope to crossbar */}
          <mesh position={[-0.65, 0.35, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
            <meshStandardMaterial color="#caa078" flatShading />
          </mesh>
          <mesh position={[0.65, 0.35, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
            <meshStandardMaterial color="#caa078" flatShading />
          </mesh>
          {/* Nail studs */}
          <mesh position={[-0.7, 0.22, 0.041]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" flatShading />
          </mesh>
          <mesh position={[0.7, 0.22, 0.041]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" flatShading />
          </mesh>
        </group>
      ))}
      {/* Big title plank above */}
      <group position={[0, 4.0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.7, 0.08]} />
          <meshStandardMaterial color="#d6b07a" flatShading />
        </mesh>
        <mesh position={[0, 0, 0.041]}>
          <boxGeometry args={[2.05, 0.55, 0.005]} />
          <meshStandardMaterial color="#7a4d24" flatShading />
        </mesh>
      </group>
    </group>
  );
}

// ---------- Wardrobe display frame (right side, 3D backing) ----------

function DisplayFrame() {
  return (
    <group position={[5.5, 1.5, 0]}>
      {/* Posts */}
      <mesh position={[-1.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 4.6, 8]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      <mesh position={[1.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 4.6, 8]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      {/* Cross beam */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[3.4, 0.18, 0.18]} />
        <meshStandardMaterial color="#5a3a1a" flatShading />
      </mesh>
      {/* Thatched roof */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[2.2, 0.9, 4]} />
        <meshStandardMaterial color="#a87a3a" flatShading />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <coneGeometry args={[1.6, 0.6, 4]} />
        <meshStandardMaterial color="#c08a52" flatShading />
      </mesh>
      {/* Inset frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.0, 3.0, 0.1]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.052]}>
        <boxGeometry args={[2.78, 2.78, 0.01]} />
        <meshStandardMaterial color="#f4e1c1" flatShading />
      </mesh>
    </group>
  );
}
