import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTideData } from '../../hooks/useTideData';
import { useMovementStore } from '../../stores/movementStore';
import { playWaveHeightAt } from './waveFunction';

// Ambient water bursts scattered on the wave surface around the rider. Each
// splash:
//   - sits at a fixed (x, z) offset from the player
//   - tracks the wave height at that point so it rides the swell
//   - cycles through "burst → rise → fall → idle" continuously
//
// Combined with the rider's foam wake, this gives the ocean visible
// liveliness: tiny whitecap puffs popping up across the surface as you
// move forward.

interface SplashInstance {
  key: number;
  laneX: number;
  laneZ: number;
  cycle: number; // seconds
  phaseOffset: number; // seconds
  burstDur: number; // seconds — how long the burst is visible
  peakY: number; // how high above the wave it rises
  scale: number; // max scale
}

const NUM_SPLASHES = 24;

function buildInstances(): SplashInstance[] {
  return new Array(NUM_SPLASHES).fill(0).map((_, i) => {
    // Distribute around the player in a wide ring on the water surface.
    // Avoid the immediate ±3m bubble around the rider so they don't
    // overlap the body rig.
    const r = 3.5 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    return {
      key: i,
      laneX: Math.cos(theta) * r,
      laneZ: Math.sin(theta) * r,
      cycle: 2.2 + Math.random() * 2.5,
      phaseOffset: Math.random() * 4,
      burstDur: 0.55 + Math.random() * 0.45,
      peakY: 0.35 + Math.random() * 0.55,
      scale: 0.22 + Math.random() * 0.18,
    };
  });
}

const WAVE_PLANE_Y = -2.0;

export default function AmbientSplashes() {
  const groupRef = useRef<THREE.Group>(null);
  const refs = useRef<THREE.Mesh[]>([]);
  const { waveHeight, waveSpeed } = useTideData();
  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });
  const tmpVec = useRef(new THREE.Vector3()).current;

  const instances = useMemo(buildInstances, []);

  useFrame((state) => {
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;
    const t = state.clock.elapsedTime;
    const speedMul = useMovementStore.getState().forwardSpeedMul;
    const effSpeed = animState.current.speed * speedMul;
    const cam = state.camera.position;

    // Recenter the whole group on the player's XZ each frame so splashes
    // are always around the rider, never left behind by forward motion.
    if (groupRef.current) {
      tmpVec.set(cam.x, 0, cam.z);
      groupRef.current.position.copy(tmpVec);
    }

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const mesh = refs.current[i];
      if (!mesh) continue;

      const cyclePos = ((t + inst.phaseOffset) % inst.cycle);
      if (cyclePos > inst.burstDur) {
        // Idle phase between bursts — hide below the wave.
        mesh.position.set(inst.laneX, WAVE_PLANE_Y - 3, inst.laneZ);
        mesh.scale.setScalar(0.0001);
        continue;
      }
      const u = cyclePos / inst.burstDur; // 0..1 burst progress
      // Wave height at this lane (world coords add the player's xz).
      const wave = playWaveHeightAt(
        cam.x + inst.laneX,
        cam.z + inst.laneZ,
        t,
        animState.current.amplitude,
        effSpeed,
      );
      // Bell-curve rise + fall.
      const rise = Math.sin(u * Math.PI) * inst.peakY;
      mesh.position.set(
        inst.laneX,
        WAVE_PLANE_Y + wave + rise,
        inst.laneZ,
      );
      // Grow then shrink.
      const sizeT = Math.sin(u * Math.PI);
      mesh.scale.setScalar(inst.scale * (0.4 + sizeT * 0.6));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      // Fade in fast, out slow.
      mat.opacity = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      {instances.map((inst, i) => (
        <mesh
          key={inst.key}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.0001}
            flatShading
            emissive="#dde8ff"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
