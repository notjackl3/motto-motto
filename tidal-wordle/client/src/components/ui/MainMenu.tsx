import { useState } from 'react';
import WardrobeScene, { type WardrobeFocus } from '../scene/WardrobeScene';
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
import TideMarquee from './TideMarquee';

interface MainMenuProps {
  onSolo: () => void;
  onMultiplayer: () => void;
}

type WardrobeTab = 'shirt' | 'shorts' | 'board' | 'hat';

// Welcome screen.
// Layer stack (back → front):
//   1. <WardrobeScene/> — full-screen 3D scene with animated wave, sky,
//      palm trees, mannequin on a sandy island, and 3D wooden sign post +
//      wardrobe display rack as decorative meshes.
//   2. HTML wooden sign buttons positioned over the 3D sign post (so the
//      labels are crisp text and the clicks are reliable HTML clicks).
//   3. HTML wardrobe panel positioned over the 3D display rack.

export default function MainMenu({ onSolo, onMultiplayer }: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState<WardrobeTab>('shirt');
  const [focus, setFocus] = useState<WardrobeFocus>('overview');

  function selectTab(t: WardrobeTab) {
    setTab(t);
    // Camera zooms into the relevant body part. Re-clicking the active tab
    // returns to the overview.
    setFocus((cur) => (cur === t ? 'overview' : t));
  }
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
    <div className="relative h-full w-full overflow-hidden">
      {/* 3D scene fills the entire viewport. */}
      <WardrobeScene focus={focus} onResetFocus={() => setFocus('overview')} />

      {/* LEFT: wooden sign menu — sits over the 3D sign post. */}
      <div className="absolute left-[5%] top-[14%] z-10 flex flex-col gap-3 items-start pointer-events-auto">
        <WoodenTitleSign label="MOTTO MOTTO" subtitle="ride the swell" />
        <WoodenButton label="PLAY SOLO" onClick={onSolo} />
        <WoodenButton label="MULTIPLAYER" onClick={onMultiplayer} />
        <WoodenButton
          label="SETTINGS"
          onClick={() => setShowSettings((v) => !v)}
        />
      </div>

      {showSettings && (
        <div className="absolute left-[5%] top-[78%] z-20 w-72">
          <WoodPanel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-[#3a2a14] tracking-[0.18em]">
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

      {/* RIGHT: wardrobe panel — sits over the 3D display rack. */}
      <div className="absolute right-[4%] top-[18%] z-10 w-[min(400px,34vw)] pointer-events-auto">
        <WoodPanel>
          <div
            className="px-4 pt-3 pb-2 flex items-baseline justify-between border-b-2"
            style={{ backgroundColor: '#caa078', borderColor: '#7a4d24' }}
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#3a2a14]/80">
                Beach Cabana
              </div>
              <div className="text-lg font-extrabold text-[#3a2a14] tracking-[0.15em]">
                YOUR LOOK
              </div>
            </div>
          </div>

          <div
            className="flex border-b-2"
            style={{ backgroundColor: '#a07a52', borderColor: '#7a4d24' }}
          >
            <Tab label="SHIRT" active={tab === 'shirt'} onClick={() => selectTab('shirt')} />
            <Tab label="SHORTS" active={tab === 'shorts'} onClick={() => selectTab('shorts')} />
            <Tab label="BOARD" active={tab === 'board'} onClick={() => selectTab('board')} />
            <Tab label="HAT" active={tab === 'hat'} onClick={() => selectTab('hat')} />
          </div>

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
            <div className="grid grid-cols-4 gap-2 mt-3 max-h-52 overflow-y-auto pr-1">
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

      <div className="absolute bottom-4 right-4 z-20">
        <TideMarquee />
      </div>
    </div>
  );
}

// ============================================================
// Wooden signs / panel
// ============================================================

function WoodenTitleSign({
  label,
  subtitle,
}: {
  label: string;
  subtitle?: string;
}) {
  return (
    <div
      className="relative w-[28rem] px-8 py-6 mb-3"
      style={{
        backgroundColor: '#d6b07a',
        border: '6px solid #7a4d24',
        borderRadius: '12px',
        boxShadow:
          '0 14px 30px rgba(0,0,0,0.45), inset 0 0 0 3px #f4e1c1, inset 0 -5px 0 rgba(122,77,36,0.5)',
        textAlign: 'center',
      }}
    >
      <div
        className="absolute -top-9 left-6 w-2 h-9"
        style={{
          background:
            'repeating-linear-gradient(0deg, #caa078 0 5px, #8a5a2a 5px 10px)',
        }}
      />
      <div
        className="absolute -top-9 right-6 w-2 h-9"
        style={{
          background:
            'repeating-linear-gradient(0deg, #caa078 0 5px, #8a5a2a 5px 10px)',
        }}
      />
      <div className="absolute top-2.5 left-3 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div className="absolute top-2.5 right-3 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div className="absolute bottom-2.5 left-3 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div className="absolute bottom-2.5 right-3 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div
        style={{
          color: '#2a1a0a',
          fontFamily: 'Georgia, serif',
          fontWeight: 800,
          fontSize: '46px',
          letterSpacing: '0.18em',
          textShadow: '0 3px 0 #f4e1c1',
          lineHeight: 1.05,
        }}
      >
        {label}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: '8px',
            color: '#5a3a1a',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '20px',
            letterSpacing: '0.08em',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

function WoodenButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative block w-96 px-8 py-5 font-extrabold tracking-[0.2em] transition hover:scale-[1.04] hover:brightness-[1.08] active:scale-[0.97]"
      style={{
        color: '#3a2a14',
        fontFamily: 'Georgia, serif',
        backgroundColor: '#c08a52',
        border: '6px solid #7a4d24',
        borderRadius: '12px',
        textShadow: '0 3px 0 #f4e1c1',
        fontSize: '30px',
        boxShadow:
          '0 10px 22px rgba(0,0,0,0.4), inset 0 0 0 3px #d6b07a, inset 0 -5px 0 rgba(58,42,20,0.35)',
        textAlign: 'center',
      }}
    >
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-2 h-6"
        style={{
          background:
            'repeating-linear-gradient(0deg, #caa078 0 5px, #8a5a2a 5px 10px)',
        }}
      />
      <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#2a2a2a]" />
      {label}
    </button>
  );
}

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
        color: '#3a2a14',
        opacity: active ? 1 : 0.6,
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

// ============================================================
// Swatches with pattern previews
// ============================================================

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
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-1 mx-1"
            style={{ backgroundColor: shirt.accent }}
          />
        ))}
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
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1.5 place-items-center">
        {Array.from({ length: 9 }).map((_, i) => (
          <Hibiscus key={i} color={shorts.accent} />
        ))}
      </div>
    );
  }
  return null;
}

function Hibiscus({ color }: { color: string }) {
  return (
    <div className="relative w-3 h-3">
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
  const isLong = board.shape === 'longboard';
  const isGun = board.shape === 'gun';
  const isFish = board.shape === 'fish';
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
              style={{ backgroundColor: board.stripe, left: 'calc(50% - 4px)' }}
            />
            <div
              className="absolute top-2 bottom-2 w-1"
              style={{ backgroundColor: board.stripe, left: 'calc(50% + 2px)' }}
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
            className="absolute"
            style={{
              backgroundColor: color,
              width: '16px',
              height: '12px',
              borderTopLeftRadius: '50%',
              borderTopRightRadius: '50%',
              border: '1.5px solid #3a2a14',
              borderBottom: 'none',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
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
              left: '4px',
              right: '-8px',
              height: '5px',
              border: '1.5px solid #3a2a14',
              borderRadius: '0 4px 4px 0',
            }}
          />
        </div>
      </div>
    );
  }
  if (hat.style === 'visor') {
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
  if (hat.style === 'beanie') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '26px',
              height: '20px',
              border: '1.5px solid #3a2a14',
              borderTopLeftRadius: '13px',
              borderTopRightRadius: '13px',
            }}
          />
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: hat.accent ?? '#fff',
              width: '8px',
              height: '8px',
              border: '1.5px solid #3a2a14',
            }}
          />
        </div>
      </div>
    );
  }
  if (hat.style === 'cowboy') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '38px',
              height: '6px',
              border: '1.5px solid #3a2a14',
              borderRadius: '14px / 50%',
            }}
          />
          <div
            className="absolute"
            style={{
              backgroundColor: color,
              width: '16px',
              height: '16px',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '1.5px solid #3a2a14',
              borderTopLeftRadius: '50%',
              borderTopRightRadius: '50%',
              borderBottom: 'none',
            }}
          />
        </div>
      </div>
    );
  }
  if (hat.style === 'fedora') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '30px',
              height: '5px',
              border: '1.5px solid #3a2a14',
              borderRadius: '6px',
            }}
          />
          <div
            className="absolute"
            style={{
              backgroundColor: color,
              width: '16px',
              height: '14px',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '1.5px solid #3a2a14',
              borderBottom: 'none',
              borderTopLeftRadius: '5px',
              borderTopRightRadius: '5px',
            }}
          />
          <div
            className="absolute"
            style={{
              backgroundColor: hat.accent ?? '#000',
              width: '16px',
              height: '3px',
              top: '-3px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    );
  }
  if (hat.style === 'top-hat') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '28px',
              height: '4px',
              border: '1.5px solid #3a2a14',
              borderRadius: '4px',
            }}
          />
          <div
            className="absolute"
            style={{
              backgroundColor: color,
              width: '14px',
              height: '22px',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '1.5px solid #3a2a14',
              borderBottom: 'none',
              borderTopLeftRadius: '3px',
              borderTopRightRadius: '3px',
            }}
          />
          <div
            className="absolute"
            style={{
              backgroundColor: hat.accent ?? '#000',
              width: '14px',
              height: '3px',
              top: '-3px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    );
  }
  if (hat.style === 'headband') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            backgroundColor: color,
            width: '30px',
            height: '6px',
            border: '1.5px solid #3a2a14',
          }}
        />
      </div>
    );
  }
  if (hat.style === 'sombrero') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '44px',
              height: '5px',
              border: '1.5px solid #3a2a14',
              borderRadius: '20px / 50%',
            }}
          />
          <div
            className="absolute"
            style={{
              top: '-18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderBottom: `18px solid ${color}`,
            }}
          />
        </div>
      </div>
    );
  }
  if (hat.style === 'propeller') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            style={{
              backgroundColor: color,
              width: '26px',
              height: '18px',
              border: '1.5px solid #3a2a14',
              borderTopLeftRadius: '13px',
              borderTopRightRadius: '13px',
            }}
          />
          <div
            className="absolute"
            style={{
              backgroundColor: hat.accent ?? '#d92b2b',
              width: '20px',
              height: '3px',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%) rotate(20deg)',
              border: '1px solid #3a2a14',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              backgroundColor: '#3a2a14',
              width: '5px',
              height: '5px',
              top: '-9px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    );
  }
  return null;
}
