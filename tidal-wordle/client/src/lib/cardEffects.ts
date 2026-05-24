import {
  CARD_DEFINITIONS,
  CARD_IDS,
  getCardById,
} from '../components/cards/CardDefinitions';
import { getCardDrawPool } from './devCardPool';
import type { ActiveEffect, Card, EffectTarget, Guess, Hint } from '../types';
import { useGameStore } from '../stores/gameStore';
import { evaluateGuess, isSolvedGuess } from './guessEvaluator';
import { getRelatedHint } from './relatedHints';
import { buildLetterPattern, formatLetterPattern } from './playerKnowledge';
import { resolveCriticsRating } from './scoring';
import { getWordTheme, getThemeParentCategory, categoryLabel, getCategoryRelatedWord } from './wordMeta';
import {
  pickMemeCannon,
  pickBrainrot,
  pickStatusDog,
  pickForcedBreak,
  pickBoredDistraction,
  pickRecipeSpam,
  pickRejectionLetter,
  pickPlayfulInsult,
  pickFaceSwap,
  hintPrefix,
  pickDiceFlavor,
  fillTemplate,
} from './cardContent/tierBVariants';
import { getCategoryStickerUrls } from './cardAssets';
import { generateBrainrotStickers } from './cardContent/brainrotStickers';
import {
  getMemeHeroUrls,
  getStatusDogUrls,
  getRecipeHeaderUrls,
  getRejectionLetterheadUrls,
  getRejectionPaperTextureUrl,
  getDistractionHeaderUrls,
  getFaceSwapUrls,
  getForcedBreakIconUrls,
} from './cardAssets';
import { playCardSfx, startPlaylistForTheme, stopPlaylist } from './cardAudio';
import { suggestWordFromPattern } from './cardContent/suggestWord';
import { isValidProbeWord } from './cardContent/probeWords';
import { pickRandomChessPuzzle, getChessPuzzleById } from './chessPuzzles';

export { CARD_IDS };

/** Cards that use a full-screen / board-blocking overlay instead of CardDetailPopup on draw. */
const CARDS_SKIP_DRAW_DETAIL_POPUP = new Set([
  'bored-distraction',
  'chess-gambit',
  'playful-insult',
  'rejection-letter',
  'recipe-spam',
]);

function showCardDetailOnDraw(card: Card): void {
  if (!CARDS_SKIP_DRAW_DETAIL_POPUP.has(card.id)) {
    useGameStore.getState().showCardDetailPopup(card, 'draw');
  }
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const MAX_OVERLAYS = 3;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getGuessesForTarget(target: EffectTarget) {
  const state = useGameStore.getState();
  return target === 'self' ? state.myGuesses : state.opponentGuesses;
}

function getLastWrongGuess(target: EffectTarget, answer: string): string {
  const guesses = getGuessesForTarget(target);
  const lastWrong = [...guesses]
    .reverse()
    .find((g) => !g.isProbe && answer && !isSolvedGuess(g.word, answer));
  return lastWrong?.word ?? '???';
}

/** Rightmost revealed letter on the latest guess row (matches board row indices). */
function pickStatusDogCoverTile(guesses: Guess[]): { row: number; col: number } {
  if (guesses.length === 0) {
    return { row: 0, col: 0 };
  }
  const row = guesses.length - 1;
  const results = guesses[row].results;
  for (let col = results.length - 1; col >= 0; col--) {
    if (results[col].state !== 'empty') {
      return { row, col };
    }
  }
  return { row, col: 0 };
}

function addHint(text: string): void {
  const hint: Hint = { id: uid(), text, createdAt: Date.now() };
  useGameStore.setState((s) => ({ hints: [...s.hints, hint] }));
}

function addOverlay(
  type: string,
  message?: string,
  expiresAt?: number,
  dismissable = true,
  meta?: Record<string, unknown>
): void {
  useGameStore.setState((s) => {
    let overlays = [
      ...s.overlays,
      { id: uid(), type, message, expiresAt, dismissable, meta },
    ];
    const blocking = overlays.filter(
      (o) => o.type === 'chess-gambit' || o.type === 'bored-distraction'
    );
    const nonBlocking = overlays.filter(
      (o) => o.type !== 'chess-gambit' && o.type !== 'bored-distraction'
    );
    while (nonBlocking.length > MAX_OVERLAYS) {
      const oldest = nonBlocking.shift();
      if (oldest) {
        overlays = overlays.filter((o) => o.id !== oldest.id);
      }
    }
    if (blocking.length > 0) {
      overlays = [
        ...blocking,
        ...overlays
          .filter(
            (o) =>
              o.type !== 'chess-gambit' && o.type !== 'bored-distraction'
          )
          .slice(-MAX_OVERLAYS),
      ];
    }
    return { overlays };
  });
}

function addActiveEffect(
  cardId: string,
  target: EffectTarget,
  expiresAt?: number,
  payload?: Record<string, unknown>
): void {
  const effect: ActiveEffect = {
    id: uid(),
    cardId,
    target,
    expiresAt,
    payload,
  };
  useGameStore.setState((s) => ({
    activeEffects: [...s.activeEffects, effect],
  }));
}

function replaceActiveEffectForTarget(
  cardId: string,
  target: EffectTarget,
  expiresAt?: number,
  payload?: Record<string, unknown>
): void {
  const effect: ActiveEffect = {
    id: uid(),
    cardId,
    target,
    expiresAt,
    payload,
  };
  useGameStore.setState((s) => ({
    activeEffects: [
      ...s.activeEffects.filter(
        (e) => !(e.cardId === cardId && e.target === target)
      ),
      effect,
    ],
  }));
}

export function clearMemeCannonForTarget(target: EffectTarget): void {
  useGameStore.setState((s) => ({
    activeEffects: s.activeEffects.filter(
      (e) => !(e.cardId === 'meme-cannon' && e.target === target)
    ),
  }));
}

export function clearFaceSwapForTarget(target: EffectTarget): void {
  const state = useGameStore.getState();
  const remaining = state.activeEffects.filter(
    (e) => !(e.cardId === 'face-swap-glitch' && e.target === target)
  );
  const updates: Partial<typeof state> = { activeEffects: remaining };
  if (
    state.faceSwap &&
    !remaining.some((e) => e.cardId === 'face-swap-glitch')
  ) {
    updates.faceSwap = false;
    updates.faceSwapImageUrl = null;
  }
  useGameStore.setState(updates);
}

function pickFromPool(pool: Card[]): Card {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function drawCard(): Card {
  return pickFromPool(getCardDrawPool());
}

export function getCardTarget(
  mode: 'solo' | 'multiplayer' | null,
  card: Card
): EffectTarget {
  if (card.type === 'buff' || card.targetSelf) return 'self';
  return mode === 'solo' ? 'self' : 'opponent';
}

export function applyEffect(
  cardId: string,
  target: EffectTarget,
  options?: { skipDiceReroll?: boolean }
): void {
  const state = useGameStore.getState();
  const card = getCardById(cardId);
  if (!card) return;

  const answer = state.answer?.toUpperCase() ?? '';
  const answerWord = state.answer?.toLowerCase() ?? '';
  const theme = answerWord ? getWordTheme(answerWord) : 'abstract-beach';
  const now = Date.now();
  const wrongGuess = getLastWrongGuess(target, answer);

  playCardSfx(cardId);

  switch (cardId) {
    case 'meme-cannon': {
      const v = pickMemeCannon(theme, answerWord);
      const caption = fillTemplate(v.captionTemplate, wrongGuess);
      const stickerUrls = getCategoryStickerUrls(theme);
      const heroUrls = getMemeHeroUrls(theme);
      replaceActiveEffectForTarget('meme-cannon', target, undefined, {
        stickerUrl: stickerUrls.primary,
        stickerFallbackUrl: stickerUrls.fallback,
        caption,
        borderClass: v.borderClass,
        stickerEmoji: v.stickerEmoji,
        memeHeroUrl: heroUrls.primary,
        memeHeroFallbackUrl: heroUrls.fallback,
      });
      break;
    }
    case 'brainrot-glitch': {
      const v = pickBrainrot(theme);
      const guesses = getGuessesForTarget(target);
      const rowCount = Math.max(guesses.length, 1);
      const maxCols = answer.length || 5;
      const stickers = generateBrainrotStickers(rowCount, maxCols, v.stickerStyle);
      addActiveEffect('brainrot-glitch', target, undefined, {
        stickers,
        theme,
      });
      useGameStore.setState({
        glitchActive: target,
        glitchUntilNextGuess: true,
      });
      break;
    }
    case 'status-dog': {
      const v = pickStatusDog(theme);
      const guesses = getGuessesForTarget(target);
      const tile = pickStatusDogCoverTile(guesses);
      const dogUrls = getStatusDogUrls(theme);
      addActiveEffect('status-dog', target, now + 10000, {
        ...tile,
        dogEmoji: v.dogEmoji,
        dogImageUrl: dogUrls.primary,
        dogImageFallbackUrl: dogUrls.fallback,
      });
      break;
    }
    case 'playful-insult': {
      const v = pickPlayfulInsult(theme, answerWord);
      addOverlay('playful-insult', v.line, undefined, true, { target });
      break;
    }
    case 'forced-break': {
      const v = pickForcedBreak(theme, answerWord);
      const iconUrls = getForcedBreakIconUrls(theme);
      if (target === 'self') {
        useGameStore.setState({
          forcedBreakPending: true,
          forcedBreakLabel: v.label,
          forcedBreakIconUrl: iconUrls.primary,
          forcedBreakIconFallbackUrl: iconUrls.fallback,
        });
      } else {
        addHint(`Forced break — opponent's next guess colors stay hidden (${v.label}).`);
      }
      break;
    }
    case 'bored-distraction': {
      const v = pickBoredDistraction(theme);
      const headerUrls = getDistractionHeaderUrls(theme);
      useGameStore.setState({
        inputLocked: true,
        distractionBlocking: true,
      });
      addOverlay('bored-distraction', v.title, undefined, true, {
        title: v.title,
        paragraphs: v.paragraphs,
        headerImageUrl: headerUrls.primary,
        headerImageFallbackUrl: headerUrls.fallback,
      });
      break;
    }
    case 'recipe-spam': {
      const v = pickRecipeSpam(theme, answerWord);
      const recipeSpamDurationMs = 8000;
      const headerUrls = getRecipeHeaderUrls(theme);
      addOverlay(
        'recipe-spam',
        v.ingredients.join('\n'),
        Date.now() + recipeSpamDurationMs,
        false,
        {
          recipeTitle: v.recipeTitle,
          maskSide: v.maskSide,
          target,
          headerImageUrl: headerUrls.primary,
          headerImageFallbackUrl: headerUrls.fallback,
        }
      );
      break;
    }
    case 'rejection-letter': {
      const v = pickRejectionLetter(theme);
      const body = fillTemplate(v.body, wrongGuess);
      const letterUrls = getRejectionLetterheadUrls(theme);
      useGameStore.setState({ inputLocked: true });
      addOverlay('rejection-letter', body, undefined, false, {
        letterhead: v.letterhead,
        letterheadImageUrl: letterUrls.primary,
        letterheadImageFallbackUrl: letterUrls.fallback,
        paperTextureUrl: getRejectionPaperTextureUrl(),
      });
      break;
    }
    case 'face-swap-glitch': {
      const v = pickFaceSwap(theme, answerWord);
      const faceUrls = getFaceSwapUrls(theme);
      const durationSec = Math.max(3, answer.length || 5);
      const tagline = fillTemplate(v.tagline, wrongGuess);
      replaceActiveEffectForTarget(
        'face-swap-glitch',
        target,
        now + durationSec * 1000,
        {
          faceImageUrl: faceUrls.primary,
          faceImageFallbackUrl: faceUrls.fallback,
          tagline,
        }
      );
      useGameStore.setState({
        faceSwap: true,
        faceSwapImageUrl: faceUrls.primary,
      });
      break;
    }
    case 'letter-reveal': {
      if (!answer) break;
      const revealed = new Set(Object.keys(state.revealedLetters).map(Number));
      const unrevealed: number[] = [];
      for (let i = 0; i < answer.length; i++) {
        if (!revealed.has(i)) unrevealed.push(i);
      }
      if (unrevealed.length > 0) {
        const pos = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        useGameStore.getState().revealAnswerLength();
        useGameStore.setState({
          revealedLetters: {
            ...state.revealedLetters,
            [pos]: answer[pos],
          },
        });
      }
      break;
    }
    case 'cosmic-reset': {
      const guesses = [...state.myGuesses];
      if (guesses.length > 0) {
        const last = guesses[guesses.length - 1];
        if (answer && !isSolvedGuess(last.word, answer) && !last.isProbe) {
          guesses.pop();
          useGameStore.setState({ myGuesses: guesses });
        }
      }
      break;
    }
    case 'marine-hint': {
      if (!answer) break;
      const count = [...answer].filter((c) => VOWELS.has(c)).length;
      useGameStore.getState().revealAnswerLength();
      addHint(
        `${hintPrefix(theme, answerWord)} The answer has ${count} vowel${count === 1 ? '' : 's'}.`
      );
      break;
    }
    case 'tide-whisper': {
      if (!answer) break;
      const revealFirst = Math.random() < 0.5;
      const pos = revealFirst ? 0 : answer.length - 1;
      const edge = revealFirst ? 'start' : 'end';
      useGameStore.getState().revealAnswerLength();
      useGameStore.setState({
        revealedLetters: {
          ...state.revealedLetters,
          [pos]: answer[pos],
        },
      });
      addHint(`${hintPrefix(theme, answerWord)} A whisper at the ${edge}…`);
      break;
    }
    case 'forecast': {
      if (!answer) break;
      const pos = Math.floor(Math.random() * answer.length);
      const isVowel = VOWELS.has(answer[pos]);
      addHint(
        `${hintPrefix(theme, answerWord)} Position ${pos + 1} is a ${isVowel ? 'vowel' : 'consonant'}.`
      );
      break;
    }
    case 'related-current': {
      if (!answer) break;
      const related = getRelatedHint(answer);
      const catWord = getCategoryRelatedWord(answer);
      const text =
        related !== 'coastal vibe' ? related : catWord;
      addHint(`${hintPrefix(theme, answerWord)} Related word: ${text}`);
      break;
    }
    case 'resume-polish': {
      if (!answer) break;
      const pattern = buildLetterPattern({
        answerLength: state.answerLength,
        revealedLetters: state.revealedLetters,
        myGuesses: state.myGuesses,
      });
      if (!pattern) {
        addHint('Keep exploring — no pattern yet.');
        break;
      }
      const display = formatLetterPattern(pattern);
      const suggestion = suggestWordFromPattern(pattern);
      const label = categoryLabel(getThemeParentCategory(theme));
      if (suggestion) {
        addHint(
          `Try a ${label} word like "${suggestion}" — pattern: ${display}`
        );
      } else {
        addHint(`Pattern (${label}): ${display}`);
      }
      break;
    }
    case 'chess-gambit': {
      const puzzle = pickRandomChessPuzzle();
      useGameStore.setState({
        inputLocked: true,
        chessPuzzleActive: true,
      });
      addOverlay('chess-gambit', undefined, undefined, true, {
        puzzleId: puzzle.id,
      });
      break;
    }
    case 'dice-roll': {
      if (options?.skipDiceReroll) break;
      addHint(pickDiceFlavor(theme));
      const pool = getCardDrawPool().filter((c) => c.id !== 'dice-roll');
      const newCard = pickFromPool(pool);
      addHint(`Dice Roll: rerolled to ${newCard.name}!`);
      useGameStore.setState((s) => ({
        cardDrawHistory: [
          newCard,
          ...s.cardDrawHistory.filter((c) => c.id !== 'dice-roll'),
        ].slice(0, 5),
      }));
      applyEffect(newCard.id, target, { skipDiceReroll: true });
      showCardDetailOnDraw(newCard);
      return;
    }
    case 'beach-playlist':
      startPlaylistForTheme(theme);
      useGameStore.setState({ musicSwapActive: true });
      setTimeout(() => {
        stopPlaylist();
        useGameStore.setState({ musicSwapActive: false });
      }, 30000);
      break;
    case 'critics-rating':
      useGameStore.setState({ criticsRatingPending: true });
      break;
    default:
      break;
  }
}

export function submitRejectionProbeWord(overlayId: string, word: string): boolean {
  const state = useGameStore.getState();
  const answer = state.answer;
  if (!answer) return false;

  const normalized = word.toUpperCase().trim();
  if (!isValidProbeWord(normalized, answer.length)) return false;

  const probeGuess: Guess = {
    word: normalized,
    results: evaluateGuess(normalized, answer),
    submittedAt: Date.now(),
    isProbe: true,
  };

  useGameStore.setState({
    bonusProbeGuess: probeGuess,
    bonusProbeRowIndex: state.myGuesses.length,
    bonusProbePending: false,
    inputLocked: false,
    overlays: state.overlays.filter((o) => o.id !== overlayId),
  });
  addHint(`Probe row: ${normalized} — letter feedback added.`);
  return true;
}

export function dismissOverlay(overlayId: string): void {
  const state = useGameStore.getState();
  const overlay = state.overlays.find((o) => o.id === overlayId);
  if (!overlay || overlay.type === 'recipe-spam' || overlay.dismissable === false) {
    return;
  }
  useGameStore.setState({
    overlays: state.overlays.filter((o) => o.id !== overlayId),
  });
}

const CHESS_WRONG_PENALTY_MS = 5000;
const CHESS_WRONG_COOLDOWN_BUMP_MS = 4000;

export function answerChessPuzzle(
  puzzleId: string,
  chosenIndex: number
): 'correct' | 'wrong' {
  const puzzle = getChessPuzzleById(puzzleId);
  const correct = puzzle !== undefined && chosenIndex === puzzle.correctIndex;

  if (correct) {
    useGameStore.setState({
      inputLocked: false,
      chessPuzzleActive: false,
      chessLockUntil: null,
      overlays: useGameStore
        .getState()
        .overlays.filter((o) => o.type !== 'chess-gambit'),
    });
    return 'correct';
  }

  const state = useGameStore.getState();
  const penaltyEndsAt = Date.now() + CHESS_WRONG_PENALTY_MS;
  const cooldownBase = Math.max(state.myCooldownEndsAt ?? 0, Date.now());
  useGameStore.setState({
    inputLocked: true,
    chessLockUntil: penaltyEndsAt,
    myCooldownEndsAt: cooldownBase + CHESS_WRONG_COOLDOWN_BUMP_MS,
  });

  window.setTimeout(() => {
    const s = useGameStore.getState();
    if (s.chessLockUntil && Date.now() >= s.chessLockUntil) {
      useGameStore.setState({
        inputLocked: false,
        chessPuzzleActive: false,
        chessLockUntil: null,
        overlays: s.overlays.filter((o) => o.type !== 'chess-gambit'),
      });
    }
  }, CHESS_WRONG_PENALTY_MS);

  return 'wrong';
}

export function applyCriticsAtRoundEnd(): {
  myStars: number;
  oppStars: number;
} {
  const state = useGameStore.getState();
  const bonus = resolveCriticsRating(
    state.mode,
    state.myGuesses,
    state.opponentGuesses
  );
  const updates: Partial<ReturnType<typeof useGameStore.getState>> = {
    lastCriticsRatings: { me: bonus.myStars, opponent: bonus.oppStars },
    criticsRatingPending: false,
  };
  if (state.criticsRatingPending) {
    updates.roundScore = {
      me: state.roundScore.me + bonus.me,
      opponent: state.roundScore.opponent + bonus.opponent,
    };
  }
  useGameStore.setState(updates);
  return { myStars: bonus.myStars, oppStars: bonus.oppStars };
}

export function fireCardAfterGuess(): void {
  const state = useGameStore.getState();
  if (state.roundOver || state.matchWinner) return;

  const card = drawCard();
  const target = getCardTarget(state.mode, card);
  if (card.id === 'dice-roll') {
    applyEffect(card.id, target);
    return;
  }
  const history = [card, ...state.cardDrawHistory].slice(0, 5);
  useGameStore.setState({ cardDrawHistory: history });

  applyEffect(card.id, target);
  showCardDetailOnDraw(card);
}

export function applyCardFromSocket(cardId: string, target: EffectTarget): void {
  applyEffect(cardId, target);
}

if (import.meta.env.DEV) {
  const w = window as unknown as {
    __testCard: (id: string) => void;
    __testCardList: () => string[];
  };
  w.__testCard = (cardId: string) => {
    const card = getCardById(cardId);
    if (!card) {
      console.error('Unknown card:', cardId, 'Available:', CARD_IDS);
      return;
    }
    const state = useGameStore.getState();
    const target = getCardTarget(state.mode, card);
    applyEffect(cardId, target);
    if (cardId !== 'dice-roll') {
      showCardDetailOnDraw(card);
    }
  };
  w.__testCardList = () => [...CARD_IDS];
}
