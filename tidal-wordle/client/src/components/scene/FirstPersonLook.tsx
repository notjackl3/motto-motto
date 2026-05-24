import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// Soft "head-follows-mouse" look-around. Camera yaw/pitch ease toward a target
// derived from cursor position, so the player can glance around but the iPad
// (which we re-pin every frame in camera-local space) stays centered.
//
// Limits are tight on purpose: ±25° yaw, ±12° pitch. Beyond that the iPad
// frame would start to feel disconnected from the body, and we want the
// gameplay to remain the focal point.

interface Props {
  yawLimit?: number;
  pitchLimit?: number;
  ease?: number;
}

export default function FirstPersonLook({
  yawLimit = (Math.PI / 180) * 25,
  pitchLimit = (Math.PI / 180) * 12,
  ease = 0.06,
}: Props) {
  const { camera } = useThree();
  const target = useRef({ yaw: 0, pitch: 0 });
  const current = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current.yaw = -nx * yawLimit;
      target.current.pitch = -ny * pitchLimit;
    }
    function onLeave() {
      target.current.yaw = 0;
      target.current.pitch = 0;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [yawLimit, pitchLimit]);

  useFrame(() => {
    current.current.yaw += (target.current.yaw - current.current.yaw) * ease;
    current.current.pitch += (target.current.pitch - current.current.pitch) * ease;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = current.current.yaw;
    camera.rotation.x = current.current.pitch;
    camera.rotation.z = 0;
  });

  return null;
}
