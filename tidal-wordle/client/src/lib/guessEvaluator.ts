import type { LetterResult } from '../types';

// TODO: implement full Wordle evaluation (correct/present/absent with duplicate handling)
export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  return guess.split('').map((letter) => ({
    letter,
    state: 'empty',
  }));
}
