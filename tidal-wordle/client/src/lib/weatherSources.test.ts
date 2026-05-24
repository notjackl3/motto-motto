import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bucketWeatherCode, fetchWeather } from './weatherSources';

describe('bucketWeatherCode', () => {
  it('buckets WMO codes into 6 conditions', () => {
    expect(bucketWeatherCode(0)).toBe('clear');
    expect(bucketWeatherCode(1)).toBe('cloudy');
    expect(bucketWeatherCode(3)).toBe('cloudy');
    expect(bucketWeatherCode(45)).toBe('fog');
    expect(bucketWeatherCode(48)).toBe('fog');
    expect(bucketWeatherCode(51)).toBe('rain');
    expect(bucketWeatherCode(63)).toBe('rain');
    expect(bucketWeatherCode(82)).toBe('rain');
    expect(bucketWeatherCode(71)).toBe('snow');
    expect(bucketWeatherCode(86)).toBe('snow');
    expect(bucketWeatherCode(95)).toBe('thunder');
    expect(bucketWeatherCode(99)).toBe('thunder');
  });

  it('falls back to cloudy for unknown codes', () => {
    expect(bucketWeatherCode(123)).toBe('cloudy');
    expect(bucketWeatherCode(-1)).toBe('cloudy');
  });
});

describe('fetchWeather', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('parses an Open-Meteo current payload into a WeatherSnapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              current: {
                temperature_2m: 22.3,
                is_day: 1,
                weather_code: 61,
                cloud_cover: 80,
                precipitation: 0.5,
              },
            }),
            { status: 200 }
          )
      )
    );

    const snap = await fetchWeather('9410230', 32.867, -117.257);
    expect(snap.stationId).toBe('9410230');
    expect(snap.isDay).toBe(true);
    expect(snap.condition).toBe('rain');
    expect(snap.temperatureC).toBe(22.3);
    expect(snap.cloudCover).toBe(80);
    expect(snap.precipitation).toBe(0.5);
  });

  it('treats missing fields as nulls and is_day=0 as night', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ current: { is_day: 0, weather_code: 0 } }),
            { status: 200 }
          )
      )
    );

    const snap = await fetchWeather('test', 0, 0);
    expect(snap.isDay).toBe(false);
    expect(snap.condition).toBe('clear');
    expect(snap.temperatureC).toBeNull();
    expect(snap.cloudCover).toBeNull();
    expect(snap.precipitation).toBeNull();
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    );
    await expect(fetchWeather('x', 0, 0)).rejects.toThrow(/HTTP 500/);
  });
});

describe('NOAA stations carry lat/lon for the weather lookup', () => {
  it('every station has finite latitude and longitude', async () => {
    const { NOAA_STATIONS } = await import('./noaaStations');
    for (const s of NOAA_STATIONS) {
      expect(Number.isFinite(s.latitude)).toBe(true);
      expect(Number.isFinite(s.longitude)).toBe(true);
      expect(Math.abs(s.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(s.longitude)).toBeLessThanOrEqual(180);
    }
  });
});
