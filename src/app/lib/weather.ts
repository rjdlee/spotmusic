export type WeatherForecastPeriod = {
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

export type WeatherForecast = {
  summary: string;
  temperature: number | null;
  temperatureUnit: string | null;
  shortForecast: string | null;
  detailedForecast: string | null;
  updatedAt: string | null;
  periods: WeatherForecastPeriod[];
};

type WeatherRequestOptions = {
  signal?: AbortSignal;
};

type WeatherCoords = {
  latitude: number;
  longitude: number;
};

const roundCoord = (value: number) => Number(value.toFixed(3));

export async function fetchWeatherForecast(
  coords: WeatherCoords,
  options: WeatherRequestOptions = {},
) {
  const params = new URLSearchParams({
    lat: roundCoord(coords.latitude).toString(),
    lon: roundCoord(coords.longitude).toString(),
  });

  const response = await fetch(`/api/weather?${params.toString()}`, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error("Weather request failed.");
  }

  return (await response.json()) as WeatherForecast;
}
