import { useEffect, useState } from 'react';
import { getRandomStation, type NoaaStation } from '../../lib/noaaStations';
import { fetchTideData, type TideSnapshot } from '../../lib/api/noaa';
import { useWeatherStore } from '../../stores/weatherStore';
import type { WeatherCondition } from '../../lib/weatherSources';

const CONDITION_ICON: Record<WeatherCondition, string> = {
  clear: '☀',
  cloudy: '☁',
  fog: '🌫',
  rain: '🌧',
  snow: '❄',
  thunder: '⛈',
};

// Big tide-data marquee for the main menu. Picks a random NOAA CO-OPS
// station on each mount, fetches the latest reading via the server proxy,
// and displays it as an instrument-panel readout (water level + slope +
// significant wave height when the buoy returns it). Falls back to the
// station name if the fetch errors.

interface DisplayState {
  station: NoaaStation;
  snap: TideSnapshot | null;
  loading: boolean;
  error: string | null;
}

function formatLevel(m: number | undefined | null): string {
  if (typeof m !== 'number' || !Number.isFinite(m)) return '—';
  return `${m >= 0 ? '+' : ''}${m.toFixed(2)} m`;
}

function formatRate(mPerMin: number | undefined | null): string {
  if (typeof mPerMin !== 'number' || !Number.isFinite(mPerMin)) return '—';
  const cmPerHr = mPerMin * 60 * 100;
  const arrow = cmPerHr > 0.5 ? '↑' : cmPerHr < -0.5 ? '↓' : '·';
  return `${arrow} ${Math.abs(cmPerHr).toFixed(1)} cm/hr`;
}

export default function TideMarquee() {
  const [state, setState] = useState<DisplayState>(() => ({
    station: getRandomStation(),
    snap: null,
    loading: true,
    error: null,
  }));

  const refreshWeather = useWeatherStore((s) => s.refreshForStation);
  const weatherSnap = useWeatherStore((s) => s.snapshot);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchTideData(state.station.id)
      .then((snap) => {
        if (cancelled) return;
        setState((s) => ({ ...s, snap, loading: false, error: null }));
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          snap: null,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      });
    // Kick a parallel weather fetch for the same station.
    void refreshWeather(state.station);
    return () => {
      cancelled = true;
    };
  }, [state.station, refreshWeather]);

  function swapStation() {
    setState((s) => ({
      station: getRandomStation(s.station.id),
      snap: null,
      loading: true,
      error: null,
    }));
  }

  const { station, snap, loading, error } = state;
  const waveHeight = snap?.waveHeightMeters;
  const hasWave = typeof waveHeight === 'number' && Number.isFinite(waveHeight);

  return (
    <div className="bracket-corners pointer-events-auto w-[min(34rem,90vw)] px-5 py-3 text-deep relative rounded-xl border border-brass/40 bg-sand/85 backdrop-blur-md shadow-[0_8px_24px_rgba(4,22,43,0.18)]">
      <span className="bracket-bl" />
      <span className="bracket-br" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-instrument !text-deep/70">
            NOAA CO-OPS · Live tide gauge
          </p>
          <p className="text-xl md:text-2xl font-bold leading-tight mt-0.5 text-deep">
            {station.name}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-deep/55">
            Station {station.id} · {station.region}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {weatherSnap && weatherSnap.stationId === station.id && (
            <span
              className="font-mono text-[11px] tabular-nums tracking-wider text-deep bg-white/70 border border-brass/40 rounded-full px-2.5 py-1"
              title={`${weatherSnap.condition} · ${weatherSnap.isDay ? 'day' : 'night'}`}
            >
              {CONDITION_ICON[weatherSnap.condition]}{' '}
              {typeof weatherSnap.temperatureC === 'number'
                ? `${Math.round(weatherSnap.temperatureC)}°C`
                : '—'}
            </span>
          )}
          <button
            type="button"
            onClick={swapStation}
            disabled={loading}
            aria-label="Swap to another tide station"
            title="Pick another station"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ocean bg-white/60 border border-ocean/40 rounded-full px-2.5 py-1 hover:bg-white hover:border-ocean transition disabled:opacity-50"
          >
            ↻ Swap
          </button>
          <span className="status-pill text-ocean !bg-white/60 !border-ocean/50">
            {loading ? 'Sync…' : error ? 'Offline' : 'Live'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3 text-center">
        <div className="rounded-md border border-brass/30 bg-white/55 px-2 py-2">
          <div className="label-instrument !text-deep/65">Water level</div>
          <div className="display-numeral text-xl md:text-2xl mt-0.5 text-ocean">
            {formatLevel(snap?.currentLevelMeters)}
          </div>
        </div>
        <div className="rounded-md border border-brass/30 bg-white/55 px-2 py-2">
          <div className="label-instrument !text-deep/65">Trend</div>
          <div className="display-numeral text-xl md:text-2xl mt-0.5 text-brass">
            {formatRate(snap?.rateMetersPerMin)}
          </div>
        </div>
        <div className="rounded-md border border-brass/30 bg-white/55 px-2 py-2">
          <div className="label-instrument !text-deep/65">
            {hasWave ? 'Swell (NDBC)' : 'Datum'}
          </div>
          <div className="display-numeral text-xl md:text-2xl mt-0.5 text-deep">
            {hasWave ? `${waveHeight.toFixed(1)} m` : 'MLLW'}
          </div>
        </div>
      </div>
      {error && (
        <p className="text-[10px] text-deep/60 mt-2 text-center">
          Couldn't reach the gauge — try the play button anyway.
        </p>
      )}
    </div>
  );
}
