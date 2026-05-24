import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getShirt, useAppearanceStore } from '../../stores/appearanceStore';

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
  const shirtColor = getShirt(useAppearanceStore((s) => s.shirtId)).color;
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
          <Hand side="left" shirtColor={shirtColor} />
        </group>
        <group ref={handRRef}>
          <Hand side="right" shirtColor={shirtColor} />
        </group>
      </group>
    </>
  );
}

// Long thin forearm that stretches from the hand back/up/inboard toward
// the (off-screen) shoulder. Single segment — no upper arm or elbow blob
// near the camera, both of which would balloon huge on the near clip plane
// and block the screen.
const FOREARM_LEN = 1.05;
const FOREARM_RADIUS = 0.055;

function Hand({
  side,
  shirtColor,
}: {
  side: 'left' | 'right';
  shirtColor: string;
}) {
  const sign = side === 'left' ? -1 : 1;

  // Direction from hand → elbow. -sign*x means slightly inboard (toward
  // the body centerline), -y means DOWN (the elbow tucks below the hand,
  // not above — otherwise the arm reads as "hanging from the ceiling"),
  // +z means behind the camera so the elbow disappears off-screen.
  const { position, rotation } = useMemo(() => {
    const dir = new THREE.Vector3(-sign * 0.2, -0.55, 0.7).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir,
    );
    const e = new THREE.Euler().setFromQuaternion(q);
    // Cylinder midpoint is L/2 along the elbow direction (so the NEAR end
    // sits at the hand origin (0,0,0) and the FAR end is at elbow ~= dir·L).
    const midpoint: [number, number, number] = [
      (dir.x * FOREARM_LEN) / 2,
      (dir.y * FOREARM_LEN) / 2,
      (dir.z * FOREARM_LEN) / 2,
    ];
    return {
      position: midpoint,
      rotation: [e.x, e.y, e.z] as [number, number, number],
    };
  }, [sign]);

  return (
    <group>
      {/* Long thin forearm stretching off-screen toward the implied shoulder. */}
      <mesh position={position} rotation={rotation} castShadow>
        <cylinderGeometry
          args={[FOREARM_RADIUS, FOREARM_RADIUS * 1.15, FOREARM_LEN, 12]}
        />
        <meshStandardMaterial color={shirtColor} flatShading />
      </mesh>
      {/* Hand */}
      <mesh castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
      {/* Thumb wrapping toward the iPad face. */}
      <mesh
        position={[sign * 0.05, 0.07, 0.03]}
        rotation={[0, 0, sign * -0.5]}
        castShadow
      >
        <capsuleGeometry args={[0.026, 0.07, 4, 8]} />
        <meshStandardMaterial color={SKIN_COLOR} flatShading />
      </mesh>
    </group>
  );
}
