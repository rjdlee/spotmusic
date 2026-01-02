import type { UserProfilePayload } from "@/app/lib/userPreferences";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

type LlmSignals = {
  context: {
    time: {
      period: string;
      localTime: string;
    };
    location: {
      display: string;
      coordinates: {
        latitude: number;
        longitude: number;
        accuracyMeters: number | null;
      } | null;
    };
    weather: {
      summary: string;
      temperature: {
        value: number | null;
        unit: string | null;
      };
      display: string;
    };
  };
  environment: {
    ambience: {
      noiseLevel: string;
      tempoBpm: number | null;
      descriptor: string;
    };
    visuals: {
      lighting: string;
      colorTone: string;
      colorTemperature: string;
      sceneMood: string;
    };
  };
  playlist: {
    pastTracks: {
      name: string;
    }[];
  };
};

type LlmRequestBody = {
  signals?: LlmSignals;
  user_profile?: UserProfilePayload;
  model?: string;
};

type LlmYouTubeParams = {
  query: string;
  maxResults: number;
  rationale?: string;
};

const modelsSupportingWebSearch = [
  // Gemini 3 Pro Preview (supports search grounding)
  "gemini-3-pro-preview",

  // Gemini 3 Flash Preview (supports search grounding)
  "gemini-3-flash-preview",

  // Gemini 2.5 Flash (supports search / web grounding in API)
  "gemini-2.5-flash",

  // Gemini 2.5 Pro (supports web search via tools/grounding)
  "gemini-2.5-pro",
];

const formatSignals = (signals: LlmSignals) => JSON.stringify(signals, null, 2);

const buildPrompt = (
  signals: LlmSignals,
  userProfile?: UserProfilePayload,
) => `
You are a specialized Music Curator. Your job is to return the ONE song the room needs, not just what it's directly asking for.

# Instructions
1. Identify the user's location, time of year, and fuse all of the input parameters into a profile
2. Analyze pastTracks and favorite_genres. Use these to determine the "sonic DNA." If a genre is unconventional (e.g., slang or memes), cross-reference it with the instrumentation/vibe of the pastTracks.
3. What musical levers can you use? Incorporate every input parameter.For example: Tempo (Match or counter), Texture (Morning vs Night, Warm vs Cold), Culture (Korean Cafe vs Cha Chaan Teng vs Nobu)
4. Use the Google Search tool to a) find a song only if you need help b) verify the song and artist exist and are real
5. Occasionally suggest a "Left-field" track that shares a DNA thread with the user's history but spans a different decade or geography. For the left-field, if the user likes Rock, don't immediately pick Queen or Journey. Look for the 'B-side' energy that fits the specific room texture.

# Requirements:
1. Always return a specific track (never a playlist, radio mix, artist-only query, album-only query, or generic genre search).
2. MUST FOLLOW - NEVER REPEAT TRACKS. DO NOT REPEAT ANY TRACKS FROM pastTracks

Examples:
1. The "Momentum" Play (Evening Shift)
Context: User likes 70s Soul; Location: Brooklyn Wine Bar; Time: 8:00 PM; Energy: Rising.
History: Last 3 tracks were mid-tempo Bill Withers and Al Green.
Logic: The room is filling up; we need momentum without breaking the "Retro" DNA. Shift from "Sit-down Soul" to "Dancefloor Disco."
Selection: The Emotions - Best of My Love
Rationale: "Moving from mellow 70s soul into high-energy disco to match the rising evening energy while staying within the user's retro preference."

2. The "Culture & Texture" Reset (Morning Heat)
Context: Location: High-end Japanese Cafe; Weather: 90°F (Hot/Humid); Energy: High (Morning Rush).
History: High-energy J-Pop and Top 40.
Logic: The room is chaotic and hot. Use the Texture lever to "cool" the room down with a reset. Apply the Culture lever by selecting "City Pop"—the DNA of Japanese summer.
Selection: Tatsuro Yamashita - Sparkle
Rationale: "The shop is frantic and hot; this track offers a 'Cool/Aqueous' texture and Japanese cultural relevance to stabilize the mood without losing the summer vibe."

3. The "Left-Field DNA" Bridge (Global Discovery)
Context: User profile shows a heavy preference for 90s UK Trip-Hop (Massive Attack, Portishead).
History: Steady "Dark" energy.
Logic: Use DNA threading to find a modern, global equivalent. The "Left-field" lever connects 90s Bristol vibes to modern Middle Eastern psych-rock.
Selection: Altin Gün - Goca Dünya
Rationale: "Sharing the 'fuzzy' synth textures and heavy basslines of the user's Trip-Hop history, but shifting the geography to Turkey for a sophisticated 'Left-field' discovery moment."

Context JSON:
${formatSignals(signals)}

User profile JSON:
${JSON.stringify(userProfile ?? null, null, 2)}

Return JSON with:
{
  "song_title": "string",
  "artist": "string",
  "query": "string (format: Artist - Song Title)",
  "maxResults": 1,
  "rationale": "short string"
}
`;

const extractJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isUsefulSignal = (value: string) =>
  value &&
  value !== "Unknown" &&
  value !== "Off" &&
  value !== "Unavailable" &&
  value !== "Permission denied";

const fallbackParams = (signals: LlmSignals): LlmYouTubeParams => {
  const contextHints = [
    signals.environment.visuals.sceneMood,
    signals.environment.ambience.descriptor,
    signals.context.weather.summary,
  ]
    .filter((value) => isUsefulSignal(value))
    .join(" ")
    .trim();

  return {
    query: contextHints
      ? `${contextHints} - "Midnight City" by M83`
      : 'M83 - Midnight City',
    maxResults: 1,
    rationale: "Fallback query generated without LLM output.",
  };
};

const isSpecificSongQuery = (value: string) => {
  const lowered = value.toLowerCase();
  const bannedTerms = [
    "playlist",
    "mix",
    "radio",
    "album",
    "discography",
    "top hits",
    "best of",
    "live set",
    "compilation",
  ];
  if (bannedTerms.some((term) => lowered.includes(term))) {
    return false;
  }

  const hasArtistSeparator =
    value.includes(" - ") || lowered.includes(" by ");
  const wordCount = value.trim().split(/\s+/).length;
  return hasArtistSeparator && wordCount >= 3;
};

const buildQueryFromParsed = (parsed: Record<string, unknown> | null) => {
  const songTitle =
    typeof parsed?.song_title === "string" ? parsed.song_title.trim() : "";
  const artist = typeof parsed?.artist === "string" ? parsed.artist.trim() : "";
  if (songTitle && artist) {
    return `${artist} - ${songTitle}`;
  }

  return typeof parsed?.query === "string" ? parsed.query.trim() : "";
};

export async function POST(request: NextRequest) {
  const headerKey = request.headers.get("x-gemini-api-key")?.trim();
  const apiKey = headerKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY." },
      { status: 500 },
    );
  }

  let payload: LlmRequestBody;
  try {
    payload = (await request.json()) as LlmRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (!payload.signals) {
    return NextResponse.json(
      { error: "Missing signals payload." },
      { status: 400 },
    );
  }

  const requestedModel =
    typeof payload.model === "string" ? payload.model.trim() : "";
  const resolvedModel = requestedModel || "gemma-3-27b-it";

  const prompt = buildPrompt(payload.signals, payload.user_profile);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const supportsWebSearch = modelsSupportingWebSearch.includes(resolvedModel);
    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents: prompt,
      config: supportsWebSearch ? { tools: [{ googleSearch: {} }] } : undefined,
    });

    const parsed = extractJson(response.text ?? "");
    const query = buildQueryFromParsed(parsed);
    const rationale =
      typeof parsed?.rationale === "string" ? parsed.rationale.trim() : "";

    const params: LlmYouTubeParams = query && isSpecificSongQuery(query)
      ? {
          query,
          maxResults: 1,
          rationale,
        }
      : fallbackParams(payload.signals);

    return NextResponse.json({ params });
  } catch (error) {
    return NextResponse.json(
      {
        error: "LLM evaluation failed.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 502 },
    );
  }
}
