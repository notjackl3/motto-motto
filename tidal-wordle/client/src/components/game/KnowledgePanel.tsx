import { useMemo } from 'react';
import { selectPlayerKnowledge } from '../../lib/playerKnowledge';
import { useGameStore } from '../../stores/gameStore';

export default function KnowledgePanel() {
  const answerLength = useGameStore((s) => s.answerLength);
  const revealedLetters = useGameStore((s) => s.revealedLetters);
  const myGuesses = useGameStore((s) => s.myGuesses);
  const hints = useGameStore((s) => s.hints);
  const mode = useGameStore((s) => s.mode);

  const knowledge = useMemo(
    () =>
      selectPlayerKnowledge({
        answerLength,
        revealedLetters,
        myGuesses,
        hints,
      }),
    [answerLength, revealedLetters, myGuesses, hints]
  );

  return (
    <div className="bg-black/40 rounded-lg p-3 border border-white/10 flex flex-col gap-2 h-full min-h-0 overflow-hidden">
      <div className="text-xs uppercase tracking-widest opacity-70 shrink-0">
        Intel
      </div>

      {!knowledge.hasContent ? (
        <p className="text-sm opacity-60 italic">
          Hints and revealed letters appear here as you play.
        </p>
      ) : (
        <div className="flex flex-col gap-2 min-h-0 overflow-y-auto text-sm">
          {knowledge.answerLength !== null && (
            <p className="text-seafoam/90">
              Answer length:{' '}
              <span className="font-semibold text-white">
                {knowledge.answerLength} letters
              </span>
            </p>
          )}

          {knowledge.patternDisplay && (
            <div>
              <p className="text-[10px] uppercase opacity-60 mb-1">Pattern</p>
              <p className="font-mono text-emerald-200 tracking-wide break-all">
                {knowledge.patternDisplay}
              </p>
              {knowledge.answerLength === null && (
                <p className="text-xs opacity-50 mt-1">
                  Full length still unknown
                </p>
              )}
            </div>
          )}

          {knowledge.hints.length > 0 && (
            <div>
              <p className="text-[10px] uppercase opacity-60 mb-1">Hints</p>
              <ul className="flex flex-col gap-1.5">
                {knowledge.hints.map((h) => (
                  <li
                    key={h.id}
                    className="bg-emerald-900/50 border border-emerald-500/40 rounded px-2 py-1.5 text-xs leading-snug"
                  >
                    {h.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {mode === 'solo' && (
        <p className="text-[10px] opacity-40 shrink-0 pt-1 border-t border-white/5">
          Solo — attack cards hit your board
        </p>
      )}
    </div>
  );
}
