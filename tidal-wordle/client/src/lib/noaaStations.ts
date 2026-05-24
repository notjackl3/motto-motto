// Curated NOAA CO-OPS tide stations along US coasts. Each entry has a
// (station_id, display name, coast tag) — the menu picks one at random on
// mount so each session opens on a different break.
//
// IDs verified via https://tidesandcurrents.noaa.gov/stations.html.

export interface NoaaStation {
  id: string;
  name: string;
  region: string;
}

export const NOAA_STATIONS: NoaaStation[] = [
  // West coast
  { id: '9410230', name: 'La Jolla, CA', region: 'Pacific' },
  { id: '9410660', name: 'Los Angeles, CA', region: 'Pacific' },
  { id: '9410840', name: 'Santa Monica, CA', region: 'Pacific' },
  { id: '9411340', name: 'Santa Barbara, CA', region: 'Pacific' },
  { id: '9413450', name: 'Monterey, CA', region: 'Pacific' },
  { id: '9414290', name: 'San Francisco, CA', region: 'Pacific' },
  { id: '9418767', name: 'Crescent City, CA', region: 'Pacific' },
  { id: '9431647', name: 'Port Orford, OR', region: 'Pacific' },
  { id: '9447130', name: 'Seattle, WA', region: 'Pacific' },
  // Hawaii
  { id: '1612340', name: 'Honolulu, HI', region: 'Hawaii' },
  { id: '1617760', name: 'Hilo, HI', region: 'Hawaii' },
  { id: '1612480', name: 'Mokuoloe, HI', region: 'Hawaii' },
  // Gulf
  { id: '8729108', name: 'Panama City, FL', region: 'Gulf' },
  { id: '8770475', name: 'Port Arthur, TX', region: 'Gulf' },
  { id: '8761724', name: 'Grand Isle, LA', region: 'Gulf' },
  // East coast
  { id: '8723214', name: 'Virginia Key, FL', region: 'Atlantic' },
  { id: '8665530', name: 'Charleston, SC', region: 'Atlantic' },
  { id: '8638610', name: 'Sewells Point, VA', region: 'Atlantic' },
  { id: '8443970', name: 'Boston, MA', region: 'Atlantic' },
  { id: '8518750', name: 'The Battery, NY', region: 'Atlantic' },
  // Alaska
  { id: '9455090', name: 'Seward, AK', region: 'Alaska' },
  { id: '9455920', name: 'Anchorage, AK', region: 'Alaska' },
];

export function getRandomStation(): NoaaStation {
  return NOAA_STATIONS[Math.floor(Math.random() * NOAA_STATIONS.length)];
}
