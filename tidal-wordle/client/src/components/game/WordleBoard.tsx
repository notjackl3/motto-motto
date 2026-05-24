import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { LetterState } from '../../types';
import {
  areGuessColorsRevealed,
  displayLetterState,
  isGuessRowHalfMasked,
  isHalfMasked,
  mergeBoardRowsWithProbe,
} from '../../lib/boardDisplay';
import { boardRowLayout } from '../../lib/boardTileSize';
import StickerImage from '../cards/StickerImage';
import type { BrainrotSticker } from '../../lib/cardContent/brainrotStickers';
import { getBrainrotStickerUrl } from '../../lib/cardContent/stickerAssets';
import type { WordTheme } from '../../lib/wordMeta';
import RecipeSpamBoardOverlay from './RecipeSpamBoardOverlay';
import MemeCannonBoardOverlay from './MemeCannonBoardOverlay';
import FaceSwapBoardOverlay from './FaceSwapBoardOverlay';
import PlayfulInsultBoardOverlay from './PlayfulInsultBoardOverlay';

const STATE_CLASSES: Record<LetterState, string> = {
  correct: 'bg-emerald-600 border-emerald-400 text-white',
  present: 'bg-amber-500 border-amber-300 text-white',
  absent: 'bg-slate-600 border-slate-500 text-white/80',
  empty: 'border-white/30 text-white',
};

function isTileCovered(
  row: number,
  col: number,
  effects: ReturnType<typeof useGameStore.getState>['activeEffects'],
  boardTarget: 'self' | 'opponent'
): {
  covered: boolean;
  dogEmoji: string;
  dogImageUrl?: string;
  dogImageFallbackUrl?: string;
  expiresAt?: number;
} {
  const effect = effects.find(
    (e) =>
      e.cardId === 'status-dog' &&
      e.target === boardTarget &&
      e.payload &&
      (e.payload as { row: number; col: number }).row === row &&
      (e.payload as { row: number; col: number }).col === col
  );
  if (!effect) return { covered: false, dogEmoji: '🐕' };
  return {
    covered: true,
    dogEmoji: (effect.payload?.dogEmoji as string) ?? '🐕',
    dogImageUrl: effect.payload?.dogImageUrl as string | undefined,
    dogImageFallbackUrl: effect.payload?.dogImageFallbackUrl as string | undefined,
    expiresAt: effect.expiresAt,
  };
}

function getMemeCannonEffect(
  effects: ReturnType<typeof useGameStore.getState>['activeEffects'],
  boardTarget: 'self' | 'opponent'
) {
  return effects.find(
    (e) => e.cardId === 'meme-cannon' && e.target === boardTarget
  );
}

function getFaceSwapEffect(
  effects: ReturnType<typeof useGameStore.getState>['activeEffects'],
  boardTarget: 'self' | 'opponent'
) {
  return effects.find(
    (e) => e.cardId === 'face-swap-glitch' && e.target === boardTarget
  );
}

function getBrainrotEffect(
  effects: ReturnType<typeof useGameStore.getState>['activeEffects'],
  boardTarget: 'self' | 'opponent'
) {
  return effects.find(
    (e) => e.cardId === 'brainrot-glitch' && e.target === boardTarget
  );
}

function getBrainrotStickersForBoard(
  effect: ReturnType<typeof getBrainrotEffect>
): BrainrotSticker[] {
  if (!effect?.payload?.stickers) return [];
  return effect.payload.stickers as BrainrotSticker[];
}

function getBrainrotTheme(
  effect: ReturnType<typeof getBrainrotEffect>
): WordTheme | undefined {
  return effect?.payload?.theme as WordTheme | undefined;
}

interface WordleBoardProps {
  boardTarget?: 'self' | 'opponent';
}

export default function WordleBoard({ boardTarget = 'self' }: WordleBoardProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const guesses =
    boardTarget === 'self'
      ? useGameStore((s) => s.myGuesses)
      : useGameStore((s) => s.opponentGuesses);
  const bonusProbeGuess = useGameStore((s) =>
    boardTarget === 'self' ? s.bonusProbeGuess : null
  );
  const bonusProbeRowIndex = useGameStore((s) =>
    boardTarget === 'self' ? s.bonusProbeRowIndex : null
  );
  const glitchActive = useGameStore((s) => s.glitchActive);
  const activeEffects = useGameStore((s) => s.activeEffects);
  const halfGuessMask = useGameStore((s) => s.halfGuessMask);
  const answerLength = useGameStore((s) => s.answerLength);
  const playfulInsultOverlay = useGameStore((s) =>
    s.overlays.find(
      (o) =>
        o.type === 'playful-insult' &&
        ((o.meta?.target as string | undefined) ?? 'self') === boardTarget
    )
  );

  const isGlitching = glitchActive === boardTarget;
  const brainrotEffect = getBrainrotEffect(activeEffects, boardTarget);
  const brainrotStickers = getBrainrotStickersForBoard(brainrotEffect);
  const brainrotTheme = getBrainrotTheme(brainrotEffect);
  const memeEffect = getMemeCannonEffect(activeEffects, boardTarget);
  const memePayload = memeEffect?.payload;
  const faceSwapEffect = getFaceSwapEffect(activeEffects, boardTarget);
  const faceSwapPayload = faceSwapEffect?.payload;
  const faceSwapSeconds =
    faceSwapEffect?.expiresAt
      ? Math.ceil(Math.max(0, faceSwapEffect.expiresAt - now) / 1000)
      : 0;
  const allRows = mergeBoardRowsWithProbe(
    guesses,
    bonusProbeGuess,
    bonusProbeRowIndex
  );

  const maxCols = useMemo(() => {
    const fromRows = allRows.reduce(
      (max, row) => Math.max(max, row.results.length),
      0
    );
    return Math.max(fromRows, answerLength ?? 5);
  }, [allRows, answerLength]);

  return (
    <div
      className="bg-black/40 rounded-lg p-2 sm:p-3 relative w-full max-w-full min-h-0 overflow-y-auto overflow-x-hidden"
      data-testid="wordle-board"
      aria-label={boardTarget === 'self' ? 'Your board' : 'Opponent board'}
    >
      <RecipeSpamBoardOverlay />
      <div className="flex flex-col gap-1 relative z-0 w-full items-center">
        {allRows.length === 0 && (
          <p className="text-xs text-center opacity-50 py-4">
            Make your first guess — check Intel for hints
          </p>
        )}
        {allRows.map((guess, r) => {
          const isProbe = guess.isProbe === true;
          const colorsRevealed = areGuessColorsRevealed(guess, now);
          const colCount = guess.results.length;
          const sizing = boardRowLayout(maxCols);
          return (
            <div
              key={`${guess.submittedAt}-${r}`}
              className={`relative w-full mx-auto ${sizing.gapClass} ${isProbe ? 'opacity-90 ring-1 ring-amber-400/50 rounded p-0.5' : ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: sizing.maxWidthPx,
              }}
            >
              {guess.results.map((result, c) => {
                const masked =
                  isGuessRowHalfMasked(c, colCount, guess) ||
                  isHalfMasked(c, colCount, halfGuessMask, boardTarget);
                const displayState = displayLetterState(result, masked, colorsRevealed);
                const { covered, dogEmoji, dogImageUrl, dogImageFallbackUrl, expiresAt } =
                  isTileCovered(r, c, activeEffects, boardTarget);
                const coverSeconds =
                  covered && expiresAt
                    ? Math.ceil(Math.max(0, expiresAt - now) / 1000)
                    : 0;
                const showLetter =
                  !covered && !masked && (displayState !== 'empty' || !colorsRevealed);
                const tileStateClass = isGlitching
                  ? 'glitch-tile'
                  : covered
                    ? 'status-dog-tile text-slate-800'
                    : STATE_CLASSES[displayState];

                const brainrotSticker = brainrotStickers.find(
                  (s) => s.row === r && s.col === c
                );
                const brainrotUrls = brainrotSticker
                  ? getBrainrotStickerUrl(brainrotSticker.state, brainrotTheme)
                  : null;

                return (
                  <div
                    key={c}
                    data-state={covered ? 'covered' : displayState}
                    className={`wordle-tile relative aspect-square min-w-0 w-full border-2 flex items-center justify-center font-bold uppercase ${sizing.fontClass} ${isGlitching ? '' : 'transition-colors'} ${tileStateClass} ${masked && !isGlitching ? 'half-masked-tile' : ''}`}
                    aria-label={
                      isGlitching
                        ? covered
                          ? 'covered by status dog'
                          : showLetter
                            ? `${result.letter}, color glitched`
                            : 'color glitched'
                        : covered
                          ? 'covered by status dog'
                          : masked
                            ? 'hidden'
                            : `${result.letter} ${displayState}`
                    }
                  >
                    {covered ? (
                      <>
                        {dogImageUrl ? (
                          <StickerImage
                            src={dogImageUrl}
                            fallbackSrc={dogImageFallbackUrl}
                            alt=""
                            size="sm"
                            className="w-[85%] h-[85%] max-w-full max-h-full"
                          />
                        ) : (
                          dogEmoji
                        )}
                        {coverSeconds > 0 && (
                          <span
                            className="absolute top-0 right-0 min-w-[1.1rem] rounded-bl bg-black/70 px-0.5 text-[9px] font-bold leading-tight text-amber-100 tabular-nums"
                            aria-hidden
                          >
                            {coverSeconds}s
                          </span>
                        )}
                      </>
                    ) : showLetter ? (
                      result.letter
                    ) : masked ? (
                      '·'
                    ) : (
                      ''
                    )}
                    {brainrotUrls && !covered && (
                      <StickerImage
                        src={brainrotUrls.primary}
                        fallbackSrc={brainrotUrls.fallback}
                        alt=""
                        size="sm"
                        className="absolute inset-0 m-auto w-[85%] h-[85%] z-10 pointer-events-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {memePayload && (
        <MemeCannonBoardOverlay
          caption={(memePayload.caption as string) ?? ''}
          borderClass={(memePayload.borderClass as string) ?? 'border-black'}
          memeHeroUrl={memePayload.memeHeroUrl as string | undefined}
          memeHeroFallbackUrl={memePayload.memeHeroFallbackUrl as string | undefined}
          stickerUrl={memePayload.stickerUrl as string | undefined}
          stickerFallbackUrl={memePayload.stickerFallbackUrl as string | undefined}
          stickerEmoji={(memePayload.stickerEmoji as string) ?? '🖼️'}
        />
      )}
      {faceSwapPayload && faceSwapSeconds > 0 && (
        <FaceSwapBoardOverlay
          faceImageUrl={(faceSwapPayload.faceImageUrl as string) ?? ''}
          faceImageFallbackUrl={faceSwapPayload.faceImageFallbackUrl as string | undefined}
          tagline={(faceSwapPayload.tagline as string) ?? 'Face swap glitch'}
          secondsLeft={faceSwapSeconds}
        />
      )}
      {playfulInsultOverlay && (
        <PlayfulInsultBoardOverlay
          overlayId={playfulInsultOverlay.id}
          message={playfulInsultOverlay.message ?? '…'}
        />
      )}
    </div>
  );
}
