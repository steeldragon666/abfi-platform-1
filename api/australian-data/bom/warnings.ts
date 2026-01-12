/**
 * BOM Warnings API - Vercel Serverless
 * Returns mock weather warnings from Bureau of Meteorology
 * Data licensed under CC BY 4.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const WARNING_TYPES = [
  { type: "heat_wave", title: "Severe Heatwave Warning", severity: "severe" },
  { type: "storm", title: "Severe Thunderstorm Warning", severity: "severe" },
  { type: "flood", title: "Minor Flood Warning", severity: "minor" },
  { type: "fire", title: "Extreme Fire Danger", severity: "extreme" },
  { type: "wind", title: "Strong Wind Warning", severity: "moderate" },
];

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS"];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const state = req.query.state as string | undefined;

  // Generate 0-3 random warnings
  const numWarnings = Math.floor(Math.random() * 4);
  const warnings = [];

  for (let i = 0; i < numWarnings; i++) {
    const warningType = WARNING_TYPES[Math.floor(Math.random() * WARNING_TYPES.length)];
    const warningState = state || STATES[Math.floor(Math.random() * STATES.length)];

    warnings.push({
      id: `W${Date.now()}${i}`,
      type: warningType.type,
      title: warningType.title,
      severity: warningType.severity,
      state: warningState,
      areas: [`${warningState} Region ${i + 1}`],
      issued: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
      expires: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      description: `${warningType.title} for parts of ${warningState}. Take appropriate precautions.`,
    });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    warnings,
    count: warnings.length,
    active_severe: warnings.filter(w => w.severity === "severe" || w.severity === "extreme").length,
    timestamp: new Date().toISOString(),
    source: {
      provider: "Bureau of Meteorology",
      license: "CC BY 4.0",
    },
  });
}
