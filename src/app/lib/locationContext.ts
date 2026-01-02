"use client";

import type { WeatherForecast } from "./weather";

type LocationStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

type WeatherStatus = "idle" | "loading" | "ready" | "error";

type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export const formatLocationValue = (coords: LocationCoords | null) => {
  if (!coords) {
    return "Unknown";
  }
  const accuracyLabel =
    coords.accuracy !== null ? ` ±${Math.round(coords.accuracy)}m` : "";
  return `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}${accuracyLabel}`;
};

export const getLocationStatusLabel = (status: LocationStatus) =>
  status === "active"
    ? "Active"
    : status === "requesting"
      ? "Requesting"
      : status === "denied"
        ? "Denied"
        : status === "unsupported"
          ? "Unsupported"
          : status === "error"
            ? "Error"
            : "Off";

export const getLocationDisplay = (
  status: LocationStatus,
  coords: LocationCoords | null,
) =>
  status === "active"
    ? formatLocationValue(coords)
    : status === "requesting"
      ? "Requesting"
      : status === "denied"
        ? "Permission denied"
        : status === "unsupported"
          ? "Unsupported"
          : status === "error"
            ? "Unavailable"
            : "Off";

export const getLocationSignal = (
  status: LocationStatus,
  coords: LocationCoords | null,
) => (status === "active" ? formatLocationValue(coords) : "Unknown");

export const getWeatherDisplay = (
  locationStatus: LocationStatus,
  weatherStatus: WeatherStatus,
  forecast: WeatherForecast | null,
) =>
  locationStatus === "active"
    ? weatherStatus === "loading"
      ? "Loading"
      : weatherStatus === "error"
        ? "Unavailable"
        : forecast?.summary ?? "Unknown"
    : locationStatus === "requesting"
      ? "Waiting for location"
      : locationStatus === "denied"
        ? "Permission denied"
        : locationStatus === "unsupported"
          ? "Unsupported"
          : locationStatus === "error"
            ? "Unavailable"
            : "Off";

export const formatWeatherSignal = (
  forecast: WeatherForecast | null,
): {
  summary: string;
  display: string;
  temperature: { value: number | null; unit: string | null };
} => {
  const summary = forecast?.summary ?? "Unknown";
  const value = forecast?.temperature ?? null;
  const unit = forecast?.temperatureUnit ?? null;
  const display =
    summary !== "Unknown" && value !== null && unit
      ? `${summary}, ${value}°${unit}`
      : summary;

  return {
    summary,
    display,
    temperature: { value, unit },
  };
};
