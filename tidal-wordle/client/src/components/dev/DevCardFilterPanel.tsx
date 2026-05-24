import { useEffect, useState } from 'react';
import {
  ALL_TYPES,
  devCardPoolSummary,
  useDevCardFilterStore,
} from '../../stores/devCardFilterStore';
import { CARD_DEFINITIONS } from '../cards/CardDefinitions';
import { useGameStore } from '../../stores/gameStore';
import type { CardType } from '../../types';

const TYPE_LABELS: Record<CardType, string> = {
  attack: 'Attack (chaos)',
  buff: 'Buff',
  wildcard: 'Wildcard',
};

const PANEL_UI_KEY = 'tidal-dev-card-panel-ui';

function readPanelUi(): { expanded: boolean; collapsed: boolean } {
  try {
    const raw = localStorage.getItem(PANEL_UI_KEY);
    if (!raw) return { expanded: false, collapsed: false };
    const parsed = JSON.parse(raw) as { expanded?: boolean; collapsed?: boolean };
    return {
      expanded: parsed.expanded ?? false,
      collapsed: parsed.collapsed ?? false,
    };
  } catch {
    return { expanded: false, collapsed: false };
  }
}

const TYPE_QUICK: { label: string; types: Record<CardType, boolean> }[] = [
  {
    label: 'All',
    types: { attack: true, buff: true, wildcard: true },
  },
  {
    label: 'Attacks only',
    types: { attack: true, buff: false, wildcard: false },
  },
  {
    label: 'Buffs only',
    types: { attack: false, buff: true, wildcard: false },
  },
  {
    label: 'Wildcards only',
    types: { attack: false, buff: false, wildcard: true },
  },
];

export default function DevCardFilterPanel() {
  const types = useDevCardFilterStore((s) => s.types);
  const cards = useDevCardFilterStore((s) => s.cards);
  const toggleType = useDevCardFilterStore((s) => s.toggleType);
  const setType = useDevCardFilterStore((s) => s.setType);
  const toggleCard = useDevCardFilterStore((s) => s.toggleCard);
  const reset = useDevCardFilterStore((s) => s.reset);
  const [expanded, setExpanded] = useState(() => readPanelUi().expanded);
  const [collapsed, setCollapsed] = useState(() => readPanelUi().collapsed);

  useEffect(() => {
    localStorage.setItem(PANEL_UI_KEY, JSON.stringify({ expanded, collapsed }));
  }, [expanded, collapsed]);

  const answer = useGameStore((s) => s.answer);
  const { poolSize, byType } = devCardPoolSummary();

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-auto bg-amber-500/90 text-black text-[10px] font-bold uppercase tracking-wide px-1 py-3 rounded-r-md shadow-lg [writing-mode:vertical-rl]"
        title="Open dev card filter"
      >
        Dev cards
      </button>
    );
  }

  return (
    <aside
      className="fixed left-0 top-16 bottom-24 z-30 w-52 pointer-events-auto flex flex-col bg-black/85 border border-amber-500/40 rounded-r-lg shadow-xl text-white text-xs overflow-hidden"
      aria-label="Developer card draw filter"
    >
      <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-amber-500/20 border-b border-amber-500/30 shrink-0">
        <span className="font-bold text-amber-200 uppercase tracking-wide text-[10px]">
          Dev · card pool
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-amber-200/80 hover:text-white px-1"
          aria-label="Collapse dev panel"
        >
          ×
        </button>
      </div>

      <div className="px-2 py-2 flex flex-col gap-2 min-h-0 overflow-y-auto">
        <p className="text-[10px] opacity-60 leading-snug">
          Filters which cards can be drawn after a guess. Dev build only.
        </p>

        <p className="text-[10px] text-amber-200/90">
          Answer:{' '}
          <span className="font-semibold text-white font-mono tracking-wide">
            {answer ?? '—'}
          </span>
        </p>

        <p className="text-[10px] text-amber-200/90">
          Pool: <span className="font-semibold text-white">{poolSize}</span>
          <span className="opacity-70">
            {' '}
            (atk {byType.attack} · buff {byType.buff} · wild {byType.wildcard})
          </span>
        </p>

        <div className="flex flex-wrap gap-1">
          {TYPE_QUICK.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                for (const t of ALL_TYPES) setType(t, preset.types[t]);
              }}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px]"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <fieldset className="flex flex-col gap-1 border-0 p-0">
          <legend className="text-[10px] uppercase opacity-50 mb-0.5">
            By type
          </legend>
          {ALL_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5"
            >
              <input
                type="checkbox"
                checked={types[type]}
                onChange={() => toggleType(type)}
                className="rounded border-white/30"
              />
              <span>{TYPE_LABELS[type]}</span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-left text-[10px] text-amber-200/80 underline"
        >
          {expanded ? 'Hide' : 'Show'} individual cards
        </button>

        {expanded && (
          <fieldset className="flex flex-col gap-0.5 border-0 p-0 max-h-48 overflow-y-auto">
            {CARD_DEFINITIONS.map((card) => (
              <label
                key={card.id}
                className="flex items-start gap-1.5 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5"
              >
                <input
                  type="checkbox"
                  checked={cards[card.id] ?? true}
                  onChange={() => toggleCard(card.id)}
                  disabled={!types[card.type]}
                  className="rounded border-white/30 mt-0.5 shrink-0"
                />
                <span
                  className={`leading-tight ${!types[card.type] ? 'opacity-40' : ''}`}
                >
                  {card.name}
                  <span className="opacity-50"> · {card.type.slice(0, 3)}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-1 text-[10px] opacity-60 hover:opacity-100 underline text-left"
        >
          Reset filters
        </button>
      </div>
    </aside>
  );
}
