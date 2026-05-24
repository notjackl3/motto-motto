/**
 * gameStore seam (Dev A / Dev B):
 * - Dev B owns: mode (sync), opponentGuesses (write via socket), opponentCooldownEndsAt,
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
  DEFAULT_COOLDOWN_MS,
  MIN_GUESS_LENGTH,
  ROUND_START_SCORE,
  applyRoundToMatch,
  computeRoundScoreAfterGuess,
  resolveCriticsRating,
  isMatchOver,
} from '../lib/scoring';

function applyCriticsAtRoundEnd(): void {
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
  myCooldownEndsAt: number | null;
  opponentCooldownEndsAt: number | null;
  /** Dev B: set true when server emits opponent:left; UI shows a 30s modal. */
  opponentLeft: boolean;
  myHand: import('../types').Card[];
  activeEffects: ActiveEffect[];
  roundScore: { me: number; opponent: number };
  matchScore: { me: number; opponent: number };
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
  cooldownFrozen: boolean;
  chessPuzzleActive: boolean;
  chessLockUntil: number | null;
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
  setMyCooldownEndsAt: (at: number | null) => void;
  clearDistractionBlock: () => void;

  // ---- Dev B: multiplayer bridge surface ----
  /** Append a server-evaluated opponent guess. */
  addOpponentGuess: (guess: Guess) => void;
  /** Append a server-evaluated self guess; idempotent on word. */
  addMyGuess: (guess: Guess) => void;
  /** Server-authoritative opponent cooldown end timestamp. */
  setOpponentCooldownEndsAt: (at: number | null) => void;
  setAnswerLengthFromServer: (length: number) => void;
  setOpponentLeft: (left: boolean) => void;
  /**
   * Pre-check + emit path used by multiplayer. Returns the same shape as
   * submitGuess but skips local evaluation entirely — server is authoritative.
   * The actual socket emit happens in useSocket; this just gates on local
   * cooldown / lock / round-over state.
   */
  multiplayerSubmitGuess: (word: string) => SubmitGuessResult;
  /** Called from the multiplayer bridge when the server signals round end. */
  applyRemoteRoundEnd: (winner: 'me' | 'opponent', answer: string) => void;
  /** Called from the multiplayer bridge when server signals next round. */
  applyRemoteNextRound: (roundNumber: number) => void;
}

const initialRoundState = {
  answer: null as string | null,
  answerLength: null as number | null,
  myGuesses: [] as Guess[],
  opponentGuesses: [] as Guess[],
  myCooldownEndsAt: null as number | null,
  opponentCooldownEndsAt: null as number | null,
  activeEffects: [] as ActiveEffect[],
  roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
  revealedLetters: {} as Record<number, string>,
  hints: [] as Hint[],
  inputLocked: false,
  glitchActive: null as EffectTarget | null,
  glitchUntilNextGuess: false,
  overlays: [] as OverlayState[],
  cooldownFrozen: false,
  chessPuzzleActive: false,
  chessLockUntil: null as number | null,
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
  matchScore: { me: 0, opponent: 0 },
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
  opponentLeft: false,

  setMode: (mode) => set({ mode }),
  setMusicMuted: (musicMuted) => set({ musicMuted }),
  setMusicSwapActive: (musicSwapActive) => set({ musicSwapActive }),
  setFaceSwap: (faceSwap) => set({ faceSwap }),
  setRoomCode: (roomCode) => set({ roomCode }),

  startMatch: (mode) => {
    set({
      mode,
      matchScore: { me: 0, opponent: 0 },
      roundsWon: { me: 0, opponent: 0 },
      matchWinner: null,
      roundHistory: [],
      cardDetailPopup: null,
      cardDrawHistory: [],
      myHand: [],
      ...initialRoundState,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
    });
    get().startRound();
  },

  startRound: () => {
    const word = getRandomWord();
    set({
      ...initialRoundState,
      answer: word,
      answerLength: null,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
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

    if (
      state.myCooldownEndsAt &&
      Date.now() < state.myCooldownEndsAt &&
      !state.cooldownFrozen
    ) {
      return { ok: false, reason: 'locked' };
    }
    const results = evaluateGuess(word, state.answer);
    const solved = isSolvedGuess(word, state.answer);
    const guess: Guess = { word, results, submittedAt: Date.now() };

    if (state.forcedBreakPending) {
      guess.colorsRevealAt = Date.now() + answerLen * 1000;
    }

    let newRoundScore = state.roundScore.me;
    if (!solved) {
      newRoundScore = computeRoundScoreAfterGuess(state.roundScore.me, false);
    }

    const updates: Partial<GameStoreState> = {
      myGuesses: [...state.myGuesses, guess],
      roundScore: { ...state.roundScore, me: newRoundScore },
      ...clearRecipeSpamState(state.overlays),
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

    if (!state.cooldownFrozen) {
      set({ myCooldownEndsAt: Date.now() + DEFAULT_COOLDOWN_MS });
    }

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

    const winnerScore =
      winner === 'me'
        ? afterCritics.roundScore.me
        : afterCritics.roundScore.opponent;

    const newMatchScore = applyRoundToMatch(
      afterCritics.matchScore,
      winner,
      winnerScore
    );
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
      pointsBanked: winnerScore,
      myFinalRoundScore: afterCritics.roundScore.me,
      myGuessCount: afterCritics.myGuesses.length,
      opponentGuessCount: afterCritics.opponentGuesses.length,
      winningGuess,
    };

    set({
      roundOver: true,
      matchScore: newMatchScore,
      roundsWon: newRoundsWon,
      matchWinner,
      roundHistory: [...afterCritics.roundHistory, historyEntry],
      roundBanner: matchWinner
        ? null
        : {
            winner,
            points: winnerScore,
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
      // Dev B note: in multiplayer the server picks the next word and we
      // wait for GAME_NEXT_ROUND to reset — don't auto-restart locally.
      if (!s.matchWinner && s.roundBanner && s.mode !== 'multiplayer') {
        get().dismissRoundBanner();
        get().startRound();
      }
    }, 2500);
  },

  dismissRoundBanner: () => set({ roundBanner: null }),

  resetRound: () => {
    set({
      ...initialRoundState,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
    });
    get().startRound();
  },

  resetMatch: () => {
    stopPlaylist();
    set({
      mode: null,
      matchScore: { me: 0, opponent: 0 },
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
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
    });
  },

  setMyCooldownEndsAt: (at) => set({ myCooldownEndsAt: at }),

  clearDistractionBlock: () =>
    set({ distractionBlocking: false, inputLocked: false }),

  // ---------- Dev B: multiplayer bridge surface ----------

  addOpponentGuess: (guess) =>
    set((state) => ({ opponentGuesses: [...state.opponentGuesses, guess] })),

  addMyGuess: (guess) =>
    set((state) => {
      if (state.myGuesses.some((g) => g.word === guess.word)) return state;
      return { myGuesses: [...state.myGuesses, guess] };
    }),

  setOpponentCooldownEndsAt: (at) => set({ opponentCooldownEndsAt: at }),

  setAnswerLengthFromServer: (length) =>
    set((state) =>
      state.answerLength === null ? { answerLength: length } : state,
    ),

  setOpponentLeft: (left) => set({ opponentLeft: left }),

  multiplayerSubmitGuess: (rawWord: string): SubmitGuessResult => {
    const state = get();
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
    if (state.answerLength && word.length !== state.answerLength) {
      return { ok: false, reason: 'length' };
    }
    if (
      state.myCooldownEndsAt &&
      Date.now() < state.myCooldownEndsAt &&
      !state.cooldownFrozen
    ) {
      return { ok: false, reason: 'locked' };
    }
    return { ok: true, solved: false };
  },

  applyRemoteRoundEnd: (winner, answer) => {
    const state = get();
    if (state.roundOver) return;
    set({ answer });
    get().endRound(winner);
  },

  applyRemoteNextRound: (_roundNumber) => {
    // Multiplayer: server picks the word; client just resets visible round
    // state. We don't call Dev A's startRound (which would pick a local
    // getRandomWord) — the answer stays null on the client until round end.
    set({
      ...initialRoundState,
      answer: null,
      answerLength: null,
      roundScore: { me: ROUND_START_SCORE, opponent: ROUND_START_SCORE },
      cardDrawHistory: [],
      opponentLeft: false,
    });
  },
}));
