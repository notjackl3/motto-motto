import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Wave from './Wave';
import Surfer from './Surfer';
import SkyAndLighting from './SkyAndLighting';
import { useGameStore } from '../../stores/gameStore';
import { ambientMusic, unlockAudio } from '../../lib/audio';

export default function WaveScene() {
  const musicSwapActive = useGameStore((s) => s.musicSwapActive);
  const musicMuted = useGameStore((s) => s.musicMuted);

  useEffect(() => {
    const m = ambientMusic();
    if (!m) return;
    m.start();
    return () => {
      // Don't tear down ambient on every scene unmount — it should persist
      // across UI transitions. The browser will release it on page unload.
    };
  }, []);

  useEffect(() => {
    ambientMusic()?.setSwapped(musicSwapActive);
  }, [musicSwapActive]);

  useEffect(() => {
    ambientMusic()?.setMuted(musicMuted);
  }, [musicMuted]);

  // Wake the audio context on the first interaction inside the scene area.
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
        camera={{ position: [4, 3, 6], fov: 50 }}
      >
        <SkyAndLighting />
        <Wave />
        <Surfer />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3.6}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          rotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
