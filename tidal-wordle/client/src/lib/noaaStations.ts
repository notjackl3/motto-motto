// Curated NOAA CO-OPS tide stations along US coasts. Each entry has a
// (station_id, display name, coast tag) — the menu picks one at random on
// mount so each session opens on a different break.
//
// IDs verified via https://tidesandcurrents.noaa.gov/stations.html.

export interface NoaaStation {
  id: string;
  name: string;
  region: string;
  /** Approximate gauge coordinates — used to fetch live weather. */
  latitude: number;
  longitude: number;
}

export const NOAA_STATIONS: NoaaStation[] = [
  // West coast
  { id: '9410230', name: 'La Jolla, CA',        region: 'Pacific',  latitude: 32.867,  longitude: -117.257 },
  { id: '9410660', name: 'Los Angeles, CA',     region: 'Pacific',  latitude: 33.720,  longitude: -118.272 },
  { id: '9410840', name: 'Santa Monica, CA',    region: 'Pacific',  latitude: 34.008,  longitude: -118.500 },
  { id: '9411340', name: 'Santa Barbara, CA',   region: 'Pacific',  latitude: 34.408,  longitude: -119.685 },
  { id: '9413450', name: 'Monterey, CA',        region: 'Pacific',  latitude: 36.605,  longitude: -121.888 },
  { id: '9414290', name: 'San Francisco, CA',   region: 'Pacific',  latitude: 37.806,  longitude: -122.465 },
  { id: '9418767', name: 'Crescent City, CA',   region: 'Pacific',  latitude: 41.745,  longitude: -124.184 },
  { id: '9431647', name: 'Port Orford, OR',     region: 'Pacific',  latitude: 42.738,  longitude: -124.498 },
  { id: '9447130', name: 'Seattle, WA',         region: 'Pacific',  latitude: 47.601,  longitude: -122.339 },
  // Hawaii
  { id: '1612340', name: 'Honolulu, HI',        region: 'Hawaii',   latitude: 21.307,  longitude: -157.867 },
  { id: '1617760', name: 'Hilo, HI',            region: 'Hawaii',   latitude: 19.730,  longitude: -155.056 },
  { id: '1612480', name: 'Mokuoloe, HI',        region: 'Hawaii',   latitude: 21.433,  longitude: -157.790 },
  // Gulf
  { id: '8729108', name: 'Panama City, FL',     region: 'Gulf',     latitude: 30.152,  longitude:  -85.667 },
  { id: '8770475', name: 'Port Arthur, TX',     region: 'Gulf',     latitude: 29.867,  longitude:  -93.930 },
  { id: '8761724', name: 'Grand Isle, LA',      region: 'Gulf',     latitude: 29.263,  longitude:  -89.957 },
  // East coast
  { id: '8723214', name: 'Virginia Key, FL',    region: 'Atlantic', latitude: 25.732,  longitude:  -80.162 },
  { id: '8665530', name: 'Charleston, SC',      region: 'Atlantic', latitude: 32.781,  longitude:  -79.925 },
  { id: '8638610', name: 'Sewells Point, VA',   region: 'Atlantic', latitude: 36.947,  longitude:  -76.330 },
  { id: '8443970', name: 'Boston, MA',          region: 'Atlantic', latitude: 42.354,  longitude:  -71.050 },
  { id: '8518750', name: 'The Battery, NY',     region: 'Atlantic', latitude: 40.701,  longitude:  -74.014 },
  // Alaska
  { id: '9455090', name: 'Seward, AK',          region: 'Alaska',   latitude: 60.121,  longitude: -149.426 },
  { id: '9455920', name: 'Anchorage, AK',       region: 'Alaska',   latitude: 61.238,  longitude: -149.890 },
];

export function getRandomStation(exceptId?: string): NoaaStation {
  const pool = exceptId
    ? NOAA_STATIONS.filter((s) => s.id !== exceptId)
    : NOAA_STATIONS;
  const list = pool.length > 0 ? pool : NOAA_STATIONS;
  return list[Math.floor(Math.random() * list.length)];
}
