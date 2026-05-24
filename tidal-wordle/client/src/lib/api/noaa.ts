export interface TideReading {
  timestamp: number;
  heightMeters: number;
}

// TODO: integrate with NOAA Tides and Currents API
// Docs: https://api.tidesandcurrents.noaa.gov/api/prod/
export async function fetchTideData(): Promise<TideReading[]> {
  return [
    { timestamp: Date.now(), heightMeters: 1.2 },
    { timestamp: Date.now() + 3600_000, heightMeters: 1.6 },
  ];
}
