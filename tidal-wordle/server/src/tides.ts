// NOAA CO-OPS proxy. Pulls latest water level + a short history window so the
// client can derive both wave height (from current level) and wave speed
// (from rate of change).
//
// Docs: https://api.tidesandcurrents.noaa.gov/api/prod/

export interface TideReading {
  timestamp: number;
  heightMeters: number;
}

export interface TideSnapshot {
  currentLevelMeters: number;
  rateMetersPerMin: number;
  recent: TideReading[];
  stationId: string;
  fetchedAt: number;
}

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const CACHE_MS = 60 * 1000;

const cache = new Map<string, { at: number; snapshot: TideSnapshot }>();

function formatDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd} ${hh}:${min}`;
}

interface NoaaResponse {
  data?: Array<{ t: string; v: string }>;
  error?: { message: string };
}

async function fetchRange(stationId: string): Promise<TideReading[]> {
  const end = new Date();
  const begin = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour back

  const params = new URLSearchParams({
    product: 'water_level',
    application: 'tidal-wordle',
    begin_date: formatDate(begin),
    end_date: formatDate(end),
    datum: 'MLLW',
    station: stationId,
    time_zone: 'gmt',
    units: 'metric',
    format: 'json',
  });

  const url = `${NOAA_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NOAA returned ${res.status}`);
  const json = (await res.json()) as NoaaResponse;
  if (json.error) throw new Error(`NOAA error: ${json.error.message}`);
  if (!json.data || json.data.length === 0) {
    throw new Error('NOAA returned no readings');
  }

  return json.data
    .map((row) => {
      // NOAA times are "YYYY-MM-DD HH:mm" UTC.
      const ts = Date.parse(row.t.replace(' ', 'T') + 'Z');
      const v = Number(row.v);
      return { timestamp: ts, heightMeters: v };
    })
    .filter((r) => Number.isFinite(r.timestamp) && Number.isFinite(r.heightMeters))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function deriveRate(readings: TideReading[]): number {
  if (readings.length < 2) return 0;
  const latest = readings[readings.length - 1];
  // Find a reading ~10 minutes earlier for a stable slope.
  const targetTs = latest.timestamp - 10 * 60 * 1000;
  let earlier = readings[0];
  for (const r of readings) {
    if (r.timestamp <= targetTs) earlier = r;
    else break;
  }
  const dtMin = (latest.timestamp - earlier.timestamp) / 60000;
  if (dtMin <= 0) return 0;
  return (latest.heightMeters - earlier.heightMeters) / dtMin;
}

export async function getTideSnapshot(stationId: string): Promise<TideSnapshot> {
  const cached = cache.get(stationId);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.snapshot;

  const readings = await fetchRange(stationId);
  const latest = readings[readings.length - 1];
  const snapshot: TideSnapshot = {
    currentLevelMeters: latest.heightMeters,
    rateMetersPerMin: deriveRate(readings),
    recent: readings,
    stationId,
    fetchedAt: now,
  };
  cache.set(stationId, { at: now, snapshot });
  return snapshot;
}
