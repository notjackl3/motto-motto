/**
 * gameStore seam (Dev A / Dev B):
 * - Dev B owns: mode (sync), opponentGuesses (write via socket),
 *   tide fields, and reads musicSwapActive + faceSwap from scene.
 * - Dev A owns: answer, guesses (my), scoring, cards, hints, overlays, inputLocked,
 *   glitchActive, halfGuessMask, bonusProbe*, forcedBreak*, distractionBlocking.
 * - answerLength: player-known length only (null until a hint reveals it; never from guesses).
 * - Coordinate before adding fields Dev B must read (document in PR).
 */
import { create } from 'zustand';
import type {
  ActiveEffect,
  EffectTarget,
  GameMode,
  Guess,
  HalfGuessMask,
  Hint,
  MatchWinner,
  OverlayState,
  Card,
  CardDetailPopupState,
  CardDetailSource,
  CompletedRoundRecord,
  RoundBannerState,
  SubmitGuessResult,
} from '../types';
import { isValidProbeWord } from '../lib/cardContent/probeWords';
import { stopPlaylist } from '../lib/cardAudio';
import { evaluateGuess, isSolvedGuess } from '../lib/guessEvaluator';
import { getRandomWord, normalizeWord } from '../lib/wordList';
import {
  MIN_GUESS_LENGTH,
  resolveCriticsRating,
  isMatchOver,
} from '../lib/scoring';

function applyCriticsAtRoundEnd(): void {
  const state = useGameStore.getState();
  const stars = resolveCriticsRating(
    state.mode,
    state.myGuesses,
    state.opponentGuesses
  );
  useGameStore.setState({
    lastCriticsRatings: { me: stars.myStars, opponent: stars.oppStars },
    criticsRatingPending: false,
  });
}

function triggerCardDrawAfterGuess(): void {
  void import('../lib/cardEffects').then((m) => m.fireCardAfterGuess());
}

function withoutRecipeSpamOverlays(overlays: OverlayState[]): OverlayState[] {
  return overlays.filter((o) => o.type !== 'recipe-spam');
}

function clearRecipeSpamState(
  overlays: OverlayState[]
): Pick<GameStoreState, 'overlays' | 'halfGuessMask'> {
  return {
    overlays: withoutRecipeSpamOverlays(overlays),
    halfGuessMask: null,
  };
}

type MatchEndListener = (winner: MatchWinner) => void;
const matchEndListeners = new Set<MatchEndListener>();

export function onMatchEnd(listener: MatchEndListener): () => void {
  matchEndListeners.add(listener);
  return () => matchEndListeners.delete(listener);
}

function notifyMatchEnd(winner: MatchWinner): void {
  matchEndListeners.forEach((fn) => fn(winner));
}

interface GameStoreState {
  mode: GameMode | null;
  answer: string | null;
  answerLength: number | null;
  myGuesses: Guess[];
  opponentGuesses: Guess[];
  myHand: import('../types').Card[];
  activeEffects: ActiveEffect[];
  roundsWon: { me: number; opponent: number };
  roundsToWin: number;
  matchWinner: MatchWinner;
  revealedLetters: Record<number, string>;
  hints: Hint[];
  cardDrawHistory: import('../types').Card[];
  inputLocked: boolean;
  glitchActive: EffectTarget | null;
  glitchUntilNextGuess: boolean;
  overlays: OverlayState[];
  chessPuzzleActive: boolean;
  /** @deprecated Blunder no longer uses input freeze; cleared on dismiss. */
  chessLockUntil: number | null;
  /** Solo chess blunder: applied to the next submitted guess row. */
  chessWordleTaxPending: import('../types').HalfGuessSide | null;
  criticsRatingPending: boolean;
  lastCriticsRatings: { me: number; opponent: number } | null;
  roundOver: boolean;
  roundBanner: RoundBannerState | null;
  /** Completed rounds this match (word revealed after each round). */
  roundHistory: CompletedRoundRecord[];
  cardDetailPopup: CardDetailPopupState | null;
  musicSwapActive: boolean;
  faceSwap: boolean;
  /** Set by face-swap-glitch; Dev B scene may read, Dev A shows HUD fallback. */
  faceSwapImageUrl: string | null;
  /** Recipe-spam: hide half of each guess row for this target until round ends. */
  halfGuessMask: HalfGuessMask | null;
  /** Rejection-letter: player may submit one probe word. */
  bonusProbePending: boolean;
  bonusProbeGuess: Guess | null;
  /** Row index where bonusProbeGuess is pinned (myGuesses.length at submit time). */
  bonusProbeRowIndex: number | null;
  /** Forced-break: flavor label shown while color reveal is pending. */
  forcedBreakLabel: string | null;
  /** Forced-break: next self guess gets delayed tile colors. */
  forcedBreakPending: boolean;
  /** Forced-break: theme icon (primary URL). */
  forcedBreakIconUrl: string | null;
  forcedBreakIconFallbackUrl: string | null;
  /** Bored-distraction: blocks input until scroll dismissed. */
  distractionBlocking: boolean;
  /** Audio settings consumed by scene + menu. */
  musicMuted: boolean;
  /** Multiplayer room code (kept for UI compatibility; multiplayer flow stubbed). */
  roomCode: string | null;

  setMode: (mode: GameMode | null) => void;
  setMusicMuted: (muted: boolean) => void;
  setMusicSwapActive: (active: boolean) => void;
  setFaceSwap: (active: boolean) => void;
  setRoomCode: (code: string | null) => void;
  startMatch: (mode: GameMode) => void;
  startRound: () => void;
  submitGuess: (word: string) => SubmitGuessResult;
  endRound: (winner: 'me' | 'opponent') => void;
  dismissRoundBanner: () => void;
  /** Reveal answer length to the player (hint cards call this). */
  revealAnswerLength: () => void;
  showCardDetailPopup: (card: Card, source?: CardDetailSource) => void;
  dismissCardDetailPopup: () => void;
  resetRound: () => void;
  resetMatch: () => void;
  clearDistractionBlock: () => void;
}

const initialRoundState = {
  answer: null as string | null,
  answerLength: null as number | null,
  myGuesses: [] as Guess[],
  opponentGuesses: [] as Guess[],
  activeEffects: [] as ActiveEffect[],
  revealedLetters: {} as Record<number, string>,
  hints: [] as Hint[],
  inputLocked: false,
  glitchActive: null as EffectTarget | null,
  glitchUntilNextGuess: false,
  overlays: [] as OverlayState[],
  chessPuzzleActive: false,
  chessLockUntil: null as number | null,
  chessWordleTaxPending: null as import('../types').HalfGuessSide | null,
  criticsRatingPending: false,
  lastCriticsRatings: null as { me: number; opponent: number } | null,
  roundOver: false,
  roundBanner: null as RoundBannerState | null,
  halfGuessMask: null as HalfGuessMask | null,
  bonusProbePending: false,
  bonusProbeGuess: null as Guess | null,
  bonusProbeRowIndex: null as number | null,
  forcedBreakLabel: null as string | null,
  forcedBreakPending: false,
  forcedBreakIconUrl: null as string | null,
  forcedBreakIconFallbackUrl: null as string | null,
  distractionBlocking: false,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  mode: null,
  ...initialRoundState,
  myHand: [],
  roundsWon: { me: 0, opponent: 0 },
  roundsToWin: 2,
  matchWinner: null,
  roundHistory: [],
  cardDetailPopup: null,
  cardDrawHistory: [],
  musicSwapActive: false,
  faceSwap: false,
  faceSwapImageUrl: null as string | null,
  halfGuessMask: null,
  bonusProbePending: false,
  bonusProbeGuess: null,
  bonusProbeRowIndex: null,
  forcedBreakLabel: null,
  forcedBreakPending: false,
  forcedBreakIconUrl: null,
  forcedBreakIconFallbackUrl: null,
  distractionBlocking: false,
  musicMuted: false,
  roomCode: null,

  setMode: (mode) => set({ mode }),
  setMusicMuted: (musicMuted) => set({ musicMuted }),
  setMusicSwapActive: (musicSwapActive) => set({ musicSwapActive }),
  setFaceSwap: (faceSwap) => set({ faceSwap }),
  setRoomCode: (roomCode) => set({ roomCode }),

  startMatch: (mode) => {
    set({
      mode,
      roundsWon: { me: 0, opponent: 0 },
      matchWinner: null,
      roundHistory: [],
      cardDetailPopup: null,
      cardDrawHistory: [],
      myHand: [],
      ...initialRoundState,
    });
    get().startRound();
  },

  startRound: () => {
    const word = getRandomWord();
    set({
      ...initialRoundState,
      answer: word,
      answerLength: null,
      roundOver: false,
      roundBanner: null,
      cardDrawHistory: [],
    });
  },

  submitGuess: (rawWord: string): SubmitGuessResult => {
    const state = get();
    if (!state.answer) return { ok: false, reason: 'no_answer' };
    if (state.roundOver || state.matchWinner) {
      return { ok: false, reason: 'round_over' };
    }
    if (
      state.inputLocked ||
      state.chessPuzzleActive ||
      state.distractionBlocking
    ) {
      return { ok: false, reason: 'locked' };
    }
    const word = normalizeWord(rawWord);
    if (!word || word.length < MIN_GUESS_LENGTH) {
      return { ok: false, reason: 'length' };
    }

    const answerLen = state.answer.length;

    if (state.bonusProbePending && !state.bonusProbeGuess) {
      if (!isValidProbeWord(word, answerLen)) {
        return { ok: false, reason: 'length' };
      }
      const results = evaluateGuess(word, state.answer);
      const probeGuess: Guess = {
        word,
        results,
        submittedAt: Date.now(),
        isProbe: true,
      };
      set({
        bonusProbeGuess: probeGuess,
        bonusProbeRowIndex: state.myGuesses.length,
        bonusProbePending: false,
        ...clearRecipeSpamState(state.overlays),
      });
      return { ok: true, solved: false };
    }

    const results = evaluateGuess(word, state.answer);
    const solved = isSolvedGuess(word, state.answer);
    const guess: Guess = { word, results, submittedAt: Date.now() };
    if (state.chessWordleTaxPending) {
      guess.halfMaskSide = state.chessWordleTaxPending;
    }

    if (state.forcedBreakPending) {
      guess.colorsRevealAt = Date.now() + answerLen * 1000;
    }

    const updates: Partial<GameStoreState> = {
      myGuesses: [...state.myGuesses, guess],
      ...clearRecipeSpamState(state.overlays),
      ...(state.chessWordleTaxPending ? { chessWordleTaxPending: null } : {}),
    };

    if (state.forcedBreakPending) {
      updates.forcedBreakPending = false;
    }

    if (state.glitchUntilNextGuess) {
      updates.glitchActive = null;
      updates.glitchUntilNextGuess = false;
    }
    if (state.activeEffects.some((e) => e.cardId === 'brainrot-glitch')) {
      updates.activeEffects = state.activeEffects.filter(
        (e) => e.cardId !== 'brainrot-glitch'
      );
    }
    if (
      state.activeEffects.some(
        (e) => e.cardId === 'meme-cannon' && e.target === 'self'
      )
    ) {
      updates.activeEffects = (
        updates.activeEffects ?? state.activeEffects
      ).filter((e) => !(e.cardId === 'meme-cannon' && e.target === 'self'));
    }

    set(updates);

    if (!solved) {
      triggerCardDrawAfterGuess();
    }

    if (solved) {
      get().endRound('me');
      return { ok: true, solved: true };
    }

    return { ok: true, solved: false };
  },

  revealAnswerLength: () => {
    const answer = get().answer;
    if (answer) set({ answerLength: answer.length });
  },

  showCardDetailPopup: (card, source = 'history') => {
    set({ cardDetailPopup: { card, source } });
  },

  dismissCardDetailPopup: () => {
    set({ cardDetailPopup: null });
  },

  endRound: (winner: 'me' | 'opponent') => {
    const state = get();
    if (state.roundOver) return;

    applyCriticsAtRoundEnd();
    const afterCritics = get();

    const newRoundsWon = {
      me: afterCritics.roundsWon.me + (winner === 'me' ? 1 : 0),
      opponent:
        afterCritics.roundsWon.opponent + (winner === 'opponent' ? 1 : 0),
    };
    const matchWinner = isMatchOver(newRoundsWon, afterCritics.roundsToWin);
    const roundNumber =
      newRoundsWon.me + newRoundsWon.opponent;

    const winningGuess =
      winner === 'me'
        ? afterCritics.myGuesses[afterCritics.myGuesses.length - 1]?.word
        : afterCritics.opponentGuesses[
            afterCritics.opponentGuesses.length - 1
          ]?.word;

    const historyEntry: CompletedRoundRecord = {
      roundIndex: roundNumber,
      answer: afterCritics.answer ?? '????',
      winner,
      myGuessCount: afterCritics.myGuesses.length,
      opponentGuessCount: afterCritics.opponentGuesses.length,
      winningGuess,
    };

    set({
      roundOver: true,
      roundsWon: newRoundsWon,
      matchWinner,
      roundHistory: [...afterCritics.roundHistory, historyEntry],
      roundBanner: matchWinner
        ? null
        : {
            winner,
            roundNumber,
            criticsStars: afterCritics.lastCriticsRatings ?? undefined,
          },
    });

    if (matchWinner) {
      notifyMatchEnd(matchWinner);
      return;
    }

    setTimeout(() => {
      const s = get();
      if (!s.matchWinner && s.roundBanner) {
        get().dismissRoundBanner();
        get().startRound();
      }
    }, 2500);
  },

  dismissRoundBanner: () => set({ roundBanner: null }),

  resetRound: () => {
    set({ ...initialRoundState });
    get().startRound();
  },

  resetMatch: () => {
    stopPlaylist();
    set({
      mode: null,
      roundsWon: { me: 0, opponent: 0 },
      matchWinner: null,
      roundHistory: [],
      cardDetailPopup: null,
      cardDrawHistory: [],
      myHand: [],
      musicSwapActive: false,
      faceSwap: false,
  faceSwapImageUrl: null as string | null,
      ...initialRoundState,
    });
  },

  clearDistractionBlock: () =>
    set({ distractionBlocking: false, inputLocked: false }),
}));
