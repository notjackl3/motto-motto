import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Camera-locked iPad + hands.
//
// Architecture:
//   - ipadGroupRef is camera-locked instantly (position + quaternion copy).
//     It carries the iPad mesh, which is hidden in drive (look) mode.
//   - armsGroupRef trails the camera with a per-frame lerp/slerp so the
//     hands SWING subtly when the player turns their head. In iPad mode
//     the lerp factor is 1.0 (snap) so the hands stay glued to the iPad
//     they're gripping. In drive mode it's 0.16, giving ~4-frame lag for
//     a natural inertial swing.
//   - Hand positions inside armsGroupRef ease between a "grip" pose
//     (gripping the iPad in focus mode) and a "rest" pose (relaxed at
//     chest level in drive mode), so when the iPad disappears for
//     driving the hands settle into a natural surfing stance.

const SHIRT_COLOR = '#e25a3a';
const SKIN_COLOR = '#f0caa0';

const IPAD_POS_IPAD: [number, number, number] = [0, 0, -0.7];
const IPAD_BODY: [number, number, number] = [0.78, 0.55, 0.025];
const IPAD_SCREEN: [number, number] = [0.72, 0.49];

// Hand pose targets, in camera-local space (i.e. armsGroup-local once it
// catches up to the camera).
const HAND_GRIP_L: [number, number, number] = [-0.42, -0.05, -0.66];
const HAND_GRIP_R: [number, number, number] = [0.42, -0.05, -0.66];
const HAND_REST_L: [number, number, number] = [-0.5, -0.55, -0.55];
const HAND_REST_R: [number, number, number] = [0.5, -0.55, -0.55];

const ARM_LAG_LOOK = 0.16; // smaller = laggier = more swing
const HAND_POSE_EASE = 0.1;

interface Props {
  lookMode: boolean;
}

export default function IpadRig({ lookMode }: Props) {
  const ipadGroupRef = useRef<THREE.Group>(null);
  const ipadRef = useRef<THREE.Group>(null);
  const armsGroupRef = useRef<THREE.Group>(null);
  const handLRef = useRef<THREE.Group>(null);
  const handRRef = useRef<THREE.Group>(null);
  const initializedArms = useRef(false);
  const easedHandL = useRef(new THREE.Vector3(...HAND_GRIP_L));
  const easedHandR = useRef(new THREE.Vector3(...HAND_GRIP_R));
  const tmpTarget = useRef(new THREE.Vector3()).current;

  useFrame((state) => {
    const cam = state.camera;

    // --- iPad group: snaps to camera, hidden in drive mode. ---
    if (ipadGroupRef.current) {
      ipadGroupRef.current.position.copy(cam.position);
      ipadGroupRef.current.quaternion.copy(cam.quaternion);
      ipadGroupRef.current.visible = !lookMode;
    }
    if (ipadRef.current) {
      ipadRef.current.position.set(...IPAD_POS_IPAD);
      ipadRef.current.rotation.set(0, 0, 0);
    }

    // --- Arms group: trails the camera. Lag factor controls the swing. ---
    if (armsGroupRef.current) {
      if (!initializedArms.current) {
        armsGroupRef.current.position.copy(cam.position);
        armsGroupRef.current.quaternion.copy(cam.quaternion);
        initializedArms.current = true;
      }
      const lerpFactor = lookMode ? ARM_LAG_LOOK : 1.0;
      armsGroupRef.current.position.lerp(cam.position, lerpFactor);
      armsGroupRef.current.quaternion.slerp(cam.quaternion, lerpFactor);
    }

    // Hand pose targets — gripping the iPad vs. resting at chest level.
    const targetL = lookMode ? HAND_REST_L : HAND_GRIP_L;
    const targetR = lookMode ? HAND_REST_R : HAND_GRIP_R;
    tmpTarget.set(...targetL);
    easedHandL.current.lerp(tmpTarget, HAND_POSE_EASE);
    tmpTarget.set(...targetR);
    easedHandR.current.lerp(tmpTarget, HAND_POSE_EASE);

    if (handLRef.current) {
      handLRef.current.position.copy(easedHandL.current);
    }
    if (handRRef.current) {
      handRRef.current.position.copy(easedHandR.current);
    }
  });

  return (
    <>
      {/* iPad — camera-locked, hidden while driving. */}
      <group ref={ipadGroupRef}>
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

      {/* Arms — lag-following the camera so they swing when you look around. */}
      <group ref={armsGroupRef}>
        <group ref={handLRef}>
          <Hand side="left" />
        </group>
        <group ref={handRRef}>
          <Hand side="right" />
        </group>
      </group>
    </>
  );
}

// Forearm + upper-arm dimensions. The forearm is the visible "arm" the
// player sees from a first-person POV — long enough to clearly read as a
// limb running off-screen toward the elbow. The upper arm hints at the
// continuation toward the (mostly invisible) shoulder.
const FOREARM_LEN = 0.72;
const UPPERARM_LEN = 0.55;

function Hand({ side }: { side: 'left' | 'right' }) {
  const sign = side === 'left' ? -1 : 1;
  return (
    <group>
      {/* Forearm — runs from the hand (near end) up + inboard + back toward
          the elbow. The cylinder's local +Y is its long axis, so we tilt
          back (rotation.x) and inboard (rotation.z) and translate the
          midpoint along that direction. With length 0.72 you see most of
          the forearm in view, with the elbow tucking off-screen. */}
      <mesh
        position={[sign * -0.13, -0.26, 0.32]}
        rotation={[0.55, 0, sign * 0.42]}
        castShadow
      >
        <cylinderGeometry args={[0.07, 0.085, FOREARM_LEN, 12]} />
        <meshStandardMaterial color={SHIRT_COLOR} flatShading />
      </mesh>
      {/* Upper arm — continues from the elbow toward the shoulder (mostly
          off-screen). Slightly steeper tilt back so it looks like the arm
          bends naturally at the elbow. */}
      <mesh
        position={[sign * -0.3, -0.6, 0.78]}
        rotation={[0.85, 0, sign * 0.55]}
        castShadow
      >
        <cylinderGeometry args={[0.085, 0.095, UPPERARM_LEN, 12]} />
        <meshStandardMaterial color={SHIRT_COLOR} flatShading />
      </mesh>
      {/* Elbow joint — sphere bridging the two limb segments. */}
      <mesh position={[sign * -0.22, -0.45, 0.6]} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={SHIRT_COLOR} flatShading />
      </mesh>
      {/* Wrist (slight skin-tone cuff at hand end) */}
      <mesh position={[sign * -0.02, -0.04, 0.04]} castShadow>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
      {/* Hand */}
      <mesh castShadow>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
      {/* Thumb wrapping toward the iPad face. */}
      <mesh
        position={[sign * 0.055, 0.075, 0.04]}
        rotation={[0, 0, sign * -0.5]}
        castShadow
      >
        <capsuleGeometry args={[0.03, 0.085, 4, 8]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
    </group>
  );
}
