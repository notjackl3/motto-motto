/**
 * Per-card integration tests — drives applyEffect(cardId, 'self') against
 * a fresh solo store and asserts the documented side-effect for each of
 * the 20 cards in CARD_DEFINITIONS. Verifies attacks/buffs/wildcards
 * actually mutate the gameStore as their description claims.
 *
 * Audio is mocked to silence browser APIs; fetch is stubbed so the
 * fire-and-forget prefetchTopics() in startMatch doesn't try to hit the
 * network from node.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cardAudio', () => ({
  stopPlaylist: vi.fn(),
  startPlaylistForTheme: vi.fn(),
  playCardSfx: vi.fn(),
}));

import { useGameStore } from '../stores/gameStore';
import { applyEffect } from './cardEffects';
import { _resetWordSourcesForTests } from './wordSources';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('[]', { status: 200 }))
  );
  _resetWordSourcesForTests();
  useGameStore.getState().resetMatch();
  useGameStore.getState().startMatch('solo');
  // Pin a known answer so each card sees deterministic input.
  useGameStore.setState({ answer: 'BEACH', answerLength: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Attack cards — debuff the target (in solo, always self)
// ─────────────────────────────────────────────────────────────────────
describe('attack cards', () => {
  it('meme-cannon adds a meme-cannon active effect with a caption', () => {
    applyEffect('meme-cannon', 'self');
    const effect = useGameStore
      .getState()
      .activeEffects.find((e) => e.cardId === 'meme-cannon');
    expect(effect).toBeTruthy();
    expect(typeof effect!.payload?.caption).toBe('string');
  });

  it('brainrot-glitch sets glitchActive + glitchUntilNextGuess and adds the effect', () => {
    applyEffect('brainrot-glitch', 'self');
    const s = useGameStore.getState();
    expect(s.glitchActive).toBe('self');
    expect(s.glitchUntilNextGuess).toBe(true);
    expect(s.activeEffects.some((e) => e.cardId === 'brainrot-glitch')).toBe(
      true
    );
  });

  it('status-dog adds an effect with ~10s expiry covering a board tile', () => {
    const before = Date.now();
    applyEffect('status-dog', 'self');
    const effect = useGameStore
      .getState()
      .activeEffects.find((e) => e.cardId === 'status-dog');
    expect(effect).toBeTruthy();
    expect(effect!.expiresAt).toBeGreaterThanOrEqual(before + 9000);
    expect(effect!.expiresAt).toBeLessThanOrEqual(before + 11000);
    expect(typeof effect!.payload?.row).toBe('number');
    expect(typeof effect!.payload?.col).toBe('number');
  });

  it('playful-insult adds a playful-insult overlay', () => {
    applyEffect('playful-insult', 'self');
    expect(
      useGameStore.getState().overlays.some((o) => o.type === 'playful-insult')
    ).toBe(true);
  });

  it('forced-break sets forcedBreakPending with a flavor label', () => {
    applyEffect('forced-break', 'self');
    const s = useGameStore.getState();
    expect(s.forcedBreakPending).toBe(true);
    expect(s.forcedBreakLabel).toBeTruthy();
  });

  it('bored-distraction locks input and adds an overlay', () => {
    applyEffect('bored-distraction', 'self');
    const s = useGameStore.getState();
    expect(s.inputLocked).toBe(true);
    expect(s.distractionBlocking).toBe(true);
    expect(s.overlays.some((o) => o.type === 'bored-distraction')).toBe(true);
  });

  it('recipe-spam adds a recipe-spam overlay with an expiry', () => {
    const before = Date.now();
    applyEffect('recipe-spam', 'self');
    const overlay = useGameStore
      .getState()
      .overlays.find((o) => o.type === 'recipe-spam');
    expect(overlay).toBeTruthy();
    expect(overlay!.expiresAt).toBeGreaterThan(before);
  });

  it('rejection-letter locks input and adds a rejection-letter overlay', () => {
    applyEffect('rejection-letter', 'self');
    const s = useGameStore.getState();
    expect(s.inputLocked).toBe(true);
    expect(s.overlays.some((o) => o.type === 'rejection-letter')).toBe(true);
  });

  it('face-swap-glitch sets faceSwap and adds the effect with answer-length expiry', () => {
    const before = Date.now();
    applyEffect('face-swap-glitch', 'self');
    const s = useGameStore.getState();
    expect(s.faceSwap).toBe(true);
    const effect = s.activeEffects.find((e) => e.cardId === 'face-swap-glitch');
    expect(effect).toBeTruthy();
    // BEACH = 5 letters → 5 second duration.
    expect(effect!.expiresAt).toBeGreaterThanOrEqual(before + 4500);
    expect(effect!.expiresAt).toBeLessThanOrEqual(before + 5500);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Buff cards — help the player
// ─────────────────────────────────────────────────────────────────────
describe('buff cards', () => {
  it('letter-reveal exposes exactly one letter at its correct position', () => {
    expect(useGameStore.getState().revealedLetters).toEqual({});
    applyEffect('letter-reveal', 'self');
    const revealed = useGameStore.getState().revealedLetters;
    expect(Object.keys(revealed)).toHaveLength(1);
    const [posStr, letter] = Object.entries(revealed)[0];
    expect(letter).toBe('BEACH'[Number(posStr)]);
  });

  it('letter-reveal also reveals the answer length', () => {
    applyEffect('letter-reveal', 'self');
    expect(useGameStore.getState().answerLength).toBe(5);
  });

  it('cosmic-reset removes the most recent wrong guess', () => {
    useGameStore.setState({
      myGuesses: [{ word: 'SANDY', results: [], submittedAt: 0 }],
    });
    applyEffect('cosmic-reset', 'self');
    expect(useGameStore.getState().myGuesses).toEqual([]);
  });

  it('cosmic-reset does NOT remove a solving guess', () => {
    useGameStore.setState({
      myGuesses: [{ word: 'BEACH', results: [], submittedAt: 0 }],
    });
    applyEffect('cosmic-reset', 'self');
    expect(useGameStore.getState().myGuesses).toHaveLength(1);
  });

  it('marine-hint adds a hint that mentions the vowel count (BEACH = 2)', () => {
    applyEffect('marine-hint', 'self');
    const hints = useGameStore.getState().hints;
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.some((h) => /\b2 vowels?\b/i.test(h.text))).toBe(true);
  });

  it('tide-whisper reveals the first or last letter and adds a hint', () => {
    applyEffect('tide-whisper', 'self');
    const s = useGameStore.getState();
    const revealed = Object.entries(s.revealedLetters);
    expect(revealed).toHaveLength(1);
    const pos = Number(revealed[0][0]);
    expect([0, 4]).toContain(pos);
    expect(s.hints.some((h) => /whisper/i.test(h.text))).toBe(true);
  });

  it('forecast adds a hint naming a vowel or consonant at a position', () => {
    applyEffect('forecast', 'self');
    const hints = useGameStore.getState().hints;
    expect(hints.some((h) => /position \d+ is a (vowel|consonant)/i.test(h.text))).toBe(
      true
    );
  });

  it('related-current adds a hint with a related word', () => {
    applyEffect('related-current', 'self');
    const hints = useGameStore.getState().hints;
    expect(hints.some((h) => /related word/i.test(h.text))).toBe(true);
  });

  it('resume-polish adds at least one hint (pattern or suggestion)', () => {
    applyEffect('resume-polish', 'self');
    expect(useGameStore.getState().hints.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Wildcard cards
// ─────────────────────────────────────────────────────────────────────
describe('wildcard cards', () => {
  it('chess-gambit activates the puzzle, locks input, and adds an overlay', () => {
    applyEffect('chess-gambit', 'self');
    const s = useGameStore.getState();
    expect(s.chessPuzzleActive).toBe(true);
    expect(s.inputLocked).toBe(true);
    expect(s.overlays.some((o) => o.type === 'chess-gambit')).toBe(true);
  });

  it('dice-roll rerolls into a different card recorded at the top of history', () => {
    applyEffect('dice-roll', 'self');
    const history = useGameStore.getState().cardDrawHistory;
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].id).not.toBe('dice-roll');
  });

  it('beach-playlist sets musicSwapActive=true and clears after 30s', () => {
    applyEffect('beach-playlist', 'self');
    expect(useGameStore.getState().musicSwapActive).toBe(true);
    vi.advanceTimersByTime(30_100);
    expect(useGameStore.getState().musicSwapActive).toBe(false);
  });

  it('critics-rating sets criticsRatingPending', () => {
    applyEffect('critics-rating', 'self');
    expect(useGameStore.getState().criticsRatingPending).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Coverage check: every card in CARD_DEFINITIONS got at least one test
// above. If a new card is added without a test, this fails fast.
// ─────────────────────────────────────────────────────────────────────
describe('card-effects coverage', () => {
  it('has at least one test per CARD_DEFINITIONS id', async () => {
    const { CARD_DEFINITIONS } = await import(
      '../components/cards/CardDefinitions'
    );
    const testedIds = new Set([
      'meme-cannon',
      'brainrot-glitch',
      'status-dog',
      'playful-insult',
      'forced-break',
      'bored-distraction',
      'recipe-spam',
      'rejection-letter',
      'face-swap-glitch',
      'letter-reveal',
      'cosmic-reset',
      'marine-hint',
      'tide-whisper',
      'forecast',
      'related-current',
      'resume-polish',
      'chess-gambit',
      'dice-roll',
      'beach-playlist',
      'critics-rating',
    ]);
    const missing = CARD_DEFINITIONS.map((c) => c.id).filter(
      (id) => !testedIds.has(id)
    );
    expect(missing).toEqual([]);
  });
});
