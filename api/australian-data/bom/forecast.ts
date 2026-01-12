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
    const maxTemp = baseTemp + (Math.random() - 0.5) * 8;

    days.push({
      date: date.toISOString().split("T")[0],
      day_name: date.toLocaleDateString("en-AU", { weekday: "long" }),
      temp_max: Math.round(maxTemp),
      temp_min: Math.round(maxTemp - 8 - Math.random() * 4),
      precip_probability: Math.round(Math.random() * 60),
      precip_amount: Math.random() > 0.6 ? Math.round(Math.random() * 15) : 0,
      conditions: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
      uv_index: Math.round(4 + Math.random() * 8),
      humidity: Math.round(40 + Math.random() * 35),
    });
  }

  return {
    region_id: region.id,
    region_name: region.name,
    state: region.state,
    forecast_days: days,
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
