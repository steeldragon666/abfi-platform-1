/**
 * Climate API Router
 * REST API endpoints for climate intelligence data
 */

import { Router, Request, Response, NextFunction } from "express";
import { climateIntelligenceService } from "./services/climateIntelligenceService";
import { runAllBomJobs } from "./bomIngestionJobs";
import { getDb } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  bomWarnings,
  bomForecasts,
  seasonalOutlooks,
  agriculturalClimateMetrics,
  bomIngestionRuns,
  properties,
} from "../drizzle/schema";
import { AGRICULTURAL_REGIONS } from "./connectors/bomConnector";

const router = Router();

// Error handling wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /risk/:lat/:lng
 * Get climate risk assessment for a location
 */
router.get("/risk/:lat/:lng", asyncHandler(async (req: Request, res: Response) => {
  const latitude = parseFloat(req.params.lat);
  const longitude = parseFloat(req.params.lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  if (latitude < -45 || latitude > -10 || longitude < 110 || longitude > 155) {
    return res.status(400).json({ error: "Coordinates outside Australian bounds" });
  }

  const includeHistorical = req.query.historical !== "false";
  const forecastDays = parseInt(req.query.forecastDays as string) || 14;

  const assessment = await climateIntelligenceService.getClimateRiskAssessment(
    latitude,
    longitude,
    { includeHistorical, forecastDays }
  );

  res.json(assessment);
}));

/**
 * GET /risk/property/:propertyId
 * Get climate risk assessment for a property
 */
router.get("/risk/property/:propertyId", asyncHandler(async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId);

  if (isNaN(propertyId)) {
    return res.status(400).json({ error: "Invalid property ID" });
  }

  const db = await getDb();
  if (!db) {
    return res.status(503).json({ error: "Database not available" });
  }

  // Get property coordinates from database
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property || !property.latitude || !property.longitude) {
    return res.status(404).json({ error: "Property not found or missing coordinates" });
  }

  const assessment = await climateIntelligenceService.getClimateRiskAssessment(
    parseFloat(property.latitude),
    parseFloat(property.longitude)
  );

  res.json({
    propertyId,
    propertyName: property.name,
    ...assessment,
  });
}));

/**
 * GET /seasonal
 * Get seasonal climate outlook for all agricultural regions
 */
router.get("/seasonal", asyncHandler(async (req: Request, res: Response) => {
  const region = req.query.region as string | undefined;
  const state = req.query.state as string | undefined;

  const forecasts = await climateIntelligenceService.getSeasonalForecast(region, state);
  res.json(forecasts);
}));

/**
 * GET /seasonal/:region
 * Get seasonal outlook for a specific region
 */
router.get("/seasonal/:region", asyncHandler(async (req: Request, res: Response) => {
  const region = req.params.region;

  const forecasts = await climateIntelligenceService.getSeasonalForecast(region);

  if (forecasts.length === 0) {
    return res.status(404).json({ error: "No seasonal outlook found for region" });
  }

  res.json(forecasts[0]);
}));

/**
 * GET /metrics/:lat/:lng
 * Get growing season metrics for a location
 */
router.get("/metrics/:lat/:lng", asyncHandler(async (req: Request, res: Response) => {
  const latitude = parseFloat(req.params.lat);
  const longitude = parseFloat(req.params.lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  // Default to current growing season (Apr-Nov for winter crops, Oct-Mar for summer)
  const now = new Date();
  const month = now.getMonth();

  let seasonStart: string;
  let seasonEnd: string;

  if (req.query.start && req.query.end) {
    seasonStart = req.query.start as string;
    seasonEnd = req.query.end as string;
  } else if (month >= 3 && month <= 9) {
    // Winter crop season (Apr-Oct)
    seasonStart = `${now.getFullYear()}-04-01`;
    seasonEnd = `${now.getFullYear()}-10-31`;
  } else {
    // Summer crop season (Oct-Mar)
    const year = month >= 9 ? now.getFullYear() : now.getFullYear() - 1;
    seasonStart = `${year}-10-01`;
    seasonEnd = `${year + 1}-03-31`;
  }

  const metrics = await climateIntelligenceService.getGrowingSeasonMetrics(
    latitude,
    longitude,
    seasonStart,
    seasonEnd
  );

  res.json(metrics);
}));

/**
 * GET /metrics/property/:propertyId
 * Get climate metrics for a property
 */
router.get("/metrics/property/:propertyId", asyncHandler(async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId);

  if (isNaN(propertyId)) {
    return res.status(400).json({ error: "Invalid property ID" });
  }

  // Default to last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const start = (req.query.start as string) || startDate.toISOString().split("T")[0];
  const end = (req.query.end as string) || endDate.toISOString().split("T")[0];

  const metrics = await climateIntelligenceService.getPropertyClimateMetrics(
    propertyId,
    start,
    end
  );

  if (!metrics) {
    return res.status(404).json({ error: "Property not found or missing coordinates" });
  }

  res.json({ propertyId, ...metrics });
}));

/**
 * GET /warnings
 * Get active weather warnings
 */
router.get("/warnings", asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state as string | undefined;
  const severity = req.query.severity as string | undefined;
  const type = req.query.type as string | undefined;

  const warnings = await climateIntelligenceService.getActiveWarnings({
    state,
    severity,
    type,
  });

  res.json({
    count: warnings.length,
    warnings,
  });
}));

/**
 * GET /warnings/active
 * Get all currently active warnings from database
 */
router.get("/warnings/active", asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state as string | undefined;

  const db = await getDb();
  if (!db) {
    return res.status(503).json({ error: "Database not available" });
  }

  const warnings = await db
    .select()
    .from(bomWarnings)
    .where(eq(bomWarnings.active, true))
    .orderBy(desc(bomWarnings.issueTime));

  // Filter by state if provided
  const filtered = state
    ? warnings.filter(w => w.state === state)
    : warnings;

  res.json({
    count: filtered.length,
    warnings: filtered,
  });
}));

/**
 * GET /forecast/:lat/:lng
 * Get weather forecast for a location
 */
router.get("/forecast/:lat/:lng", asyncHandler(async (req: Request, res: Response) => {
  const latitude = parseFloat(req.params.lat);
  const longitude = parseFloat(req.params.lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  const db = await getDb();
  if (!db) {
    return res.status(503).json({ error: "Database not available" });
  }

  // Find nearest region
  let nearestRegion = AGRICULTURAL_REGIONS[0];
  let minDist = Number.MAX_VALUE;

  for (const region of AGRICULTURAL_REGIONS) {
    const dist = Math.sqrt(
      Math.pow(region.lat - latitude, 2) + Math.pow(region.lng - longitude, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearestRegion = region;
    }
  }

  // Get latest forecast for the region
  const forecasts = await db
    .select()
    .from(bomForecasts)
    .where(eq(bomForecasts.locationName, nearestRegion.name))
    .orderBy(desc(bomForecasts.issueTime))
    .limit(7);

  res.json({
    region: nearestRegion.name,
    state: nearestRegion.state,
    distance: Math.round(minDist * 111), // Approximate km
    forecasts,
  });
}));

/**
 * GET /regions
 * Get list of agricultural regions covered by climate data
 */
router.get("/regions", asyncHandler(async (req: Request, res: Response) => {
  res.json({
    regions: AGRICULTURAL_REGIONS.map(r => ({
      name: r.name,
      state: r.state,
      latitude: r.lat,
      longitude: r.lng,
    })),
  });
}));

/**
 * GET /historical/:lat/:lng
 * Get historical climate data for a location
 */
router.get("/historical/:lat/:lng", asyncHandler(async (req: Request, res: Response) => {
  const latitude = parseFloat(req.params.lat);
  const longitude = parseFloat(req.params.lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  // Default to last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const start = (req.query.start as string) || startDate.toISOString().split("T")[0];
  const end = (req.query.end as string) || endDate.toISOString().split("T")[0];

  const data = await climateIntelligenceService.getHistoricalClimateData(
    latitude,
    longitude,
    start,
    end
  );

  res.json({
    location: { latitude, longitude },
    period: { start, end },
    count: data.length,
    data,
  });
}));

/**
 * GET /ingestion/status
 * Get status of recent ingestion runs
 */
router.get("/ingestion/status", asyncHandler(async (req: Request, res: Response) => {
  const db = await getDb();
  if (!db) {
    return res.status(503).json({ error: "Database not available" });
  }

  const limit = parseInt(req.query.limit as string) || 20;

  const runs = await db
    .select()
    .from(bomIngestionRuns)
    .orderBy(desc(bomIngestionRuns.startedAt))
    .limit(limit);

  res.json({
    count: runs.length,
    runs,
  });
}));

/**
 * POST /ingest
 * Trigger manual ingestion of BOM data (admin only)
 */
router.post("/ingest", asyncHandler(async (req: Request, res: Response) => {
  console.log("[Climate API] Manual ingestion triggered");

  try {
    const results = await runAllBomJobs();

    res.json({
      success: true,
      message: "BOM ingestion completed",
      results,
    });
  } catch (error) {
    console.error("[Climate API] Ingestion failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Ingestion failed",
    });
  }
}));

/**
 * GET /overview
 * Get climate intelligence overview for all regions
 */
router.get("/overview", asyncHandler(async (req: Request, res: Response) => {
  const db = await getDb();
  if (!db) {
    return res.status(503).json({ error: "Database not available" });
  }

  // Get latest warnings count
  const activeWarnings = await db
    .select()
    .from(bomWarnings)
    .where(eq(bomWarnings.active, true));

  // Get latest seasonal outlooks
  const latestOutlooks = await db
    .select()
    .from(seasonalOutlooks)
    .orderBy(desc(seasonalOutlooks.issueDate))
    .limit(12);

  // Group outlooks by dominant condition
  const belowAvgRainRegions = latestOutlooks.filter(
    o => (o.rainBelowMedianPercent || 0) > 50
  ).map(o => o.region);
  const aboveAvgRainRegions = latestOutlooks.filter(
    o => (o.rainAboveMedianPercent || 0) > 50
  ).map(o => o.region);

  // Get recent ingestion status
  const [latestIngestion] = await db
    .select()
    .from(bomIngestionRuns)
    .orderBy(desc(bomIngestionRuns.startedAt))
    .limit(1);

  res.json({
    summary: {
      regionsMonitored: AGRICULTURAL_REGIONS.length,
      activeWarnings: activeWarnings.length,
      warningsByType: groupByType(activeWarnings),
      lastDataUpdate: latestIngestion?.finishedAt || latestIngestion?.startedAt,
    },
    seasonalOutlook: {
      belowAverageRainfall: {
        count: belowAvgRainRegions.length,
        regions: belowAvgRainRegions,
      },
      aboveAverageRainfall: {
        count: aboveAvgRainRegions.length,
        regions: aboveAvgRainRegions,
      },
    },
    warnings: activeWarnings.slice(0, 5).map(w => ({
      type: w.warningType,
      severity: w.severity,
      title: w.title,
      state: w.state,
      issueTime: w.issueTime,
    })),
  });
}));

// Helper function to group warnings by type
function groupByType(warnings: any[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const w of warnings) {
    groups[w.warningType] = (groups[w.warningType] || 0) + 1;
  }
  return groups;
}

// Error handler
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[Climate API] Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

export const climateRouter = router;
