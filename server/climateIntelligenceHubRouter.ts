/**
 * Climate Intelligence Hub Router
 * Unified API combining Google Earth Engine satellite data + BOM climate data
 *
 * Provides single-source-of-truth climate intelligence for bioenergy projects
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eq, and, gte, lte, desc, or, sql, inArray } from "drizzle-orm";
import {
  climateLocationData,
  bioenergyProjects,
  bomWarnings,
  seasonalOutlooks,
} from "../drizzle/schema";
import { climateIntelligenceService } from "./services/climateIntelligenceService";
import earthEngineService from "./services/earthEngine";
import { AGRICULTURAL_REGIONS } from "./connectors/bomConnector";

// Types for unified climate data
interface SatelliteData {
  ndvi: {
    mean: number;
    min: number;
    max: number;
    healthCategory: string;
  };
  vegetationHealth: {
    healthScore: number;
    evi: number;
    lai: number;
    trend: string;
    alerts: string[];
  };
  soilMoisture: {
    surfaceMoisture: number;
    rootZoneMoisture: number;
    moistureCategory: string;
    droughtRisk: string;
  };
}

interface ClimateData {
  current: {
    maxTemp: number | null;
    minTemp: number | null;
    rainfall: number | null;
    humidity: number | null;
  };
  forecast: {
    days: number;
    rainfallTotal: number;
    tempRange: { min: number; max: number };
    frostDays: number;
    heatStressDays: number;
  };
  seasonal: {
    rainfallOutlook: "below_average" | "near_average" | "above_average";
    temperatureOutlook: "below_average" | "near_average" | "above_average";
    probability: number;
  } | null;
  risks: {
    drought: { level: string; probability: number };
    frost: { level: string; daysExpected: number };
    heatStress: { level: string; daysExpected: number };
    flood: { level: string; probability: number };
  };
}

interface UnifiedClimateIntelligence {
  location: {
    latitude: number;
    longitude: number;
    region?: string;
    state?: string;
  };
  timestamp: string;
  satellite: SatelliteData;
  climate: ClimateData;
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    expiryTime?: string;
  }>;
  overallScore: number;
  recommendations: string[];
  dataFreshness: {
    satellite: string;
    climate: string;
  };
}

// Helper: Generate location hash for caching
function generateLocationHash(lat: number, lng: number): string {
  // Round to 2 decimal places (~1km precision) for caching
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  return `${roundedLat}_${roundedLng}`;
}

// Helper: Calculate overall climate score
function calculateOverallScore(satellite: SatelliteData, climate: ClimateData): number {
  let score = 100;

  // NDVI impact (30 points)
  const ndviScore = Math.min(satellite.ndvi.mean / 0.6, 1) * 30;
  score = score - 30 + ndviScore;

  // Vegetation health (20 points)
  const vegScore = (satellite.vegetationHealth.healthScore / 100) * 20;
  score = score - 20 + vegScore;

  // Soil moisture/drought (20 points)
  const droughtPenalty: Record<string, number> = { low: 0, moderate: 5, high: 10, severe: 20 };
  score -= droughtPenalty[satellite.soilMoisture.droughtRisk] || 0;

  // Climate risks (30 points)
  const riskPenalty: Record<string, number> = { low: 0, moderate: 5, high: 10, extreme: 15 };
  score -= riskPenalty[climate.risks.drought.level] || 0;
  score -= riskPenalty[climate.risks.frost.level] || 0;
  score -= riskPenalty[climate.risks.heatStress.level] || 0;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper: Generate recommendations based on data
function generateUnifiedRecommendations(
  satellite: SatelliteData,
  climate: ClimateData,
  alerts: any[]
): string[] {
  const recommendations: string[] = [];

  // Satellite-based recommendations
  if (satellite.ndvi.healthCategory === "poor" || satellite.ndvi.healthCategory === "bare") {
    recommendations.push("Vegetation cover is low - consider biomass availability impact");
  }

  if (satellite.vegetationHealth.trend === "declining") {
    recommendations.push("Vegetation health is declining - monitor feedstock quality");
  }

  if (satellite.soilMoisture.droughtRisk === "high" || satellite.soilMoisture.droughtRisk === "severe") {
    recommendations.push("High drought risk detected - assess water availability for operations");
  }

  // Climate-based recommendations
  if (climate.risks.drought.level === "high" || climate.risks.drought.level === "extreme") {
    recommendations.push("Drought conditions expected - plan for reduced biomass yields");
  }

  if (climate.risks.frost.daysExpected > 5) {
    recommendations.push("Multiple frost days forecast - may affect crop residue quality");
  }

  if (climate.risks.heatStress.daysExpected > 7) {
    recommendations.push("Heat stress conditions expected - monitor fire risk for storage");
  }

  if (climate.seasonal?.rainfallOutlook === "below_average") {
    recommendations.push("Below-average rainfall forecast - consider feedstock security measures");
  }

  // Alert-based recommendations
  if (alerts.some(a => a.type === "fire")) {
    recommendations.push("Active fire warnings - review emergency procedures");
  }

  if (alerts.some(a => a.type === "flood")) {
    recommendations.push("Flood warnings active - assess logistics and access routes");
  }

  if (recommendations.length === 0) {
    recommendations.push("Climate conditions are favorable for operations");
  }

  return recommendations;
}

export const climateIntelligenceHubRouter = router({
  /**
   * Get unified climate intelligence for a location
   * Combines GEE satellite data + BOM climate data
   */
  getLocationIntelligence: publicProcedure
    .input(z.object({
      lat: z.number().min(-45).max(-10),
      lng: z.number().min(110).max(155),
      includeHistorical: z.boolean().optional().default(false),
      forceRefresh: z.boolean().optional().default(false),
    }))
    .query(async ({ input }): Promise<UnifiedClimateIntelligence> => {
      const { lat, lng, includeHistorical, forceRefresh } = input;
      const db = await getDb();

      // Check cache first (unless force refresh)
      if (db && !forceRefresh) {
        const locationHash = generateLocationHash(lat, lng);
        const cached = await db
          .select()
          .from(climateLocationData)
          .where(eq(climateLocationData.locationHash, locationHash))
          .limit(1);

        if (cached.length > 0) {
          const cacheAge = Date.now() - new Date(cached[0].updatedAt).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < maxAge) {
            // Return cached data
            return {
              location: {
                latitude: parseFloat(cached[0].latitude),
                longitude: parseFloat(cached[0].longitude),
                state: cached[0].state || undefined,
              },
              timestamp: cached[0].updatedAt.toISOString(),
              satellite: {
                ndvi: {
                  mean: parseFloat(cached[0].ndviMean || "0"),
                  min: parseFloat(cached[0].ndviMin || "0"),
                  max: parseFloat(cached[0].ndviMax || "0"),
                  healthCategory: cached[0].ndviCategory || "unknown",
                },
                vegetationHealth: {
                  healthScore: cached[0].vegetationHealthScore || 50,
                  evi: parseFloat(cached[0].vegetationEVI || "0"),
                  lai: parseFloat(cached[0].vegetationLAI || "0"),
                  trend: cached[0].vegetationTrend || "stable",
                  alerts: [],
                },
                soilMoisture: {
                  surfaceMoisture: parseFloat(cached[0].soilMoistureSurface || "0"),
                  rootZoneMoisture: parseFloat(cached[0].soilMoistureRootZone || "0"),
                  moistureCategory: "moderate",
                  droughtRisk: cached[0].droughtRisk || "low",
                },
              },
              climate: {
                current: {
                  maxTemp: parseFloat(cached[0].tempMaxAvg30Days || "0") || null,
                  minTemp: parseFloat(cached[0].tempMinAvg30Days || "0") || null,
                  rainfall: parseFloat(cached[0].rainfallLast30Days || "0"),
                  humidity: null,
                },
                forecast: {
                  days: 14,
                  rainfallTotal: 0,
                  tempRange: {
                    min: parseFloat(cached[0].tempMinAvg30Days || "0"),
                    max: parseFloat(cached[0].tempMaxAvg30Days || "0"),
                  },
                  frostDays: cached[0].frostDaysLast30 || 0,
                  heatStressDays: cached[0].heatStressDaysLast30 || 0,
                },
                seasonal: null,
                risks: {
                  drought: { level: cached[0].droughtRisk || "low", probability: 0 },
                  frost: { level: "low", daysExpected: 0 },
                  heatStress: { level: "low", daysExpected: 0 },
                  flood: { level: "low", probability: 0 },
                },
              },
              alerts: [],
              overallScore: 75,
              recommendations: [],
              dataFreshness: {
                satellite: cached[0].satelliteDataUpdatedAt?.toISOString() || "unknown",
                climate: cached[0].bomDataUpdatedAt?.toISOString() || "unknown",
              },
            };
          }
        }
      }

      // Fetch fresh data from both sources in parallel
      const [satelliteData, climateRisk, warnings] = await Promise.all([
        // GEE satellite data
        (async () => {
          try {
            const [ndvi, vegHealth, soilMoisture] = await Promise.all([
              earthEngineService.calculateNDVI(
                { lat, lng },
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                new Date().toISOString().split("T")[0]
              ),
              earthEngineService.getVegetationHealth({ lat, lng }, 6),
              earthEngineService.getSoilMoisture({ lat, lng }),
            ]);
            return { ndvi, vegHealth, soilMoisture };
          } catch (error) {
            console.error("[ClimateHub] GEE fetch failed:", error);
            // Return demo data if GEE unavailable
            return {
              ndvi: { mean: 0.45, min: 0.3, max: 0.6, healthCategory: "moderate" },
              vegHealth: { healthScore: 65, evi: 0.35, lai: 2.5, trend: "stable", alerts: [] },
              soilMoisture: { surfaceMoisture: 0.25, rootZoneMoisture: 0.3, moistureCategory: "moderate", droughtRisk: "low" },
            };
          }
        })(),

        // BOM climate risk assessment
        climateIntelligenceService.getClimateRiskAssessment(lat, lng, {
          includeHistorical,
          forecastDays: 14,
        }),

        // Active warnings
        climateIntelligenceService.getActiveWarnings(),
      ]);

      // Find region/state
      let nearestRegion = AGRICULTURAL_REGIONS[0];
      let minDist = Number.MAX_VALUE;
      for (const region of AGRICULTURAL_REGIONS) {
        const dist = Math.sqrt(Math.pow(region.lat - lat, 2) + Math.pow(region.lng - lng, 2));
        if (dist < minDist) {
          minDist = dist;
          nearestRegion = region;
        }
      }

      // Build unified response
      const satellite: SatelliteData = {
        ndvi: {
          mean: satelliteData.ndvi.mean,
          min: satelliteData.ndvi.min,
          max: satelliteData.ndvi.max,
          healthCategory: satelliteData.ndvi.healthCategory,
        },
        vegetationHealth: {
          healthScore: satelliteData.vegHealth.healthScore,
          evi: satelliteData.vegHealth.evi,
          lai: satelliteData.vegHealth.lai,
          trend: satelliteData.vegHealth.trend,
          alerts: satelliteData.vegHealth.alerts,
        },
        soilMoisture: {
          surfaceMoisture: satelliteData.soilMoisture.surfaceMoisture,
          rootZoneMoisture: satelliteData.soilMoisture.rootZoneMoisture,
          moistureCategory: satelliteData.soilMoisture.moistureCategory,
          droughtRisk: satelliteData.soilMoisture.droughtRisk,
        },
      };

      const climate: ClimateData = {
        current: {
          maxTemp: null,
          minTemp: null,
          rainfall: null,
          humidity: null,
        },
        forecast: {
          days: 14,
          rainfallTotal: 0,
          tempRange: { min: 10, max: 30 },
          frostDays: climateRisk.risks.frost.daysExpected,
          heatStressDays: climateRisk.risks.heatStress.daysExpected,
        },
        seasonal: null,
        risks: {
          drought: {
            level: climateRisk.risks.drought.level,
            probability: climateRisk.risks.drought.probability,
          },
          frost: {
            level: climateRisk.risks.frost.level,
            daysExpected: climateRisk.risks.frost.daysExpected,
          },
          heatStress: {
            level: climateRisk.risks.heatStress.level,
            daysExpected: climateRisk.risks.heatStress.daysExpected,
          },
          flood: {
            level: climateRisk.risks.flood.level,
            probability: climateRisk.risks.flood.probability,
          },
        },
      };

      const alerts = climateRisk.activeWarnings;
      const overallScore = calculateOverallScore(satellite, climate);
      const recommendations = generateUnifiedRecommendations(satellite, climate, alerts);

      // Cache the result
      if (db) {
        const locationHash = generateLocationHash(lat, lng);
        try {
          await db
            .insert(climateLocationData)
            .values({
              locationHash,
              latitude: lat.toString(),
              longitude: lng.toString(),
              state: nearestRegion.state as any,
              ndviMean: satellite.ndvi.mean.toString(),
              ndviMin: satellite.ndvi.min.toString(),
              ndviMax: satellite.ndvi.max.toString(),
              ndviCategory: satellite.ndvi.healthCategory as any,
              soilMoistureSurface: satellite.soilMoisture.surfaceMoisture.toString(),
              soilMoistureRootZone: satellite.soilMoisture.rootZoneMoisture.toString(),
              droughtRisk: climate.risks.drought.level as any,
              satelliteDataUpdatedAt: new Date(),
              bomDataUpdatedAt: new Date(),
            })
            .onDuplicateKeyUpdate({
              set: {
                ndviMean: satellite.ndvi.mean.toString(),
                ndviMin: satellite.ndvi.min.toString(),
                ndviMax: satellite.ndvi.max.toString(),
                ndviCategory: satellite.ndvi.healthCategory as any,
                soilMoistureSurface: satellite.soilMoisture.surfaceMoisture.toString(),
                soilMoistureRootZone: satellite.soilMoisture.rootZoneMoisture.toString(),
                droughtRisk: climate.risks.drought.level as any,
                satelliteDataUpdatedAt: new Date(),
                bomDataUpdatedAt: new Date(),
                updatedAt: new Date(),
              },
            });
        } catch (cacheError) {
          console.error("[ClimateHub] Cache update failed:", cacheError);
        }
      }

      return {
        location: {
          latitude: lat,
          longitude: lng,
          region: nearestRegion.name,
          state: nearestRegion.state,
        },
        timestamp: new Date().toISOString(),
        satellite,
        climate,
        alerts,
        overallScore,
        recommendations,
        dataFreshness: {
          satellite: new Date().toISOString(),
          climate: new Date().toISOString(),
        },
      };
    }),

  /**
   * Get climate data for multiple bioenergy projects
   */
  getProjectsClimate: publicProcedure
    .input(z.object({
      projectIds: z.array(z.number()).min(1).max(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get projects with coordinates
      const projects = await db
        .select({
          id: bioenergyProjects.id,
          name: bioenergyProjects.name,
          slug: bioenergyProjects.slug,
          latitude: bioenergyProjects.latitude,
          longitude: bioenergyProjects.longitude,
          state: bioenergyProjects.state,
        })
        .from(bioenergyProjects)
        .where(inArray(bioenergyProjects.id, input.projectIds));

      // Fetch climate data for each project with coordinates
      const results = await Promise.all(
        projects
          .filter(p => p.latitude && p.longitude)
          .map(async (project) => {
            try {
              const lat = parseFloat(project.latitude!);
              const lng = parseFloat(project.longitude!);

              // Get cached or fresh data
              const locationHash = generateLocationHash(lat, lng);
              const [cached] = await db
                .select()
                .from(climateLocationData)
                .where(eq(climateLocationData.locationHash, locationHash))
                .limit(1);

              if (cached) {
                return {
                  projectId: project.id,
                  projectName: project.name,
                  slug: project.slug,
                  state: project.state,
                  climate: {
                    ndvi: parseFloat(cached.ndviMean || "0"),
                    soilMoisture: parseFloat(cached.soilMoistureSurface || "0"),
                    droughtRisk: cached.droughtRisk || "low",
                    vegetationHealth: cached.vegetationHealthScore || 50,
                    lastUpdated: cached.updatedAt.toISOString(),
                  },
                };
              }

              // No cached data - return minimal info
              return {
                projectId: project.id,
                projectName: project.name,
                slug: project.slug,
                state: project.state,
                climate: null,
              };
            } catch (error) {
              return {
                projectId: project.id,
                projectName: project.name,
                slug: project.slug,
                state: project.state,
                climate: null,
                error: "Failed to fetch climate data",
              };
            }
          })
      );

      return { projects: results };
    }),

  /**
   * Get regional climate overview for a state
   */
  getRegionalOverview: publicProcedure
    .input(z.object({
      state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get active warnings for the state
      const warnings = await db
        .select()
        .from(bomWarnings)
        .where(and(
          eq(bomWarnings.state, input.state),
          eq(bomWarnings.active, true)
        ))
        .orderBy(desc(bomWarnings.issueTime))
        .limit(10);

      // Get seasonal outlooks for the state
      const outlooks = await db
        .select()
        .from(seasonalOutlooks)
        .where(eq(seasonalOutlooks.state, input.state))
        .orderBy(desc(seasonalOutlooks.issueDate))
        .limit(1);

      // Get projects in this state with climate data
      const projectsWithClimate = await db
        .select({
          id: bioenergyProjects.id,
          name: bioenergyProjects.name,
          status: bioenergyProjects.status,
          latitude: bioenergyProjects.latitude,
          longitude: bioenergyProjects.longitude,
        })
        .from(bioenergyProjects)
        .where(eq(bioenergyProjects.state, input.state))
        .limit(20);

      // Get climate data for state regions
      const regions = AGRICULTURAL_REGIONS.filter(r => r.state === input.state);

      // Calculate aggregate metrics
      const droughtLevels: Record<string, number> = { low: 0, moderate: 0, high: 0, extreme: 0 };

      // Get cached climate data for regions in state
      const cachedData = await db
        .select()
        .from(climateLocationData)
        .where(eq(climateLocationData.state, input.state));

      for (const data of cachedData) {
        if (data.droughtRisk) {
          droughtLevels[data.droughtRisk] = (droughtLevels[data.droughtRisk] || 0) + 1;
        }
      }

      // Determine dominant outlook
      let rainfallOutlook: "below_average" | "near_average" | "above_average" = "near_average";
      if (outlooks.length > 0) {
        const o = outlooks[0];
        if ((o.rainBelowMedianPercent || 0) > 50) rainfallOutlook = "below_average";
        else if ((o.rainAboveMedianPercent || 0) > 50) rainfallOutlook = "above_average";
      }

      return {
        state: input.state,
        timestamp: new Date().toISOString(),
        summary: {
          projectCount: projectsWithClimate.length,
          regionsMonitored: regions.length,
          activeWarnings: warnings.length,
          dominantDroughtRisk: Object.entries(droughtLevels)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "low",
          rainfallOutlook,
        },
        warnings: warnings.map(w => ({
          type: w.warningType,
          severity: w.severity,
          title: w.title,
          issueTime: w.issueTime?.toISOString(),
          expiryTime: w.expiryTime?.toISOString(),
        })),
        seasonalOutlook: outlooks.length > 0 ? {
          period: {
            start: outlooks[0].validPeriodStart?.toISOString().split("T")[0],
            end: outlooks[0].validPeriodEnd?.toISOString().split("T")[0],
            months: outlooks[0].validPeriodMonths,
          },
          rainfallBelowMedian: outlooks[0].rainBelowMedianPercent,
          rainfallAboveMedian: outlooks[0].rainAboveMedianPercent,
          tempAboveMedian: outlooks[0].maxTempAboveMedianPercent,
        } : null,
        projects: projectsWithClimate.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          hasCoordinates: !!(p.latitude && p.longitude),
        })),
      };
    }),

  /**
   * Get all active climate alerts across Australia
   */
  getClimateAlerts: publicProcedure
    .input(z.object({
      severity: z.enum(["all", "minor", "moderate", "severe", "extreme"]).optional().default("all"),
      state: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let query = db
        .select()
        .from(bomWarnings)
        .where(eq(bomWarnings.active, true))
        .orderBy(desc(bomWarnings.issueTime))
        .limit(50);

      const warnings = await query;

      // Filter by severity and state if specified
      let filtered = warnings;
      if (input.severity !== "all") {
        filtered = filtered.filter(w => w.severity === input.severity);
      }
      if (input.state) {
        filtered = filtered.filter(w => w.state === input.state);
      }

      // Group by type
      const byType: Record<string, typeof warnings> = {};
      for (const w of filtered) {
        const type = w.warningType || "other";
        if (!byType[type]) byType[type] = [];
        byType[type].push(w);
      }

      return {
        total: filtered.length,
        byType: Object.entries(byType).map(([type, items]) => ({
          type,
          count: items.length,
          alerts: items.map(w => ({
            id: w.id,
            type: w.warningType,
            severity: w.severity,
            title: w.title,
            state: w.state,
            issueTime: w.issueTime?.toISOString(),
            expiryTime: w.expiryTime?.toISOString(),
          })),
        })),
        states: Array.from(new Set(filtered.map(w => w.state).filter(Boolean))),
      };
    }),

  /**
   * Get climate data freshness status
   */
  getDataStatus: publicProcedure.query(async () => {
    const db = await getDb();

    // Check GEE availability
    const geeAvailable = earthEngineService.isEarthEngineAvailable();

    // Get latest data timestamps from cache
    let latestSatellite: Date | null = null;
    let latestClimate: Date | null = null;
    let cacheEntries = 0;

    if (db) {
      const [latest] = await db
        .select({
          satelliteTimestamp: climateLocationData.satelliteDataUpdatedAt,
          bomTimestamp: climateLocationData.bomDataUpdatedAt,
        })
        .from(climateLocationData)
        .orderBy(desc(climateLocationData.updatedAt))
        .limit(1);

      if (latest) {
        latestSatellite = latest.satelliteTimestamp;
        latestClimate = latest.bomTimestamp;
      }

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(climateLocationData);
      cacheEntries = countResult?.count || 0;
    }

    return {
      status: geeAvailable ? "operational" : "degraded",
      services: {
        earthEngine: {
          available: geeAvailable,
          mode: geeAvailable ? "live" : "demo",
          lastData: latestSatellite?.toISOString() || null,
        },
        bomClimate: {
          available: true,
          lastData: latestClimate?.toISOString() || null,
        },
      },
      cache: {
        entries: cacheEntries,
        maxAge: "24 hours",
      },
    };
  }),
});

export default climateIntelligenceHubRouter;
