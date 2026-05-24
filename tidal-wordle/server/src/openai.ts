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
const MAX_CACHE_HINTS = 12;
const MAX_BATCH = 12;

function fallbackHint(word: string): string {
  const opts = fallbackHintList(word);
  return opts[Math.floor(Math.random() * opts.length)];
}

// Deterministic varied set used when OPENAI_API_KEY is missing or the API
// call fails. Returned distinct hints up to the requested count, then cycles.
function fallbackHintList(word: string): string[] {
  const w = word.toLowerCase();
  const vowels = (w.match(/[aeiou]/g) ?? []).length;
  const consonants = w.length - vowels;
  const first = w[0]?.toUpperCase() ?? '?';
  const last = w[w.length - 1] ?? '?';
  const unique = new Set(w.split('')).size;
  return [
    `${w.length} letters, starts with "${first}", ends with "${last}".`,
    `Contains ${vowels} vowel${vowels === 1 ? '' : 's'} and ${consonants} consonant${consonants === 1 ? '' : 's'}.`,
    `${unique} distinct letters in this one.`,
    `Think beach. Think coastline.`,
    `Try something that begins with "${first}".`,
    `Common on a sunny shoreline.`,
    `You might sense it before you see it.`,
    `Belongs somewhere between sand and sky.`,
  ];
}

function dedupeKeepOrder(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    const key = s.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export async function generateHintBatch(
  word: string,
  count: number,
): Promise<string[]> {
  // Pre-fills the per-word cache with `count` varied hints in a single
  // OpenAI call. Round-start hook on the client uses this so box pickups
  // can pop instantly from a local list — no per-hit network round-trip.
  //
  // Hints span a deliberate spectrum: word structure (letters, length,
  // vowels), pronunciation feel, semantic vibe, sensory detail, where
  // you'd encounter the thing, and adjacent concepts — so a player who
  // collects several boxes accumulates distinct angles on the answer.
  const key = word.toLowerCase().trim();
  const n = Math.max(1, Math.min(MAX_BATCH, Math.floor(count)));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const hints = fallbackHintList(word).slice(0, n);
    cache.set(key, hints);
    return hints;
  }

  // Letter-shape facts baked into the user message so the model has the
  // exact structural data without us trusting it to count.
  const w = word.toLowerCase();
  const vowels = (w.match(/[aeiou]/g) ?? []).length;
  const consonants = w.length - vowels;
  const first = w[0] ?? '';
  const last = w[w.length - 1] ?? '';

  const systemPrompt = [
    'You write short Wordle hints for a beach/ocean-themed word game.',
    'Output a JSON object {"hints": [...]} with exactly the requested number of strings.',
    'Each hint: ONE sentence, under 14 words, no preamble, no quotes around it.',
    'Hard rules: NEVER include the answer word, its plural, its stem, or a direct synonym.',
    'Hints MUST be distinct from each other in angle AND wording — no near-duplicates.',
    'Cover a deliberate spectrum across the set. Distribute across these categories (use each at least once when count >= 6):',
    '  • LETTER SHAPE: total letters, vowel/consonant count, first or last letter, repeated letters.',
    '  • SOUND: how it reads aloud — number of syllables, rhyme family, ends with a soft/hard sound.',
    '  • MEANING: what it is / what it does, in plain words but without naming it.',
    '  • VIBE: mood, association, the feeling it evokes.',
    '  • SETTING: where you would find it (a beach scene, a coastline, a tide pool, a boat, a forecast).',
    '  • SENSORY: what it looks/sounds/smells/feels like.',
    '  • CULTURE: how surfers, sailors, fishermen, beachgoers, or forecasters talk about it.',
    '  • ADJACENT: a closely related concept that points at it without naming it.',
    'No hint may repeat the angle of another in the same set.',
  ].join(' ');

  const userPrompt = [
    `Word: ${word}`,
    `Structure facts you may use verbatim: ${w.length} letters; ${vowels} vowel${vowels === 1 ? '' : 's'}; ${consonants} consonant${consonants === 1 ? '' : 's'}; starts with "${first}"; ends with "${last}".`,
    `Return ${n} distinct hints as {"hints":[...]}.`,
  ].join(' ');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 50 * n + 80,
        temperature: 0.95,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
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
    const cleaned = arr
      .map((s) => (typeof s === 'string' ? s.replace(/^["“]|["”]$/g, '').trim() : ''))
      .filter((s) => s.length > 0);
    let hints = dedupeKeepOrder(cleaned).slice(0, n);
    // Top up from fallbacks if the model returned fewer unique items than asked.
    if (hints.length < n) {
      for (const f of fallbackHintList(word)) {
        if (hints.length >= n) break;
        if (!hints.some((h) => h.toLowerCase() === f.toLowerCase())) hints.push(f);
      }
    }
    if (hints.length === 0) throw new Error('OpenAI returned empty hints');
    cache.set(key, hints.slice(0, MAX_CACHE_HINTS));
    return hints;
  } catch (err) {
    console.warn(
      '[hint] batch generation failed, using fallback hints:',
      err instanceof Error ? err.message : err,
    );
    const hints = fallbackHintList(word).slice(0, n);
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
