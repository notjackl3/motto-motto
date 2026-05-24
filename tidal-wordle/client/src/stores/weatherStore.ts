/**
 * Live-weather store — fed by TideMarquee on station change. Read by
 * SkyAndLighting (3D scene) and RainOverlay so the entire scene reflects
 * the real-time conditions at the selected NOAA station.
 *
 * The store holds at most one snapshot. While a fetch is in flight the
 * previous snapshot stays visible (no flicker).
 */
import { create } from 'zustand';
import {
  fetchWeather,
  type WeatherCondition,
  type WeatherSnapshot,
} from '../lib/weatherSources';
import type { NoaaStation } from '../lib/noaaStations';

export interface SkyTheme {
  top: string;
  mid: string;
  bottom: string;
  ambient: number;
  hemiTop: string;
  hemiBottom: string;
  hemiIntensity: number;
  sun: string;
  sunIntensity: number;
  fog: string;
}

const DAY_CLEAR: SkyTheme = {
  top: '#4ca7e8',
  mid: '#a7d9f5',
  bottom: '#ffe6c2',
  ambient: 0.9,
  hemiTop: '#bfe6e8',
  hemiBottom: '#6a8a9a',
  hemiIntensity: 1.1,
  sun: '#fff1d6',
  sunIntensity: 0.95,
  fog: '#ffd9b4',
};

const DAY_CLOUDY: SkyTheme = {
  top: '#8aa6b8',
  mid: '#c4d2db',
  bottom: '#e2dfd6',
  ambient: 0.85,
  hemiTop: '#c2cfd6',
  hemiBottom: '#6c7780',
  hemiIntensity: 0.95,
  sun: '#d8d4cc',
  sunIntensity: 0.55,
  fog: '#cfd4d9',
};

const DAY_FOG: SkyTheme = {
  top: '#b4bcc1',
  mid: '#c9cfd2',
  bottom: '#dadcde',
  ambient: 0.75,
  hemiTop: '#cdd2d6',
  hemiBottom: '#7a8085',
  hemiIntensity: 0.9,
  sun: '#c8c4ba',
  sunIntensity: 0.35,
  fog: '#c2c8cc',
};

const DAY_RAIN: SkyTheme = {
  top: '#566a78',
  mid: '#7b8b96',
  bottom: '#9aa6ae',
  ambient: 0.6,
  hemiTop: '#8593a0',
  hemiBottom: '#3c454c',
  hemiIntensity: 0.85,
  sun: '#8c92a0',
  sunIntensity: 0.3,
  fog: '#7d8a94',
};

const DAY_THUNDER: SkyTheme = {
  top: '#3a4452',
  mid: '#525e6a',
  bottom: '#6e7882',
  ambient: 0.55,
  hemiTop: '#5a6470',
  hemiBottom: '#252b32',
  hemiIntensity: 0.75,
  sun: '#7d8390',
  sunIntensity: 0.2,
  fog: '#3f4a55',
};

const DAY_SNOW: SkyTheme = {
  top: '#bcc8d4',
  mid: '#dde4ec',
  bottom: '#f0f3f7',
  ambient: 0.9,
  hemiTop: '#dde4ec',
  hemiBottom: '#9aa5b0',
  hemiIntensity: 1.0,
  sun: '#e7ebf0',
  sunIntensity: 0.55,
  fog: '#d9e0e8',
};

const NIGHT_CLEAR: SkyTheme = {
  top: '#0a1838',
  mid: '#152a55',
  bottom: '#324a7a',
  ambient: 0.35,
  hemiTop: '#3a4f7a',
  hemiBottom: '#0a1226',
  hemiIntensity: 0.6,
  sun: '#aeb8d6',
  sunIntensity: 0.25,
  fog: '#152a55',
};

const NIGHT_CLOUDY: SkyTheme = {
  top: '#1a2538',
  mid: '#2a3548',
  bottom: '#3a4458',
  ambient: 0.32,
  hemiTop: '#34405a',
  hemiBottom: '#0a121f',
  hemiIntensity: 0.55,
  sun: '#8a92a8',
  sunIntensity: 0.15,
  fog: '#2a3548',
};

const NIGHT_RAIN: SkyTheme = {
  top: '#0d1830',
  mid: '#1a253c',
  bottom: '#2a3550',
  ambient: 0.28,
  hemiTop: '#2a3550',
  hemiBottom: '#070d1a',
  hemiIntensity: 0.5,
  sun: '#6a7088',
  sunIntensity: 0.12,
  fog: '#1a253c',
};

const NIGHT_THUNDER: SkyTheme = {
  top: '#080f22',
  mid: '#121a30',
  bottom: '#1f283c',
  ambient: 0.25,
  hemiTop: '#1f283c',
  hemiBottom: '#04081a',
  hemiIntensity: 0.45,
  sun: '#6e7488',
  sunIntensity: 0.1,
  fog: '#0c1428',
};

const NIGHT_SNOW: SkyTheme = {
  top: '#3a4458',
  mid: '#54607a',
  bottom: '#7080a0',
  ambient: 0.4,
  hemiTop: '#54607a',
  hemiBottom: '#1a2030',
  hemiIntensity: 0.6,
  sun: '#aeb8d6',
  sunIntensity: 0.25,
  fog: '#54607a',
};

const NIGHT_FOG: SkyTheme = {
  top: '#22293a',
  mid: '#2e3648',
  bottom: '#3c4456',
  ambient: 0.32,
  hemiTop: '#38405a',
  hemiBottom: '#10141e',
  hemiIntensity: 0.5,
  sun: '#7e8498',
  sunIntensity: 0.15,
  fog: '#2e3648',
};

export const DEFAULT_SKY_THEME: SkyTheme = DAY_CLEAR;

export function skyThemeFor(
  isDay: boolean,
  condition: WeatherCondition
): SkyTheme {
  if (isDay) {
    switch (condition) {
      case 'clear':
        return DAY_CLEAR;
      case 'cloudy':
        return DAY_CLOUDY;
      case 'fog':
        return DAY_FOG;
      case 'rain':
        return DAY_RAIN;
      case 'snow':
        return DAY_SNOW;
      case 'thunder':
        return DAY_THUNDER;
    }
  }
  switch (condition) {
    case 'clear':
      return NIGHT_CLEAR;
    case 'cloudy':
      return NIGHT_CLOUDY;
    case 'fog':
      return NIGHT_FOG;
    case 'rain':
      return NIGHT_RAIN;
    case 'snow':
      return NIGHT_SNOW;
    case 'thunder':
      return NIGHT_THUNDER;
  }
}

interface WeatherStoreState {
  snapshot: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  /** Latest in-flight controller so a stale fetch can be aborted. */
  refreshForStation: (station: NoaaStation) => Promise<void>;
  clear: () => void;
}

let inflight: AbortController | null = null;

export const useWeatherStore = create<WeatherStoreState>((set) => ({
  snapshot: null,
  loading: false,
  error: null,
  refreshForStation: async (station: NoaaStation) => {
    if (inflight) inflight.abort();
    const ctl = new AbortController();
    inflight = ctl;
    set({ loading: true, error: null });
    try {
      const snap = await fetchWeather(
        station.id,
        station.latitude,
        station.longitude,
        ctl.signal
      );
      if (!ctl.signal.aborted) {
        set({ snapshot: snap, loading: false, error: null });
      }
    } catch (err) {
      if (ctl.signal.aborted) return;
      set({
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      if (inflight === ctl) inflight = null;
    }
  },
  clear: () => set({ snapshot: null, loading: false, error: null }),
}));
