// NOAA CO-OPS API integration.
// Docs: https://api.tidesandcurrents.noaa.gov/api/prod/
//
// Browser fetches go through the server proxy at /api/tides to avoid any
// CORS surprises and to keep the same origin in dev. The server hits NOAA
// directly with `fetch`.

export interface TideReading {
  timestamp: number;
  heightMeters: number;
}

export interface TideSnapshot {
  // Latest water level (meters, relative to MLLW datum).
  currentLevelMeters: number;
  // Rate of change in meters per minute, signed.
  rateMetersPerMin: number;
  // Recent samples used to derive the rate, in chronological order.
  recent: TideReading[];
  stationId: string;
  fetchedAt: number;
  // Real significant wave height (meters) from a nearby NDBC buoy. Optional
  // — if NDBC fetch failed or all recent rows had no reading, the client
  // falls back to deriving wave height from the tide level.
  waveHeightMeters?: number;
  dominantPeriodSec?: number;
  buoyId?: string;
}

export const DEFAULT_STATION_ID = '9410230'; // La Jolla, CA

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export async function fetchTideData(
  stationId: string = DEFAULT_STATION_ID,
): Promise<TideSnapshot> {
  const url = `${SERVER_URL}/api/tides?station=${encodeURIComponent(stationId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Tide proxy returned ${res.status}`);
  }
  const json = (await res.json()) as TideSnapshot;
  return json;
}
