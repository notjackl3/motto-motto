import { describe, expect, it } from 'vitest';
import { evaluateGuess, isSolvedGuess, isGuessCorrect } from './guessEvaluator';

describe('evaluateGuess', () => {
  it('marks duplicates per Wordle rules (EERIE vs BEACH)', () => {
    const r = evaluateGuess('EERIE', 'BEACH');
    expect(r.map((x) => x.state)).toEqual([
      'absent',
      'correct',
      'absent',
      'absent',
      'absent',
    ]);
  });

  it('marks present letters in wrong positions', () => {
    const r = evaluateGuess('SPEED', 'ERASE');
    expect(r.some((x) => x.state === 'present')).toBe(true);
  });

  it('marks extra letters beyond answer length as absent', () => {
    const r = evaluateGuess('BEACHES', 'BEACH');
    expect(r.length).toBe(7);
    expect(r.slice(5).every((x) => x.state === 'absent')).toBe(true);
  });

  it('evaluates shorter guesses without revealing trailing answer slots', () => {
    const r = evaluateGuess('BE', 'BEACH');
    expect(r.length).toBe(2);
    expect(r[0].state).toBe('correct');
    expect(r[1].state).toBe('correct');
  });

  it('aligns longer guesses so embedded answer letters can be correct (BLURTUBRT vs TURTLE)', () => {
    const r = evaluateGuess('BLURTUBRT', 'TURTLE');
    expect(r[2]).toMatchObject({ letter: 'U', state: 'correct', answerIndex: 1 });
    expect(r[3]).toMatchObject({ letter: 'R', state: 'correct', answerIndex: 2 });
    expect(r[4]).toMatchObject({ letter: 'T', state: 'correct', answerIndex: 3 });
  });

  it('aligns a one-letter prefix before the answer (XTURTLE vs TURTLE)', () => {
    const r = evaluateGuess('XTURTLE', 'TURTLE');
    expect(r.slice(1).every((x) => x.state === 'correct')).toBe(true);
    expect(r[0].state).toBe('absent');
  });
});

describe('isSolvedGuess', () => {
  it('requires exact match including length', () => {
    expect(isSolvedGuess('BEAC', 'BEACH')).toBe(false);
    expect(isSolvedGuess('BEACH', 'BEACH')).toBe(true);
    expect(isGuessCorrect(evaluateGuess('BEAC', 'BEACH'))).toBe(true);
  });
});
