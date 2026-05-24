// Thin OpenAI hint generator.
//
// One function: ask gpt-4o-mini for a short, oblique hint about a target
// word. We keep the prompt strict so the model can't reveal the word
// directly or trivially. Hints get cached in-memory by word so repeated
// box pickups for the same answer don't burn API tokens.
//
// If OPENAI_API_KEY is not set, the function returns a deterministic
// fallback hint built from the word's shape — letter count, vowel count,
// and first/last letters — so the mystery-box flow works for local dev
// without an account.

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: { message: string };
}

const cache = new Map<string, string[]>(); // word → list of generated hints
const MAX_CACHE_HINTS = 4;

function fallbackHint(word: string): string {
  const w = word.toLowerCase();
  const vowels = (w.match(/[aeiou]/g) ?? []).length;
  const first = w[0]?.toUpperCase() ?? '?';
  const last = w[w.length - 1] ?? '?';
  const patterns = [
    `${w.length} letters, starts with "${first}", ends with "${last}".`,
    `Contains ${vowels} vowel${vowels === 1 ? '' : 's'}.`,
    `Think beach. Think coastline.`,
    `Try a word that begins with "${first}".`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

export async function generateHintBatch(
  word: string,
  count: number,
): Promise<string[]> {
  // Pre-fills the per-word cache with `count` varied hints in a single
  // OpenAI call. Round-start hook on the client uses this so box pickups
  // can pop instantly from a local list — no per-hit network round-trip.
  const key = word.toLowerCase().trim();
  const n = Math.max(1, Math.min(8, Math.floor(count)));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const hints = new Array(n).fill(0).map(() => fallbackHint(word));
    cache.set(key, hints);
    return hints;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 40 * n + 40,
        temperature: 0.95,
        messages: [
          {
            role: 'system',
            content:
              'You write short Wordle hints. Output exactly the requested number of hints as a JSON array of strings, no commentary. Each hint: one sentence under 12 words, NEVER includes the answer word, its plural, or a direct synonym. Hints should be varied — vibe, meaning, where it fits in a beach/ocean/coastal theme, sensory detail.',
          },
          {
            role: 'user',
            content: `Word: ${word}. Return ${n} different hints as a JSON array.`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as OpenAIResponse;
    if (json.error) throw new Error(`OpenAI error: ${json.error.message}`);
    const raw = json.choices?.[0]?.message?.content?.trim() ?? '';
    // Accept either {"hints": [...]} or a bare array.
    const parsed = JSON.parse(raw) as unknown;
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { hints?: unknown }).hints)
        ? (parsed as { hints: unknown[] }).hints
        : null;
    if (!arr || arr.length === 0) throw new Error('No hints in OpenAI response');
    const hints = arr
      .map((s) => (typeof s === 'string' ? s.replace(/^["“]|["”]$/g, '').trim() : ''))
      .filter((s) => s.length > 0)
      .slice(0, n);
    if (hints.length === 0) throw new Error('OpenAI returned empty hints');
    cache.set(key, hints);
    return hints;
  } catch (err) {
    console.warn(
      '[hint] batch generation failed, using fallback hints:',
      err instanceof Error ? err.message : err,
    );
    const hints = new Array(n).fill(0).map(() => fallbackHint(word));
    cache.set(key, hints);
    return hints;
  }
}

export async function generateHint(word: string): Promise<string> {
  const key = word.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached && cached.length > 0) {
    // Rotate through previously generated hints so repeated boxes feel fresh.
    return cached[Math.floor(Math.random() * cached.length)];
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const hint = fallbackHint(word);
    cache.set(key, [hint]);
    return hint;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 40,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content:
              'You write very short Wordle hints. Output exactly one sentence under 12 words. NEVER include the answer word, its plural, or a direct synonym. Hint at the meaning, vibe, or where it fits in a beach/ocean theme. No quotes, no preamble.',
          },
          {
            role: 'user',
            content: `Hint for the word: ${word}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as OpenAIResponse;
    if (json.error) throw new Error(`OpenAI error: ${json.error.message}`);
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('OpenAI returned no content');
    // Strip stray quotes / trailing periods that drift across responses.
    const hint = raw.replace(/^["“]|["”]$/g, '').trim();

    const list = cache.get(key) ?? [];
    list.push(hint);
    while (list.length > MAX_CACHE_HINTS) list.shift();
    cache.set(key, list);
    return hint;
  } catch (err) {
    console.warn(
      '[hint] OpenAI fetch failed, falling back to shape hint:',
      err instanceof Error ? err.message : err,
    );
    const hint = fallbackHint(word);
    cache.set(key, [hint]);
    return hint;
  }
}
