/**
 * BOM Agriculture Summary API - Vercel Serverless
 * Returns mock agricultural weather summary from Bureau of Meteorology
 * Data licensed under CC BY 4.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const COMMODITIES = [
  { name: "Wheat", regions: ["NSW", "VIC", "SA", "WA"] },
  { name: "Canola", regions: ["NSW", "VIC", "WA"] },
  { name: "Barley", regions: ["SA", "VIC", "WA"] },
  { name: "Cotton", regions: ["NSW", "QLD"] },
  { name: "Sugarcane", regions: ["QLD"] },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const season = new Date().getMonth() >= 9 || new Date().getMonth() <= 2 ? "summer" : "winter";

  const commoditySummaries = COMMODITIES.map(commodity => {
    const growthStage = Math.random() > 0.5 ? "vegetative" : "reproductive";
    const conditionScore = 60 + Math.random() * 30;

    return {
      commodity: commodity.name,
      regions: commodity.regions,
      current_season: season,
      growth_stage: growthStage,
      condition_score: Math.round(conditionScore),
      rainfall_adequacy: conditionScore > 75 ? "adequate" : conditionScore > 60 ? "marginal" : "deficit",
      heat_stress_risk: Math.random() > 0.7 ? "elevated" : "normal",
      frost_risk: season === "winter" && Math.random() > 0.6 ? "elevated" : "low",
      yield_outlook: conditionScore > 80 ? "above_average" : conditionScore > 65 ? "average" : "below_average",
    };
  });

  const nationalSummary = {
    avg_condition_score: Math.round(commoditySummaries.reduce((s, c) => s + c.condition_score, 0) / commoditySummaries.length),
    regions_with_deficit: commoditySummaries.filter(c => c.rainfall_adequacy === "deficit").length,
    active_heat_stress: commoditySummaries.filter(c => c.heat_stress_risk === "elevated").length,
    season_outlook: "near_average",
  };

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    commodities: commoditySummaries,
    national_summary: nationalSummary,
    season,
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology / ABARES",
      license: "CC BY 4.0",
      attribution: "Australian Bureau of Meteorology",
    },
  });
}
