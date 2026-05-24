import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import SkyAndLighting from './SkyAndLighting';
import PlayWave from './PlayWave';
import MouseLookControls from './MouseLookControls';
import BodyRig from './BodyRig';
import IpadRig from './IpadRig';
import SurfingMotion from './SurfingMotion';
import EnvironmentObjects from './EnvironmentObjects';
import PlayerControls from './PlayerControls';
import AmbientSplashes from './AmbientSplashes';
import MysteryBoxes from './MysteryBoxes';
import { useGameStore } from '../../stores/gameStore';
import { ambientMusic, unlockAudio } from '../../lib/audio';

interface Props {
  lookMode: boolean;
}

function Clouds() {
  const clouds = [
    { x: -10, y: 10, z: -20, s: 2.2 },
    { x: 14, y: 12, z: -25, s: 2.8 },
    { x: 4, y: 14, z: -38, s: 3.4 },
    { x: -22, y: 11, z: -32, s: 2.0 },
    { x: 26, y: 16, z: -48, s: 2.6 },
    { x: -34, y: 13, z: -45, s: 2.4 },
  ];
  return (
    <group>
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

export default function PlayScene({ lookMode }: Props) {
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
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
        camera={{
          position: [0, 1.8, 0],
          fov: 70,
          near: 0.05,
          far: 400,
        }}
      >
        <SkyAndLighting />
        <Clouds />
        <PlayWave />
        <EnvironmentObjects />
        {/* MouseLook must run BEFORE SurfingMotion so the surf tilt (pitch
            offset + roll) is applied on top of the mouse-look rotation each
            frame rather than getting wiped by it. */}
        <MouseLookControls active={lookMode} />
        <SurfingMotion lookMode={lookMode} />
        <PlayerControls active={lookMode} />
        <BodyRig />
        <AmbientSplashes />
        <MysteryBoxes lookMode={lookMode} />
        <IpadRig lookMode={lookMode} />
      </Canvas>
    </div>
  );
}
