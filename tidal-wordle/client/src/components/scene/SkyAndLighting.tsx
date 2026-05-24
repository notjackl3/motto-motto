import { useMemo } from 'react';
import * as THREE from 'three';

// Gradient skydome: a large back-faced sphere with a custom shader that fades
// from a warm peach near the horizon up to a clean blue overhead.
export default function SkyAndLighting() {
  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color('#4ca7e8') },
          midColor: { value: new THREE.Color('#f7c8a0') },
          bottomColor: { value: new THREE.Color('#ffe6c2') },
        },
        vertexShader: `
          varying vec3 vWorldPos;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPos;
          void main() {
            float h = normalize(vWorldPos).y;
            vec3 col;
            if (h > 0.0) {
              col = mix(midColor, topColor, smoothstep(0.0, 0.55, h));
            } else {
              col = mix(midColor, bottomColor, smoothstep(0.0, -0.4, h));
            }
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [],
  );

  return (
    <>
      <mesh scale={[200, 200, 200]}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#bfe6e8', '#6a8a9a', 1.1]} />
      <directionalLight
        position={[10, 12, 6]}
        intensity={0.9}
        color="#fff1d6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0005}
        shadow-radius={6}
      />
      <fog attach="fog" args={['#ffd9b4', 22, 55]} />
    </>
  );
}
