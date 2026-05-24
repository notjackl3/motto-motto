import { useEffect, useRef, useState } from 'react';
import {
  fetchTideData,
  DEFAULT_STATION_ID,
  type TideSnapshot,
} from '../lib/api/noaa';

const REFRESH_MS = 5 * 60 * 1000;

// Typical tide ranges at La Jolla sit roughly in [-1m, 2.5m] relative to MLLW.
// Compress that into [0, 2] in-game wave-height units.
function levelToWaveHeight(meters: number): number {
  const min = -1;
  const max = 2.5;
  const t = Math.min(1, Math.max(0, (meters - min) / (max - min)));
  return t * 2;
}

// Convert rate (m/min) into a wave-speed multiplier centered on 1.0.
// A rising or falling tide cranks the speed up; slack water = baseline.
function rateToWaveSpeed(rateMetersPerMin: number): number {
  const magnitude = Math.abs(rateMetersPerMin);
  return Math.min(2.5, 0.6 + magnitude * 30);
}

interface UseTideDataResult {
  waveHeight: number;
  waveSpeed: number;
  isLoading: boolean;
  error: string | null;
  snapshot: TideSnapshot | null;
  isMocked: boolean;
}

// Sine-wave fallback so the scene never goes dead even when NOAA is down.
function mockSnapshot(): TideSnapshot {
  const now = Date.now();
  const seed = (now / 60000) % (2 * Math.PI);
  const level = 1.0 + Math.sin(seed) * 0.8;
  const rate = Math.cos(seed) * 0.02;
  return {
    currentLevelMeters: level,
    rateMetersPerMin: rate,
    recent: [],
    stationId: 'mock',
    fetchedAt: now,
  };
}

export function useTideData(stationId: string = DEFAULT_STATION_ID): UseTideDataResult {
  const [snapshot, setSnapshot] = useState<TideSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMocked, setIsMocked] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const snap = await fetchTideData(stationId);
        if (cancelled || !mountedRef.current) return;
        setSnapshot(snap);
        setError(null);
        setIsMocked(false);
      } catch (err) {
        if (cancelled || !mountedRef.current) return;
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[tide] live fetch failed, falling back to mock:', message);
        setSnapshot(mockSnapshot());
        setError(message);
        setIsMocked(true);
      } finally {
        if (!cancelled && mountedRef.current) setIsLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);

    // While mocked, also nudge the snapshot every few seconds so the sine-wave
    // animates and the scene continues to feel alive.
    const mockTicker = setInterval(() => {
      if (!mountedRef.current) return;
      setSnapshot((current) => {
        if (!current || current.stationId !== 'mock') return current;
        return mockSnapshot();
      });
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(mockTicker);
    };
  }, [stationId]);

  const waveHeight = snapshot ? levelToWaveHeight(snapshot.currentLevelMeters) : 1.0;
  const waveSpeed = snapshot ? rateToWaveSpeed(snapshot.rateMetersPerMin) : 1.0;

  return { waveHeight, waveSpeed, isLoading, error, snapshot, isMocked };
}
