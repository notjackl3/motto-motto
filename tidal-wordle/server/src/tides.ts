// NOAA CO-OPS proxy. Pulls latest water level + a short history window so the
// client can derive both wave height (from current level) and wave speed
// (from rate of change).
//
// Plus a sibling NDBC fetcher for *real* significant wave height from
// offshore buoys (CO-OPS doesn't carry wave data). Both run in parallel
// inside getTideSnapshot; the snapshot returned to the client carries
// whatever subset succeeded.
//
// Docs:
//   https://api.tidesandcurrents.noaa.gov/api/prod/
//   https://www.ndbc.noaa.gov/realtime.shtml

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
  // Significant wave height (meters) sampled from a nearby NDBC buoy.
  // Optional — missing if NDBC was unreachable or all recent rows had MM.
  waveHeightMeters?: number;
  dominantPeriodSec?: number;
  buoyId?: string;
}

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NDBC_BASE = 'https://www.ndbc.noaa.gov/data/realtime2';
// Point Loma South — closest active wave buoy to the La Jolla CO-OPS gauge.
const DEFAULT_BUOY_ID = '46232';
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

export async function getTideSnapshot(
  stationId: string,
  buoyId: string = DEFAULT_BUOY_ID,
): Promise<TideSnapshot> {
  const cacheKey = `${stationId}|${buoyId}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.snapshot;

  // Tide (required) + waves (optional) in parallel. If waves fail or come
  // back empty, the snapshot just omits the wave fields and the client
  // falls back to the tide-level derivation.
  const [tideRes, waveRes] = await Promise.allSettled([
    fetchRange(stationId),
    fetchBuoyWaves(buoyId),
  ]);

  if (tideRes.status !== 'fulfilled') {
    throw tideRes.reason instanceof Error
      ? tideRes.reason
      : new Error(String(tideRes.reason));
  }
  const readings = tideRes.value;
  const latest = readings[readings.length - 1];

  const snapshot: TideSnapshot = {
    currentLevelMeters: latest.heightMeters,
    rateMetersPerMin: deriveRate(readings),
    recent: readings,
    stationId,
    fetchedAt: now,
  };

  if (waveRes.status === 'fulfilled' && waveRes.value) {
    snapshot.waveHeightMeters = waveRes.value.waveHeightMeters;
    snapshot.dominantPeriodSec = waveRes.value.dominantPeriodSec;
    snapshot.buoyId = buoyId;
  } else if (waveRes.status === 'rejected') {
    console.warn(
      '[waves] NDBC fetch failed (continuing without wave data):',
      waveRes.reason instanceof Error ? waveRes.reason.message : waveRes.reason,
    );
  }

  cache.set(cacheKey, { at: now, snapshot });
  return snapshot;
}

// ---------- NDBC wave fetch ----------
//
// NDBC's realtime2 endpoint returns a plain-text fixed-width table. The
// first two lines start with `#` and carry the column headers + units;
// data rows follow in newest-first order. Missing values are the literal
// string "MM". Example:
//
//   #YY  MM DD hh mm WDIR WSPD GST  WVHT  DPD ...
//   #yr  mo dy hr mn degT m/s  m/s     m  sec ...
//   2026 05 24 18 50  240  3.5  4.2   1.3    9 ...
//
// We parse the first header line to find the column indexes for WVHT
// (significant wave height, m) and DPD (dominant period, s), then walk
// data rows top-down and return the first row where WVHT parses as a
// finite number.

interface BuoyWaveReading {
  waveHeightMeters: number;
  dominantPeriodSec: number | undefined;
}

async function fetchBuoyWaves(buoyId: string): Promise<BuoyWaveReading | null> {
  const url = `${NDBC_BASE}/${encodeURIComponent(buoyId)}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NDBC returned ${res.status}`);
  const body = await res.text();

  const lines = body.split('\n');
  let headerCols: string[] | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      // First # line is the column names. Strip the # and split on whitespace.
      if (!headerCols) {
        headerCols = line.replace(/^#/, '').trim().split(/\s+/);
      }
      continue;
    }
    if (!headerCols) continue;
    const cols = line.split(/\s+/);
    const wvhtIdx = headerCols.indexOf('WVHT');
    const dpdIdx = headerCols.indexOf('DPD');
    if (wvhtIdx < 0) return null;
    const wvhtRaw = cols[wvhtIdx];
    const wvht = Number(wvhtRaw);
    if (!Number.isFinite(wvht)) continue; // "MM" or garbage → try next row
    const dpdRaw = dpdIdx >= 0 ? cols[dpdIdx] : undefined;
    const dpd = dpdRaw !== undefined ? Number(dpdRaw) : NaN;
    return {
      waveHeightMeters: wvht,
      dominantPeriodSec: Number.isFinite(dpd) ? dpd : undefined,
    };
  }
  return null;
}
