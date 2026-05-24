import { submitRejectionProbeWord } from '../../lib/cardEffects';
import { getProbeWordOptions } from '../../lib/cardContent/probeWords';
import { useGameStore } from '../../stores/gameStore';

interface RejectionLetterOverlayProps {
  overlayId: string;
  message: string;
  letterhead?: string;
  letterheadImageUrl?: string;
  paperTextureUrl?: string;
}

export default function RejectionLetterOverlay({
  overlayId,
  message,
  letterhead = 'HR — Beach Wordle Division',
  letterheadImageUrl,
  paperTextureUrl,
}: RejectionLetterOverlayProps) {
  const answerLength = useGameStore((s) => s.answer?.length ?? 5);
  const options = getProbeWordOptions(answerLength);

  function handlePick(word: string) {
    submitRejectionProbeWord(overlayId, word);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 pointer-events-auto p-4">
      <div className="rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-sand/30">
        <div className="bg-deep text-white px-5 py-3 flex items-center gap-3">
          {letterheadImageUrl ? (
            <img
              src={letterheadImageUrl}
              alt=""
              className="h-10 w-10 object-contain rounded bg-white/10 p-1 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl shrink-0" aria-hidden>
              ✉️
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-seafoam/80">
              Rejection Letter
            </p>
            <h3 className="font-bold text-base leading-tight truncate">
              {letterhead}
            </h3>
          </div>
        </div>

        <div
          className="font-serif text-gray-800"
          style={
            paperTextureUrl
              ? {
                  backgroundImage: `url(${paperTextureUrl})`,
                  backgroundSize: 'cover',
                }
              : { background: '#faf8f5' }
          }
        >
          <div className="p-5 space-y-4">
            <p className="text-sm leading-relaxed border-l-2 border-red-300/60 pl-3">
              {message}
            </p>
            <p className="text-xs text-gray-600 italic">
              As consolation, you may submit one probe word — it reveals letter
              feedback without counting as a guess.
            </p>
          </div>

          <ProbeWordPicker options={options} onPick={handlePick} />
        </div>
      </div>
    </div>
  );
}

function ProbeWordPicker({
  options,
  onPick,
}: {
  options: string[];
  onPick: (word: string) => void;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-t border-sand/40 px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-deep/60 mb-3 text-center font-sans">
        Choose your probe word
      </p>
      <div className="grid grid-cols-3 gap-2 font-sans">
        {options.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => onPick(word)}
            className="bg-seafoam/20 hover:bg-seafoam/40 border border-seafoam/50 text-deep px-2 py-2.5 rounded-lg text-sm font-bold tracking-wide transition uppercase"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
