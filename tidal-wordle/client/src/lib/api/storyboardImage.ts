const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export interface StoryboardImageRequest {
  word: string;
  roundIndex: number;
  priorWords: string[];
  caption: string;
  narrative: string;
}

export interface StoryboardImageResult {
  imageUrl: string;
  revisedPrompt?: string;
}

export async function fetchStoryboardImage(
  payload: StoryboardImageRequest
): Promise<StoryboardImageResult> {
  const res = await fetch(`${SERVER_URL}/api/storyboard/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      errBody || `Storyboard image API returned ${res.status}`
    );
  }

  const json = (await res.json()) as StoryboardImageResult;
  if (!json.imageUrl) {
    throw new Error('Storyboard image API returned no imageUrl');
  }
  return json;
}
