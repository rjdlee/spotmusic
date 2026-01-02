
export type LlmSignalInputs = {
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

export type LlmUserProfile = UserProfilePayload;

export type LlmYouTubeParams = {
  query: string;
  maxResults: number;
  rationale?: string;
};

type LlmResponse = {
  params: LlmYouTubeParams;
};

export async function evaluateYouTubeParams(
  signals: LlmSignalInputs,
  userProfile?: LlmUserProfile | null,
  options: { signal?: AbortSignal; apiKey?: string; model?: string } = {},
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (options.apiKey) {
    headers["x-gemini-api-key"] = options.apiKey;
  }

  const response = await fetch("/api/llm/youtube", {
    method: "POST",
    headers,
    body: JSON.stringify({
      signals,
      user_profile: userProfile ?? undefined,
      model: options.model,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error("LLM evaluation request failed.");
  }

  const data = (await response.json()) as LlmResponse;
  return data.params;
}
import type { UserProfilePayload } from "./userPreferences";
