import { NextRequest, NextResponse } from "next/server";

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    channelTitle?: string;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

export async function GET(request: NextRequest) {
  const headerKey = request.headers.get("x-youtube-api-key")?.trim();
  const apiKey = headerKey || process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing YOUTUBE_API_KEY." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const maxResultsRaw = searchParams.get("maxResults");
  const maxResults = Math.min(
    Math.max(Number(maxResultsRaw ?? "3"), 1),
    5,
  );

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query param: q." },
      { status: 400 },
    );
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "YouTube search failed.",
          status: response.status,
          details: errorText,
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as YouTubeSearchResponse;
    const videos =
      data.items
        ?.map((item) => ({
          videoId: item.id?.videoId ?? null,
          title: item.snippet?.title ?? null,
          channelTitle: item.snippet?.channelTitle ?? null,
        }))
        .filter((item) => item.videoId) ?? [];

    return NextResponse.json({ query, videos });
  } catch (error) {
    return NextResponse.json(
      {
        error: "YouTube search request failed.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 502 },
    );
  }
}
