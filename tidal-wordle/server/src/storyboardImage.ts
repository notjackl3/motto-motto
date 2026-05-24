export interface StoryboardImageRequest {
  word: string;
  roundIndex: number;
  priorWords: string[];
  caption: string;
  narrative: string;
}

export interface StoryboardImageResponse {
  imageUrl: string;
  model: string;
  revisedPrompt?: string;
}

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

function sanitizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/[^a-z-]/g, '').slice(0, 32);
}

function isGptImageModel(model: string): boolean {
  return model.startsWith('gpt-image');
}

export function buildMangaImagePrompt(req: StoryboardImageRequest): string {
  const word = sanitizeWord(req.word) || 'beach';
  const chapter = Math.max(1, Math.min(req.roundIndex, 12));
  const prior =
    req.priorWords.length > 0
      ? `Story so far: ${req.priorWords.map(sanitizeWord).filter(Boolean).join(' → ')}. `
      : '';

  return [
    'Single vertical Japanese manga comic panel, black ink linework with soft watercolor wash, beach and ocean surf setting.',
    `${prior}This panel is chapter ${chapter} and focuses on the word "${word.toUpperCase()}".`,
    `Scene mood: ${req.narrative}`,
    'Include a young surfer character, dramatic speed lines, cinematic waves, leave clear space at the bottom for a speech bubble.',
    'No text, no letters, no watermarks, no UI frames.',
  ].join(' ');
}

function mimeForFormat(format: string): string {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

function buildRequestBody(
  model: string,
  prompt: string,
  size: string,
  quality: string,
  outputFormat: string
): Record<string, unknown> {
  if (isGptImageModel(model)) {
    return {
      model,
      prompt,
      n: 1,
      size,
      quality,
      output_format: outputFormat,
    };
  }

  // Legacy DALL·E 2/3 (if available on the account).
  return {
    model,
    prompt,
    n: 1,
    size,
    quality,
    response_format: 'url',
  };
}

export async function generateStoryboardImage(
  req: StoryboardImageRequest
): Promise<StoryboardImageResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server');
  }

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1';
  const outputFormat = process.env.OPENAI_IMAGE_FORMAT?.trim() || 'png';
  const size =
    process.env.OPENAI_IMAGE_SIZE?.trim() ||
    (isGptImageModel(model) ? '1024x1536' : '1024x1792');
  const quality =
    process.env.OPENAI_IMAGE_QUALITY?.trim() ||
    (isGptImageModel(model) ? 'medium' : 'standard');
  const prompt = buildMangaImagePrompt(req);

  const res = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildRequestBody(model, prompt, size, quality, outputFormat)
    ),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI images API ${res.status}: ${body.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
  };
  const item = json.data?.[0];
  if (!item) {
    throw new Error('OpenAI images API returned no image data');
  }

  let imageUrl: string | undefined;
  if (item.b64_json) {
    imageUrl = `data:${mimeForFormat(outputFormat)};base64,${item.b64_json}`;
  } else if (item.url) {
    imageUrl = item.url;
  }

  if (!imageUrl) {
    throw new Error('OpenAI images API returned no image URL or base64 data');
  }

  return {
    imageUrl,
    model,
    revisedPrompt: item.revised_prompt,
  };
}

export function parseStoryboardImageBody(
  body: unknown
): StoryboardImageRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.word !== 'string' || typeof b.roundIndex !== 'number') {
    return null;
  }
  if (typeof b.caption !== 'string' || typeof b.narrative !== 'string') {
    return null;
  }
  const priorWords = Array.isArray(b.priorWords)
    ? b.priorWords.filter((w): w is string => typeof w === 'string').slice(0, 12)
    : [];

  const word = sanitizeWord(b.word);
  if (!word) return null;

  return {
    word,
    roundIndex: Math.max(1, Math.min(Math.floor(b.roundIndex), 12)),
    priorWords: priorWords.map(sanitizeWord).filter(Boolean),
    caption: b.caption.slice(0, 120),
    narrative: b.narrative.slice(0, 500),
  };
}
