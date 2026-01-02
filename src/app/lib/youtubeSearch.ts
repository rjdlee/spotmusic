export type YouTubeSearchVideo = {
  videoId: string;
  title: string | null;
  channelTitle: string | null;
};

type YouTubeSearchResponse = {
  query: string;
  videos: YouTubeSearchVideo[];
};

export function buildYouTubeSearchQuery(
  trackName: string,
  artistName?: string | null,
) {
  const trimmedTrack = trackName.trim();
  const trimmedArtist = artistName?.trim();
  if (!trimmedTrack && !trimmedArtist) {
    return "";
  }

  return [trimmedArtist, trimmedTrack].filter(Boolean).join(" - ");
}

export async function searchYouTubeVideos(
  query: string,
  options: { maxResults?: number; signal?: AbortSignal; apiKey?: string } = {},
) {
  const params = new URLSearchParams({ q: query });
  const maxResults = 1;
  params.set("maxResults", String(maxResults));

  const headers: HeadersInit = {};
  if (options.apiKey) {
    headers["x-youtube-api-key"] = options.apiKey;
  }

  const response = await fetch(`/api/youtube/search?${params.toString()}`, {
    headers,
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error("YouTube search request failed.");
  }

  return (await response.json()) as YouTubeSearchResponse;
}
