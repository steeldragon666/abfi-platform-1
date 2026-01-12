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

export default function handler(req: VercelRequest, res: VercelResponse) {
  const regions = DROUGHT_REGIONS.map(region => {
    const statusIndex = Math.floor(Math.random() * STATUSES.length);
    const rainfallDeficit = statusIndex >= 2 ? Math.round(15 + Math.random() * 35) : Math.round(Math.random() * 15);

    return {
      region_id: region.id,
      region_name: region.name,
      state: region.state,
      status: STATUSES[statusIndex],
      status_code: statusIndex,
      area_affected_pct: region.area_pct,
      rainfall_deficit_pct: rainfallDeficit,
      months_below_avg: statusIndex >= 2 ? Math.floor(3 + Math.random() * 18) : 0,
      last_updated: new Date().toISOString(),
    };
  });

  const droughtDeclared = regions.filter(r => r.status === "Drought Declared").length;
  const totalAffectedArea = regions.reduce((sum, r) => sum + (r.status_code >= 2 ? r.area_affected_pct : 0), 0);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    drought_status: regions,
    summary: {
      total_regions: regions.length,
      drought_declared: droughtDeclared,
      total_affected_area_pct: Math.round(totalAffectedArea / regions.length),
    },
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
    },
  });
}
