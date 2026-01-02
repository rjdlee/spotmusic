"use client";

import Tooltip from "./Tooltip";
import Notice from "./Notice";
import { formatLocationValue } from "../lib/locationContext";
import type { WeatherForecast } from "../lib/weather";

type WeatherForecastWidgetProps = {
  status: "idle" | "loading" | "ready" | "error";
  locationStatus:
    | "idle"
    | "requesting"
    | "active"
    | "denied"
    | "unsupported"
    | "error";
  locationCoords: Parameters<typeof formatLocationValue>[0];
  forecast: WeatherForecast | null;
  errorMessage: string | null;
};

type ForecastVariant =
  | "sun"
  | "moon"
  | "cloud"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "wind";

const getForecastVariant = (
  shortForecast: string | null,
  detailedForecast: string | null,
  isDaytime: boolean | null,
): ForecastVariant => {
  const combined = `${shortForecast ?? ""} ${detailedForecast ?? ""}`.toLowerCase();

  if (/thunder|storm/.test(combined)) {
    return "storm";
  }
  if (/snow|sleet|ice/.test(combined)) {
    return "snow";
  }
  if (/rain|shower|drizzle/.test(combined)) {
    return "rain";
  }
  if (/fog|mist|haze/.test(combined)) {
    return "fog";
  }
  if (/wind|breezy|gust/.test(combined)) {
    return "wind";
  }
  if (/cloud|overcast/.test(combined)) {
    return "cloud";
  }

  if (isDaytime === false) {
    return "moon";
  }

  return "sun";
};

const ForecastIcon = ({ variant }: { variant: ForecastVariant }) => {
  const svg = (() => {
    switch (variant) {
      case "moon":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M15.5 4.5a7.5 7.5 0 1 0 4 13.9 8.5 8.5 0 0 1-4-13.9Z"
              fill="currentColor"
            />
          </svg>
        );
      case "cloud":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M7.5 18h8.6a3.4 3.4 0 0 0 0-6.8 4.6 4.6 0 0 0-8.9-1.5A3.2 3.2 0 0 0 7.5 18Z"
              fill="currentColor"
            />
          </svg>
        );
      case "rain":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M7.6 15h8.2a3.2 3.2 0 0 0-.2-6.4A4.5 4.5 0 0 0 6.7 9a3 3 0 0 0 .9 6Z"
              fill="currentColor"
            />
            <path
              d="m8.5 19 1.2-2M12 19l1.2-2M15.5 19l1.2-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        );
      case "storm":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M7.2 14.4h8.5a3 3 0 0 0 0-6 4.3 4.3 0 0 0-8.4-.8 2.8 2.8 0 0 0-.1 6.8Z"
              fill="currentColor"
            />
            <path
              d="M11 21 13.5 17h-2.3l2-4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "snow":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M7.4 14h8.8a3.1 3.1 0 0 0-.2-6.2 4.4 4.4 0 0 0-8.6-.6 2.9 2.9 0 0 0 0 6.8Z"
              fill="currentColor"
            />
            <path
              d="M9 18.5h.01M12 18.5h.01M15 18.5h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case "fog":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M6.5 12.8h9.8a2.6 2.6 0 0 0 0-5.2 4 4 0 0 0-7.7-.8 2.4 2.4 0 0 0-2.1 2.4 2.6 2.6 0 0 0 0 3.6Z"
              fill="currentColor"
            />
            <path
              d="M6.5 16.5h11M7.8 19h8.4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        );
      case "wind":
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path
              d="M4 10h9a2.5 2.5 0 1 0-2.4-3.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M4 14h12.5a2.3 2.3 0 1 1-2.2 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <circle cx="12" cy="12" r="5.5" fill="currentColor" />
            <path
              d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        );
    }
  })();

  return (
    <div className="grid h-16 w-16 place-items-center rounded-full bg-[#4a536b]/80 text-slate-100 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {svg}
    </div>
  );
};

export default function WeatherForecastWidget({
  status,
  locationStatus,
  locationCoords,
  forecast,
  errorMessage,
}: WeatherForecastWidgetProps) {
  const periods = forecast?.periods ?? [];
  const hasForecast = periods.length > 0;
  const todayKey = new Date().toDateString();
  const todayPeriods = periods.filter((period) => {
    if (!period.startTime) {
      return false;
    }
    const date = new Date(period.startTime);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    return date.toDateString() === todayKey;
  });
  const currentPeriod = periods[0] ?? null;
  const currentTemp =
    forecast?.temperature ?? currentPeriod?.temperature ?? null;
  const temps = (todayPeriods.length > 0 ? todayPeriods : periods)
    .map((period) => period.temperature)
    .filter((value): value is number => typeof value === "number");
  const highTemp = temps.length > 0 ? Math.max(...temps) : null;
  const lowTemp = temps.length > 0 ? Math.min(...temps) : null;
  const wind =
    currentPeriod?.windSpeed && currentPeriod?.windDirection
      ? `${currentPeriod.windSpeed} ${currentPeriod.windDirection}`
      : currentPeriod?.windSpeed ?? "Calm";
  const condition =
    forecast?.shortForecast ??
    currentPeriod?.shortForecast ??
    forecast?.summary ??
    "Forecast unavailable";
  const locationLabel =
    locationStatus === "active"
      ? formatLocationValue(locationCoords)
      : locationStatus === "requesting"
        ? "Waiting for location"
        : locationStatus === "denied"
          ? "Location denied"
          : locationStatus === "unsupported"
            ? "Location unavailable"
            : locationStatus === "error"
              ? "Location error"
              : "Location inactive";
  const isReady = status === "ready" && hasForecast;

  const statusMessage =
    locationStatus === "active"
      ? status === "loading"
        ? "Fetching the latest forecast..."
        : status === "error"
          ? "Forecast unavailable."
          : hasForecast
            ? "Today's forecast is ready."
            : "Waiting on the forecast."
      : locationStatus === "requesting"
        ? "Waiting for location access."
        : locationStatus === "denied"
          ? "Location permission denied."
          : locationStatus === "unsupported"
            ? "Location unavailable."
        : locationStatus === "error"
          ? "Location error."
          : "Enable location to fetch forecast.";
  const statusTooltip = isReady ? "Today's forecast is ready." : statusMessage;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--mix-ink-soft)]">
              Weather
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[color:var(--mix-ink-soft)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M12 3.5a6.5 6.5 0 0 0-6.5 6.5c0 4.9 6.5 10.9 6.5 10.9S18.5 14.9 18.5 10A6.5 6.5 0 0 0 12 3.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="10" r="2.4" fill="currentColor" />
              </svg>
              <span>{locationLabel}</span>
            </div>
          </div>
          <div>
            <div className="text-5xl font-semibold text-[color:var(--mix-ink)]">
              {currentTemp !== null ? `${currentTemp}°` : "--"}
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-[color:var(--mix-ink-soft)]">
              <span>{condition}</span>
              <Tooltip
                content={statusTooltip}
                ariaLabel="Weather status info"
              />
            </div>
          </div>
        </div>
        <ForecastIcon
          variant={getForecastVariant(
            currentPeriod?.shortForecast ?? null,
            currentPeriod?.detailedForecast ?? null,
            currentPeriod?.isDaytime ?? null,
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="mixer-panel px-4 py-3 text-center">
          <div className="text-sm text-[color:var(--mix-ink-soft)]">High</div>
          <div className="text-xl font-semibold text-[color:var(--mix-ink)]">
            {highTemp !== null ? `${highTemp}°` : "--"}
          </div>
        </div>
        <div className="mixer-panel px-4 py-3 text-center">
          <div className="text-sm text-[color:var(--mix-ink-soft)]">Low</div>
          <div className="text-xl font-semibold text-[color:var(--mix-ink)]">
            {lowTemp !== null ? `${lowTemp}°` : "--"}
          </div>
        </div>
        <div className="mixer-panel px-4 py-3 text-center">
          <div className="text-sm text-[color:var(--mix-ink-soft)]">Wind</div>
          <div className="text-xl font-semibold text-[color:var(--mix-ink)]">
            {wind}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <Notice>
          {errorMessage}
        </Notice>
      ) : null}
    </div>
  );
}
