import { Canvas } from '@react-three/fiber';
import Wave from './Wave';
import Surfer from './Surfer';
import SkyAndLighting from './SkyAndLighting';

export default function WaveScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [4, 3, 6], fov: 50 }}>
        <SkyAndLighting />
        <Wave />
        <Surfer />
      </Canvas>
    </div>
  );
}
