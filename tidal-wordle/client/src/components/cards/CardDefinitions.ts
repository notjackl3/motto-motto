import type { Card, GameMode } from '../../types';

export const CARD_DEFINITIONS: Card[] = [
  {
    id: 'meme-cannon',
    name: 'Meme Cannon',
    type: 'attack',
    description: 'Drops a goofy meme image over the board with your last wrong guess as caption.',
    soloDescription:
      'Chaos draw — drops a goofy meme over your board with your last wrong guess as caption.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'brainrot-glitch',
    name: 'Brainrot Glitch',
    type: 'attack',
    description:
      "Distorts tile colors in a chaotic cycle so the target can't tell which letters were green or orange — lasts one guess.",
    soloDescription:
      "Chaos draw — your tile colors glitch and shift so you can't tell which letters were green or orange until your next guess.",
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'status-dog',
    name: 'Status Dog',
    type: 'attack',
    description: "A loyal pup covers one of the target's letter tiles for 10 seconds.",
    soloDescription:
      'Chaos draw — a loyal pup covers one of your letter tiles for 10 seconds.',
    targetSelf: false,
    duration: 'persistent',
  },
  {
    id: 'playful-insult',
    name: 'Playful Insult',
    type: 'attack',
    description: 'A playful jab pops up in front of the target.',
    soloDescription: 'Chaos draw — a playful jab pops up on your screen.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'forced-break',
    name: 'Forced Break',
    type: 'attack',
    description:
      'Delays color feedback on the target\'s next guess — green and yellow tiles stay neutral for answer-length seconds.',
    soloDescription:
      'Chaos draw — your next guess hides green/yellow colors for answer-length seconds (you can still guess on the normal cooldown).',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'bored-distraction',
    name: 'Bored Distraction',
    type: 'attack',
    description: 'A corner distraction popup with a random activity suggestion.',
    soloDescription:
      'Chaos draw — a corner distraction with a random activity suggestion.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'recipe-spam',
    name: 'Recipe Spam',
    type: 'attack',
    description: 'Overlays a food-blog style scrolling ingredient list.',
    soloDescription:
      'Chaos draw — overlays a food-blog style scrolling ingredient list on your board.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'rejection-letter',
    name: 'Rejection Letter',
    type: 'attack',
    description: 'A formal rejection email overlay for your guess.',
    soloDescription: 'Chaos draw — a formal rejection email for your latest guess.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'face-swap-glitch',
    name: 'Face Swap Glitch',
    type: 'attack',
    description:
      'Glitch face overlay on the target board for answer-length seconds (category-themed).',
    soloDescription:
      'Chaos draw — a glitchy cartoon face covers your board for answer-length seconds.',
    targetSelf: false,
    duration: 'persistent',
  },
  {
    id: 'letter-reveal',
    name: 'Letter Reveal',
    type: 'buff',
    description: 'Reveals one letter in the answer at its correct position.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'cosmic-reset',
    name: 'Cosmic Reset',
    type: 'buff',
    description: 'Removes your most recent wrong guess from the board.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'marine-hint',
    name: 'Marine Hint',
    type: 'buff',
    description: 'Tells you how many vowels are in the answer.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'tide-whisper',
    name: 'Tide Whisper',
    type: 'buff',
    description: 'Reveals the first or last letter of the answer.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'forecast',
    name: 'Forecast',
    type: 'buff',
    description: 'Reveals whether a random position is a vowel or consonant.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'related-current',
    name: 'Related Current',
    type: 'buff',
    description: 'Reveals a thematically related word to the answer.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'resume-polish',
    name: 'Resume Polish',
    type: 'buff',
    description: 'Suggests an optimal next guess based on your current guesses.',
    targetSelf: true,
    duration: 'instant',
  },
  {
    id: 'chess-gambit',
    name: 'Chess Gambit',
    type: 'wildcard',
    description: 'Both players must solve a mini chess puzzle before continuing.',
    soloDescription: 'Solve a mini chess puzzle before you can continue.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'dice-roll',
    name: 'Dice Roll',
    type: 'wildcard',
    description:
      'Discards this draw and instantly plays a random card from the deck instead (one reroll).',
    soloDescription:
      'Discards this draw and instantly plays a random card from the deck instead (one reroll).',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'beach-playlist',
    name: 'Beach Playlist',
    type: 'wildcard',
    description: 'Swaps the beach playlist for 30 seconds.',
    targetSelf: false,
    duration: 'instant',
  },
  {
    id: 'critics-rating',
    name: "Critic's Rating",
    type: 'wildcard',
    description: 'Rates guess efficiency at round end; winner gets a bonus.',
    soloDescription:
      'Rates your guess efficiency at round end; 4+ stars earns a +25 bonus.',
    targetSelf: false,
    duration: 'instant',
  },
];

export const CARD_IDS = CARD_DEFINITIONS.map((c) => c.id) as [
  string,
  ...string[],
];

export function getCardById(id: string): Card | undefined {
  return CARD_DEFINITIONS.find((c) => c.id === id);
}

export function getCardDescription(
  card: Card,
  mode: GameMode | null
): string {
  if (mode === 'solo' && card.soloDescription) return card.soloDescription;
  return card.description;
}
