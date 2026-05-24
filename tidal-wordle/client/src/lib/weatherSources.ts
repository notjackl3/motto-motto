/**
 * Live weather for the currently selected NOAA station.
 *
 * Uses Open-Meteo's free current-weather endpoint (no API key). The client
 * hits a same-origin `/api/weather?lat=X&lon=Y` path; in dev the Vite
 * config proxies it directly to api.open-meteo.com, in prod the Express
 * server proxies the same path. Open-Meteo's `is_day` flag drives the
 * day/night switch; `weather_code` is bucketed to one of:
 *   clear | cloudy | fog | rain | snow | thunder
 */
export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface WeatherSnapshot {
  /** Cached station id this snapshot belongs to. */
  stationId: string;
  isDay: boolean;
  condition: WeatherCondition;
  temperatureC: number | null;
  /** 0–100, % sky covered. */
  cloudCover: number | null;
  /** mm in the past hour (Open-Meteo current). */
  precipitation: number | null;
  fetchedAt: number;
}

/** WMO weather code → simplified condition bucket. */
export function bucketWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'thunder';
  return 'cloudy';
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    is_day?: 0 | 1;
    weather_code?: number;
    cloud_cover?: number;
    precipitation?: number;
  };
}

export async function fetchWeather(
  stationId: string,
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<WeatherSnapshot> {
  const url = `/api/weather?lat=${latitude}&lon=${longitude}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  const cur = data.current ?? {};
  return {
    stationId,
    isDay: cur.is_day === 1,
    condition: bucketWeatherCode(cur.weather_code ?? 0),
    temperatureC:
      typeof cur.temperature_2m === 'number' ? cur.temperature_2m : null,
    cloudCover:
      typeof cur.cloud_cover === 'number' ? cur.cloud_cover : null,
    precipitation:
      typeof cur.precipitation === 'number' ? cur.precipitation : null,
    fetchedAt: Date.now(),
  };
}
