/**
 * BOM Drought Status API - Vercel Serverless
 * Returns mock drought status from Bureau of Meteorology
 * Data licensed under CC BY 4.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DROUGHT_REGIONS = [
  { id: "NSW_DR1", name: "Western NSW", state: "NSW", area_pct: 35 },
  { id: "NSW_DR2", name: "Central West", state: "NSW", area_pct: 15 },
  { id: "QLD_DR1", name: "Southern Queensland", state: "QLD", area_pct: 25 },
  { id: "VIC_DR1", name: "Northern Victoria", state: "VIC", area_pct: 10 },
  { id: "SA_DR1", name: "Upper North", state: "SA", area_pct: 20 },
  { id: "WA_DR1", name: "Wheatbelt", state: "WA", area_pct: 12 },
];

const STATUSES = ["Normal", "Below Average", "Drought Watch", "Drought Declared", "Recovering"];

const FEEDSTOCK_CROPS = ["Canola", "Wheat", "Tallow", "UCO Feedstock"];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const regions = DROUGHT_REGIONS.map(region => {
    const statusIndex = Math.floor(Math.random() * STATUSES.length);
    const rainfallDeficiency = statusIndex >= 2 ? Math.round(15 + Math.random() * 35) : Math.round(Math.random() * 15);
    const impactedCrops = statusIndex >= 2
      ? FEEDSTOCK_CROPS.slice(0, Math.floor(1 + Math.random() * 3))
      : [];

    return {
      id: region.id,
      name: region.name,
      state: region.state,
      status: STATUSES[statusIndex],
      statusCode: statusIndex,
      rainfallDeficiency,
      waterStorages: Math.round(30 + Math.random() * 50),
      impactedCrops,
      lastUpdated: new Date().toISOString(),
    };
  });

  const droughtCount = regions.filter(r => r.status === "Drought Declared").length;
  const recoveringCount = regions.filter(r => r.status === "Recovering").length;
  const normalCount = regions.filter(r => r.status === "Normal").length;
  const totalCount = regions.length;

  // Bioenergy impact
  const affectedFeedstockRegions = regions
    .filter(r => r.statusCode >= 2)
    .map(r => ({
      region: r.name,
      feedstock: r.impactedCrops[0] || "General crops",
      impactLevel: r.statusCode >= 3 ? "High" : "Moderate",
      productionReduction: Math.round(10 + Math.random() * 25),
    }));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    regions,
    summary: {
      areasInDrought: Math.round((droughtCount / totalCount) * 100),
      areasRecovering: Math.round((recoveringCount / totalCount) * 100),
      areasNormal: Math.round((normalCount / totalCount) * 100),
      totalRegions: totalCount,
    },
    bioenergyImpact: {
      affectedFeedstockRegions,
      overallRisk: droughtCount >= 2 ? "High" : droughtCount >= 1 ? "Moderate" : "Low",
    },
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
    },
  });
}
