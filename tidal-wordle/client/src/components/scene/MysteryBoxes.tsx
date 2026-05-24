import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTideData } from '../../hooks/useTideData';
import { useMovementStore } from '../../stores/movementStore';
import { useGameStore } from '../../stores/gameStore';
import { useViewStore } from '../../stores/viewStore';
import { playWaveHeightAt } from './waveFunction';
import { fetchHint, fetchHints } from '../../lib/api/hint';
import { playSfx } from '../../lib/audio';

// Mario-style mystery boxes that drift toward the player on the wave. Hit
// one (player XZ inside HIT_RADIUS of the box) and a hint is popped from
// a pre-generated pool and pushed into gameStore.hints, which the
// KnowledgePanel renders on the iPad.
//
// Pool is populated once per round via /api/hints (batch OpenAI) the
// instant the round's answer is set, so per-hit pickups are instant. The
// single-hint endpoint is used as a fallback if the pool drains or the
// pre-fetch fails.
//
// Boxes share the env-object drift system: each has a baseZ that wraps via
// driftDistance, plus a laneX in [-3, 3] so they sit in the player's
// steerable range (lateral clamp is ±4 m).

const FORWARD_DRIFT = 8.0;
const PASS_THRESHOLD = 12; // close behind the player; boxes only count as
                          //"hit" while in front, so this is where they
                          // recycle after passing
const SPAWN_FAR_Z = -180;
const CYCLE = PASS_THRESHOLD - SPAWN_FAR_Z;
const BOX_SIZE = 1.6; // m — box geometry side length
const HIT_RADIUS = 2.2; // m — distance from player XZ at which box pops
const WAVE_PLANE_Y = -2.0;

interface BoxInstance {
  key: number;
  baseZ: number;
  laneX: number;
  spinSeed: number;
  bobSeed: number;
}

const NUM_BOXES = 4;

function buildBoxes(): BoxInstance[] {
  // Pre-distribute boxes along the cycle so the player doesn't see them
  // all spawn at once.
  return new Array(NUM_BOXES).fill(0).map((_, i) => ({
    key: i,
    // Stagger Z across the spawn range; each box gets ~26 m of headroom.
    baseZ: SPAWN_FAR_Z + (i / NUM_BOXES) * CYCLE + (Math.random() - 0.5) * 8,
    // Stay within the player's steerable lane (±4) but vary so they aren't
    // all dead-center.
    laneX: (Math.random() * 2 - 1) * 3.2,
    spinSeed: Math.random() * Math.PI * 2,
    bobSeed: Math.random() * Math.PI * 2,
  }));
}

function driftedZ(baseZ: number, drift: number): number {
  const raw = baseZ + drift * FORWARD_DRIFT;
  const m = (((raw - SPAWN_FAR_Z) % CYCLE) + CYCLE) % CYCLE;
  return SPAWN_FAR_Z + m;
}

interface BoxRuntime {
  // Tracks the current wrap-generation index. When the wrap advances, the
  // box resets to "unhit" (so the same box reincarnated ahead can be hit
  // again). Hit suppression while drifting toward the player is per-cycle.
  wrapGen: number;
  hitThisCycle: boolean;
  // Fade/pop animation state: 0 = idle visible, 1 = freshly hit (fading out).
  popT: number;
}

interface Props {
  // Only collide when the player is in first-person look mode. While the
  // iPad UI has focus, hits are ignored so accidental drifts past a box
  // don't burn a hint.
  lookMode: boolean;
}

const HINTS_PER_ROUND = 4;

export default function MysteryBoxes({ lookMode }: Props) {
  const meshRefs = useRef<THREE.Group[]>([]);
  const runtime = useRef<BoxRuntime[]>([]);
  const tideData = useTideData();
  const animState = useRef({
    amplitude: tideData.waveHeight,
    speed: tideData.waveSpeed,
  });
  const inflightHint = useRef(false);
  // Pre-fetched hint pool for the current answer. Populated once on round
  // start (see effect below) and drained on box pickups so each hit just
  // pops a hint instead of round-tripping to the server.
  const hintPool = useRef<string[]>([]);
  const prefetchedForWord = useRef<string | null>(null);

  const answer = useGameStore((s) => s.answer);

  useEffect(() => {
    if (!answer) {
      hintPool.current = [];
      prefetchedForWord.current = null;
      return;
    }
    if (prefetchedForWord.current === answer) return;
    prefetchedForWord.current = answer;
    hintPool.current = [];
    let cancelled = false;
    fetchHints(answer, HINTS_PER_ROUND)
      .then((hints) => {
        if (cancelled) return;
        if (prefetchedForWord.current !== answer) return;
        hintPool.current = hints.slice();
      })
      .catch((err) => {
        console.warn('[mystery] hint prefetch failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [answer]);

  const boxes = useMemo(buildBoxes, []);
  if (runtime.current.length !== boxes.length) {
    runtime.current = boxes.map(() => ({
      wrapGen: 0,
      hitThisCycle: false,
      popT: 0,
    }));
  }

  useFrame((state, delta) => {
    animState.current.amplitude +=
      (tideData.waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (tideData.waveSpeed - animState.current.speed) * 0.04;

    const t = state.clock.elapsedTime;
    const mv = useMovementStore.getState();
    const drift = mv.driftDistance;
    const playerX = mv.lateralPosition;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const mesh = meshRefs.current[i];
      const rt = runtime.current[i];
      if (!mesh || !rt) continue;

      // Wrap-generation tracking: figure out how many full CYCLEs the box
      // has completed. When it increments, this box has reincarnated far
      // ahead and is eligible to be hit again.
      const raw = box.baseZ + drift * FORWARD_DRIFT;
      const gen = Math.floor((raw - SPAWN_FAR_Z) / CYCLE);
      if (gen !== rt.wrapGen) {
        rt.wrapGen = gen;
        rt.hitThisCycle = false;
        rt.popT = 0;
      }

      const z = driftedZ(box.baseZ, drift);
      // Bob with the wave so boxes ride on the surface; +0.9 lifts them so
      // they float just above the swell like real Mario blocks. Boxes live
      // in world space (fixed laneX) so the player can actually steer to
      // intercept them — see the collision math below.
      const surface = playWaveHeightAt(
        box.laneX,
        z,
        drift,
        animState.current.amplitude,
        animState.current.speed,
      );
      const y =
        WAVE_PLANE_Y +
        surface +
        0.9 +
        Math.sin(t * 1.4 + box.bobSeed) * 0.12;

      mesh.position.set(box.laneX, y, z);
      // Slow spin around Y so the ? face rotates into view from any angle.
      mesh.rotation.y = t * 0.6 + box.spinSeed;

      // --- Pop animation: scale up + fade out when freshly hit. ---
      if (rt.hitThisCycle) {
        rt.popT = Math.min(1, rt.popT + delta * 2.2);
        const popScale = 1 + rt.popT * 0.6;
        mesh.scale.setScalar(popScale * (1 - rt.popT * 0.95));
        const mat = (mesh.children[0] as THREE.Mesh).material as THREE.Material & {
          opacity: number;
          transparent: boolean;
        };
        mat.transparent = true;
        mat.opacity = 1 - rt.popT;
        mesh.visible = rt.popT < 1;
        continue;
      }

      mesh.scale.setScalar(1);
      mesh.visible = true;
      const mat = (mesh.children[0] as THREE.Mesh).material as THREE.Material & {
        opacity: number;
        transparent: boolean;
      };
      mat.transparent = false;
      mat.opacity = 1;

      // --- Collision check ---
      // Boxes drift toward +Z; only boxes near the player on Z and close
      // in X are pickable. Player is at world (playerX, 0); boxes at
      // (box.laneX, z). Hint pickups are gated to look-mode so the player
      // doesn't burn one while focused on the iPad UI.
      if (lookMode && z < 4 && z > -8) {
        const dx = box.laneX - playerX;
        const dz = z;
        const distSq = dx * dx + dz * dz;
        if (distSq < HIT_RADIUS * HIT_RADIUS) {
          rt.hitThisCycle = true;
          rt.popT = 0;
          requestHint();
        }
      }
    }
  });

  function requestHint() {
    if (inflightHint.current) return;
    const answerNow = useGameStore.getState().answer;
    if (!answerNow) return;
    inflightHint.current = true;
    playSfx('cardDraw');
    useViewStore.getState().triggerRainbowFlash();

    // Fast path: pop a pre-generated hint instantly. Each round's pool is
    // populated by the useEffect above when the answer changes.
    const pooled = hintPool.current.shift();
    if (pooled) {
      useGameStore.getState().addHint(pooled);
      useViewStore.getState().pushHintToast(pooled);
      setTimeout(() => {
        inflightHint.current = false;
      }, 400);
      return;
    }

    // Fallback: pool empty (prefetch failed or already drained). Hit the
    // single-hint endpoint so the player still gets something.
    fetchHint(answerNow)
      .then((hint) => {
        useGameStore.getState().addHint(hint);
        useViewStore.getState().pushHintToast(hint);
      })
      .catch((err) => {
        console.warn('[mystery] hint fetch failed:', err);
      })
      .finally(() => {
        setTimeout(() => {
          inflightHint.current = false;
        }, 400);
      });
  }

  // Rivets and the "?" mark sit just outside the cube faces (±BOX_SIZE/2 + ε).
  const faceOffset = BOX_SIZE / 2 + 0.02;

  return (
    <group>
      {boxes.map((b, i) => (
        <group
          key={b.key}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />
            <meshStandardMaterial
              color="#f0b020"
              emissive="#ff8a00"
              emissiveIntensity={0.55}
              flatShading
            />
          </mesh>
          {/* Decorative rivets on each face — quick Mario-block read. */}
          {[
            [0, 0, faceOffset] as [number, number, number],
            [0, 0, -faceOffset] as [number, number, number],
            [faceOffset, 0, 0] as [number, number, number],
            [-faceOffset, 0, 0] as [number, number, number],
          ].map((p, j) => (
            <mesh key={j} position={p}>
              <torusGeometry args={[0.4, 0.07, 8, 18]} />
              <meshStandardMaterial color="#7a4500" flatShading />
            </mesh>
          ))}
          {/* "?" mark on the front face — built from a torus, a box, and a sphere. */}
          <group position={[0, 0, faceOffset + 0.01]}>
            <mesh position={[0, 0.32, 0]}>
              <torusGeometry args={[0.27, 0.09, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#ffffff" flatShading />
            </mesh>
            <mesh position={[0, -0.07, 0]}>
              <boxGeometry args={[0.14, 0.32, 0.07]} />
              <meshStandardMaterial color="#ffffff" flatShading />
            </mesh>
            <mesh position={[0, -0.39, 0]}>
              <sphereGeometry args={[0.11, 10, 10]} />
              <meshStandardMaterial color="#ffffff" flatShading />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
