import { useState } from 'react';
import WardrobeScene from '../scene/WardrobeScene';
import {
  BOARDS,
  HATS,
  SHIRTS,
  SHORTS,
  useAppearanceStore,
  getBoard,
  getShirt,
  getShorts,
  getHat,
  type BoardOption,
  type HatOption,
  type ShirtOption,
  type ShortsOption,
} from '../../stores/appearanceStore';
import { useGameStore } from '../../stores/gameStore';

interface MainMenuProps {
  onSolo: () => void;
  onMultiplayer: () => void;
}

type WardrobeTab = 'shirt' | 'shorts' | 'board' | 'hat';

// Beach island welcome screen.
//   - 3D wooden menu signs (PLAY SOLO / MULTIPLAYER / SETTINGS) live IN the
//     scene on the left side of the island.
//   - A 3D wooden wardrobe rack stands on the right; the HTML wardrobe panel
//     is positioned to visually nest into it (carved-wood styling, solid
//     wood-tone colors, no emojis or gradients).

export default function MainMenu({ onSolo, onMultiplayer }: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState<WardrobeTab>('shirt');
  const musicMuted = useGameStore((s) => s.musicMuted);
  const setMusicMuted = useGameStore((s) => s.setMusicMuted);

  const shirtId = useAppearanceStore((s) => s.shirtId);
  const shortsId = useAppearanceStore((s) => s.shortsId);
  const boardId = useAppearanceStore((s) => s.boardId);
  const hatId = useAppearanceStore((s) => s.hatId);
  const setShirt = useAppearanceStore((s) => s.setShirt);
  const setShorts = useAppearanceStore((s) => s.setShorts);
  const setBoard = useAppearanceStore((s) => s.setBoard);
  const setHat = useAppearanceStore((s) => s.setHat);

  const currentShirt = getShirt(shirtId);
  const currentShorts = getShorts(shortsId);
  const currentBoard = getBoard(boardId);
  const currentHat = getHat(hatId);

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <WardrobeScene
        onSolo={onSolo}
        onMultiplayer={onMultiplayer}
        onSettings={() => setShowSettings((v) => !v)}
      />

      {/* Settings drawer — appears near the SETTINGS sign in the scene. */}
      {showSettings && (
        <div className="absolute left-6 bottom-10 z-20">
          <WoodPanel className="w-72 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-[#3a2a14] tracking-[0.2em]">
                SETTINGS
              </div>
              <button
                onClick={() => setShowSettings(false)}
                aria-label="Close"
                className="text-[#7a4d24] hover:text-[#3a2a14] text-lg leading-none w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <label className="flex items-center justify-between gap-2 cursor-pointer text-sm text-[#3a2a14]">
              <span>Background music</span>
              <input
                type="checkbox"
                checked={!musicMuted}
                onChange={(e) => setMusicMuted(!e.target.checked)}
                className="h-4 w-4 accent-[#3aa8c0]"
              />
            </label>
          </WoodPanel>
        </div>
      )}

      {/* Footer attribution. */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/70 italic select-none pointer-events-none">
        Tide data: NOAA CO-OPS · La Jolla #9410230
      </div>

      {/* RIGHT: wardrobe panel — sits over the 3D wooden rack in the scene. */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-[min(420px,38vw)] pointer-events-auto z-10">
        <WoodPanel className="w-full">
          {/* Banner header */}
          <div
            className="px-4 pt-3 pb-2 flex items-baseline justify-between border-b-2"
            style={{
              backgroundColor: '#caa078',
              borderColor: '#7a4d24',
            }}
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-[#3a2a14]/80">
                Beach Cabana
              </div>
              <div className="text-lg font-extrabold text-[#3a2a14] tracking-[0.15em]">
                YOUR LOOK
              </div>
            </div>
          </div>

          {/* Wooden tabs */}
          <div
            className="flex border-b-2"
            style={{ backgroundColor: '#a07a52', borderColor: '#7a4d24' }}
          >
            <Tab label="SHIRT" active={tab === 'shirt'} onClick={() => setTab('shirt')} />
            <Tab label="SHORTS" active={tab === 'shorts'} onClick={() => setTab('shorts')} />
            <Tab label="BOARD" active={tab === 'board'} onClick={() => setTab('board')} />
            <Tab label="HAT" active={tab === 'hat'} onClick={() => setTab('hat')} />
          </div>

          {/* Body */}
          <div className="p-4" style={{ backgroundColor: '#f4e1c1' }}>
            {tab === 'shirt' && (
              <CurrentSelection
                name={currentShirt.name}
                description={currentShirt.description}
              />
            )}
            {tab === 'shorts' && (
              <CurrentSelection
                name={currentShorts.name}
                description={currentShorts.description}
              />
            )}
            {tab === 'board' && (
              <CurrentSelection
                name={currentBoard.name}
                description={currentBoard.description}
              />
            )}
            {tab === 'hat' && (
              <CurrentSelection
                name={currentHat.name}
                description={currentHat.description}
              />
            )}

            <div className="grid grid-cols-4 gap-2 mt-3 max-h-64 overflow-y-auto pr-1">
              {tab === 'shirt' &&
                SHIRTS.map((s) => (
                  <ShirtSwatch
                    key={s.id}
                    shirt={s}
                    selected={shirtId === s.id}
                    onClick={() => setShirt(s.id)}
                  />
                ))}
              {tab === 'shorts' &&
                SHORTS.map((s) => (
                  <ShortsSwatch
                    key={s.id}
                    shorts={s}
                    selected={shortsId === s.id}
                    onClick={() => setShorts(s.id)}
                  />
                ))}
              {tab === 'board' &&
                BOARDS.map((b) => (
                  <BoardSwatch
                    key={b.id}
                    board={b}
                    selected={boardId === b.id}
                    onClick={() => setBoard(b.id)}
                  />
                ))}
              {tab === 'hat' &&
                HATS.map((h) => (
                  <HatSwatch
                    key={h.id}
                    hat={h}
                    selected={hatId === h.id}
                    onClick={() => setHat(h.id)}
                  />
                ))}
            </div>
          </div>

          <div
            className="px-4 py-2 text-[10px] italic text-center text-[#3a2a14]/80 border-t-2"
            style={{ backgroundColor: '#caa078', borderColor: '#7a4d24' }}
          >
            choices saved · carried into the game
          </div>
        </WoodPanel>
      </div>
    </div>
  );
}

// --- WoodPanel: a wood-tone carved board with iron nail studs ---

function WoodPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative shadow-2xl ${className}`}
      style={{
        backgroundColor: '#f4e1c1',
        border: '4px solid #7a4d24',
        borderRadius: '6px',
        boxShadow:
          '0 12px 30px rgba(0,0,0,0.5), inset 0 0 0 2px #caa078, inset 0 0 0 4px #7a4d24',
      }}
    >
      <div
        className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: '#2a2a2a' }}
      />
      <div
        className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: '#2a2a2a' }}
      />
      <div
        className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: '#2a2a2a' }}
      />
      <div
        className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: '#2a2a2a' }}
      />
      <div className="relative overflow-hidden" style={{ borderRadius: '2px' }}>
        {children}
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-xs font-extrabold tracking-[0.2em] transition border-b-4"
      style={{
        backgroundColor: active ? '#caa078' : 'transparent',
        color: active ? '#3a2a14' : '#3a2a14',
        opacity: active ? 1 : 0.65,
        borderColor: active ? '#3a2a14' : 'transparent',
      }}
    >
      {label}
    </button>
  );
}

function CurrentSelection({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="mb-1 text-center">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#7a4d24]">
        Equipped
      </div>
      <div className="text-lg font-extrabold text-[#3a2a14] tracking-wide">
        {name}
      </div>
      <div className="text-xs text-[#5a3a1a] italic mt-1 px-2">
        {description}
      </div>
    </div>
  );
}

// --- Swatches with pattern previews (carved wood frames, no emoji) ---

function SwatchFrame({
  selected,
  onClick,
  title,
  background,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  background: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="group relative aspect-square transition hover:scale-105 overflow-hidden"
      style={{
        backgroundColor: background,
        border: selected ? '3px solid #3a2a14' : '3px solid #7a4d24',
        outline: selected ? '2px solid #3aa8c0' : 'none',
        borderRadius: '4px',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      {children}
      {selected && (
        <span
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold"
          style={{ backgroundColor: '#3aa8c0', color: '#0a2a3a' }}
        >
          ✓
        </span>
      )}
      <span
        className="absolute inset-x-0 -bottom-5 text-[9px] text-center truncate opacity-0 group-hover:opacity-100 transition"
        style={{ color: '#3a2a14' }}
      >
        {title}
      </span>
    </button>
  );
}

function ShirtSwatch({
  shirt,
  selected,
  onClick,
}: {
  shirt: ShirtOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <SwatchFrame
      selected={selected}
      onClick={onClick}
      title={shirt.name}
      background={shirt.color}
    >
      <ShirtPatternPreview shirt={shirt} />
    </SwatchFrame>
  );
}

function ShirtPatternPreview({ shirt }: { shirt: ShirtOption }) {
  if (shirt.pattern === 'solid') return null;
  if (shirt.pattern === 'stripes-h') {
    return (
      <div className="absolute inset-0 flex flex-col justify-around py-2">
        <div className="h-1 mx-1" style={{ backgroundColor: shirt.accent }} />
        <div className="h-1 mx-1" style={{ backgroundColor: shirt.accent }} />
        <div className="h-1 mx-1" style={{ backgroundColor: shirt.accent }} />
      </div>
    );
  }
  if (shirt.pattern === 'stripes-v') {
    return (
      <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1" style={{ backgroundColor: shirt.accent }} />
        <div className="w-1" style={{ backgroundColor: shirt.accent }} />
      </div>
    );
  }
  if (shirt.pattern === 'spots') {
    return (
      <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              backgroundColor: shirt.accent,
              width: '70%',
              aspectRatio: '1',
              justifySelf: 'center',
              alignSelf: 'center',
            }}
          />
        ))}
      </div>
    );
  }
  if (shirt.pattern === 'emblem') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-6 h-6">
          <div
            className="absolute left-1/2 top-0 bottom-0 w-1.5 -translate-x-1/2"
            style={{ backgroundColor: shirt.accent }}
          />
          <div
            className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2"
            style={{ backgroundColor: shirt.accent }}
          />
        </div>
      </div>
    );
  }
  if (shirt.pattern === 'racing') {
    return (
      <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 flex gap-1.5">
        <div className="w-1.5" style={{ backgroundColor: shirt.accent }} />
        <div className="w-1.5" style={{ backgroundColor: shirt.accent }} />
      </div>
    );
  }
  return null;
}

function ShortsSwatch({
  shorts,
  selected,
  onClick,
}: {
  shorts: ShortsOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <SwatchFrame
      selected={selected}
      onClick={onClick}
      title={shorts.name}
      background={shorts.color}
    >
      <ShortsPatternPreview shorts={shorts} />
    </SwatchFrame>
  );
}

function ShortsPatternPreview({ shorts }: { shorts: ShortsOption }) {
  if (shorts.pattern === 'solid') return null;
  if (shorts.pattern === 'stripes-side') {
    return (
      <>
        <div
          className="absolute inset-y-2 left-2 w-1"
          style={{ backgroundColor: shorts.accent }}
        />
        <div
          className="absolute inset-y-2 right-2 w-1"
          style={{ backgroundColor: shorts.accent }}
        />
      </>
    );
  }
  if (shorts.pattern === 'stripes-h') {
    return (
      <div
        className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-1.5"
        style={{ backgroundColor: shorts.accent }}
      />
    );
  }
  if (shorts.pattern === 'spots') {
    return (
      <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              backgroundColor: shorts.accent,
              width: '55%',
              aspectRatio: '1',
              justifySelf: 'center',
              alignSelf: 'center',
            }}
          />
        ))}
      </div>
    );
  }
  if (shorts.pattern === 'floral') {
    return (
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <Hibiscus key={i} color={shorts.accent} />
        ))}
      </div>
    );
  }
  return null;
}

function Hibiscus({ color }: { color: string }) {
  // 5-petal flower built from CSS pseudo-circles.
  return (
    <div className="relative w-3 h-3 mx-auto my-auto">
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * 360;
        return (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-4px)`,
            }}
          />
        );
      })}
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: '#3a2a14' }}
      />
    </div>
  );
}

function BoardSwatch({
  board,
  selected,
  onClick,
}: {
  board: BoardOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <SwatchFrame
      selected={selected}
      onClick={onClick}
      title={board.name}
      background="#caa078"
    >
      <BoardShapePreview board={board} />
    </SwatchFrame>
  );
}

function BoardShapePreview({ board }: { board: BoardOption }) {
  const shape = board.shape;
  const isLong = shape === 'longboard';
  const isGun = shape === 'gun';
  const isFish = shape === 'fish';
  const widthPct = isLong ? 32 : isGun ? 22 : isFish ? 36 : 30;
  const heightPct = isLong ? 90 : isGun ? 92 : 80;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="relative"
        style={{
          width: `${widthPct}%`,
          height: `${heightPct}%`,
          backgroundColor: board.deck,
          border: `2px solid ${board.rail}`,
          borderRadius: isFish ? '50% 50% 30% 30%' : '50%',
        }}
      >
        {board.pattern === 'single-stripe' && (
          <div
            className="absolute left-1/2 top-2 bottom-2 w-1 -translate-x-1/2"
            style={{ backgroundColor: board.stripe }}
          />
        )}
        {board.pattern === 'double-stripe' && (
          <>
            <div
              className="absolute top-2 bottom-2 w-1"
              style={{
                backgroundColor: board.stripe,
                left: 'calc(50% - 4px)',
              }}
            />
            <div
              className="absolute top-2 bottom-2 w-1"
              style={{
                backgroundColor: board.stripe,
                left: 'calc(50% + 2px)',
              }}
            />
          </>
        )}
        {board.pattern === 'tip-block' && (
          <div
            className="absolute left-0 right-0 top-0 h-1/3"
            style={{
              backgroundColor: board.stripe,
              borderRadius: '50% 50% 0 0',
            }}
          />
        )}
        {board.pattern === 'spots' && (
          <div className="absolute inset-2 grid grid-cols-2 grid-rows-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  backgroundColor: board.stripe,
                  width: '60%',
                  aspectRatio: '1',
                  justifySelf: 'center',
                  alignSelf: 'center',
                }}
              />
            ))}
          </div>
        )}
        {board.pattern === 'flame' && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: board.stripe }}
          />
        )}
        {board.pattern === 'checker' && (
          <div className="absolute inset-1 grid grid-cols-2 grid-rows-4 gap-px overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor:
                    (Math.floor(i / 2) + (i % 2)) % 2 === 0
                      ? board.stripe
                      : board.deck,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HatSwatch({
  hat,
  selected,
  onClick,
}: {
  hat: HatOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <SwatchFrame
      selected={selected}
      onClick={onClick}
      title={hat.name}
      background="#caa078"
    >
      <HatShapePreview hat={hat} />
    </SwatchFrame>
  );
}

function HatShapePreview({ hat }: { hat: HatOption }) {
  if (hat.style === 'none') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: '#f0caa0', border: '1.5px solid #3a2a14' }}
        />
      </div>
    );
  }
  const color = hat.color ?? '#caa078';
  if (hat.style === 'straw') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            className="rounded-full"
            style={{
              backgroundColor: color,
              width: '36px',
              height: '8px',
              border: '1.5px solid #3a2a14',
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              backgroundColor: color,
              width: '16px',
              height: '12px',
              borderTopLeftRadius: '50%',
              borderTopRightRadius: '50%',
              border: '1.5px solid #3a2a14',
              borderBottom: 'none',
              transform: 'translate(-50%, -8px)',
            }}
          />
          {hat.accent && (
            <div
              className="absolute"
              style={{
                backgroundColor: hat.accent,
                width: '16px',
                height: '3px',
                top: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          )}
        </div>
      </div>
    );
  }
  if (hat.style === 'bucket') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            backgroundColor: color,
            width: '28px',
            height: '20px',
            border: '1.5px solid #3a2a14',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
          }}
        >
          <div
            className="absolute -bottom-1 -left-1 -right-1 rounded-full"
            style={{
              backgroundColor: color,
              height: '6px',
              border: '1.5px solid #3a2a14',
            }}
          />
          {hat.accent && (
            <div
              className="absolute left-0 right-0"
              style={{
                backgroundColor: hat.accent,
                top: '60%',
                height: '3px',
              }}
            />
          )}
        </div>
      </div>
    );
  }
  if (hat.style === 'snapback') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '24px',
              height: '14px',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              border: '1.5px solid #3a2a14',
            }}
          />
          <div
            className="absolute -bottom-1.5"
            style={{
              backgroundColor: color,
              left: '-6px',
              right: '12px',
              height: '5px',
              border: '1.5px solid #3a2a14',
              borderRadius: '0 0 4px 4px',
            }}
          />
          {hat.accent && (
            <div
              className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-1.5"
              style={{ backgroundColor: hat.accent }}
            />
          )}
        </div>
      </div>
    );
  }
  // visor
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <div
          style={{
            backgroundColor: color,
            width: '24px',
            height: '4px',
            border: '1.5px solid #3a2a14',
            borderRadius: '6px',
          }}
        />
        <div
          className="absolute"
          style={{
            backgroundColor: hat.accent ?? '#fff',
            top: '4px',
            left: '-4px',
            right: '-4px',
            height: '8px',
            border: '1.5px solid #3a2a14',
            borderRadius: '0 0 12px 12px',
            borderTop: 'none',
          }}
        />
      </div>
    </div>
  );
}
