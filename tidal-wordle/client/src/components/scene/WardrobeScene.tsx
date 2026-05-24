import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import SkyAndLighting from './SkyAndLighting';
import {
  getBoard,
  getHat,
  getShirt,
  getShorts,
  useAppearanceStore,
  type BoardOption,
  type ShirtOption,
  type ShortsOption,
} from '../../stores/appearanceStore';
import { useGameStore } from '../../stores/gameStore';
import { ambientMusic, unlockAudio } from '../../lib/audio';

// Wardrobe scene — the welcome screen 3D world.
//
// A wooden cabana platform on a sandbar at golden hour. The player's
// character stands on a rotating turntable so the player can preview
// their outfit from every angle. A palm-frond canopy frames the top,
// tiki torches flicker either side, and three surfboards lean on a
// rack behind.
//
// Same flat-shaded, vector-cartoon aesthetic as WaveScene/PlayScene:
// faceted geometry, peach/blue gradient sky from SkyAndLighting, soft fog.
//
// The cabana is shifted +X so it renders in the right half of the screen,
// leaving the left half open for the menu UI overlay.

const WORLD_X = 2.4;

interface Props {
  onSolo: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
}

export default function WardrobeScene({ onSolo, onMultiplayer, onSettings }: Props) {
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
    <div className="absolute inset-0 -z-10">
      <Canvas
        shadows="soft"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [WORLD_X + 1.5, 2.8, 9.5], fov: 50 }}
      >
        <SkyAndLighting />

        {/* Open ocean stretching to the horizon — animates with vertex displacement. */}
        <OceanPlane />
        <Clouds />
        <DistantSailboat />
        <Seagulls />

        {/* 3D wooden menu signs on the LEFT side of the island. */}
        <MenuSignPost
          onSolo={onSolo}
          onMultiplayer={onMultiplayer}
          onSettings={onSettings}
        />

        {/* Wardrobe display rack — visual anchor for the HTML wardrobe panel. */}
        <group position={[WORLD_X, 0, 0]}>
          <WardrobeDisplayRack />
        </group>

        <group position={[WORLD_X, 0, 0]}>
          {/* Island sandbar — larger, more island-feeling. */}
          <mesh position={[0, -0.8, 0]} receiveShadow>
            <cylinderGeometry args={[11, 14, 0.5, 36]} />
            <meshStandardMaterial color="#f4d9a4" flatShading />
          </mesh>
          {/* Wet-sand ring just above the water line for a beach edge. */}
          <mesh position={[0, -1.04, 0]} receiveShadow>
            <cylinderGeometry args={[14.5, 15.5, 0.1, 40]} />
            <meshStandardMaterial color="#d8b777" flatShading />
          </mesh>

          <PalmTree position={[-5.5, -0.55, -1.5]} sway={0.05} />
          <PalmTree position={[6.0, -0.55, 0.5]} sway={-0.07} />
          <PalmTree position={[-3.0, -0.55, 3.0]} sway={0.04} />

          <CabanaPlatform />
          <BoardRack />
          <TikiTorch position={[-2.6, 0, 0.5]} />
          <TikiTorch position={[2.6, 0, 0.5]} />
          <PalmCanopy />
          <SandPiles />
          <BeachUmbrella position={[-4.0, -0.4, 2.5]} />
          <Starfish position={[-3.5, -0.6, -3.6]} />
          <Seashell position={[3.5, -0.6, -4.0]} />

          <Mannequin />
        </group>

      </Canvas>
    </div>
  );
}

// --- Mannequin ---
//
// A stylized Surfer pose: head, torso, arms, legs, surfboard tucked under
// arm. Reads colors live from the appearance store so swatch clicks update
// instantly. Slowly rotates so the player sees all sides.
function Mannequin() {
  const groupRef = useRef<THREE.Group>(null);

  const shirtId = useAppearanceStore((s) => s.shirtId);
  const shortsId = useAppearanceStore((s) => s.shortsId);
  const boardId = useAppearanceStore((s) => s.boardId);
  const hatId = useAppearanceStore((s) => s.hatId);

  const shirt = getShirt(shirtId);
  const shorts = getShorts(shortsId);
  const board = getBoard(boardId);
  const hat = getHat(hatId);

  // Mannequin stands tall on the turntable. The board stands upright to the
  // right; the right hand rests on top of it (classic showcase pose). The
  // platform rotates slowly so the player can preview all angles.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.25;
      // Very subtle vertical breath — keep the pose feeling alive, not bobbing.
      groupRef.current.position.y = 0.6 + Math.sin(t * 1.0) * 0.015;
    }
  });

  const SKIN = '#f0caa0';

  return (
    <group ref={groupRef} position={[0, 0.6, 0]}>
      {/* Wooden turntable under the mannequin. */}
      <mesh position={[0, -1.05, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.1, 24]} />
        <meshStandardMaterial color="#a06a3a" flatShading />
      </mesh>
      <mesh position={[0, -0.99, 0]} receiveShadow>
        <cylinderGeometry args={[0.92, 0.92, 0.02, 24]} />
        <meshStandardMaterial color="#c4884c" flatShading />
      </mesh>

      <ShortsPiece shorts={shorts} />

      {/* Hips waistband */}
      <mesh position={[0, -0.16, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.26, 0.16, 14]} />
        <meshStandardMaterial color={shorts.color} flatShading />
      </mesh>

      <TorsoPiece shirt={shirt} skin={SKIN} />

      {/* Neck + Head */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 10]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <sphereGeometry args={[0.23, 18, 16]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <Eye x={-0.08} />
      <Eye x={0.08} />
      <mesh position={[0, 0.83, 0.21]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#3a2a1a" />
      </mesh>

      {/* Hair — peeks out when no hat or when wearing a visor. */}
      {(hat.style === 'none' || hat.style === 'visor') && (
        <mesh position={[0, 1.06, -0.02]} castShadow>
          <sphereGeometry args={[0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2a1a0a" flatShading />
        </mesh>
      )}

      <HatPiece hat={hat} />

      {/* Surfboard — standing vertically to the right of the surfer, nose
          pointing up. The right hand rests on top of it (see TorsoPiece). */}
      <group position={[0.85, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <DisplayBoard board={board} />
      </group>
    </group>
  );
}

// ---------- Wardrobe display rack (3D anchor for the HTML wardrobe panel) ----------
//
// A tall wooden rack on the FAR-RIGHT of the island, where the HTML wardrobe
// panel visually sits. Has a thatched roof, two posts, a wood frame around an
// inset "paper" panel and a "Wardrobe" plaque on top. The HTML overlay aligns
// with this rack on screen so the two read as one piece of beach signage.

function WardrobeDisplayRack() {
  return (
    <group position={[7.0, 0, -0.5]}>
      {/* Left post */}
      <mesh position={[-1.5, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 4.6, 8]} />
        <meshStandardMaterial color="#6a4a25" flatShading />
      </mesh>
      {/* Right post */}
      <mesh position={[1.5, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 4.6, 8]} />
        <meshStandardMaterial color="#6a4a25" flatShading />
      </mesh>
      {/* Cross beam at the top */}
      <mesh position={[0, 4.0, 0]} castShadow>
        <boxGeometry args={[3.4, 0.18, 0.18]} />
        <meshStandardMaterial color="#5a3a1a" flatShading />
      </mesh>
      {/* Thatched roof over the rack */}
      <mesh position={[0, 4.45, 0]} castShadow>
        <coneGeometry args={[2.2, 0.9, 4]} />
        <meshStandardMaterial color="#a87a3a" flatShading />
      </mesh>
      <mesh position={[0, 4.85, 0]} castShadow>
        <coneGeometry args={[1.6, 0.6, 4]} />
        <meshStandardMaterial color="#c08a52" flatShading />
      </mesh>

      {/* Plaque at the top with the word "WARDROBE" carved in. */}
      <group position={[0, 3.6, 0.12]}>
        <mesh castShadow>
          <boxGeometry args={[2.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#caa078" flatShading />
        </mesh>
        <mesh position={[0, 0, 0.052]}>
          <boxGeometry args={[1.95, 0.36, 0.005]} />
          <meshStandardMaterial color="#7a4d24" flatShading />
        </mesh>
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.22}
          color="#2a1a0a"
          fontWeight="bold"
          letterSpacing={0.1}
          outlineWidth={0.005}
          outlineColor="#6a3a1a"
          anchorY="middle"
          anchorX="center"
        >
          WARDROBE
        </Text>
      </group>

      {/* Inset wooden frame the HTML panel visually fills. */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[3.0, 3.0, 0.1]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      <mesh position={[0, 1.5, 0.052]}>
        <boxGeometry args={[2.78, 2.78, 0.01]} />
        <meshStandardMaterial color="#f4e1c1" flatShading />
      </mesh>

      {/* Hibiscus-style flower carving on the left and a starfish carving on
          the right — purely decorative beach details. */}
      <group position={[-1.05, 3.6, 0.18]}>
        <CarvedFlower color="#d92b2b" />
      </group>
      <group position={[1.05, 3.6, 0.18]}>
        <CarvedStarfish color="#ff8a3c" />
      </group>

      {/* Small ladder-like shelf bracket details. */}
      {[0.3, -0.8].map((y, i) => (
        <mesh key={i} position={[0, y, -0.06]} castShadow>
          <boxGeometry args={[2.8, 0.06, 0.08]} />
          <meshStandardMaterial color="#5a3a1a" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function CarvedFlower({ color }: { color: string }) {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, 0]}
          >
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        );
      })}
      <mesh>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffd166" flatShading />
      </mesh>
    </group>
  );
}

function CarvedStarfish({ color }: { color: string }) {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2 + Math.PI / 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <coneGeometry args={[0.05, 0.16, 3]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

// ---- Torso with patterns ----

function TorsoPiece({ shirt, skin }: { shirt: ShirtOption; skin: string }) {
  const isTank = shirt.cut === 'tank';
  const isRashguard = shirt.cut === 'rashguard';

  const torsoRadiusTop = 0.26;
  const torsoRadiusBottom = 0.3;
  const torsoHeight = 0.7;

  return (
    <group>
      {/* Base torso. */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry
          args={[torsoRadiusTop, torsoRadiusBottom, torsoHeight, 16]}
        />
        <meshStandardMaterial color={shirt.color} flatShading />
      </mesh>

      <ShirtPattern shirt={shirt} />

      {/* Arms. Sleeveless tanks show skin; rashguards have a full sleeve in
          shirt color; tees have a short sleeve. */}
      <Arm
        side="left"
        shirt={shirt}
        skin={skin}
        isTank={isTank}
        isRashguard={isRashguard}
      />
      <Arm
        side="right"
        shirt={shirt}
        skin={skin}
        isTank={isTank}
        isRashguard={isRashguard}
      />
    </group>
  );
}

function Arm({
  side,
  shirt,
  skin,
  isTank,
  isRashguard,
}: {
  side: 'left' | 'right';
  shirt: ShirtOption;
  skin: string;
  isTank: boolean;
  isRashguard: boolean;
}) {
  // Asymmetric showcase pose:
  //   left arm  — hangs straight down at the side
  //   right arm — bent at the elbow, hand resting on top of the upright board
  // Each arm is built as upper segment → forearm → hand so the elbow can bend
  // for the right side without distorting the left.

  if (side === 'left') {
    // Upper arm: vertical, from shoulder straight down.
    // Forearm: continues straight down.
    // Hand: at the hip.
    const sleeveLen = isRashguard ? 0.55 : isTank ? 0 : 0.3;
    return (
      <group>
        {/* Shoulder cap (skin-toned for tanks, shirt-toned otherwise). */}
        <mesh position={[-0.32, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
        </mesh>
        {/* Upper arm */}
        {!isTank && sleeveLen > 0 && (
          <mesh position={[-0.34, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.08, sleeveLen, 10]} />
            <meshStandardMaterial color={shirt.color} flatShading />
          </mesh>
        )}
        {/* Skin segment of the arm. */}
        <mesh
          position={[-0.36, isRashguard ? -0.18 : isTank ? 0.18 : -0.05, 0]}
          castShadow
        >
          <cylinderGeometry
            args={[0.08, 0.078, isRashguard ? 0.32 : isTank ? 0.7 : 0.4, 10]}
          />
          <meshStandardMaterial
            color={isRashguard ? skin : skin}
            flatShading
          />
        </mesh>
        {/* Hand at hip level. */}
        <mesh position={[-0.36, -0.42, 0]} castShadow>
          <sphereGeometry args={[0.09, 12, 10]} />
          <meshStandardMaterial color={skin} flatShading />
        </mesh>
      </group>
    );
  }

  // Right arm — bent at elbow, hand resting on the top of the upright board.
  // Board top is at world-local (mannequin space) y ≈ 0.9 / x ≈ 0.85.
  const shoulder: [number, number, number] = [0.32, 0.5, 0];
  const elbow: [number, number, number] = [0.55, 0.3, 0];
  const hand: [number, number, number] = [0.75, 0.75, 0];

  const upperLen = vecLen(shoulder, elbow);
  const forearmLen = vecLen(elbow, hand);

  const upperMid = midpoint(shoulder, elbow);
  const upperRot = aimRotation(shoulder, elbow);
  const forearmMid = midpoint(elbow, hand);
  const forearmRot = aimRotation(elbow, hand);

  const upperColor = isTank ? skin : shirt.color;
  const forearmColor = isRashguard ? shirt.color : skin;

  return (
    <group>
      <mesh position={shoulder} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {/* Upper arm segment from shoulder to elbow. */}
      <mesh position={upperMid} rotation={upperRot} castShadow>
        <cylinderGeometry args={[0.085, 0.08, upperLen, 10]} />
        <meshStandardMaterial color={upperColor} flatShading />
      </mesh>
      {/* Forearm segment from elbow to hand. */}
      <mesh position={forearmMid} rotation={forearmRot} castShadow>
        <cylinderGeometry args={[0.075, 0.075, forearmLen, 10]} />
        <meshStandardMaterial color={forearmColor} flatShading />
      </mesh>
      {/* Elbow joint. */}
      <mesh position={elbow} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={forearmColor} flatShading />
      </mesh>
      {/* Hand on board top. */}
      <mesh position={hand} castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
    </group>
  );
}

function vecLen(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

function midpoint(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function aimRotation(
  from: [number, number, number],
  to: [number, number, number],
): [number, number, number] {
  // Returns the Euler rotation so a default-up cylinder points from→to.
  const dir = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2],
  ).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}

function ShirtPattern({ shirt }: { shirt: ShirtOption }) {
  // All patterns are extra meshes layered onto the cylindrical torso.
  if (shirt.pattern === 'solid') return null;
  if (shirt.pattern === 'stripes-h') {
    // 3 thin horizontal bands.
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
    // Two thin vertical stripes front-and-back.
    return (
      <group>
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.28]} castShadow>
            <boxGeometry args={[0.035, 0.65, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={`b${i}`} position={[x, 0.28, -0.28]} castShadow>
            <boxGeometry args={[0.035, 0.65, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'spots') {
    // Hibiscus-like dots around the torso.
    const spots: Array<[number, number, number]> = [];
    const ring = (y: number, count: number, phase: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + phase;
        const r = 0.285;
        spots.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
      }
    };
    ring(0.5, 5, 0);
    ring(0.34, 5, Math.PI / 5);
    ring(0.18, 5, 0);
    ring(0.02, 5, Math.PI / 5);
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
        {/* White plus / cross emblem — vertical bar + horizontal bar. */}
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
    // Two thick stripes top-to-bottom, front and back.
    return (
      <group>
        {[-0.09, 0.09].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.28]} castShadow>
            <boxGeometry args={[0.08, 0.7, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
        {[-0.09, 0.09].map((x, i) => (
          <mesh key={`b${i}`} position={[x, 0.28, -0.28]} castShadow>
            <boxGeometry args={[0.08, 0.7, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

// ---- Shorts/Pants with patterns ----

function ShortsPiece({ shorts }: { shorts: ShortsOption }) {
  // Long neoprene legs for the black wetsuit; short for everything else.
  const isLong = shorts.id === 'black-wetsuit';
  const legHeight = isLong ? 1.3 : 0.85;
  const legY = isLong ? -0.85 : -0.6;
  return (
    <group>
      <Leg
        side="left"
        shorts={shorts}
        legHeight={legHeight}
        legY={legY}
        isLong={isLong}
      />
      <Leg
        side="right"
        shorts={shorts}
        legHeight={legHeight}
        legY={legY}
        isLong={isLong}
      />
    </group>
  );
}

function Leg({
  side,
  shorts,
  legHeight,
  legY,
  isLong,
}: {
  side: 'left' | 'right';
  shorts: ShortsOption;
  legHeight: number;
  legY: number;
  isLong: boolean;
}) {
  const sign = side === 'left' ? -1 : 1;
  const x = sign * 0.18;
  return (
    <group>
      <mesh position={[x, legY, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, legHeight, 12]} />
        <meshStandardMaterial color={shorts.color} flatShading />
      </mesh>
      <ShortsPatternMesh
        shorts={shorts}
        side={sign}
        legY={legY}
        legHeight={legHeight}
      />
      {/* If not long-leg pants, render the skin below the shorts. */}
      {!isLong && (
        <mesh position={[x, legY - 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.115, 0.115, 0.6, 12]} />
          <meshStandardMaterial color="#f0caa0" flatShading />
        </mesh>
      )}
    </group>
  );
}

function ShortsPatternMesh({
  shorts,
  side,
  legY,
  legHeight,
}: {
  shorts: ShortsOption;
  side: 1 | -1;
  legY: number;
  legHeight: number;
}) {
  const x = side * 0.18;
  if (shorts.pattern === 'solid') return null;
  if (shorts.pattern === 'stripes-side') {
    return (
      <mesh position={[x + side * 0.13, legY, 0]} castShadow>
        <boxGeometry args={[0.02, legHeight * 0.95, 0.06]} />
        <meshStandardMaterial color={shorts.accent} flatShading />
      </mesh>
    );
  }
  if (shorts.pattern === 'stripes-h') {
    // Band near the top of the leg.
    return (
      <mesh position={[x, legY + legHeight / 2 - 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.135, 0.135, 0.05, 14]} />
        <meshStandardMaterial color={shorts.accent} flatShading />
      </mesh>
    );
  }
  if (shorts.pattern === 'spots') {
    return (
      <group>
        {[0.1, -0.1, 0.0].map((dy, i) => (
          <mesh
            key={i}
            position={[x + side * 0.135, legY + dy, 0.05]}
            castShadow
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={shorts.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shorts.pattern === 'floral') {
    return (
      <group>
        {[
          [0, 0.1, 0.13],
          [side * 0.05, -0.05, 0.13],
          [side * -0.04, -0.18, 0.13],
        ].map((p, i) => (
          <Flower
            key={i}
            position={[x + p[0], legY + p[1], p[2]]}
            color={shorts.accent}
          />
        ))}
      </group>
    );
  }
  return null;
}

function Flower({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} rotation={[0, 0, 0]}>
      {/* Center */}
      <mesh castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Petals */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.025, Math.sin(angle) * 0.025, 0]}
            castShadow
          >
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function Eye({ x }: { x: number }) {
  return (
    <mesh position={[x, 0.95, 0.2]}>
      <sphereGeometry args={[0.028, 10, 10]} />
      <meshBasicMaterial color="#1a1a1a" />
    </mesh>
  );
}

function HatPiece({ hat }: { hat: ReturnType<typeof getHat> }) {
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
        {hat.accent && (
          <mesh position={[0, 0.21, 0]}>
            <cylinderGeometry args={[0.262, 0.262, 0.03, 22]} />
            <meshStandardMaterial color={hat.accent} flatShading />
          </mesh>
        )}
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
        {hat.accent && (
          <mesh position={[0, 0.18, 0.21]}>
            <boxGeometry args={[0.1, 0.06, 0.04]} />
            <meshStandardMaterial color={hat.accent} flatShading />
          </mesh>
        )}
      </group>
    );
  }
  if (hat.style === 'visor') {
    return (
      <group position={[0, 1.05, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.24, 0.04, 8, 18]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0, 0.28]} rotation={[0.2, 0, 0]} castShadow>
          <cylinderGeometry
            args={[0.32, 0.32, 0.03, 18, 1, false, -Math.PI / 2, Math.PI]}
          />
          <meshStandardMaterial
            color={hat.color}
            flatShading
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    );
  }
  return null;
}

function DisplayBoard({ board }: { board: BoardOption }) {
  // Board geometry varies by shape:
  //   shortboard: narrow + pointed nose
  //   longboard:  longer + rounder nose
  //   fish:       wider with a forked tail
  //   gun:        long + very narrow
  const isLong = board.shape === 'longboard';
  const isFish = board.shape === 'fish';
  const isGun = board.shape === 'gun';
  const width = isFish ? 0.62 : isGun ? 0.42 : isLong ? 0.55 : 0.5;
  const length = isLong ? 2.4 : isGun ? 2.3 : 1.9;
  const noseLen = isLong ? 0.4 : isGun ? 0.7 : 0.55;
  const noseRadius = isGun ? 0.13 : isLong ? 0.3 : 0.26;
  return (
    <group>
      {/* Deck */}
      <mesh castShadow>
        <boxGeometry args={[width, 0.07, length]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>
      {/* Rails */}
      <mesh position={[-(width / 2 - 0.04), 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.85]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      <mesh position={[width / 2 - 0.04, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.85]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0, -(length / 2 + noseLen / 2 - 0.05)]}>
        <coneGeometry args={[noseRadius, noseLen, 4]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>

      {/* Pattern on the deck */}
      <BoardDeckPattern board={board} length={length} width={width} />

      {/* Tail — single fin for shortboards/longboards, fish-fork for fish. */}
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

function BoardDeckPattern({
  board,
  length,
  width,
}: {
  board: BoardOption;
  length: number;
  width: number;
}) {
  if (board.pattern === 'single-stripe') {
    return (
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.08, 0.012, length * 0.9]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
    );
  }
  if (board.pattern === 'double-stripe') {
    return (
      <group>
        <mesh position={[-0.08, 0.04, 0]}>
          <boxGeometry args={[0.04, 0.012, length * 0.9]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
        <mesh position={[0.08, 0.04, 0]}>
          <boxGeometry args={[0.04, 0.012, length * 0.9]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
      </group>
    );
  }
  if (board.pattern === 'tip-block') {
    return (
      <mesh position={[0, 0.04, -length / 3]}>
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
            <mesh key={i} position={[x, 0.04, z]}>
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
      <group position={[0, 0.04, -length / 2 + 0.2]}>
        <mesh>
          <coneGeometry args={[0.15, 0.4, 5]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
      </group>
    );
  }
  if (board.pattern === 'checker') {
    // 2x6 checker squares along the spine.
    return (
      <group>
        {Array.from({ length: 12 }).map((_, i) => {
          const row = Math.floor(i / 2);
          const col = i % 2;
          if ((row + col) % 2 !== 0) return null;
          const z = -length / 2 + 0.25 + row * (length / 7);
          const x = (col - 0.5) * 0.18;
          return (
            <mesh key={i} position={[x, 0.041, z]}>
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

function CabanaPlatform() {
  return (
    <group position={[0, -0.5, 0]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.06, -1.5 + i * 0.6]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[3.6, 0.08, 0.55]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#b07a44' : '#a06a3a'}
            flatShading
          />
        </mesh>
      ))}
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[3.7, 0.22, 3.7]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      <Post position={[-1.7, 1.1, -1.5]} />
      <Post position={[1.7, 1.1, -1.5]} />
      <Post position={[-1.7, 1.1, 1.5]} />
      <Post position={[1.7, 1.1, 1.5]} />
    </group>
  );
}

function Post({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
        <meshStandardMaterial color="#6a4a25" flatShading />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#8a6a3a" flatShading />
      </mesh>
    </group>
  );
}

function PalmCanopy() {
  return (
    <group position={[0, 1.95, 0]}>
      <mesh castShadow>
        <coneGeometry args={[2.6, 1.0, 4]} />
        <meshStandardMaterial color="#7a5a2a" flatShading />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <coneGeometry args={[2.0, 0.8, 4]} />
        <meshStandardMaterial color="#8a6a3a" flatShading />
      </mesh>
      {(
        [
          [-2.2, -0.4, -2.0],
          [2.2, -0.4, -2.0],
          [-2.2, -0.4, 2.0],
          [2.2, -0.4, 2.0],
        ] as Array<[number, number, number]>
      ).map((p, i) => (
        <group key={i} position={p}>
          {Array.from({ length: 4 }).map((_, j) => {
            const angle = (j / 4) * Math.PI * 2;
            return (
              <mesh
                key={j}
                position={[Math.cos(angle) * 0.2, -0.1, Math.sin(angle) * 0.2]}
                rotation={[Math.cos(angle) * 0.4, angle, -0.6]}
              >
                <coneGeometry args={[0.15, 0.9, 4]} />
                <meshStandardMaterial color="#3a8a3a" flatShading />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function BoardRack() {
  const boards: Array<{ x: number; deck: string; stripe: string }> = [
    { x: -1.0, deck: '#ffb27f', stripe: '#ff5a5a' },
    { x: 0, deck: '#dfe7ef', stripe: '#1a1a2e' },
    { x: 1.0, deck: '#ffe066', stripe: '#4fb56d' },
  ];
  return (
    <group position={[0, -0.1, -1.6]}>
      {boards.map((b, i) => (
        <group
          key={i}
          position={[b.x, 0.9, 0]}
          rotation={[0, 0, (i - 1) * 0.05]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.07, 1.8]} />
            <meshStandardMaterial color={b.deck} flatShading />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.07, 0.012, 1.6]} />
            <meshStandardMaterial color={b.stripe} flatShading />
          </mesh>
          <mesh position={[0, 0, -0.95]}>
            <coneGeometry args={[0.22, 0.5, 4]} />
            <meshStandardMaterial color={b.deck} flatShading />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.05, 0.18]} castShadow>
        <boxGeometry args={[2.6, 0.05, 0.06]} />
        <meshStandardMaterial color="#6a4a25" flatShading />
      </mesh>
    </group>
  );
}

function TikiTorch({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!flameRef.current) return;
    const t = state.clock.elapsedTime;
    const flicker =
      0.85 + Math.sin(t * 9 + position[0]) * 0.1 + Math.random() * 0.05;
    flameRef.current.scale.set(flicker, flicker * 1.2, flicker);
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.07, 2.0, 8]} />
        <meshStandardMaterial color="#6a4a25" flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.08, 0.25, 10]} />
        <meshStandardMaterial color="#3a2a1a" flatShading />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.35, 0]}>
        <coneGeometry args={[0.13, 0.36, 8]} />
        <meshBasicMaterial color="#ffae3a" />
      </mesh>
      <pointLight
        position={[0, 1.35, 0]}
        intensity={0.5}
        distance={4}
        color="#ffae3a"
      />
    </group>
  );
}

function SandPiles() {
  const piles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        x: Math.cos((i / 10) * Math.PI * 2) * (4.5 + Math.random() * 1.5),
        z: Math.sin((i / 10) * Math.PI * 2) * (4.5 + Math.random() * 1.5),
        s: 0.4 + Math.random() * 0.6,
      })),
    [],
  );
  return (
    <group>
      {piles.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, -0.78, p.z]}
          rotation={[0, i * 0.6, 0]}
          castShadow
        >
          <coneGeometry args={[p.s * 0.6, p.s * 0.3, 6]} />
          <meshStandardMaterial color="#e7c887" flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Wooden menu signs ----------
//
// A single weathered post stands on the LEFT side of the island. Three signs
// hang from it by knotted ropes — "PLAY SOLO", "MULTIPLAYER", "SETTINGS" —
// plus a big driftwood banner with the game title across the top. Each sign
// raycasts onClick events and grows a little on hover for feedback.

const SIGN_POS_X = -3.2;

function MenuSignPost({
  onSolo,
  onMultiplayer,
  onSettings,
}: {
  onSolo: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
}) {
  return (
    <group position={[SIGN_POS_X, 0, 1.0]}>
      {/* Tall wooden post stuck in the sand. */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 4.4, 8]} />
        <meshStandardMaterial color="#7a4d24" flatShading />
      </mesh>
      {/* Wrapped rope detail near the top. */}
      <mesh position={[0, 3.6, 0]}>
        <torusGeometry args={[0.16, 0.04, 6, 14]} />
        <meshStandardMaterial color="#caa078" flatShading />
      </mesh>
      {/* Top crossbar for the banner. */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <boxGeometry args={[1.8, 0.12, 0.12]} />
        <meshStandardMaterial color="#6a4a25" flatShading />
      </mesh>

      {/* Driftwood title banner. */}
      <WoodenSign
        position={[0, 3.1, 0]}
        size={[2.4, 0.7]}
        big
        sway={0.04}
        text="TIDAL WORDLE"
        subtext="ride the swell"
        color="#d6b07a"
      />

      {/* Three menu signs hanging in a column. */}
      <WoodenSign
        position={[0, 1.95, 0]}
        size={[1.55, 0.55]}
        sway={0.06}
        text="PLAY SOLO"
        onClick={onSolo}
      />
      <WoodenSign
        position={[0, 1.05, 0]}
        size={[1.55, 0.55]}
        sway={0.07}
        text="MULTIPLAYER"
        onClick={onMultiplayer}
      />
      <WoodenSign
        position={[0, 0.15, 0]}
        size={[1.55, 0.55]}
        sway={0.05}
        text="SETTINGS"
        onClick={onSettings}
      />

      {/* Decorative: small palm-leaf hanging off the post. */}
      <mesh position={[0.2, 3.55, 0.2]} rotation={[0, 0.5, -0.7]} castShadow>
        <coneGeometry args={[0.18, 0.9, 4]} />
        <meshStandardMaterial color="#3a8a3a" flatShading />
      </mesh>
      <mesh position={[-0.2, 3.55, 0.2]} rotation={[0, -0.5, 0.7]} castShadow>
        <coneGeometry args={[0.18, 0.9, 4]} />
        <meshStandardMaterial color="#3a8a3a" flatShading />
      </mesh>
    </group>
  );
}

interface SignProps {
  position: [number, number, number];
  size: [number, number]; // width, height
  text: string;
  subtext?: string;
  onClick?: () => void;
  big?: boolean;
  sway?: number;
  color?: string;
}

function WoodenSign({
  position,
  size,
  text,
  subtext,
  onClick,
  big,
  sway = 0.05,
  color = '#c08a52',
}: SignProps) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetScale = useRef(1);
  const currentScale = useRef(1);
  const clickable = !!onClick;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Hanging-sign sway, varies per-sign by position seed.
    ref.current.rotation.z =
      Math.sin(t * (1.0 + position[1] * 0.3) + position[1]) * sway;
    // Smooth hover-scale.
    targetScale.current = hovered && clickable ? 1.07 : 1.0;
    currentScale.current += (targetScale.current - currentScale.current) * 0.18;
    ref.current.scale.setScalar(currentScale.current);
  });

  useEffect(() => {
    if (hovered && clickable) {
      document.body.style.cursor = 'pointer';
      return () => {
        document.body.style.cursor = '';
      };
    }
  }, [hovered, clickable]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!clickable) return;
    e.stopPropagation();
    onClick?.();
  };

  const [w, h] = size;

  return (
    <group ref={ref} position={position}>
      {/* Two ropes going up to the crossbar. */}
      <Rope from={[-w / 2 + 0.12, h / 2 + 0.04, 0]} to={[-w / 2 + 0.12, h / 2 + 0.6, 0]} />
      <Rope from={[w / 2 - 0.12, h / 2 + 0.04, 0]} to={[w / 2 - 0.12, h / 2 + 0.6, 0]} />

      {/* The plank itself — clickable. */}
      <group
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Wood plank with rounded edges (a slim box + side caps). */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, 0.08]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        {/* Bevel / dark border for a "carved" look. */}
        <mesh position={[0, 0, 0.041]}>
          <boxGeometry args={[w - 0.16, h - 0.16, 0.005]} />
          <meshStandardMaterial color={hexShift(color, -28)} flatShading />
        </mesh>
        {/* Wood-grain lines (a few thin darker boxes). */}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[0, h / 2 - 0.12 - i * 0.12, 0.042]}>
            <boxGeometry args={[w - 0.3, 0.012, 0.003]} />
            <meshStandardMaterial color={hexShift(color, -45)} flatShading />
          </mesh>
        ))}
        {/* Two iron nail studs at the top corners. */}
        <mesh position={[-w / 2 + 0.12, h / 2 - 0.1, 0.042]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#2a2a2a" flatShading />
        </mesh>
        <mesh position={[w / 2 - 0.12, h / 2 - 0.1, 0.042]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#2a2a2a" flatShading />
        </mesh>

        {/* Carved text — drei's Text component renders true 3D text. */}
        <Text
          position={[0, subtext ? h * 0.12 : 0, 0.046]}
          fontSize={big ? 0.22 : 0.18}
          color="#2a1a0a"
          anchorX="center"
          anchorY="middle"
          maxWidth={w - 0.2}
          letterSpacing={0.03}
          fontWeight="bold"
          outlineWidth={big ? 0.008 : 0}
          outlineColor="#6a3a1a"
        >
          {text}
        </Text>
        {subtext && (
          <Text
            position={[0, -h * 0.18, 0.046]}
            fontSize={0.09}
            color="#5a3a1a"
            anchorX="center"
            anchorY="middle"
            fontStyle="italic"
          >
            {subtext}
          </Text>
        )}
      </group>
    </group>
  );
}

function Rope({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz);
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  const angle = Math.atan2(dx, dy);
  return (
    <mesh position={mid} rotation={[0, 0, angle]}>
      <cylinderGeometry args={[0.018, 0.018, len, 6]} />
      <meshStandardMaterial color="#caa078" flatShading />
    </mesh>
  );
}

// ---------- Ocean & sky decoration ----------

function OceanPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 220, 80, 80);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const restPositions = useMemo(() => {
    const pos = geometry.attributes.position.array as Float32Array;
    return Float32Array.from(pos);
  }, [geometry]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = restPositions[i];
      const z = restPositions[i + 2];
      // Two crossing sines for a gentle, friendly swell.
      const h =
        Math.sin(x * 0.18 + t * 0.9) * 0.22 +
        Math.cos(z * 0.14 - t * 0.7) * 0.18 +
        Math.sin((x + z) * 0.08 + t * 0.5) * 0.12;
      arr[i + 1] = h;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, -1.3, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#1f6f97"
        metalness={0.15}
        roughness={0.5}
        flatShading={false}
      />
    </mesh>
  );
}

function Clouds() {
  const clouds = useMemo(
    () => [
      { x: -14, y: 9, z: -25, s: 2.2 },
      { x: 12, y: 11, z: -28, s: 2.8 },
      { x: 2, y: 13, z: -42, s: 3.4 },
      { x: -22, y: 10, z: -36, s: 2.0 },
      { x: 24, y: 14, z: -50, s: 2.6 },
      { x: -32, y: 12, z: -48, s: 2.4 },
      { x: 18, y: 9, z: -18, s: 1.8 },
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
            <meshStandardMaterial
              color="#ffffff"
              flatShading
              emissive="#fff5e0"
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh position={[c.s * 0.8, -c.s * 0.15, 0]}>
            <sphereGeometry args={[c.s * 0.75, 10, 10]} />
            <meshStandardMaterial
              color="#ffffff"
              flatShading
              emissive="#fff5e0"
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh position={[-c.s * 0.8, -c.s * 0.1, 0.2]}>
            <sphereGeometry args={[c.s * 0.65, 10, 10]} />
            <meshStandardMaterial
              color="#ffffff"
              flatShading
              emissive="#fff5e0"
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DistantSailboat() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Slow drift across the horizon.
    ref.current.position.x = -20 + ((t * 0.6) % 50) - 5;
    ref.current.position.y = -1.1 + Math.sin(t * 1.5) * 0.06;
    ref.current.rotation.z = Math.sin(t * 1.5) * 0.04;
  });
  return (
    <group ref={ref} position={[-20, -1.1, -38]}>
      {/* Hull */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.3, 0.5]} />
        <meshStandardMaterial color="#d6553a" flatShading />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.4, 0.6, 4]} />
        <meshStandardMaterial color="#a8392a" flatShading />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
        <meshStandardMaterial color="#3a2a1a" flatShading />
      </mesh>
      {/* Sail */}
      <mesh position={[0.3, 1.0, 0]} castShadow>
        <coneGeometry args={[0.55, 1.4, 3]} />
        <meshStandardMaterial color="#fff8e2" flatShading />
      </mesh>
    </group>
  );
}

function Seagulls() {
  const refs = useRef<THREE.Group[]>([]);
  const gulls = useMemo(
    () => [
      { baseX: -8, baseY: 6, baseZ: -20, speed: 0.3, phase: 0 },
      { baseX: 10, baseY: 7, baseZ: -22, speed: 0.4, phase: 1.5 },
      { baseX: -4, baseY: 8, baseZ: -28, speed: 0.25, phase: 3 },
    ],
    [],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    gulls.forEach((g, i) => {
      const ref = refs.current[i];
      if (!ref) return;
      const angle = t * g.speed + g.phase;
      ref.position.x = g.baseX + Math.cos(angle) * 6;
      ref.position.y = g.baseY + Math.sin(angle * 0.5) * 0.5;
      ref.position.z = g.baseZ + Math.sin(angle) * 4;
      ref.rotation.y = -angle + Math.PI / 2;
    });
  });
  return (
    <group>
      {gulls.map((g, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          position={[g.baseX, g.baseY, g.baseZ]}
        >
          {/* Body */}
          <mesh castShadow>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
          {/* Wings — two flat angled planes that flap. */}
          <Wing side={-1} />
          <Wing side={1} />
        </group>
      ))}
    </group>
  );
}

function Wing({ side }: { side: 1 | -1 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = side * (0.4 + Math.sin(t * 6) * 0.5);
  });
  return (
    <mesh ref={ref} position={[side * 0.18, 0, 0]} castShadow>
      <boxGeometry args={[0.4, 0.02, 0.18]} />
      <meshStandardMaterial color="#f6f6f6" flatShading />
    </mesh>
  );
}

function PalmTree({
  position,
  sway = 0.05,
}: {
  position: [number, number, number];
  sway?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.7 + position[0]) * sway;
  });
  // Curved trunk built from a few stacked cylinders.
  const segs = 5;
  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: segs }).map((_, i) => {
        const y = i * 0.85;
        const offsetX = Math.sin(i * 0.4) * 0.1;
        return (
          <mesh
            key={i}
            position={[offsetX, y, 0]}
            rotation={[0, 0, Math.sin(i * 0.4) * 0.05]}
            castShadow
          >
            <cylinderGeometry args={[0.16 - i * 0.015, 0.18 - i * 0.015, 0.9, 8]} />
            <meshStandardMaterial color="#7a4d24" flatShading />
          </mesh>
        );
      })}
      {/* Coconut cluster */}
      <group position={[Math.sin(segs * 0.4) * 0.1, segs * 0.85 + 0.05, 0]}>
        {[
          [-0.15, 0, 0.05],
          [0.15, 0, -0.05],
          [0, 0.05, -0.15],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#3a2a1a" flatShading />
          </mesh>
        ))}
        {/* Fronds — 6 cones arranged radially. */}
        {Array.from({ length: 7 }).map((_, i) => {
          const angle = (i / 7) * Math.PI * 2;
          const droop = -0.5;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.4, 0.05, Math.sin(angle) * 0.4]}
              rotation={[Math.sin(angle) * 0.6, angle, Math.cos(angle) * 0.6 + droop]}
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

function BeachUmbrella({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.0, 6]} />
        <meshStandardMaterial color="#dfe7ef" flatShading />
      </mesh>
      <group position={[0, 1.05, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const color = i % 2 === 0 ? '#ff5a5a' : '#fff8e2';
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.45, 0, Math.sin(angle) * 0.45]}
              rotation={[0.5, -angle, 0]}
              castShadow
            >
              <coneGeometry args={[0.35, 0.9, 3]} />
              <meshStandardMaterial color={color} flatShading />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Starfish({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0.6]}>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0]} rotation={[0, 0, angle]} castShadow>
            <coneGeometry args={[0.12, 0.4, 4]} />
            <meshStandardMaterial color="#ff8a3c" flatShading />
          </mesh>
        );
      })}
      <mesh castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffa55c" flatShading />
      </mesh>
    </group>
  );
}

function Seashell({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0.3, 0.4, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.18, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffd6b4" flatShading />
      </mesh>
      {/* Ribs */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI - Math.PI / 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.05, 0.02, Math.sin(angle) * 0.05]}
            rotation={[0, angle, 0.5]}
          >
            <boxGeometry args={[0.02, 0.02, 0.34]} />
            <meshStandardMaterial color="#e8a888" flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function hexShift(hex: string, amount: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(m.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(m.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(m.slice(4, 6), 16) + amount));
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}
