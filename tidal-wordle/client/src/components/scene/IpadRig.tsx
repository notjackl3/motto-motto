import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTideData } from '../../hooks/useTideData';
import { playWaveHeightAt } from './waveFunction';

// Camera-locked: just the iPad and the hands gripping it. The torso, legs,
// surfboard, and foam live in BodyRig (yaw-only) so they hide behind the
// view frustum when looking forward and become visible when looking down —
// real first-person convention.
//
// Hands get short orange wrist nubs that hint at arms going off-screen,
// without us needing to dynamically connect them to the body's shoulders.

const FORWARD_TILT_MULT = 0.16;
const SHIRT_COLOR = '#e25a3a';
const SKIN_COLOR = '#f0caa0';

// iPad position in camera-local space.
//   - Focus (ipad) mode: held up centered, primary reading surface.
//   - Look (driving) mode: dropped to the bottom of the view, tilted back
//     so its face is still readable when the camera looks forward.
const IPAD_POS_IPAD: [number, number, number] = [0, 0, -0.7];
const IPAD_POS_LOOK: [number, number, number] = [0, -0.55, -0.85];
const IPAD_TILT_LOOK = 0.55; // ~31° tilt back to face the camera
const IPAD_BODY: [number, number, number] = [0.78, 0.55, 0.025];
const IPAD_SCREEN: [number, number] = [0.72, 0.49];

// Hands sit just under the iPad in both modes — we offset them to follow.
const HAND_OFFSET_X = 0.42;
const HAND_OFFSET_Y = -0.05;
const HAND_OFFSET_Z = 0.04;

interface Props {
  lookMode: boolean;
}

export default function IpadRig({ lookMode }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const ipadRef = useRef<THREE.Group>(null);
  const handLRef = useRef<THREE.Group>(null);
  const handRRef = useRef<THREE.Group>(null);
  const { waveHeight, waveSpeed } = useTideData();
  const animState = useRef({ amplitude: waveHeight, speed: waveSpeed });
  const easedSlope = useRef(0);
  const easedPos = useRef<[number, number, number]>([...IPAD_POS_IPAD]);
  const easedTilt = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    animState.current.amplitude += (waveHeight - animState.current.amplitude) * 0.04;
    animState.current.speed += (waveSpeed - animState.current.speed) * 0.04;

    const t = state.clock.elapsedTime;
    const amp = animState.current.amplitude;
    const spd = animState.current.speed;

    // Glue to the camera 1:1 — body parts in IpadRig stay locked in screen
    // space; SurfingMotion handles the surfing bob via the camera itself.
    groupRef.current.position.copy(state.camera.position);
    groupRef.current.quaternion.copy(state.camera.quaternion);

    // Ease the iPad position + tilt between the two modes so toggling E
    // smoothly drops the iPad to the bottom of the view (or back up).
    const target = lookMode ? IPAD_POS_LOOK : IPAD_POS_IPAD;
    const targetTilt = lookMode ? IPAD_TILT_LOOK : 0;
    const k = 0.12;
    easedPos.current[0] += (target[0] - easedPos.current[0]) * k;
    easedPos.current[1] += (target[1] - easedPos.current[1]) * k;
    easedPos.current[2] += (target[2] - easedPos.current[2]) * k;
    easedTilt.current += (targetTilt - easedTilt.current) * k;

    // In look mode the iPad is fully stabilized — no wave rock — because
    // the camera is already doing the rocking and we want the iPad to feel
    // gripped in the player's hands. We keep a tiny breathing slope only
    // for iPad mode where the camera is still and the iPad needs life.
    const targetSlope = lookMode
      ? 0
      : (playWaveHeightAt(0, 0.8, t, amp, spd) -
          playWaveHeightAt(0, -0.8, t, amp, spd)) *
        0.25;
    easedSlope.current += (targetSlope - easedSlope.current) * 0.08;

    if (ipadRef.current) {
      ipadRef.current.position.set(
        easedPos.current[0],
        easedPos.current[1],
        easedPos.current[2],
      );
      ipadRef.current.rotation.x =
        easedTilt.current + easedSlope.current * FORWARD_TILT_MULT;
    }
    // Hands follow the iPad so the player still appears to be holding it.
    if (handLRef.current) {
      handLRef.current.position.set(
        -HAND_OFFSET_X + easedPos.current[0],
        HAND_OFFSET_Y + easedPos.current[1],
        HAND_OFFSET_Z + easedPos.current[2],
      );
      handLRef.current.rotation.x = easedTilt.current;
    }
    if (handRRef.current) {
      handRRef.current.position.set(
        HAND_OFFSET_X + easedPos.current[0],
        HAND_OFFSET_Y + easedPos.current[1],
        HAND_OFFSET_Z + easedPos.current[2],
      );
      handRRef.current.rotation.x = easedTilt.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hands gripping the iPad with short wrist sleeves trailing off. */}
      <group ref={handLRef}>
        <Hand side="left" />
      </group>
      <group ref={handRRef}>
        <Hand side="right" />
      </group>

      {/* iPad — screen face is blank in 3D; DOM overlay paints the UI. */}
      <group ref={ipadRef}>
        <mesh castShadow>
          <boxGeometry args={IPAD_BODY} />
          <meshStandardMaterial color="#1a1a1a" flatShading />
        </mesh>
        <mesh position={[0, 0, 0.014]}>
          <boxGeometry args={[IPAD_BODY[0] - 0.02, IPAD_BODY[1] - 0.02, 0.005]} />
          <meshStandardMaterial color="#0a0a0a" flatShading />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={IPAD_SCREEN} />
          <meshBasicMaterial color="#0a2336" />
        </mesh>
      </group>
    </group>
  );
}

function Hand({ side }: { side: 'left' | 'right' }) {
  return (
    <group>
      {/* Wrist sleeve fading off toward the (off-screen) elbow. */}
      <mesh
        position={[side === 'left' ? -0.06 : 0.06, -0.06, 0.06]}
        rotation={[0.3, 0, side === 'left' ? 0.4 : -0.4]}
        castShadow
      >
        <cylinderGeometry args={[0.06, 0.07, 0.28, 10]} />
        <meshStandardMaterial color={SHIRT_COLOR} flatShading />
      </mesh>
      {/* Hand */}
      <mesh castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
      {/* Thumb wrapping around to the iPad face. */}
      <mesh
        position={[side === 'left' ? 0.05 : -0.05, 0.07, 0.03]}
        rotation={[0, 0, side === 'left' ? -0.5 : 0.5]}
        castShadow
      >
        <capsuleGeometry args={[0.028, 0.07, 4, 8]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
    </group>
  );
}

