/**
 * Build offline Chess Gambit catalog from Lichess open data.
 *
 * Preferred: stream lichess_db_puzzle.csv (CC0)
 *   https://database.lichess.org/#puzzles
 *   zstd -d lichess_db_puzzle.csv.zst
 *
 * Dev bootstrap (no CSV): fetches mate-in-1 puzzles from the public API.
 *   Do not use bootstrap for bulk harvesting — use the CSV dump instead.
 *
 * Usage:
 *   node scripts/import-lichess-puzzles.mjs --csv /path/to/lichess_db_puzzle.csv --count 120
 *   node scripts/import-lichess-puzzles.mjs --bootstrap 100
 */

import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, '../client/package.json'));
const { Chess } = require('chess.js');

const OUT_PATH = join(__dirname, '../client/src/data/chessPuzzles.catalog.json');

/** Hand-tuned puzzles kept at the front of the catalog. */
const CURATED = [
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
    source: 'curated',
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
      "Black's king is trapped on the back rank — Rf8# is unstoppable.",
    source: 'curated',
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
    source: 'curated',
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
    source: 'curated',
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
    source: 'curated',
  },
];

const THEME_TITLES = {
  mateIn1: 'Checkmate Spot',
  backRankMate: 'Back Rank Crush',
  fork: 'Fork Attack',
  pin: 'Pin & Win',
  skewer: 'Skewer Strike',
  hangingPiece: 'Loose Piece',
  discoveredAttack: 'Discovery',
  doubleCheck: 'Double Check',
  sacrifice: 'Sacrifice',
  deflection: 'Deflection',
  attraction: 'Attraction',
  interference: 'Interference',
  xRayAttack: 'X-Ray',
};

function parseArgs(argv) {
  const args = { count: 120, csv: null, bootstrap: 0, minRating: 700, maxRating: 1500 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--csv' && argv[i + 1]) {
      args.csv = argv[++i];
    } else if (a === '--count' && argv[i + 1]) {
      args.count = Number(argv[++i]);
    } else if (a === '--bootstrap' && argv[i + 1]) {
      args.bootstrap = Number(argv[++i]);
    } else if (a === '--min-rating' && argv[i + 1]) {
      args.minRating = Number(argv[++i]);
    } else if (a === '--max-rating' && argv[i + 1]) {
      args.maxRating = Number(argv[++i]);
    }
  }
  return args;
}

function uciToMove(uci) {
  const move = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) move.promotion = uci[4];
  return move;
}

function sideLabel(turn) {
  return turn === 'w' ? 'White' : 'Black';
}

function titleFromThemes(themes) {
  for (const theme of themes) {
    if (THEME_TITLES[theme]) return THEME_TITLES[theme];
  }
  return 'Tactical Shot';
}

function wrongFeedbackForThemes(themes) {
  if (themes.includes('mateIn1')) {
    return 'That move is not checkmate — look for a forcing finish.';
  }
  return 'That move misses the tactic — find the most forcing continuation.';
}

function normalizeSan(san) {
  return san.replace(/[+#]/g, '');
}

function buildMcqFromPosition(chess, solutionSan, themes) {
  const solutionNorm = normalizeSan(solutionSan);
  const legal = chess.moves({ verbose: true });
  const correctVerbose = legal.find((m) => normalizeSan(m.san) === solutionNorm);
  if (!correctVerbose) return null;

  const correctSan = correctVerbose.san;
  const correctLabel = correctVerbose.san;

  const wrongCandidates = legal
    .filter((m) => normalizeSan(m.san) !== solutionNorm)
    .filter((m) => {
      if (!themes.includes('mateIn1')) return true;
      const trial = new Chess(chess.fen());
      const played = trial.move(m.san);
      return played && !trial.isCheckmate();
    });

  if (wrongCandidates.length < 3) return null;

  shuffleInPlace(wrongCandidates);
  const wrong = wrongCandidates.slice(0, 3);
  const options = [
    { label: correctLabel, san: correctSan },
    ...wrong.map((m) => ({ label: m.san, san: m.san })),
  ];
  shuffleInPlace(options);

  return {
    options,
    correctIndex: options.findIndex((o) => normalizeSan(o.san) === solutionNorm),
    wrongFeedback: wrongFeedbackForThemes(themes),
  };
}

function puzzleFromCsvRow(row, minRating, maxRating) {
  const themes = (row.Themes ?? '').split(/\s+/).filter(Boolean);
  if (!themes.includes('mateIn1')) return null;

  const rating = Number(row.Rating);
  const popularity = Number(row.Popularity);
  const nbPlays = Number(row.NbPlays);
  if (Number.isNaN(rating) || rating < minRating || rating > maxRating) return null;
  if (popularity < 55 || nbPlays < 50) return null;

  const uciMoves = (row.Moves ?? '').trim().split(/\s+/);
  if (uciMoves.length < 2) return null;

  const chess = new Chess(row.FEN);
  const setup = chess.move(uciToMove(uciMoves[0]));
  if (!setup) return null;

  const solutionUci = uciMoves[1];
  const played = chess.move(uciToMove(solutionUci));
  if (!played) return null;
  if (!chess.isCheckmate()) return null;

  chess.undo();
  const displayFen = chess.fen();
  const solutionSan = played.san;
  const prompt = `${sideLabel(chess.turn())} to move. Checkmate in one.`;

  const mcq = buildMcqFromPosition(chess, solutionSan, themes);
  if (!mcq || mcq.correctIndex < 0) return null;

  return {
    id: `lichess-${row.PuzzleId}`,
    title: titleFromThemes(themes),
    prompt,
    fen: displayFen,
    ...mcq,
    lichessId: row.PuzzleId,
    rating,
    themes,
    source: 'lichess-csv',
  };
}

function puzzleFromApiPayload(payload, minRating, maxRating) {
  const { puzzle, game } = payload;
  const themes = puzzle.themes ?? [];
  if (!themes.includes('mateIn1')) return null;

  const rating = puzzle.rating ?? 0;
  if (rating < minRating || rating > maxRating) return null;

  const solution = puzzle.solution ?? [];
  if (solution.length < 2) return null;

  const chess = new Chess();
  if (!chess.loadPgn(game.pgn, { sloppy: true })) return null;

  const targetPly = puzzle.initialPly ?? 0;
  while (chess.history().length > targetPly) {
    chess.undo();
  }

  const setup = chess.move(uciToMove(solution[0]));
  if (!setup) return null;

  const played = chess.move(uciToMove(solution[1]));
  if (!played) return null;
  if (!chess.isCheckmate()) return null;

  chess.undo();
  const displayFen = chess.fen();
  const solutionSan = played.san;
  const prompt = `${sideLabel(chess.turn())} to move. Checkmate in one.`;

  const mcq = buildMcqFromPosition(chess, solutionSan, themes);
  if (!mcq || mcq.correctIndex < 0) return null;

  return {
    id: `lichess-${puzzle.id}`,
    title: titleFromThemes(themes),
    prompt,
    fen: displayFen,
    ...mcq,
    lichessId: puzzle.id,
    rating,
    themes,
    source: 'lichess-api',
  };
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function fenKey(fen) {
  return fen.split(/\s+/).slice(0, 4).join(' ');
}

function stripForClient(puzzle) {
  const { lichessId, rating, themes, source, ...rest } = puzzle;
  return rest;
}

async function streamCsv(path, targetCount, minRating, maxRating, seen) {
  const out = [];
  const rl = createInterface({
    input: createReadStream(path, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo += 1;
    if (lineNo === 1) continue;
    if (out.length >= targetCount) break;
    if (!line.trim()) continue;

    const row = parseCsvLine(line);
    if (!row?.PuzzleId) continue;

    const puzzle = puzzleFromCsvRow(row, minRating, maxRating);
    if (!puzzle) continue;

    const key = fenKey(puzzle.fen);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push(puzzle);
    if (out.length % 25 === 0) {
      console.log(`  …${out.length} puzzles from CSV`);
    }
  }

  return out;
}

/** Minimal CSV parser for Lichess dump (quoted fields rare in puzzle rows). */
function parseCsvLine(line) {
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === ',' && !inQuotes) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur);

  if (parts.length < 8) return null;
  return {
    PuzzleId: parts[0],
    FEN: parts[1],
    Moves: parts[2],
    Rating: parts[3],
    RatingDeviation: parts[4],
    Popularity: parts[5],
    NbPlays: parts[6],
    Themes: parts[7],
    GameUrl: parts[8],
    OpeningTags: parts[9],
  };
}

async function bootstrapFromApi(targetCount, minRating, maxRating, seen) {
  const out = [];
  let attempts = 0;
  const maxAttempts = targetCount * 40;

  while (out.length < targetCount && attempts < maxAttempts) {
    attempts += 1;
    const res = await fetch(
      'https://lichess.org/api/puzzle/next?angle=mateIn1&difficulty=easiest'
    );
    if (!res.ok) {
      const backoff = res.status === 429 ? 2000 + attempts * 50 : 400;
      console.warn(`API ${res.status}, retrying in ${backoff}ms…`);
      await sleep(backoff);
      continue;
    }
    const payload = await res.json();
    const puzzle = puzzleFromApiPayload(payload, minRating, maxRating);
    if (!puzzle) continue;

    const key = fenKey(puzzle.fen);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push(puzzle);
    if (out.length % 10 === 0) {
      console.log(`  …${out.length} puzzles from API (${attempts} tries)`);
    }
    await sleep(120);
  }

  if (out.length < targetCount) {
    console.warn(`Only collected ${out.length}/${targetCount} from API.`);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs(process.argv);
  const seen = new Set(CURATED.map((p) => fenKey(p.fen)));
  let imported = [];

  if (args.csv) {
    console.log(`Reading ${args.csv} (mateIn1, rating ${args.minRating}–${args.maxRating})…`);
    imported = await streamCsv(args.csv, args.count, args.minRating, args.maxRating, seen);
  } else if (args.bootstrap > 0) {
    console.log(
      `Bootstrapping ${args.bootstrap} mate-in-1 puzzles from Lichess API (dev only)…`
    );
    imported = await bootstrapFromApi(
      args.bootstrap,
      args.minRating,
      args.maxRating,
      seen
    );
  } else {
    console.error(
      'Provide --csv path/to/lichess_db_puzzle.csv or --bootstrap N\n' +
        'See https://database.lichess.org/#puzzles'
    );
    process.exit(1);
  }

  const puzzles = [...CURATED.map(stripForClient), ...imported.map(stripForClient)];

  const catalog = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: puzzles.length,
      curated: CURATED.length,
      imported: imported.length,
      source:
        args.csv != null
          ? 'lichess_db_puzzle.csv (CC0)'
          : 'lichess.org/api/puzzle/next (dev bootstrap)',
      refresh:
        'node scripts/import-lichess-puzzles.mjs --csv /path/to/lichess_db_puzzle.csv --count 120',
    },
    puzzles,
  };

  writeFileSync(OUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${puzzles.length} puzzles → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
