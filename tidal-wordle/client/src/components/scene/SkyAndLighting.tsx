import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  DEFAULT_SKY_THEME,
  skyThemeFor,
  type SkyTheme,
} from '../../stores/weatherStore';
import { useWeatherStore } from '../../stores/weatherStore';

// Skydome shader fades from horizon to overhead. Colours come from the
// weatherStore (NOAA-station-driven Open-Meteo snapshot): day/night and
// condition (clear/cloudy/fog/rain/snow/thunder) each pick a different
// palette. Cloud cover dims the sun proportionally. The shader uniforms
// lerp toward the target so weather changes fade in rather than snap.
export default function SkyAndLighting() {
  const snapshot = useWeatherStore((s) => s.snapshot);

  const target = useMemo<SkyTheme>(() => {
    if (!snapshot) return DEFAULT_SKY_THEME;
    return skyThemeFor(snapshot.isDay, snapshot.condition);
  }, [snapshot]);

  const cloudDim = useMemo(() => {
    const cc = snapshot?.cloudCover;
    if (typeof cc !== 'number') return 1;
    // 0% cloud → 1.0, 100% cloud → 0.55
    return 1 - (cc / 100) * 0.45;
  }, [snapshot?.cloudCover]);

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color(DEFAULT_SKY_THEME.top) },
          midColor: { value: new THREE.Color(DEFAULT_SKY_THEME.mid) },
          bottomColor: { value: new THREE.Color(DEFAULT_SKY_THEME.bottom) },
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

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fogColor = useMemo(() => new THREE.Color(DEFAULT_SKY_THEME.fog), []);
  const targetTopColor = useMemo(() => new THREE.Color(), []);
  const targetMidColor = useMemo(() => new THREE.Color(), []);
  const targetBottomColor = useMemo(() => new THREE.Color(), []);
  const targetSunColor = useMemo(() => new THREE.Color(), []);
  const targetHemiTopColor = useMemo(() => new THREE.Color(), []);
  const targetHemiBottomColor = useMemo(() => new THREE.Color(), []);
  const targetFogColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    targetTopColor.set(target.top);
    targetMidColor.set(target.mid);
    targetBottomColor.set(target.bottom);
    targetSunColor.set(target.sun);
    targetHemiTopColor.set(target.hemiTop);
    targetHemiBottomColor.set(target.hemiBottom);
    targetFogColor.set(target.fog);
  }, [
    target,
    targetTopColor,
    targetMidColor,
    targetBottomColor,
    targetSunColor,
    targetHemiTopColor,
    targetHemiBottomColor,
    targetFogColor,
  ]);

  useFrame((_, dt) => {
    const a = Math.min(1, dt * 1.6);
    const u = skyMaterial.uniforms as Record<
      string,
      { value: THREE.Color }
    >;
    u.topColor.value.lerp(targetTopColor, a);
    u.midColor.value.lerp(targetMidColor, a);
    u.bottomColor.value.lerp(targetBottomColor, a);
    if (ambientRef.current) {
      ambientRef.current.intensity +=
        (target.ambient - ambientRef.current.intensity) * a;
    }
    if (hemiRef.current) {
      hemiRef.current.color.lerp(targetHemiTopColor, a);
      hemiRef.current.groundColor.lerp(targetHemiBottomColor, a);
      hemiRef.current.intensity +=
        (target.hemiIntensity - hemiRef.current.intensity) * a;
    }
    if (sunRef.current) {
      sunRef.current.color.lerp(targetSunColor, a);
      const targetSunI = target.sunIntensity * cloudDim;
      sunRef.current.intensity +=
        (targetSunI - sunRef.current.intensity) * a;
    }
    fogColor.lerp(targetFogColor, a);
  });

  return (
    <>
      <mesh scale={[200, 200, 200]}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      <ambientLight ref={ambientRef} intensity={DEFAULT_SKY_THEME.ambient} />
      <hemisphereLight
        ref={hemiRef}
        args={[
          DEFAULT_SKY_THEME.hemiTop,
          DEFAULT_SKY_THEME.hemiBottom,
          DEFAULT_SKY_THEME.hemiIntensity,
        ]}
      />
      <directionalLight
        ref={sunRef}
        position={[10, 12, 6]}
        intensity={DEFAULT_SKY_THEME.sunIntensity}
        color={DEFAULT_SKY_THEME.sun}
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
      <fog attach="fog" args={[fogColor, 22, 55]} />
    </>
  );
}
