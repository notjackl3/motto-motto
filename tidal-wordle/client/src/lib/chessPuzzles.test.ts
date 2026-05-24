import { describe, expect, it } from 'vitest';
import {
  getChessPuzzleById,
  getChessPuzzleCount,
  parseFenBoard,
  pickRandomChessPuzzle,
  shuffleOptionOrder,
} from './chessPuzzles';

describe('parseFenBoard', () => {
  it('parses an empty rank and full rank', () => {
    const board = parseFenBoard('8/8/8/8/8/8/8/4R2K w - - 0 1');
    expect(board).toHaveLength(8);
    expect(board[7]?.[4]).toBe('♖');
    expect(board[7]?.[7]).toBe('♔');
    expect(board[0]?.every((cell) => cell === null)).toBe(true);
  });
});

describe('chess puzzle catalog', () => {
  it('returns known puzzles by id', () => {
    const puzzle = getChessPuzzleById('scholars-mate-f7');
    expect(puzzle?.correctIndex).toBe(1);
    expect(puzzle?.options).toHaveLength(4);
  });

  it('shuffles option order in place', () => {
    const order = shuffleOptionOrder(4);
    expect(order.sort()).toEqual([0, 1, 2, 3]);
  });

  it('picks from the catalog', () => {
    expect(getChessPuzzleById(pickRandomChessPuzzle().id)).toBeDefined();
  });

  it('loads the offline Lichess-derived catalog', () => {
    expect(getChessPuzzleCount()).toBeGreaterThanOrEqual(100);
  });
});
