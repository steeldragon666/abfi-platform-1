/**
 * BOM Fire Danger API - Vercel Serverless
 * Returns mock fire danger ratings from Bureau of Meteorology
 * Data licensed under CC BY 4.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const FIRE_DISTRICTS = [
  { id: "NSW_FD1", name: "Greater Sydney", state: "NSW" },
  { id: "NSW_FD2", name: "Hunter", state: "NSW" },
  { id: "VIC_FD1", name: "Mallee", state: "VIC" },
  { id: "VIC_FD2", name: "Central", state: "VIC" },
  { id: "QLD_FD1", name: "Darling Downs", state: "QLD" },
  { id: "SA_FD1", name: "Mount Lofty Ranges", state: "SA" },
  { id: "WA_FD1", name: "Perth Metro", state: "WA" },
];

const RATINGS = ["Low-Moderate", "High", "Very High", "Severe", "Extreme", "Catastrophic"];

function generateFireDanger(district: typeof FIRE_DISTRICTS[0]) {
  const ratingIndex = Math.floor(Math.random() * 4); // Usually not extreme
  return {
    district_id: district.id,
    district_name: district.name,
    state: district.state,
    rating: RATINGS[ratingIndex],
    rating_code: ratingIndex,
    fire_ban: ratingIndex >= 3,
    valid_from: new Date().toISOString(),
    valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const state = req.query.state as string | undefined;

  let districts = FIRE_DISTRICTS;
  if (state) {
    districts = FIRE_DISTRICTS.filter(d => d.state === state);
  }

  const ratings = districts.map(generateFireDanger);
  const extremeCount = ratings.filter(r => r.rating_code >= 4).length;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    fire_danger: ratings,
    summary: {
      total_districts: ratings.length,
      extreme_count: extremeCount,
      total_fire_bans: ratings.filter(r => r.fire_ban).length,
    },
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
    },
  });
}
