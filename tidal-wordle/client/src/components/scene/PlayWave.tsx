import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTideData } from '../../hooks/useTideData';
import { useMovementStore } from '../../stores/movementStore';
import { playWaveHeightAt } from './waveFunction';

// Big stylized water plane centered on the player so the ocean is visible in
// every direction — looking forward, backward, or sideways, you always see
// swell. The plane recenters on the camera each frame to give effectively
// infinite water without paying for a literally infinite mesh.
const WIDTH = 360;
const DEPTH = 360;
const SEG_X = 120;
const SEG_Z = 120;

export default function PlayWave() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { waveHeight, waveSpeed } = useTideData();
  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(WIDTH, DEPTH, SEG_X, SEG_Z);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const restPositions = useMemo(() => {
    const pos = geometry.attributes.position.array as Float32Array;
    return Float32Array.from(pos);
  }, [geometry]);

  useFrame((state) => {
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;
    // Smooth phase: use the accumulated drift distance instead of raw clock
    // time × speedMul. drift integrates `delta · speedMul` continuously, so
    // changing speed never jumps the wave pattern — it just changes the
    // rate. (Was: t · speed · speedMul, which discontinuously jumped the
    // whole product whenever speedMul changed → big wave-pattern glitch.)
    const wavePhaseTime = useMovementStore.getState().driftDistance;
    const arr = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = restPositions[i];
      const z = restPositions[i + 2];
      arr[i + 1] = playWaveHeightAt(
        x,
        z,
        wavePhaseTime,
        animState.current.amplitude,
        animState.current.speed,
      );
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Recenter the plane on the player's XZ each frame. Combined with the
    // phase scroll inside playWaveHeightAt this makes the ocean look
    // infinite and the waves still appear to flow past.
    if (meshRef.current) {
      meshRef.current.position.x = state.camera.position.x;
      meshRef.current.position.z = state.camera.position.z;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, -2.0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#2898d4"
        flatShading
        roughness={0.55}
        metalness={0.08}
      />
    </mesh>
  );
}
