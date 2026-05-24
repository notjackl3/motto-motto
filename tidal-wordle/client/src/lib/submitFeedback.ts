import type { SubmitGuessResult } from '../types';

export function getSubmitFeedbackMessage(
  result: SubmitGuessResult,
  onCooldown: boolean
): string | null {
  if (result.ok) return null;
  switch (result.reason) {
    case 'length':
      return 'Enter at least 2 letters, or a valid probe word (see hint).';
    case 'not_in_list':
      return 'Invalid guess.';
    case 'locked':
      return onCooldown ? 'Cooldown — wait a moment.' : 'Input locked (card effect).';
    case 'round_over':
      return 'Round is over.';
    case 'no_answer':
      return 'No active round.';
    default:
      return 'Cannot submit guess.';
  }
}
