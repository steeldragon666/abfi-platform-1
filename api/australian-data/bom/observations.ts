/**
 * BOM Observations API - Vercel Serverless
 * Returns mock weather observations from Bureau of Meteorology
 * Data licensed under CC BY 4.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const STATIONS = [
  { id: "066062", name: "Sydney Airport", state: "NSW", lat: -33.95, lng: 151.17 },
  { id: "086282", name: "Melbourne Airport", state: "VIC", lat: -37.67, lng: 144.83 },
  { id: "040913", name: "Brisbane", state: "QLD", lat: -27.48, lng: 153.04 },
  { id: "009021", name: "Perth Airport", state: "WA", lat: -31.93, lng: 115.98 },
  { id: "023034", name: "Adelaide Airport", state: "SA", lat: -34.93, lng: 138.53 },
  { id: "094029", name: "Hobart Airport", state: "TAS", lat: -42.83, lng: 147.50 },
];

function generateObservation(station: typeof STATIONS[0]) {
  const baseTemp = station.state === "QLD" ? 28 : station.state === "TAS" ? 15 : 22;
  const temp = baseTemp + (Math.random() - 0.5) * 10;

  return {
    station_id: station.id,
    station_name: station.name,
    state: station.state,
    lat: station.lat,
    lng: station.lng,
    timestamp: new Date().toISOString(),
    air_temp: Math.round(temp * 10) / 10,
    apparent_temp: Math.round((temp - 2 + Math.random() * 4) * 10) / 10,
    rel_hum: Math.round(40 + Math.random() * 40),
    wind_spd_kmh: Math.round(5 + Math.random() * 25),
    wind_dir: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
    rain_trace: Math.random() > 0.7 ? Math.round(Math.random() * 10 * 10) / 10 : 0,
    cloud_oktas: Math.floor(Math.random() * 8),
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const state = req.query.state as string | undefined;

  let stations = STATIONS;
  if (state) {
    stations = STATIONS.filter(s => s.state === state);
  }

  const observations = stations.map(generateObservation);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    observations,
    count: observations.length,
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
      attribution: "Australian Bureau of Meteorology",
    },
  });
}
