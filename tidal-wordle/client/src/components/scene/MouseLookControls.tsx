import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useViewStore } from '../../stores/viewStore';

// Camera-look controller.
//
// In look mode: cursor is hidden (pointer lock), raw mouse movement drives
// yaw/pitch like a standard FPS.
// In ipad mode: cursor is visible, camera eases to a "looking down at the
// iPad" pose so the UI lands naturally on the iPad held at chest level.

interface Props {
  active: boolean;
  yawLimit?: number;
  pitchLimit?: number;
  sensitivity?: number;
  /** Pitch the camera eases to when not in look mode (negative = looking down). */
  idlePitch?: number;
}

export default function MouseLookControls({
  active,
  yawLimit = Math.PI,
  pitchLimit = (Math.PI / 180) * 70,
  sensitivity = 0.0022,
  idlePitch = -0.62,
}: Props) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(idlePitch);
  const lastPitchPush = useRef(0);

  // Pointer-lock toggling.
  useEffect(() => {
    const el = gl.domElement;
    if (active) {
      const req = el.requestPointerLock?.();
      if (req && typeof (req as Promise<void>).then === 'function') {
        (req as Promise<void>).catch(() => undefined);
      }
    } else if (document.pointerLockElement === el) {
      document.exitPointerLock();
    }
  }, [active, gl]);

  // Raw mouse movement (only used while pointer is locked).
  useEffect(() => {
    const el = gl.domElement;
    function onMove(e: MouseEvent) {
      if (document.pointerLockElement !== el) return;
      yaw.current -= e.movementX * sensitivity;
      pitch.current -= e.movementY * sensitivity;
      if (yaw.current > Math.PI) yaw.current -= 2 * Math.PI;
      if (yaw.current < -Math.PI) yaw.current += 2 * Math.PI;
      yaw.current = Math.max(-yawLimit, Math.min(yawLimit, yaw.current));
      pitch.current = Math.max(-pitchLimit, Math.min(pitchLimit, pitch.current));
    }
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [gl, sensitivity, yawLimit, pitchLimit]);

  useFrame((state) => {
    camera.rotation.order = 'YXZ';
    if (active) {
      camera.rotation.y = yaw.current;
      camera.rotation.x = pitch.current;
    } else {
      // Ease yaw to forward, pitch to the iPad-looking idle angle.
      yaw.current += (0 - yaw.current) * 0.12;
      pitch.current += (idlePitch - pitch.current) * 0.12;
      camera.rotation.y = yaw.current;
      camera.rotation.x = pitch.current;
    }
    camera.rotation.z = 0;

    // Throttled pitch push for the DOM overlay.
    const now = state.clock.elapsedTime;
    if (now - lastPitchPush.current > 0.05) {
      useViewStore.getState().setPitch(pitch.current);
      lastPitchPush.current = now;
    }
  });

  return null;
}
