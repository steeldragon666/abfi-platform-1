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

const RATING_LEGEND = {
  0: { level: "Low-Moderate", color: "#4CAF50" },
  1: { level: "High", color: "#FFC107" },
  2: { level: "Very High", color: "#FF9800" },
  3: { level: "Severe", color: "#F44336" },
  4: { level: "Extreme", color: "#9C27B0" },
  5: { level: "Catastrophic", color: "#000000" },
};

function generateFireDanger(district: typeof FIRE_DISTRICTS[0]) {
  const rating = Math.floor(Math.random() * 4); // Usually not extreme
  return {
    id: district.id,
    name: district.name,
    state: district.state,
    rating,
    ratingInfo: RATING_LEGEND[rating as keyof typeof RATING_LEGEND],
    fireBan: rating >= 3,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const state = req.query.state as string | undefined;

  let filteredDistricts = FIRE_DISTRICTS;
  if (state) {
    filteredDistricts = FIRE_DISTRICTS.filter(d => d.state === state);
  }

  const districts = filteredDistricts.map(generateFireDanger);
  const extremeStates = [...new Set(districts.filter(d => d.rating >= 4).map(d => d.state))];

  // Count by rating
  const byRating: Record<string, number> = {};
  districts.forEach(d => {
    const level = d.ratingInfo.level;
    byRating[level] = (byRating[level] || 0) + 1;
  });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    districts,
    summary: {
      totalDistricts: districts.length,
      statesWithExtreme: extremeStates,
      byRating,
      totalFireBans: districts.filter(d => d.fireBan).length,
    },
    ratingLegend: RATING_LEGEND,
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
    },
  });
}
