import { CARD_DEFINITIONS, getCardById } from '../components/cards/CardDefinitions';
import type { ActiveEffect, Card, EffectTarget, Hint } from '../types';
import { useGameStore } from '../stores/gameStore';
import { isGuessCorrect } from './guessEvaluator';
import { criticsRatingBonus } from './scoring';

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export const RELATED_HINTS: Record<string, string> = {
  SAND: 'dune',
  SURF: 'wave',
  WAVE: 'swell',
  TIDE: 'ebb',
  SHELL: 'clam',
  CRAB: 'lobster',
  REEF: 'coral',
  CORAL: 'reef',
  SHORE: 'coast',
  DUNE: 'sand',
  BEACH: 'shore',
  SALT: 'brine',
  KELP: 'seaweed',
  BUOY: 'marker',
  BOAT: 'sail',
  SHARK: 'fish',
  SAIL: 'wind',
  SWIM: 'float',
  FOAM: 'surf',
  PALM: 'tropical',
  OCEAN: 'sea',
  PIER: 'dock',
  ROCK: 'stone',
  FISH: 'swim',
  SUN: 'warmth',
  TOWEL: 'dry',
  WETSUIT: 'dive',
  LIFEGUARD: 'rescue',
  BAY: 'inlet',
  COAST: 'shore',
  GULF: 'bay',
  COVE: 'inlet',
  DOCK: 'pier',
  LAGOON: 'bay',
  WHALE: 'mammal',
  DOLPHIN: 'porpoise',
  SEAL: 'pup',
  GULL: 'bird',
  SWELL: 'wave',
  CURRENT: 'flow',
  ISLAND: 'atoll',
  DRIFTWOOD: 'wreck',
  SEAWEED: 'kelp',
  SUNSET: 'dusk',
  HORIZON: 'skyline',
  TROPICAL: 'warm',
  VOYAGE: 'sail',
  MARINA: 'harbor',
  HARBOR: 'port',
  LIGHTHOUSE: 'beacon',
  SNORKEL: 'dive',
  KAYAK: 'paddle',
  YACHT: 'boat',
  UMBRELLA: 'shade',
  HAMMOCK: 'rest',
};

const PLAYFUL_INSULTS = [
  'Your guesses are weak sauce.',
  'Did you even read the rules?',
  'The tide waits for no one — neither should you.',
  'That guess had all the confidence of a deflated beach ball.',
  'Were you typing with sunscreen on your hands?',
  'Even the seagulls are judging you.',
  'Bold strategy. Lets see if it pays off.',
  'Your word sense is drier than low tide.',
  'The ocean called — it wants its vowels back.',
  'Nice try. The beach sends its regards.',
];

const BORED_SUGGESTIONS = [
  'Why not learn origami?',
  'Touch grass? (Or sand?)',
  'Count the waves for a minute.',
  'Hydrate — the sun is relentless.',
  'Sketch a crab in the margin.',
  'Practice your shaka hand sign.',
];

const RECIPE_INGREDIENTS = [
  '2 cups all-purpose flour',
  '1 tsp sea salt (harvested at dawn)',
  '3 tbsp melted coconut oil',
  '1/2 cup granulated sugar',
  '2 large eggs, room temperature',
  '1 tsp vanilla extract',
  '1 cup whole milk',
  '2 tsp baking powder',
  'Zest of one lime',
  '1/4 cup toasted coconut flakes',
  'Pinch of sand — just kidding',
  '1 tbsp honey from local bees',
  'Fresh berries for garnish',
  'Powdered sugar for dusting',
  'Whipped cream (optional)',
  'Edible flowers (Instagram optional)',
  '1 stick unsalted butter',
  '1/2 tsp cinnamon',
  '1/4 tsp nutmeg',
  'Dark chocolate chips',
  'Chopped macadamia nuts',
  'Lemon juice',
  'Orange blossom water',
  'Almond extract',
  'Graham cracker crumbs',
  'Sweetened condensed milk',
  'Evaporated milk',
  'Cream cheese frosting',
  'Caramel drizzle',
  'Sea salt caramel',
];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addHint(text: string): void {
  const hint: Hint = { id: uid(), text, createdAt: Date.now() };
  useGameStore.setState((s) => ({ hints: [...s.hints, hint] }));
}

function addOverlay(
  type: string,
  message?: string,
  expiresAt?: number,
  dismissable = true
): void {
  useGameStore.setState((s) => ({
    overlays: [
      ...s.overlays,
      { id: uid(), type, message, expiresAt, dismissable },
    ],
  }));
}

function addActiveEffect(
  cardId: string,
  target: EffectTarget,
  expiresAt?: number,
  payload?: Record<string, unknown>
): void {
  const effect: ActiveEffect = {
    id: uid(),
    cardId,
    target,
    expiresAt,
    payload,
  };
  useGameStore.setState((s) => ({
    activeEffects: [...s.activeEffects, effect],
  }));
}

export function drawCard(): Card {
  const state = useGameStore.getState();
  let pool = [...CARD_DEFINITIONS];

  if (state.pendingDiceRandomize) {
    pool = pool.sort(() => Math.random() - 0.5);
    useGameStore.setState({ pendingDiceRandomize: false });
  }

  const card = pool[Math.floor(Math.random() * pool.length)];
  return card;
}

export function getCardTarget(mode: 'solo' | 'multiplayer' | null, card: Card): EffectTarget {
  if (card.type === 'buff' || card.targetSelf) return 'self';
  return mode === 'solo' ? 'self' : 'opponent';
}

export function applyEffect(cardId: string, target: EffectTarget): void {
  const state = useGameStore.getState();
  const card = getCardById(cardId);
  if (!card) return;

  const answer = state.answer?.toUpperCase() ?? '';
  const now = Date.now();

  switch (cardId) {
    case 'meme-cannon': {
      const lastWrong = [...state.myGuesses]
        .reverse()
        .find((g) => !isGuessCorrect(g.results));
      const caption = lastWrong?.word ?? 'NO CAPTION';
      addOverlay('meme-cannon', caption, now + 3000, false);
      break;
    }
    case 'brainrot-glitch':
      useGameStore.setState({
        glitchActive: target,
        glitchUntilNextGuess: true,
      });
      break;
    case 'status-dog': {
      const guesses = target === 'self' ? state.myGuesses : state.opponentGuesses;
      const revealed: { row: number; col: number }[] = [];
      guesses.forEach((g, row) => {
        g.results.forEach((r, col) => {
          if (r.state === 'correct' || r.state === 'present') {
            revealed.push({ row, col });
          }
        });
      });
      if (revealed.length > 0) {
        const pick = revealed[Math.floor(Math.random() * revealed.length)];
        addActiveEffect('status-dog', target, now + 10000, pick);
      }
      break;
    }
    case 'playful-insult': {
      const insult =
        PLAYFUL_INSULTS[Math.floor(Math.random() * PLAYFUL_INSULTS.length)];
      addOverlay('playful-insult', insult, now + 2000, false);
      break;
    }
    case 'forced-break':
      useGameStore.setState({
        inputLocked: true,
        cooldownFrozen: true,
        forcedBreakActive: true,
      });
      addOverlay('forced-break', 'Time for a mandatory beach break.', undefined, true);
      break;
    case 'bored-distraction': {
      const suggestion =
        BORED_SUGGESTIONS[Math.floor(Math.random() * BORED_SUGGESTIONS.length)];
      addOverlay('bored-distraction', suggestion, now + 5000, true);
      break;
    }
    case 'recipe-spam':
      addOverlay(
        'recipe-spam',
        RECIPE_INGREDIENTS.join('\n'),
        undefined,
        true
      );
      break;
    case 'rejection-letter':
      addOverlay(
        'rejection-letter',
        'We regret to inform you that your guess does not align with our needs at this time. We encourage you to apply yourself to other shores.',
        undefined,
        true
      );
      break;
    case 'face-swap-glitch':
      useGameStore.setState({ faceSwap: true });
      setTimeout(() => useGameStore.setState({ faceSwap: false }), 5000);
      break;
    case 'letter-reveal': {
      if (!answer) break;
      const revealed = new Set(Object.keys(state.revealedLetters).map(Number));
      const unrevealed: number[] = [];
      for (let i = 0; i < answer.length; i++) {
        if (!revealed.has(i)) unrevealed.push(i);
      }
      if (unrevealed.length > 0) {
        const pos = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        useGameStore.setState({
          revealedLetters: {
            ...state.revealedLetters,
            [pos]: answer[pos],
          },
        });
      }
      break;
    }
    case 'cosmic-reset': {
      const guesses = [...state.myGuesses];
      if (guesses.length > 0) {
        const last = guesses[guesses.length - 1];
        if (!isGuessCorrect(last.results)) {
          guesses.pop();
          useGameStore.setState({ myGuesses: guesses });
        }
      }
      break;
    }
    case 'marine-hint': {
      if (!answer) break;
      const count = [...answer].filter((c) => VOWELS.has(c)).length;
      addHint(`The answer has ${count} vowel${count === 1 ? '' : 's'}.`);
      break;
    }
    case 'tide-whisper': {
      if (!answer) break;
      const revealFirst = Math.random() < 0.5;
      const letter = revealFirst ? answer[0] : answer[answer.length - 1];
      const pos = revealFirst ? 'first' : 'last';
      addHint(`The ${pos} letter is ${letter}.`);
      break;
    }
    case 'forecast': {
      if (!answer) break;
      const pos = Math.floor(Math.random() * answer.length);
      const isVowel = VOWELS.has(answer[pos]);
      addHint(
        `Position ${pos + 1} is a ${isVowel ? 'vowel' : 'consonant'}.`
      );
      break;
    }
    case 'related-current': {
      if (!answer) break;
      const related = RELATED_HINTS[answer] ?? 'no related word found';
      addHint(`Related word: ${related}`);
      break;
    }
    case 'resume-polish': {
      if (!answer) break;
      const len = answer.length;
      const pattern: string[] = Array(len).fill('_');
      for (const g of state.myGuesses) {
        g.results.forEach((r, i) => {
          if (r.state === 'correct' && i < len) pattern[i] = r.letter;
        });
      }
      for (const [pos, letter] of Object.entries(state.revealedLetters)) {
        pattern[Number(pos)] = letter;
      }
      const known = pattern.filter((c) => c !== '_').join(', ');
      addHint(
        known
          ? `Try a word with these letters: ${pattern.join(', ')}`
          : 'Keep exploring — no pattern yet.'
      );
      break;
    }
    case 'chess-gambit':
      useGameStore.setState({
        inputLocked: true,
        chessPuzzleActive: true,
      });
      addOverlay('chess-gambit', undefined, undefined, true);
      break;
    case 'dice-roll': {
      if (Math.random() < 0.5) {
        useGameStore.setState({ pendingDiceRandomize: true });
        addHint('Dice Roll: next draw will be randomized!');
      } else {
        useGameStore.setState({ pendingCardSwap: true });
        addHint('Dice Roll: next cards will be swapped!');
      }
      break;
    }
    case 'beach-playlist':
      useGameStore.setState({ musicSwapActive: true });
      setTimeout(
        () => useGameStore.setState({ musicSwapActive: false }),
        30000
      );
      break;
    case 'critics-rating':
      useGameStore.setState({ criticsRatingPending: true });
      break;
    default:
      break;
  }
}

export function dismissOverlay(overlayId: string): void {
  const state = useGameStore.getState();
  const overlay = state.overlays.find((o) => o.id === overlayId);
  useGameStore.setState({
    overlays: state.overlays.filter((o) => o.id !== overlayId),
  });
  if (overlay?.type === 'forced-break') {
    useGameStore.setState({
      inputLocked: false,
      cooldownFrozen: false,
      forcedBreakActive: false,
    });
  }
}

export function solveChessPuzzle(correct: boolean): void {
  if (correct) {
    useGameStore.setState({
      inputLocked: false,
      chessPuzzleActive: false,
      overlays: useGameStore
        .getState()
        .overlays.filter((o) => o.type !== 'chess-gambit'),
    });
  } else {
    useGameStore.setState({ chessLockUntil: Date.now() + 5000 });
    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.chessLockUntil && Date.now() >= s.chessLockUntil) {
        useGameStore.setState({
          inputLocked: false,
          chessPuzzleActive: false,
          chessLockUntil: null,
          overlays: s.overlays.filter((o) => o.type !== 'chess-gambit'),
        });
      }
    }, 5000);
  }
}

export function applyCriticsRatingIfPending(): void {
  const state = useGameStore.getState();
  if (!state.criticsRatingPending) return;
  const bonus = criticsRatingBonus(state.myGuesses, state.opponentGuesses);
  useGameStore.setState({
    roundScore: {
      me: state.roundScore.me + bonus.me,
      opponent: state.roundScore.opponent + bonus.opponent,
    },
    criticsRatingPending: false,
    lastCriticsRatings: { me: bonus.myStars, opponent: bonus.oppStars },
  });
}

export function fireCardAfterGuess(): void {
  const state = useGameStore.getState();
  const card = drawCard();
  const target = getCardTarget(state.mode, card);
  const history = [card, ...state.cardDrawHistory].slice(0, 5);
  useGameStore.setState({ cardDrawHistory: history });
  applyEffect(card.id, target);
}

export function applyCardFromSocket(cardId: string, target: EffectTarget): void {
  applyEffect(cardId, target);
}

// Dev helper
if (import.meta.env.DEV) {
  (window as unknown as { __testCard: (id: string) => void }).__testCard = (
    cardId: string
  ) => {
    const card = getCardById(cardId);
    if (!card) {
      console.error('Unknown card:', cardId);
      return;
    }
    const state = useGameStore.getState();
    const target = getCardTarget(state.mode, card);
    applyEffect(cardId, target);
  };
}
