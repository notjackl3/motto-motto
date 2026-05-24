// Tiny client wrappers for the server's hint endpoints. The server owns
// the OpenAI key + prompt; we just send the current answer word.
//
// - fetchHint:  one-shot, returns a single string. Fallback path.
// - fetchHints: batch, called once at round start so per-box pickups can
//   pop from a local cache instead of round-tripping each hit.

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export async function fetchHint(word: string): Promise<string> {
  const url = `${SERVER_URL}/api/hint?word=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Hint endpoint returned ${res.status}`);
  }
  const json = (await res.json()) as { hint?: string; error?: string };
  if (json.error) throw new Error(json.error);
  if (!json.hint) throw new Error('Empty hint');
  return json.hint;
}

export async function fetchHints(
  word: string,
  count: number = 4,
): Promise<string[]> {
  const url = `${SERVER_URL}/api/hints?word=${encodeURIComponent(word)}&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Hints endpoint returned ${res.status}`);
  }
  const json = (await res.json()) as { hints?: string[]; error?: string };
  if (json.error) throw new Error(json.error);
  if (!json.hints || json.hints.length === 0) throw new Error('Empty hints');
  return json.hints;
}
