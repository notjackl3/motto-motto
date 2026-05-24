import { parseFenBoard } from '../../lib/chessPuzzles';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

interface ChessBoardProps {
  fen: string;
  size?: 'sm' | 'md';
}

export default function ChessBoard({ fen, size = 'md' }: ChessBoardProps) {
  const board = parseFenBoard(fen);
  const cellSize = size === 'sm' ? 'w-7 h-7 text-xl' : 'w-9 h-9 sm:w-10 sm:h-10 text-2xl';

  return (
    <div className="inline-block rounded-lg overflow-hidden border-2 border-amber-900/40 shadow-inner">
      {board.map((rank, rankIdx) => (
        <div key={rankIdx} className="flex">
          {rank.map((piece, fileIdx) => {
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            return (
              <div
                key={`${rankIdx}-${fileIdx}`}
                aria-hidden
                className={`${cellSize} flex items-center justify-center select-none ${
                  isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]'
                }`}
              >
                <span
                  className={`leading-none ${
                    piece && '♔♕♖♗♘♙'.includes(piece)
                      ? 'text-slate-900 drop-shadow-sm'
                      : piece
                        ? 'text-slate-100 drop-shadow-md'
                        : ''
                  }`}
                >
                  {piece ?? ''}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex border-t border-amber-900/30 bg-[#eeeed2]">
        {FILES.map((file) => (
          <div
            key={file}
            className={`${cellSize} flex items-center justify-center text-[10px] font-semibold text-amber-900/70`}
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}
