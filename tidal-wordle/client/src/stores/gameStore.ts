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
  StoryboardPage,
} from '../types';
import {
  MIN_GUESS_LENGTH,
  resolveCriticsRating,
  isMatchOver,
} from '../lib/scoring';
import { isValidProbeWord } from '../lib/cardContent/probeWords';
import { stopPlaylist } from '../lib/cardAudio';
import { evaluateGuess, isSolvedGuess } from '../lib/guessEvaluator';
import {
  getRandomWord,
  normalizeWord,
  pickRandomWordExcluding,
} from '../lib/wordList';
import {
  loadSoloCompletedWords,
  saveSoloCompletedWords,
} from '../lib/soloWordProgress';
import {
  createStoryboardPageStub,
  generateStoryboardPage,
} from '../lib/storyboard';
import type { Role } from '../../../shared/events';
import { useMultiplayerStore } from './multiplayerStore';

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

function enqueueStoryboardPage(word: string, roundIndex: number): void {
  const priorWords = useGameStore
    .getState()
    .storyboardPages.map((p) => p.word);
  if (
    useGameStore
      .getState()
      .storyboardPages.some((p) => p.roundIndex === roundIndex)
  ) {
    return;
  }

  const stub = createStoryboardPageStub(word, roundIndex, priorWords);
  useGameStore.setState((state) => ({
    storyboardPages: [...state.storyboardPages, stub],
    storyboardHasUnread: true,
  }));

  void generateStoryboardPage(word, roundIndex, priorWords).then((result) => {
    useGameStore.setState((state) => ({
      storyboardPages: state.storyboardPages.map((p) =>
        p.id === stub.id ? { ...p, ...result } : p
      ),
    }));
  });
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
  /** Multiplayer bridge — written by useSocketBridge from server events. */
  myCooldownEndsAt: number | null;
  opponentCooldownEndsAt: number | null;
  /** True when server emits opponent:left; UI may show a notice. */
  opponentLeft: boolean;
  /** Sequential MP: server role that may submit the next guess. */
  activeTurn: Role | null;
  /** Manga storyboard pages — one panel per completed round. */
  storyboardPages: StoryboardPage[];
  /** Pull-out phone UI visible. */
  phoneOpen: boolean;
  /** New panel arrived while phone was stowed. */
  storyboardHasUnread: boolean;
  /** Solo: words cleared this run + persisted in localStorage. */
  soloCompletedWords: string[];
  /** Solo: every bank word has been cleared at least once. */
  wordBankExhausted: boolean;

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
  setPhoneOpen: (open: boolean) => void;
  togglePhone: () => void;

  // ---- Multiplayer bridge surface (called from useSocketBridge) ----
  addOpponentGuess: (guess: Guess) => void;
  addMyGuess: (guess: Guess) => void;
  setMyCooldownEndsAt: (at: number | null) => void;
  setOpponentCooldownEndsAt: (at: number | null) => void;
  setAnswerLengthFromServer: (length: number) => void;
  setOpponentLeft: (left: boolean) => void;
  setActiveTurnFromServer: (turn: Role) => void;
  /** Server-authoritative submit: pre-check locally, then let server evaluate. */
  multiplayerSubmitGuess: (word: string) => SubmitGuessResult;
  applyRemoteRoundEnd: (winner: 'me' | 'opponent', answer: string) => void;
  applyRemoteNextRound: (roundNumber: number, activeTurn?: Role) => void;
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
  myCooldownEndsAt: null as number | null,
  opponentCooldownEndsAt: null as number | null,
  activeTurn: null as Role | null,
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
  opponentLeft: false,
  activeTurn: null,
  storyboardPages: [],
  phoneOpen: false,
  storyboardHasUnread: false,
  soloCompletedWords: [],
  wordBankExhausted: false,

  setMode: (mode) => set({ mode }),
  setMusicMuted: (musicMuted) => set({ musicMuted }),
  setMusicSwapActive: (musicSwapActive) => set({ musicSwapActive }),
  setFaceSwap: (faceSwap) => set({ faceSwap }),
  setRoomCode: (roomCode) => set({ roomCode }),

  startMatch: (mode) => {
    const soloCompletedWords =
      mode === 'solo' ? loadSoloCompletedWords() : [];
    set({
      mode,
      roundsWon: { me: 0, opponent: 0 },
      matchWinner: null,
      roundHistory: [],
      cardDetailPopup: null,
      cardDrawHistory: [],
      myHand: [],
      storyboardPages: [],
      phoneOpen: false,
      storyboardHasUnread: false,
      soloCompletedWords,
      wordBankExhausted: false,
      ...initialRoundState,
    });
    get().startRound();
  },

  startRound: () => {
    const state = get();
    if (state.mode === 'solo') {
      const excluded = new Set(
        state.soloCompletedWords.map((w) => w.toUpperCase())
      );
      const word = pickRandomWordExcluding(excluded);
      if (!word) {
        set({
          ...initialRoundState,
          answer: null,
          answerLength: null,
          roundOver: false,
          roundBanner: null,
          wordBankExhausted: true,
        });
        return;
      }
      set({
        ...initialRoundState,
        answer: word,
        answerLength: null,
        roundOver: false,
        roundBanner: null,
        cardDrawHistory: [],
        wordBankExhausted: false,
        soloCompletedWords: state.soloCompletedWords,
      });
      return;
    }

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

    if (state.mode === 'solo') {
      if (winner !== 'me' || !state.answer) return;

      applyCriticsAtRoundEnd();
      const afterCritics = get();
      const answer = afterCritics.answer;
      if (!answer) return;
      const answerWord = answer.toLowerCase();
      const soloCompletedWords = [
        ...afterCritics.soloCompletedWords,
        ...(afterCritics.soloCompletedWords.includes(answerWord)
          ? []
          : [answerWord]),
      ];
      saveSoloCompletedWords(soloCompletedWords);
      const chapterIndex = soloCompletedWords.length;

      const winningGuess =
        afterCritics.myGuesses[afterCritics.myGuesses.length - 1]?.word;

      const historyEntry: CompletedRoundRecord = {
        roundIndex: chapterIndex,
        answer,
        winner: 'me',
        myGuessCount: afterCritics.myGuesses.length,
        opponentGuessCount: 0,
        winningGuess,
      };

      set({
        roundOver: true,
        soloCompletedWords,
        roundHistory: [...afterCritics.roundHistory, historyEntry],
        roundBanner: {
          winner: 'me',
          roundNumber: chapterIndex,
          criticsStars: afterCritics.lastCriticsRatings ?? undefined,
        },
      });

      enqueueStoryboardPage(answerWord, chapterIndex);

      setTimeout(() => {
        const s = get();
        if (s.mode !== 'solo' || !s.roundBanner) return;
        get().dismissRoundBanner();
        get().startRound();
      }, 1500);
      return;
    }

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

    const answerWord = afterCritics.answer?.toLowerCase();
    if (answerWord) {
      enqueueStoryboardPage(answerWord, roundNumber);
    }

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
      storyboardPages: [],
      phoneOpen: false,
      storyboardHasUnread: false,
      soloCompletedWords: [],
      wordBankExhausted: false,
      musicSwapActive: false,
      faceSwap: false,
  faceSwapImageUrl: null as string | null,
      ...initialRoundState,
    });
  },

  clearDistractionBlock: () =>
    set({ distractionBlocking: false, inputLocked: false }),

  setPhoneOpen: (open) =>
    set({
      phoneOpen: open,
      ...(open ? { storyboardHasUnread: false } : {}),
    }),

  togglePhone: () => {
    const next = !get().phoneOpen;
    set({
      phoneOpen: next,
      ...(next ? { storyboardHasUnread: false } : {}),
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // Multiplayer bridge (called from useSocketBridge in useSocket.ts).
  // Server is authoritative for evaluations, cooldowns, round/match
  // outcomes; these methods just project server payloads into the
  // local store so the existing solo UI keeps working in MP mode.
  // ─────────────────────────────────────────────────────────────────

  setMyCooldownEndsAt: (at) => set({ myCooldownEndsAt: at }),
  setOpponentCooldownEndsAt: (at) => set({ opponentCooldownEndsAt: at }),
  setOpponentLeft: (left) => set({ opponentLeft: left }),
  setActiveTurnFromServer: (turn) => set({ activeTurn: turn }),
  setAnswerLengthFromServer: (length) => {
    if (get().answerLength !== length) set({ answerLength: length });
  },

  addMyGuess: (guess) => {
    const existing = get().myGuesses;
    if (existing.some((g) => g.word === guess.word)) return;
    set({ myGuesses: [...existing, guess] });
  },

  addOpponentGuess: (guess) => {
    const existing = get().opponentGuesses;
    if (existing.some((g) => g.word === guess.word)) return;
    set({ opponentGuesses: [...existing, guess] });
  },

  multiplayerSubmitGuess: (word) => {
    // Local pre-check only; server runs the real evaluator. We reject
    // empty input and obvious locks; everything else is "send it".
    const state = get();
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return { ok: false, reason: 'length' };
    if (state.matchWinner !== null || state.roundOver) {
      return { ok: false, reason: 'round_over' };
    }
    if (state.inputLocked || state.chessPuzzleActive || state.distractionBlocking) {
      return { ok: false, reason: 'locked' };
    }
    const myRole = useMultiplayerStore.getState().role;
    if (
      myRole &&
      state.activeTurn !== null &&
      state.activeTurn !== myRole
    ) {
      return { ok: false, reason: 'not_your_turn' };
    }
    if (state.answerLength !== null && trimmed.length !== state.answerLength) {
      return { ok: false, reason: 'length' };
    }
    return { ok: true } as SubmitGuessResult;
  },

  applyRemoteRoundEnd: (winner, answer) => {
    const state = get();
    const nextRoundsWon = {
      me: state.roundsWon.me + (winner === 'me' ? 1 : 0),
      opponent: state.roundsWon.opponent + (winner === 'opponent' ? 1 : 0),
    };
    const matchWinner: MatchWinner =
      nextRoundsWon.me >= state.roundsToWin
        ? 'me'
        : nextRoundsWon.opponent >= state.roundsToWin
          ? 'opponent'
          : null;

    const roundNumber = nextRoundsWon.me + nextRoundsWon.opponent;

    set({
      roundOver: true,
      answer,
      roundsWon: nextRoundsWon,
      matchWinner,
    });

    enqueueStoryboardPage(answer.toLowerCase(), roundNumber);

    if (matchWinner !== null) notifyMatchEnd(matchWinner);
  },

  applyRemoteNextRound: (_roundNumber, activeTurn = 'host') => {
    set({
      ...initialRoundState,
      matchWinner: null,
      activeTurn,
    });
  },
}));
