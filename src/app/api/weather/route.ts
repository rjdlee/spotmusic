import { NextRequest, NextResponse } from "next/server";
import { createExpiringCache, stableStringify } from "@/app/lib/inMemoryCache";

type WeatherForecastPeriod = {
  name: string | null;
  startTime: string | null;
  isDaytime: boolean | null;
  temperature: number | null;
  temperatureUnit: string | null;
  shortForecast: string | null;
  detailedForecast: string | null;
  windSpeed: string | null;
  windDirection: string | null;
  icon: string | null;
};

type WeatherForecast = {
  summary: string;
  temperature: number | null;
  temperatureUnit: string | null;
  shortForecast: string | null;
  detailedForecast: string | null;
  updatedAt: string | null;
  periods: WeatherForecastPeriod[];
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const weatherCache = createExpiringCache<WeatherForecast>(CACHE_TTL_MS);

const USER_AGENT = "SpotMusic (local)";

const parseNumber = (value: string | null, min: number, max: number) => {
  if (value === null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (numeric < min || numeric > max) {
    return null;
  }
  return numeric;
};

const buildSummary = (period: {
  temperature?: number;
  temperatureUnit?: string;
  shortForecast?: string;
  detailedForecast?: string;
  startTime?: string;
}): WeatherForecast => {
  const temperature =
    typeof period.temperature === "number" ? period.temperature : null;
  const temperatureUnit =
    typeof period.temperatureUnit === "string" ? period.temperatureUnit : null;
  const shortForecast =
    typeof period.shortForecast === "string" ? period.shortForecast : null;
  const detailedForecast =
    typeof period.detailedForecast === "string" ? period.detailedForecast : null;
  const updatedAt = typeof period.startTime === "string" ? period.startTime : null;

  const summaryParts = [
    shortForecast ?? detailedForecast ?? "Unknown",
    temperature !== null && temperatureUnit
      ? `${temperature}°${temperatureUnit}`
      : null,
  ].filter(Boolean);

  return {
    summary: summaryParts.join(", "),
    temperature,
    temperatureUnit,
    shortForecast,
    detailedForecast,
    updatedAt,
    periods: [],
  };
};

const buildPeriod = (period: Record<string, unknown>): WeatherForecastPeriod => ({
  name: typeof period.name === "string" ? period.name : null,
  startTime: typeof period.startTime === "string" ? period.startTime : null,
  isDaytime: typeof period.isDaytime === "boolean" ? period.isDaytime : null,
  temperature:
    typeof period.temperature === "number" ? period.temperature : null,
  temperatureUnit:
    typeof period.temperatureUnit === "string" ? period.temperatureUnit : null,
  shortForecast:
    typeof period.shortForecast === "string" ? period.shortForecast : null,
  detailedForecast:
    typeof period.detailedForecast === "string" ? period.detailedForecast : null,
  windSpeed: typeof period.windSpeed === "string" ? period.windSpeed : null,
  windDirection:
    typeof period.windDirection === "string" ? period.windDirection : null,
  icon: typeof period.icon === "string" ? period.icon : null,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latitude = parseNumber(searchParams.get("lat"), -90, 90);
  const longitude = parseNumber(searchParams.get("lon"), -180, 180);

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { error: "Invalid coordinates." },
      { status: 400 },
    );
  }

  const roundedLat = Number(latitude.toFixed(3));
  const roundedLon = Number(longitude.toFixed(3));
  const cacheKey = stableStringify({ roundedLat, roundedLon });
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  const pointResponse = await fetch(
    `https://api.weather.gov/points/${roundedLat},${roundedLon}`,
    { headers, cache: "no-store" },
  );

  if (!pointResponse.ok) {
    return NextResponse.json(
      { error: "Weather lookup failed." },
      { status: 502 },
    );
  }

  const pointData = (await pointResponse.json()) as {
    properties?: { forecast?: string };
  };
  const forecastUrl = pointData?.properties?.forecast;
  if (!forecastUrl) {
    return NextResponse.json(
      { error: "Weather lookup failed." },
      { status: 502 },
    );
  }

  const forecastResponse = await fetch(forecastUrl, {
    headers,
    cache: "no-store",
  });

  if (!forecastResponse.ok) {
    return NextResponse.json(
      { error: "Weather lookup failed." },
      { status: 502 },
    );
  }

  const forecastData = (await forecastResponse.json()) as {
    properties?: { periods?: Array<Record<string, unknown>> };
  };
  const periods = forecastData?.properties?.periods ?? [];
  const period = periods[0];
  if (!period) {
    return NextResponse.json(
      { error: "Weather lookup failed." },
      { status: 502 },
    );
  }

  const summary = buildSummary(period);
  const fullForecast: WeatherForecast = {
    ...summary,
    periods: periods.map(buildPeriod),
  };
  weatherCache.set(cacheKey, fullForecast);

  return NextResponse.json(fullForecast);
}
