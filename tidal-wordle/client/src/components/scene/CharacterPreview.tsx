import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getBoard,
  getHat,
  getShirt,
  getShorts,
  useAppearanceStore,
  type BoardOption,
  type HatOption,
  type ShirtOption,
  type ShortsOption,
} from '../../stores/appearanceStore';

// Small focused 3D canvas dedicated to the character preview. Keeps the
// menu screen reliable: even if a parent illustration changes, the preview
// renders independently (no heavy environment, no overlays inside Canvas).

interface Props {
  className?: string;
}

export default function CharacterPreview({ className = '' }: Props) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows="soft"
        gl={{ antialias: true, alpha: true, premultipliedAlpha: true }}
        camera={{ position: [0, 1.4, 4.2], fov: 38 }}
      >
        <ambientLight intensity={0.95} />
        <hemisphereLight args={['#bfe6e8', '#caa078', 0.9]} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={1.1}
          color="#fff1d6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Wooden turntable disk. */}
        <mesh position={[0, -1.06, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.12, 24]} />
          <meshStandardMaterial color="#a06a3a" flatShading />
        </mesh>
        <mesh position={[0, -0.99, 0]} receiveShadow>
          <cylinderGeometry args={[0.98, 0.98, 0.02, 24]} />
          <meshStandardMaterial color="#c4884c" flatShading />
        </mesh>

        <Mannequin />
      </Canvas>
    </div>
  );
}

function Mannequin() {
  const groupRef = useRef<THREE.Group>(null);

  const shirt = getShirt(useAppearanceStore((s) => s.shirtId));
  const shorts = getShorts(useAppearanceStore((s) => s.shortsId));
  const board = getBoard(useAppearanceStore((s) => s.boardId));
  const hat = getHat(useAppearanceStore((s) => s.hatId));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.25;
      groupRef.current.position.y = 0.6 + Math.sin(t * 1.0) * 0.015;
    }
  });

  const SKIN = '#f0caa0';

  return (
    <group ref={groupRef} position={[0, 0.6, 0]}>
      <Legs shorts={shorts} skin={SKIN} />
      {/* Waistband */}
      <mesh position={[0, -0.16, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.26, 0.16, 14]} />
        <meshStandardMaterial color={shorts.color} flatShading />
      </mesh>
      <Torso shirt={shirt} skin={SKIN} />
      <Head skin={SKIN} hat={hat} />
      <Arms shirt={shirt} skin={SKIN} />
      {/* Surfboard upright next to the surfer. */}
      <group position={[0.95, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <BoardMesh board={board} />
      </group>
    </group>
  );
}

function Legs({ shorts, skin }: { shorts: ShortsOption; skin: string }) {
  const isLong = shorts.id === 'black-wetsuit';
  const legHeight = isLong ? 1.3 : 0.85;
  const legY = isLong ? -0.85 : -0.6;
  return (
    <group>
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <mesh position={[sign * 0.18, legY, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, legHeight, 12]} />
            <meshStandardMaterial color={shorts.color} flatShading />
          </mesh>
          {!isLong && (
            <mesh position={[sign * 0.18, legY - 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.115, 0.115, 0.6, 12]} />
              <meshStandardMaterial color={skin} flatShading />
            </mesh>
          )}
          <ShortsAccent shorts={shorts} sign={sign as 1 | -1} legY={legY} legHeight={legHeight} />
        </group>
      ))}
    </group>
  );
}

function ShortsAccent({
  shorts,
  sign,
  legY,
  legHeight,
}: {
  shorts: ShortsOption;
  sign: 1 | -1;
  legY: number;
  legHeight: number;
}) {
  if (shorts.pattern === 'solid') return null;
  if (shorts.pattern === 'stripes-side') {
    return (
      <mesh position={[sign * 0.18 + sign * 0.13, legY, 0]} castShadow>
        <boxGeometry args={[0.02, legHeight * 0.95, 0.06]} />
        <meshStandardMaterial color={shorts.accent} flatShading />
      </mesh>
    );
  }
  if (shorts.pattern === 'stripes-h') {
    return (
      <mesh position={[sign * 0.18, legY + legHeight / 2 - 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.135, 0.135, 0.05, 14]} />
        <meshStandardMaterial color={shorts.accent} flatShading />
      </mesh>
    );
  }
  if (shorts.pattern === 'spots') {
    return (
      <group>
        {[0.15, -0.15, 0.0].map((dy, i) => (
          <mesh
            key={i}
            position={[sign * 0.18 + sign * 0.135, legY + dy, 0.05]}
            castShadow
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={shorts.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shorts.pattern === 'floral') {
    return (
      <group>
        {[0.15, 0, -0.15].map((dy, i) => (
          <mesh
            key={i}
            position={[sign * 0.18, legY + dy, 0.135]}
            castShadow
          >
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={shorts.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

function Torso({ shirt, skin }: { shirt: ShirtOption; skin: string }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.7, 16]} />
        <meshStandardMaterial color={shirt.color} flatShading />
      </mesh>
      <ShirtPattern shirt={shirt} />
      {/* Skin sleeves get added by Arms component. */}
      {void skin}
    </group>
  );
}

function ShirtPattern({ shirt }: { shirt: ShirtOption }) {
  if (shirt.pattern === 'solid') return null;
  if (shirt.pattern === 'stripes-h') {
    return (
      <group>
        {[0.5, 0.34, 0.18].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[0.273, 0.282, 0.06, 16]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'stripes-v') {
    return (
      <group>
        {[-0.06, 0.06].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.28]} castShadow>
            <boxGeometry args={[0.035, 0.65, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'spots') {
    const spots: Array<[number, number, number]> = [];
    const ring = (y: number, phase: number) => {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + phase;
        const r = 0.285;
        spots.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
      }
    };
    ring(0.5, 0);
    ring(0.34, Math.PI / 5);
    ring(0.18, 0);
    ring(0.02, Math.PI / 5);
    return (
      <group>
        {spots.map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (shirt.pattern === 'emblem') {
    return (
      <group position={[0, 0.4, 0.27]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.18, 0.02]} />
          <meshStandardMaterial color={shirt.accent} flatShading />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.05, 0.02]} />
          <meshStandardMaterial color={shirt.accent} flatShading />
        </mesh>
      </group>
    );
  }
  if (shirt.pattern === 'racing') {
    return (
      <group>
        {[-0.09, 0.09].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.28]} castShadow>
            <boxGeometry args={[0.08, 0.7, 0.015]} />
            <meshStandardMaterial color={shirt.accent} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

function Head({ skin, hat }: { skin: string; hat: HatOption }) {
  return (
    <group>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <sphereGeometry args={[0.23, 18, 16]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.95, 0.2]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.08, 0.95, 0.2]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* Smile */}
      <mesh position={[0, 0.83, 0.21]}>
        <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#3a2a1a" />
      </mesh>
      {/* Hair if visible */}
      {(hat.style === 'none' || hat.style === 'visor') && (
        <mesh position={[0, 1.06, -0.02]} castShadow>
          <sphereGeometry args={[0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2a1a0a" flatShading />
        </mesh>
      )}
      <HatMesh hat={hat} />
    </group>
  );
}

function HatMesh({ hat }: { hat: HatOption }) {
  if (hat.style === 'none' || hat.color === null) return null;
  if (hat.style === 'straw') {
    return (
      <group position={[0, 1.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.18, 18]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        {hat.accent && (
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.245, 0.245, 0.03, 18]} />
            <meshStandardMaterial color={hat.accent} flatShading />
          </mesh>
        )}
      </group>
    );
  }
  if (hat.style === 'bucket') {
    return (
      <group position={[0, 1.08, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.05, 22]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.27, 0.22, 22]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        {hat.accent && (
          <mesh position={[0, 0.21, 0]}>
            <cylinderGeometry args={[0.262, 0.262, 0.03, 22]} />
            <meshStandardMaterial color={hat.accent} flatShading />
          </mesh>
        )}
      </group>
    );
  }
  if (hat.style === 'snapback') {
    return (
      <group position={[0, 1.06, 0]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        <mesh position={[0, 0.02, -0.32]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.3]} />
          <meshStandardMaterial color={hat.color} flatShading />
        </mesh>
        {hat.accent && (
          <mesh position={[0, 0.18, 0.21]}>
            <boxGeometry args={[0.1, 0.06, 0.04]} />
            <meshStandardMaterial color={hat.accent} flatShading />
          </mesh>
        )}
      </group>
    );
  }
  // visor
  return (
    <group position={[0, 1.05, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.24, 0.04, 8, 18]} />
        <meshStandardMaterial color={hat.color} flatShading />
      </mesh>
    </group>
  );
}

function Arms({ shirt, skin }: { shirt: ShirtOption; skin: string }) {
  const isTank = shirt.cut === 'tank';
  const isRashguard = shirt.cut === 'rashguard';
  return (
    <group>
      {/* LEFT arm: hangs straight at the side. */}
      <mesh position={[-0.32, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {!isTank && (
        <mesh position={[-0.34, 0.22, 0]} castShadow>
          <cylinderGeometry
            args={[0.085, 0.08, isRashguard ? 0.55 : 0.3, 10]}
          />
          <meshStandardMaterial color={shirt.color} flatShading />
        </mesh>
      )}
      <mesh
        position={[-0.36, isRashguard ? -0.18 : isTank ? 0.18 : -0.05, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.08, 0.078, isRashguard ? 0.32 : isTank ? 0.7 : 0.4, 10]}
        />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[-0.36, -0.42, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>

      {/* RIGHT arm: bent at elbow, hand on top of upright board. */}
      <mesh position={[0.32, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {/* Upper arm angled outward+down to elbow. */}
      <mesh
        position={[0.44, 0.4, 0]}
        rotation={[0, 0, -0.6]}
        castShadow
      >
        <cylinderGeometry
          args={[0.085, 0.08, 0.3, 10]}
        />
        <meshStandardMaterial color={isTank ? skin : shirt.color} flatShading />
      </mesh>
      {/* Elbow */}
      <mesh position={[0.6, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={isRashguard ? shirt.color : skin} flatShading />
      </mesh>
      {/* Forearm goes up+outward to hand on board top. */}
      <mesh
        position={[0.75, 0.55, 0]}
        rotation={[0, 0, -0.6]}
        castShadow
      >
        <cylinderGeometry
          args={[0.075, 0.075, 0.5, 10]}
        />
        <meshStandardMaterial color={isRashguard ? shirt.color : skin} flatShading />
      </mesh>
      {/* Hand on board top */}
      <mesh position={[0.9, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
    </group>
  );
}

function BoardMesh({ board }: { board: BoardOption }) {
  const isLong = board.shape === 'longboard';
  const isFish = board.shape === 'fish';
  const isGun = board.shape === 'gun';
  const width = isFish ? 0.62 : isGun ? 0.42 : isLong ? 0.55 : 0.5;
  const length = isLong ? 2.4 : isGun ? 2.3 : 1.9;
  const noseLen = isLong ? 0.4 : isGun ? 0.7 : 0.55;
  const noseRadius = isGun ? 0.13 : isLong ? 0.3 : 0.26;
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[width, 0.07, length]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>
      <mesh position={[-(width / 2 - 0.04), 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.85]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      <mesh position={[width / 2 - 0.04, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.013, length * 0.85]} />
        <meshStandardMaterial color={board.rail} flatShading />
      </mesh>
      <mesh position={[0, 0, -(length / 2 + noseLen / 2 - 0.05)]}>
        <coneGeometry args={[noseRadius, noseLen, 4]} />
        <meshStandardMaterial color={board.deck} flatShading />
      </mesh>
      <BoardAccent board={board} length={length} width={width} />
      {/* Single stripe down the deck for visual variety. */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.08, 0.012, length * 0.9]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
      {/* Fin (tail). */}
      {isFish ? (
        <group position={[0, -0.04, length / 2 - 0.05]}>
          <mesh position={[-0.12, 0, 0.08]} rotation={[0, 0.4, 0]}>
            <coneGeometry args={[0.08, 0.24, 4]} />
            <meshStandardMaterial color={board.finColor} flatShading />
          </mesh>
          <mesh position={[0.12, 0, 0.08]} rotation={[0, -0.4, 0]}>
            <coneGeometry args={[0.08, 0.24, 4]} />
            <meshStandardMaterial color={board.finColor} flatShading />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, -0.1, length / 2 - 0.1]}>
          <coneGeometry args={[0.08, 0.22, 4]} />
          <meshStandardMaterial color={board.finColor} flatShading />
        </mesh>
      )}
    </group>
  );
}

function BoardAccent({
  board,
  length,
  width,
}: {
  board: BoardOption;
  length: number;
  width: number;
}) {
  if (board.pattern === 'double-stripe') {
    return (
      <group>
        <mesh position={[-0.08, 0.041, 0]}>
          <boxGeometry args={[0.04, 0.012, length * 0.9]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
        <mesh position={[0.08, 0.041, 0]}>
          <boxGeometry args={[0.04, 0.012, length * 0.9]} />
          <meshStandardMaterial color={board.stripe} flatShading />
        </mesh>
      </group>
    );
  }
  if (board.pattern === 'tip-block') {
    return (
      <mesh position={[0, 0.041, -length / 3]}>
        <boxGeometry args={[width * 0.7, 0.012, length / 3]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
    );
  }
  if (board.pattern === 'spots') {
    return (
      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const z = -length / 2 + 0.2 + i * (length / 9);
          const x = i % 2 === 0 ? -0.1 : 0.1;
          return (
            <mesh key={i} position={[x, 0.041, z]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={board.stripe} flatShading />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (board.pattern === 'flame') {
    return (
      <mesh position={[0, 0.041, -length / 2 + 0.2]}>
        <coneGeometry args={[0.15, 0.4, 5]} />
        <meshStandardMaterial color={board.stripe} flatShading />
      </mesh>
    );
  }
  if (board.pattern === 'checker') {
    return (
      <group>
        {Array.from({ length: 12 }).map((_, i) => {
          const row = Math.floor(i / 2);
          const col = i % 2;
          if ((row + col) % 2 !== 0) return null;
          const z = -length / 2 + 0.25 + row * (length / 7);
          const x = (col - 0.5) * 0.18;
          return (
            <mesh key={i} position={[x, 0.042, z]}>
              <boxGeometry args={[0.16, 0.012, length / 8]} />
              <meshStandardMaterial color={board.stripe} flatShading />
            </mesh>
          );
        })}
      </group>
    );
  }
  return null;
}
