import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SkyAndLighting from './SkyAndLighting';
import Wave from './Wave';
import BoardParticles from './BoardParticles';
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

export type WardrobeFocus = 'overview' | 'shirt' | 'shorts' | 'board' | 'hat';

interface Props {
  focus: WardrobeFocus;
  onResetFocus: () => void;
}

export default function WardrobeScene({ focus, onResetFocus }: Props) {
  const musicSwapActive = useGameStore((s) => s.musicSwapActive);
  const musicMuted = useGameStore((s) => s.musicMuted);

  // Cursor-drag spins the mannequin around its Y axis. A click (no
  // meaningful drag distance) resets the camera focus to overview, so the
  // user can "press away" from a zoomed-in tab to see the whole character.
  const [yaw, setYaw] = useState(0);
  const dragRef = useRef<{
    startX: number;
    startYaw: number;
    moved: boolean;
  } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startYaw: yaw, moved: false };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 4) dragRef.current.moved = true;
    setYaw(dragRef.current.startYaw + dx * 0.012);
  }
  function handlePointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    // A pointerup without significant horizontal drag counts as a click
    // — treat it as "press away" to return the camera to the overview pose.
    if (drag && !drag.moved && focus !== 'overview') {
      onResetFocus();
    }
  }

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
    <div
      className="absolute inset-0"
      style={{ cursor: 'grab', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Canvas
        shadows="soft"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 2.4, 7.0], fov: 42 }}
      >
        <CameraController focus={focus} />
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

        {/* Mannequin centered on the island — driven by cursor-drag yaw. */}
        <Mannequin focus={focus} yaw={yaw} />

        {/* Wooden sign post on the LEFT — 3D backing for the HTML buttons. */}
        <SignPost />

        {/* Wardrobe display frame on the RIGHT — 3D backing for the panel. */}
        <DisplayFrame />
      </Canvas>
    </div>
  );
}

// ---------- Camera controller ----------
//
// Lerps the camera position + lookAt target whenever `focus` changes. The
// overview pose frames the whole island; each other focus zooms in on a
// specific body part. The mannequin is at world (0, 1.2, 0) (after a scale
// of 2.0 brings its feet to the island top at y=-0.8).
//
// World-space anchor points (mannequin scale 2.0, mannequin pos y=1.2):
//   feet     ~ y = -0.8
//   knees    ~ y = -0.2
//   waist    ~ y =  0.9
//   chest    ~ y =  1.8
//   head     ~ y =  3.0
//   board    ~ at x≈1.8, y≈1.0..2.6
//
// Camera positions chosen so the targeted area fills most of the frame.
// For each zoom focus we put camera.Y === lookAt.Y so the targeted body
// part lands at the exact vertical center (no downward tilt that would
// push the character to the top of the frame).

const FOCUS_POSES: Record<
  WardrobeFocus,
  { pos: [number, number, number]; look: [number, number, number] }
> = {
  overview: { pos: [0, 1.6, 7.5], look: [0, 1.3, 0] },
  hat: { pos: [0, 3.04, 3.2], look: [0, 3.04, 0] },
  shirt: { pos: [0, 1.76, 3.4], look: [0, 1.76, 0] },
  shorts: { pos: [0, 0.05, 3.6], look: [0, 0.05, 0] },
  board: { pos: [3.8, 1.1, 2.4], look: [1.8, 1.1, 0] },
};

function CameraController({ focus }: { focus: WardrobeFocus }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...FOCUS_POSES.overview.pos));
  const targetLook = useRef(new THREE.Vector3(...FOCUS_POSES.overview.look));
  const currentLook = useRef(new THREE.Vector3(...FOCUS_POSES.overview.look));

  // Update target when focus changes.
  useEffect(() => {
    const p = FOCUS_POSES[focus];
    targetPos.current.set(...p.pos);
    targetLook.current.set(...p.look);
  }, [focus]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.08);
    currentLook.current.lerp(targetLook.current, 0.08);
    camera.lookAt(currentLook.current);
  });

  return null;
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
//
// Smooth tapered trunk + leaf-shaped fronds.
// Trunk: single tall cylinder, narrower at top than base. A handful of dark
// torus rings give it the segmented palm look without breaking continuity.
// Fronds: each is a stem (thin cylinder) + a flat blade (cone flattened in
// Z). Eight fronds radiate around the crown, drooping outward and down.

const PALM_TRUNK_HEIGHT = 5.0;
const PALM_BASE_R = 0.32;
const PALM_TOP_R = 0.16;

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
  return (
    <group ref={ref} position={position}>
      {/* Smooth tapered trunk. */}
      <mesh position={[0, PALM_TRUNK_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry
          args={[PALM_TOP_R, PALM_BASE_R, PALM_TRUNK_HEIGHT, 12]}
        />
        <meshStandardMaterial color="#8a5a2a" flatShading />
      </mesh>
      {/* Decorative bark rings — dark thin tori up the trunk. */}
      {Array.from({ length: 7 }).map((_, i) => {
        const y = 0.45 + i * 0.6;
        // Interpolate radius along the taper.
        const r =
          PALM_BASE_R -
          ((PALM_BASE_R - PALM_TOP_R) * y) / PALM_TRUNK_HEIGHT +
          0.01;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.03, 4, 14]} />
            <meshStandardMaterial color="#5a3a1a" flatShading />
          </mesh>
        );
      })}
      {/* Crown — coconuts + fronds. */}
      <group position={[0, PALM_TRUNK_HEIGHT, 0]}>
        {[
          [-0.18, -0.1, 0.12],
          [0.16, -0.08, -0.05],
          [0.02, -0.02, -0.18],
          [0.1, -0.12, 0.16],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color="#3a2a1a" flatShading />
          </mesh>
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return <Frond key={i} angle={angle} />;
        })}
      </group>
    </group>
  );
}

function Frond({ angle }: { angle: number }) {
  // Each frond points radially OUTWARD from the crown along +X in its local
  // frame, after rotating by `angle` around the Y axis. The blade tilts
  // downward (-Z rotation) for a natural droop. The blade is a cone
  // flattened in Z to read as a flat leaf rather than a spike.
  return (
    <group rotation={[0, angle, 0]}>
      {/* Stem — short cylinder anchoring the frond to the crown. */}
      <mesh
        position={[0.45, -0.05, 0]}
        rotation={[0, 0, -Math.PI / 2 - 0.25]}
        castShadow
      >
        <cylinderGeometry args={[0.025, 0.05, 0.9, 6]} />
        <meshStandardMaterial color="#5a6a2a" flatShading />
      </mesh>
      {/* Blade — flattened cone, drooping outward and slightly down. */}
      <mesh
        position={[1.1, -0.25, 0]}
        rotation={[0, 0, -Math.PI / 2 - 0.45]}
        scale={[1.0, 1.0, 0.18]}
        castShadow
      >
        <coneGeometry args={[0.32, 1.8, 8]} />
        <meshStandardMaterial color="#3a8a3a" flatShading />
      </mesh>
      {/* Darker midrib stripe down the leaf. */}
      <mesh
        position={[1.1, -0.25, 0]}
        rotation={[0, 0, -Math.PI / 2 - 0.45]}
        castShadow
      >
        <boxGeometry args={[0.025, 1.7, 0.025]} />
        <meshStandardMaterial color="#2a6a2a" flatShading />
      </mesh>
    </group>
  );
}

// ---------- Mannequin (standing, holding upright board) ----------

const MANNEQUIN_SCALE = 2.0;
// Feet at local y=-1 inside the mannequin group. After scaling, feet sit at
// world y = MANNEQUIN_Y - MANNEQUIN_SCALE. Island top is at y=-0.8, so we
// pick MANNEQUIN_Y so feet land exactly there: y = -0.8 + scale = 1.2.
const MANNEQUIN_Y = -0.8 + MANNEQUIN_SCALE;

function Mannequin({
  focus,
  yaw,
}: {
  focus: WardrobeFocus;
  yaw: number;
}) {
  const ref = useRef<THREE.Group>(null);

  const shirt = getShirt(useAppearanceStore((s) => s.shirtId));
  const shorts = getShorts(useAppearanceStore((s) => s.shortsId));
  const board = getBoard(useAppearanceStore((s) => s.boardId));
  const hat = getHat(useAppearanceStore((s) => s.hatId));

  // Mannequin rotation is fully user-controlled (cursor-drag yaw from
  // WardrobeScene). A subtle vertical bob gives it some life.
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = yaw;
    ref.current.position.y = MANNEQUIN_Y + Math.sin(t * 1.0) * 0.02;
  });

  const SKIN = '#f0caa0';

  return (
    <group
      ref={ref}
      position={[0, MANNEQUIN_Y, 0]}
      scale={MANNEQUIN_SCALE}
    >
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
        {/* Particle effects play only when the BOARD tab is focused. */}
        <BoardParticles board={board} active={focus === 'board'} />
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

// Arm joints are defined by 3 endpoints (shoulder, elbow, hand). The Limb
// helper builds a cylinder that precisely connects two endpoints (correct
// length, correct rotation), and a sphere at each joint hides the seam.
// This is far more reliable than hand-positioning + rotating cylinders.

function Arms({ shirt, skin }: { shirt: ShirtOption; skin: string }) {
  const isTank = shirt.cut === 'tank';
  const isRashguard = shirt.cut === 'rashguard';

  // Shoulders anchored INSIDE the torso top (torso top is at local y ~0.6).
  const LShoulder: [number, number, number] = [-0.26, 0.55, 0];
  const LElbow: [number, number, number] = [-0.3, 0.05, 0];
  const LHand: [number, number, number] = [-0.34, -0.45, 0];

  // Right arm reaches up-out to rest the hand on the board's top edge.
  // Board sub-group sits at local (0.9, -0.05, 0) and stands vertical,
  // so the board's top in mannequin-local coords is roughly (0.9, ~0.95, 0).
  const RShoulder: [number, number, number] = [0.26, 0.55, 0];
  const RElbow: [number, number, number] = [0.55, 0.3, 0];
  const RHand: [number, number, number] = [0.85, 0.85, 0];

  const upperColor = isTank ? skin : shirt.color;
  const lowerColor = isRashguard ? shirt.color : skin;

  return (
    <group>
      {/* LEFT arm */}
      <Joint position={LShoulder} radius={0.13} color={upperColor} />
      <Limb from={LShoulder} to={LElbow} radius={0.095} color={upperColor} />
      <Joint position={LElbow} radius={0.09} color={lowerColor} />
      <Limb from={LElbow} to={LHand} radius={0.085} color={lowerColor} />
      <Joint position={LHand} radius={0.1} color={skin} />

      {/* RIGHT arm */}
      <Joint position={RShoulder} radius={0.13} color={upperColor} />
      <Limb from={RShoulder} to={RElbow} radius={0.095} color={upperColor} />
      <Joint position={RElbow} radius={0.09} color={lowerColor} />
      <Limb from={RElbow} to={RHand} radius={0.085} color={lowerColor} />
      <Joint position={RHand} radius={0.1} color={skin} />
    </group>
  );
}

function Joint({
  position,
  radius,
  color,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
}) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 14, 12]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Limb({
  from,
  to,
  radius,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  color: string;
}) {
  const { position, rotation, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    dir.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir,
    );
    const e = new THREE.Euler().setFromQuaternion(q);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    return {
      position: mid.toArray() as [number, number, number],
      rotation: [e.x, e.y, e.z] as [number, number, number],
      length: len,
    };
  }, [from, to]);

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius * 1.05, length, 12]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
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
  // Use ExtrudeGeometry on a 2D surfboard silhouette so the board is one
  // flat piece (no protruding nose cone). Width along X, length along Y in
  // the shape; extrusion along Z is the deck thickness. We then internally
  // rotate the mesh -90° around X so the long axis points along local -Z
  // (matches the rest of the code's coordinate convention) and the
  // thickness sits along local Y.
  const isLong = board.shape === 'longboard';
  const isFish = board.shape === 'fish';
  const isGun = board.shape === 'gun';
  const width = isFish ? 0.7 : isGun ? 0.42 : isLong ? 0.6 : 0.52;
  const length = isLong ? 2.6 : isGun ? 2.5 : 2.0;
  const tailWidth = isFish ? width * 0.95 : isGun ? width * 0.55 : width * 0.85;
  const thickness = 0.07;

  const shape = useMemo(() => {
    const w = width / 2;
    const l = length / 2;
    const tw = tailWidth / 2;
    const s = new THREE.Shape();
    // Surfboard outline in 2D: tail at +Y, nose at -Y, width along X.
    // Sequence: start at tail-left, curve up the left side, sweep around
    // the nose, come back down the right side, close at tail-right.
    s.moveTo(-tw, l);
    // Tail-left -> mid-left
    s.quadraticCurveTo(-w * 1.02, l * 0.6, -w, 0);
    // Mid-left -> nose
    s.quadraticCurveTo(-w * 0.95, -l * 0.65, -w * 0.4, -l * 0.95);
    // Nose curve
    s.quadraticCurveTo(0, -l * 1.04, w * 0.4, -l * 0.95);
    // Nose -> mid-right
    s.quadraticCurveTo(w * 0.95, -l * 0.65, w, 0);
    // Mid-right -> tail-right
    s.quadraticCurveTo(w * 1.02, l * 0.6, tw, l);
    // Tail edge — fish has a notch, others are straight.
    if (isFish) {
      s.lineTo(w * 0.1, l * 0.78);
      s.lineTo(0, l);
      s.lineTo(-w * 0.1, l * 0.78);
      s.lineTo(-tw, l);
    } else {
      s.lineTo(-tw, l);
    }
    return s;
  }, [width, length, tailWidth, isFish]);

  const extrudeSettings = useMemo(
    () => ({ depth: thickness, bevelEnabled: false, steps: 1 }),
    [],
  );

  return (
    <group>
      {/* Deck — extruded 2D silhouette, lying flat. The internal
          rotation [-Math.PI/2, 0, 0] makes shape-Y (length) → mesh -Z and
          shape-Z (depth) → mesh +Y, matching board-local axes used below. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -thickness / 2, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>

      {/* Rails — slim accent strips down each side of the deck. */}
      <mesh position={[-(width / 2 - 0.05), 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.78]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      <mesh position={[width / 2 - 0.05, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.78]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>

      {/* Center stripe down the deck. */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.08, 0.012, length * 0.78]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>

      <BoardAccent board={board} length={length} width={width} />

      {/* Fin — a thin flat blade. Stays under the board (in board-local -Y)
          so when the board stands vertical the fin sticks straight back. */}
      {isFish ? (
        <group position={[0, -0.05, length / 2 - 0.12]}>
          <mesh
            position={[-0.13, 0, 0.06]}
            rotation={[0, 0.35, 0.1]}
            castShadow
          >
            <boxGeometry args={[0.18, 0.02, 0.05]} />
            <meshStandardMaterial color={board.finColor} flatShading />
          </mesh>
          <mesh
            position={[0.13, 0, 0.06]}
            rotation={[0, -0.35, -0.1]}
            castShadow
          >
            <boxGeometry args={[0.18, 0.02, 0.05]} />
            <meshStandardMaterial color={board.finColor} flatShading />
          </mesh>
        </group>
      ) : (
        <mesh
          position={[0, -0.08, length / 2 - 0.15]}
          rotation={[0, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.04, 0.18, 0.08]} />
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
