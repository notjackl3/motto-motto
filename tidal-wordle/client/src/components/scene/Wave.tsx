import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTideData } from '../../hooks/useTideData';
import { waveHeightAt } from './waveFunction';

const SIZE = 60;
const SEGMENTS = 80;

export default function Wave() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { waveHeight, waveSpeed } = useTideData();

  // Smooth tide updates so 5-min refreshes don't snap the scene.
  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Stash the rest-pose positions so we can re-displace each frame from a clean slate.
  const restPositions = useMemo(() => {
    const pos = geometry.attributes.position.array as Float32Array;
    return Float32Array.from(pos);
  }, [geometry]);

  useFrame((state) => {
    // Ease toward target so live tide refreshes blend in.
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;

    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length; i += 3) {
      const x = restPositions[i];
      const z = restPositions[i + 2];
      arr[i + 1] = waveHeightAt(
        x,
        z,
        t,
        animState.current.amplitude,
        animState.current.speed,
      );
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -1, 0]} receiveShadow>
      <meshStandardMaterial
        color="#1f5d8a"
        metalness={0.2}
        roughness={0.4}
        flatShading={false}
      />
    </mesh>
  );
}
