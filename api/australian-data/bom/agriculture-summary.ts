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
  const season = new Date().getMonth() >= 9 || new Date().getMonth() <= 2 ? "Summer" : "Winter";

  const commoditySummaries = COMMODITIES.map(commodity => {
    const growthStage = Math.random() > 0.5 ? "vegetative" : "reproductive";
    const conditionScore = 60 + Math.random() * 30;

    return {
      commodity: commodity.name,
      regions: commodity.regions,
      currentSeason: season,
      growthStage,
      conditionScore: Math.round(conditionScore),
      rainfallAdequacy: conditionScore > 75 ? "adequate" : conditionScore > 60 ? "marginal" : "deficit",
      heatStressRisk: Math.random() > 0.7 ? "elevated" : "normal",
      frostRisk: season === "Winter" && Math.random() > 0.6 ? "elevated" : "low",
      yieldOutlook: conditionScore > 80 ? "above_average" : conditionScore > 65 ? "average" : "below_average",
    };
  });

  const nationalOutlook = {
    temperature: "Above average temperatures expected in northern regions",
    rainfall: "Near average rainfall for most agricultural regions",
    soilMoisture: "Adequate in eastern states, declining in western regions",
  };

  const keyDates = [
    { event: "Winter crop harvest", timing: "October - December" },
    { event: "Summer planting window", timing: "November - January" },
    { event: "Canola flowering", timing: "August - September" },
  ];

  const feedstockImplications = {
    canola: {
      availability: "Near Average",
      priceOutlook: "Stable",
      reason: "Good growing conditions in main production areas",
    },
    tallow: {
      availability: "Above Average",
      priceOutlook: "Slightly lower",
      reason: "Strong livestock numbers in feedlot regions",
    },
    uco: {
      availability: "Near Average",
      priceOutlook: "Stable",
      reason: "Steady demand from food service sector",
    },
  };

  const regionalConditions = [
    { region: "Eastern Australia", states: ["NSW", "VIC", "QLD"], outlook: "Favorable", keyRisks: ["Late frost risk in elevated areas", "Heat stress in northern zones"] },
    { region: "Western Australia", states: ["WA"], outlook: "Mixed", keyRisks: ["Below average soil moisture", "Limited late season rainfall"] },
    { region: "Southern Australia", states: ["SA", "TAS"], outlook: "Favorable", keyRisks: ["Harvest timing concerns", "Storage capacity"] },
  ];

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    commodities: commoditySummaries,
    season,
    nationalOutlook,
    keyDates,
    feedstockImplications,
    regionalConditions,
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology / ABARES",
      license: "CC BY 4.0",
      attribution: "Australian Bureau of Meteorology",
    },
  });
}
