/**
 * BOM Forecast API - Vercel Serverless
 * Returns mock 7-day weather forecasts from Bureau of Meteorology
 * Data licensed under CC BY 4.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REGIONS = [
  { id: "NSW_PT131", name: "Sydney", state: "NSW" },
  { id: "VIC_PT042", name: "Melbourne", state: "VIC" },
  { id: "QLD_PT001", name: "Brisbane", state: "QLD" },
  { id: "WA_PT015", name: "Perth", state: "WA" },
  { id: "SA_PT014", name: "Adelaide", state: "SA" },
  { id: "TAS_PT016", name: "Hobart", state: "TAS" },
];

const CONDITIONS = ["Sunny", "Partly cloudy", "Cloudy", "Showers", "Rain", "Fine"];

function generateForecast(region: typeof REGIONS[0]) {
  const baseTemp = region.state === "QLD" ? 30 : region.state === "TAS" ? 18 : 25;
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const maxTemp = Math.round(baseTemp + (Math.random() - 0.5) * 8);
    const rainChance = Math.round(Math.random() * 60);
    const conditions = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

    // Agriculture outlook based on conditions
    const harvestConditions = rainChance > 40 ? "Poor" : rainChance > 20 ? "Moderate" : "Good";

    days.push({
      date: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("en-AU", { weekday: "long" }),
      maxTemp,
      minTemp: Math.round(maxTemp - 8 - Math.random() * 4),
      rainChance,
      rainAmount: Math.random() > 0.6 ? Math.round(Math.random() * 15) : 0,
      conditions,
      uvIndex: Math.round(4 + Math.random() * 8),
      humidity: Math.round(40 + Math.random() * 35),
      agricultureOutlook: {
        harvestConditions,
        sprayConditions: rainChance > 30 ? "Poor" : "Good",
      },
    });
  }

  return {
    station: {
      id: region.id,
      name: region.name,
      state: region.state,
    },
    forecasts: days,
    issued: new Date().toISOString(),
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const state = req.query.state as string | undefined;

  let regions = REGIONS;
  if (state) {
    regions = REGIONS.filter(r => r.state === state);
  }

  const forecasts = regions.map(generateForecast);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    forecasts,
    count: forecasts.length,
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
      attribution: "Australian Bureau of Meteorology",
    },
  });
}
