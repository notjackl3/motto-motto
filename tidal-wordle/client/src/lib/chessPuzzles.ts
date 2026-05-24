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

const PUZZLES: ChessPuzzle[] = [
  {
    id: 'scholars-mate-f7',
    title: "Scholar's Trap",
    prompt: 'White to move. Checkmate in one.',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    options: [
      { label: 'Qh5', san: 'Qh5' },
      { label: 'Qxf7#', san: 'Qxf7' },
      { label: 'Nf3', san: 'Nf3' },
      { label: 'Bxf7+', san: 'Bxf7' },
    ],
    correctIndex: 1,
    wrongFeedback:
      'The f7 pawn is the only shield — Qxf7# ends the game instantly.',
  },
  {
    id: 'back-rank-mate',
    title: 'Back Rank Crush',
    prompt: 'White to move. Checkmate in one.',
    fen: '6k1/5ppp/8/8/8/5R2/5PPP/6K1 w - - 0 1',
    options: [
      { label: 'Rf8#', san: 'Rf8' },
      { label: 'Rg3', san: 'Rg3' },
      { label: 'Kf1', san: 'Kf1' },
      { label: 'h4', san: 'h4' },
    ],
    correctIndex: 0,
    wrongFeedback:
      'Black’s king is trapped on the back rank — Rf8# is unstoppable.',
  },
  {
    id: 'rook-x-ray',
    title: 'Rook Squeeze',
    prompt: 'White to move. Win the rook in one.',
    fen: '4r2k/8/8/8/8/8/8/4R2K w - - 0 1',
    options: [
      { label: 'Rxe8+', san: 'Rxe8' },
      { label: 'Re2', san: 'Re2' },
      { label: 'Kf1', san: 'Kf1' },
      { label: 'Rh1', san: 'Rh1' },
    ],
    correctIndex: 0,
    wrongFeedback:
      'The rooks are aligned on the e-file — Rxe8+ wins the exchange.',
  },
  {
    id: 'knight-fork',
    title: 'Knight Fork',
    prompt: 'White to move. Win the queen in one.',
    fen: '4k2q/8/8/4N3/8/8/8/4K3 w - - 0 1',
    options: [
      { label: 'Ng6', san: 'Ng6' },
      { label: 'Nf7', san: 'Nf7' },
      { label: 'Nc6', san: 'Nc6' },
      { label: 'Ke2', san: 'Ke2' },
    ],
    correctIndex: 1,
    wrongFeedback:
      'Nf7 forks the king on e8 and queen on h8 — pick up the queen next move.',
  },
  {
    id: 'discovered-attack',
    title: 'Battery Blast',
    prompt: 'White to move. Win material in one.',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 5 4',
    options: [
      { label: 'Qxf7+', san: 'Qxf7' },
      { label: 'Qh4', san: 'Qh4' },
      { label: 'Qd5', san: 'Qd5' },
      { label: 'Qg5', san: 'Qg5' },
    ],
    correctIndex: 0,
    wrongFeedback:
      'Qxf7+ wins the pawn with check — Black must respond while you stay ahead.',
  },
];

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
