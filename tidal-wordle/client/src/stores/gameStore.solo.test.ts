/**
 * End-to-end solo flow exercised through the gameStore.
 *
 * Drives the real store (no UI) through:
 *   startMatch('solo') → submit wrong guesses → submit correct guess →
 *   round ends → auto-advance to next round → win best-of-3 → match ends.
 *
 * We mock cardEffects' dynamic import because it pulls in audio/asset
 * modules that aren't safe to load in the node test environment.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/cardEffects', () => ({
  fireCardAfterGuess: () => {},
}));

vi.mock('../lib/cardAudio', () => ({
  stopPlaylist: () => {},
  startPlaylistForTheme: () => {},
  playCardSfx: () => {},
}));

import { useGameStore, onMatchEnd } from './gameStore';
import { _resetWordSourcesForTests } from '../lib/wordSources';

function setAnswer(answer: string): void {
  useGameStore.setState({ answer: answer.toUpperCase() });
}

function submit(word: string) {
  return useGameStore.getState().submitGuess(word);
}

beforeEach(() => {
  vi.useFakeTimers();
  _resetWordSourcesForTests();
  useGameStore.getState().resetMatch();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('solo gameplay — single round', () => {
  it('starts solo with a non-empty answer and a source label', () => {
    useGameStore.getState().startMatch('solo');
    const s = useGameStore.getState();
    expect(s.mode).toBe('solo');
    expect(s.answer).toBeTruthy();
    expect(s.myGuesses).toEqual([]);
    expect(s.roundOver).toBe(false);
    expect(s.matchWinner).toBeNull();
    // currentWordSource is 'local' when the fetched cache is empty.
    expect(s.currentWordSource).toBe('local');
  });

  it('records wrong guesses without ending the round', () => {
    useGameStore.getState().startMatch('solo');
    setAnswer('BEACH');

    const r1 = submit('SANDY');
    expect(r1).toEqual({ ok: true, solved: false });

    const r2 = submit('OCEAN');
    expect(r2).toEqual({ ok: true, solved: false });

    const s = useGameStore.getState();
    expect(s.myGuesses.map((g) => g.word)).toEqual(['SANDY', 'OCEAN']);
    expect(s.roundOver).toBe(false);
    expect(s.roundsWon.me).toBe(0);
  });

  it('marks the correct guess solved and ends the round', () => {
    useGameStore.getState().startMatch('solo');
    setAnswer('BEACH');

    submit('SANDY');
    const result = submit('BEACH');
    expect(result).toEqual({ ok: true, solved: true });

    const s = useGameStore.getState();
    expect(s.roundOver).toBe(true);
    expect(s.roundsWon.me).toBe(1);
  });

  it('rejects guesses below MIN_GUESS_LENGTH', () => {
    useGameStore.getState().startMatch('solo');
    setAnswer('OCEAN');
    const result = submit('A');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('length');
  });

  it('rejects guesses after the round is already over', () => {
    useGameStore.getState().startMatch('solo');
    setAnswer('SURF');
    submit('SURF');
    const after = submit('WAVE');
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.reason).toBe('round_over');
  });
});

describe('solo gameplay — best-of-3 match', () => {
  it('advances to a new round after a win, then ends the match on the 2nd win', () => {
    const winnerEvents: Array<'me' | 'opponent'> = [];
    const off = onMatchEnd((w) => {
      if (w === 'me' || w === 'opponent') winnerEvents.push(w);
    });

    useGameStore.getState().startMatch('solo');

    // ---- Round 1: win ----
    setAnswer('BEACH');
    submit('BEACH');
    expect(useGameStore.getState().roundsWon).toEqual({ me: 1, opponent: 0 });
    expect(useGameStore.getState().matchWinner).toBeNull();

    // Auto-advance timer (2.5s) fires startRound.
    vi.advanceTimersByTime(2600);
    const afterRound1 = useGameStore.getState();
    expect(afterRound1.roundOver).toBe(false);
    expect(afterRound1.myGuesses).toEqual([]);
    expect(afterRound1.answer).toBeTruthy();

    // ---- Round 2: win → match over ----
    setAnswer('OCEAN');
    submit('OCEAN');
    const s = useGameStore.getState();
    expect(s.roundsWon).toEqual({ me: 2, opponent: 0 });
    expect(s.matchWinner).toBe('me');
    expect(winnerEvents).toEqual(['me']);

    off();
  });

  it('keeps round history with the revealed answer per round', () => {
    useGameStore.getState().startMatch('solo');

    setAnswer('BEACH');
    submit('BEACH');
    vi.advanceTimersByTime(2600);

    setAnswer('OCEAN');
    submit('OCEAN');

    const history = useGameStore.getState().roundHistory;
    expect(history.map((r) => r.answer)).toEqual(['BEACH', 'OCEAN']);
    expect(history.every((r) => r.winner === 'me')).toBe(true);
  });
});

describe('solo gameplay — word source selection', () => {
  it('uses a fetched topic as the answer source when cache is warm', async () => {
    const { _seedCacheForTests } = await import('../lib/wordSources');
    _seedCacheForTests({ ocean: ['WAVE'] });

    useGameStore.getState().startMatch('solo');
    const s = useGameStore.getState();
    expect(s.answer).toBe('WAVE');
    expect(s.currentWordSource).toBe('ocean');
  });

  it('falls back to local word source when nothing has been fetched', () => {
    useGameStore.getState().startMatch('solo');
    expect(useGameStore.getState().currentWordSource).toBe('local');
  });
});
