import catalog from '../data/chessPuzzles.catalog.json';

export interface ChessPuzzleOption {
  label: string;
  san: string;
}

export interface ChessPuzzle {
  id: string;
  title: string;
  prompt: string;
  fen: string;
  options: ChessPuzzleOption[];
  correctIndex: number;
  wrongFeedback: string;
}

const PUZZLES: ChessPuzzle[] = catalog.puzzles;

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

export type BoardCell = string | null;

/** 8×8 grid: index 0 = rank 8 (top), index 7 = rank 1 (bottom). */
export function parseFenBoard(fen: string): BoardCell[][] {
  const placement = fen.trim().split(/\s+/)[0] ?? '';
  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    throw new Error(`Invalid FEN: expected 8 ranks, got ${ranks.length}`);
  }

  return ranks.map((rank) => {
    const row: BoardCell[] = [];
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        const empty = Number(char);
        for (let i = 0; i < empty; i += 1) row.push(null);
      } else {
        row.push(PIECE_SYMBOLS[char] ?? null);
      }
    }
    if (row.length !== 8) {
      throw new Error(`Invalid FEN rank "${rank}": expected 8 files`);
    }
    return row;
  });
}

export function pieceSymbol(fenChar: string): string | null {
  return PIECE_SYMBOLS[fenChar] ?? null;
}

export function pickRandomChessPuzzle(): ChessPuzzle {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)]!;
}

export function getChessPuzzleById(id: string): ChessPuzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function shuffleOptionOrder(count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

export function getChessPuzzleCount(): number {
  return PUZZLES.length;
}
