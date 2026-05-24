/** Bonus probe words for rejection-letter (length buckets). */
export function getProbeWordOptions(answerLength: number): string[] {
  if (answerLength <= 5) return ['DENY', 'NOPE', 'PASS'];
  if (answerLength <= 7) return ['REJECT', 'REGRET', 'SORRY'];
  return ['REJECTION', 'DECLINED', 'UNLIKELY'];
}

export function isValidProbeWord(word: string, answerLength: number): boolean {
  const upper = word.toUpperCase().trim();
  return getProbeWordOptions(answerLength).includes(upper);
}
