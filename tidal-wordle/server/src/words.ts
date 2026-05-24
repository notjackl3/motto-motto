// Server-side word list. Kept separate from the client's beachWords.json so
// the answer is server-authoritative. Keep this in sync manually for now —
// later phases may share a single source.

const FIVE_LETTER_BEACH_WORDS = [
  'shell',
  'coral',
  'shore',
  'beach',
  'shark',
  'ocean',
] as const;

export function pickAnswer(): string {
  const i = Math.floor(Math.random() * FIVE_LETTER_BEACH_WORDS.length);
  return FIVE_LETTER_BEACH_WORDS[i];
}
