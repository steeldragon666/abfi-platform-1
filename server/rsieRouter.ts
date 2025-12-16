/**
 * RSIE (Risk & Supply Intelligence Engine) Router
 *
 * Provides tRPC endpoints for RSIE v2.1 features:
 * - Data provenance tracking
 * - Risk event management
 * - Supplier exposure calculations
 * - Weather intelligence
 * - Intelligence feed
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// ============================================================================
// Constants
// ============================================================================

const RISK_EVENT_TYPES = [
  "bushfire",
  "flood",
  "drought",
  "cyclone",
  "hailstorm",
  "pest_outbreak",
  "disease",
  "frost",
  "heatwave",
  "supply_shock",
  "policy_change",
  "market_disruption",
  "other",
] as const;

const DATA_SOURCE_TYPES = [
  "api",
  "csv_upload",
  "manual_entry",
  "satellite",
  "government",
  "aggregator",
  "internal",
] as const;

const RISK_SEVERITY = ["low", "medium", "high", "critical"] as const;

const EXPOSURE_MITIGATION_STATUS = [
  "unmitigated",
  "partially_mitigated",
  "fully_mitigated",
  "accepted",
] as const;

const INTELLIGENCE_ITEM_TYPES = ["news", "policy", "market_note"] as const;

const AUSTRALIAN_STATES = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
  "ACT",
] as const;

// ============================================================================
// Helper Procedures (will use from routers.ts when wired up)
// ============================================================================

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

// ============================================================================
// Router
// ============================================================================

export const rsieRouter = router({
  // ==========================================================================
  // DATA SOURCES
  // ==========================================================================

  dataSources: router({
    list: protectedProcedure.query(async () => {
      return await db.listDataSources();
    }),

    listEnabled: protectedProcedure.query(async () => {
      return await db.listDataSources(true);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const source = await db.getDataSourceById(input.id);
        if (!source) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Data source not found" });
        }
        return source;
      }),

    create: adminProcedure
      .input(
        z.object({
          sourceKey: z.string().min(1).max(64),
          name: z.string().min(1).max(128),
          licenseClass: z.enum(["CC_BY_4", "CC_BY_3", "COMMERCIAL", "RESTRICTED", "UNKNOWN"]),
          termsUrl: z.string().url().max(512).optional(),
          attributionText: z.string().max(512).optional(),
          isEnabled: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createDataSource(input);
        console.log("[RSIE] Created data source:", input.name, "id:", id);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(128).optional(),
          termsUrl: z.string().url().max(512).optional(),
          attributionText: z.string().max(512).optional(),
          isEnabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateDataSource(id, updates);
        return { success: true };
      }),

    toggleEnabled: adminProcedure
      .input(z.object({ id: z.number(), isEnabled: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.toggleDataSourceEnabled(input.id, input.isEnabled);
        console.log("[RSIE] Toggled data source:", input.id, "enabled:", input.isEnabled);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // RISK EVENTS
  // ==========================================================================

  riskEvents: router({
    // List recent risk events
    list: protectedProcedure
      .input(
        z.object({
          eventType: z.array(z.string()).optional(),
          severity: z.array(z.enum(RISK_SEVERITY)).optional(),
          eventStatus: z.array(z.enum(["watch", "active", "resolved"])).optional(),
          limit: z.number().int().positive().default(50),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.searchRiskEvents({
          eventType: input.eventType,
          severity: input.severity,
          eventStatus: input.eventStatus,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    // Get single risk event with full details
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getRiskEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Risk event not found" });
        }
        return event;
      }),

    // Get risk event by fingerprint (for deduplication)
    getByFingerprint: protectedProcedure
      .input(z.object({ fingerprint: z.string() }))
      .query(async ({ input }) => {
        return await db.getRiskEventByFingerprint(input.fingerprint);
      }),

    // Get active risk events in a bounding box
    getInBbox: protectedProcedure
      .input(
        z.object({
          minLat: z.number().min(-90).max(90),
          maxLat: z.number().min(-90).max(90),
          minLng: z.number().min(-180).max(180),
          maxLng: z.number().min(-180).max(180),
        })
      )
      .query(async ({ input }) => {
        return await db.getActiveRiskEventsInBbox(
          input.minLat,
          input.maxLat,
          input.minLng,
          input.maxLng
        );
      }),

    // Create risk event (admin/system)
    create: adminProcedure
      .input(
        z.object({
          eventType: z.enum([
            "drought", "cyclone", "storm", "flood", "bushfire", "heatwave",
            "frost", "pest", "disease", "policy", "industrial_action", "logistics_disruption"
          ]),
          eventClass: z.enum(["hazard", "biosecurity", "systemic"]).default("hazard"),
          eventStatus: z.enum(["watch", "active", "resolved"]).default("active"),
          severity: z.enum(RISK_SEVERITY),
          affectedRegionGeojson: z.any(), // GeoJSON object
          bboxMinLat: z.string(),
          bboxMaxLat: z.string(),
          bboxMinLng: z.string(),
          bboxMaxLng: z.string(),
          startDate: z.date(),
          endDate: z.date().optional(),
          scoreTotal: z.number().int(),
          scoreComponents: z.any(),
          confidence: z.string(),
          methodVersion: z.string(),
          sourceId: z.number().optional(),
          sourceRefs: z.any().optional(),
          ingestionRunId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Generate fingerprint for deduplication
        const fingerprint = generateEventFingerprint(
          input.eventType,
          JSON.stringify(input.affectedRegionGeojson),
          input.startDate
        );

        const id = await db.createRiskEvent({
          ...input,
          eventFingerprint: fingerprint,
        });

        console.log("[RSIE] Created risk event, id:", id, "fingerprint:", fingerprint);
        return { id, fingerprint };
      }),

    // Update risk event
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          eventStatus: z.enum(["watch", "active", "resolved"]).optional(),
          severity: z.enum(RISK_SEVERITY).optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateRiskEvent(id, updates);
        console.log("[RSIE] Updated risk event:", id);
        return { success: true };
      }),

    // Resolve a risk event
    resolve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.resolveRiskEvent(input.id);
        console.log("[RSIE] Resolved risk event:", input.id);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // SUPPLIER EXPOSURE
  // ==========================================================================

  exposure: router({
    // Get exposure summary for current supplier
    mySummary: protectedProcedure.query(async ({ ctx }) => {
      const supplier = await db.getSupplierByUserId(ctx.user.id);
      if (!supplier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Supplier profile required",
        });
      }

      return await db.getSupplierExposureSummary(supplier.id);
    }),

    // List exposures for a specific supplier site
    bySite: protectedProcedure
      .input(z.object({ siteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const supplier = await db.getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Supplier profile required",
          });
        }

        // Verify site belongs to supplier
        const site = await db.getSupplierSiteById(input.siteId);
        if (!site || site.supplierId !== supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Site not found or not owned by supplier",
          });
        }

        return await db.getExposuresBySiteId(input.siteId);
      }),

    // Get exposures by risk event
    byRiskEvent: protectedProcedure
      .input(z.object({ riskEventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExposuresByRiskEventId(input.riskEventId);
      }),

    // Update mitigation status for an exposure
    updateMitigation: protectedProcedure
      .input(
        z.object({
          exposureId: z.number(),
          mitigationStatus: z.enum(["none", "partial", "full"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const supplier = await db.getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Supplier profile required",
          });
        }

        await db.updateExposureMitigation(input.exposureId, input.mitigationStatus);
        return { success: true };
      }),

    // Calculate exposure for all supplier sites against active risk events (admin)
    recalculate: adminProcedure.mutation(async () => {
      console.log("[RSIE] Recalculating all supplier exposures...");
      const result = await db.recalculateAllExposures();
      console.log("[RSIE] Processed", result.processed, "exposures for", result.eventCount, "events");
      return result;
    }),

    // Calculate exposure for a specific risk event (admin)
    recalculateForEvent: adminProcedure
      .input(z.object({ riskEventId: z.number() }))
      .mutation(async ({ input }) => {
        console.log("[RSIE] Calculating exposures for risk event:", input.riskEventId);
        return await db.calculateExposuresForRiskEvent(input.riskEventId);
      }),
  }),

  // ==========================================================================
  // WEATHER INTELLIGENCE
  // ==========================================================================

  weather: router({
    // Get weather data for a grid cell
    getForCell: protectedProcedure
      .input(
        z.object({
          cellId: z.string(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        const historical = await db.getWeatherForCell(
          input.cellId,
          input.startDate,
          input.endDate
        );
        return { historical };
      }),

    // Get forecast for a grid cell
    getForecast: protectedProcedure
      .input(
        z.object({
          cellId: z.string(),
          hoursAhead: z.number().int().positive().default(168), // 7 days
        })
      )
      .query(async ({ input }) => {
        const forecast = await db.getForecastForCell(input.cellId, input.hoursAhead);
        return { forecast };
      }),

    // Get combined weather data (historical + forecast) for a cell
    getCombined: protectedProcedure
      .input(
        z.object({
          cellId: z.string(),
          historicalDays: z.number().int().positive().default(30),
          forecastHours: z.number().int().positive().default(168),
        })
      )
      .query(async ({ input }) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.historicalDays);

        const [historical, forecast] = await Promise.all([
          db.getWeatherForCell(input.cellId, startDate),
          db.getForecastForCell(input.cellId, input.forecastHours),
        ]);

        return { historical, forecast };
      }),

    // Get weather alerts for supplier sites
    myAlerts: protectedProcedure.query(async ({ ctx }) => {
      const supplier = await db.getSupplierByUserId(ctx.user.id);
      if (!supplier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Supplier profile required",
        });
      }

      // Get supplier's sites and check for weather alerts
      const sites = await db.getSupplierSitesBySupplierId(supplier.id);

      // For now, return empty - would implement weather threshold checking
      return [];
    }),
  }),

  // ==========================================================================
  // INTELLIGENCE FEED
  // ==========================================================================

  intelligence: router({
    // List intelligence items
    list: protectedProcedure
      .input(
        z.object({
          itemType: z.array(z.enum(INTELLIGENCE_ITEM_TYPES)).optional(),
          tags: z.array(z.string()).optional(),
          limit: z.number().int().positive().default(20),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.listIntelligenceItems({
          itemType: input.itemType,
          tags: input.tags,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    // Get single intelligence item
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const item = await db.getIntelligenceItemById(input.id);
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Intelligence item not found",
          });
        }
        return item;
      }),

    // Create intelligence item (admin/system)
    create: adminProcedure
      .input(
        z.object({
          itemType: z.enum(INTELLIGENCE_ITEM_TYPES),
          title: z.string().min(1).max(256),
          sourceUrl: z.string().url().max(512),
          publisher: z.string().max(128).optional(),
          publishedAt: z.date().optional(),
          summary: z.string().optional(),
          summaryModel: z.string().max(64).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createIntelligenceItem({
          ...input,
          summaryGeneratedAt: input.summary ? new Date() : undefined,
        });
        console.log("[RSIE] Created intelligence item:", input.title, "id:", id);
        return { id };
      }),

    // Update intelligence item
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(256).optional(),
          summary: z.string().optional(),
          summaryModel: z.string().max(64).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        if (updates.summary) {
          (updates as any).summaryGeneratedAt = new Date();
        }
        await db.updateIntelligenceItem(id, updates);
        return { success: true };
      }),

    // Delete intelligence item
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteIntelligenceItem(input.id);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // INGESTION RUNS (Admin view of data pipeline)
  // ==========================================================================

  ingestion: router({
    // List recent ingestion runs
    listRuns: adminProcedure
      .input(
        z.object({
          sourceId: z.number().optional(),
          status: z.enum(["started", "succeeded", "partial", "failed"]).optional(),
          limit: z.number().int().positive().default(20),
        })
      )
      .query(async ({ input }) => {
        return await db.listIngestionRuns({
          sourceId: input.sourceId,
          status: input.status,
          limit: input.limit,
        });
      }),

    // Get single ingestion run details
    getRunById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const run = await db.getIngestionRunById(input.id);
        if (!run) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Ingestion run not found",
          });
        }
        return run;
      }),

    // Create a new ingestion run (for manual or scheduled triggers)
    create: adminProcedure
      .input(
        z.object({
          sourceId: z.number(),
          runType: z.enum(["baseline", "weather", "impact", "policy", "spatial"]),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createIngestionRun({
          sourceId: input.sourceId,
          runType: input.runType,
          status: "started",
          startedAt: new Date(),
        });
        console.log("[RSIE] Created ingestion run:", id, "for source:", input.sourceId);
        return { runId: id };
      }),

    // Complete an ingestion run
    complete: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["succeeded", "partial", "failed"]),
          recordsIn: z.number().int().nonnegative(),
          recordsOut: z.number().int().nonnegative(),
          errorMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.completeIngestionRun(
          input.id,
          input.status,
          input.recordsIn,
          input.recordsOut,
          input.errorMessage
        );
        console.log("[RSIE] Completed ingestion run:", input.id, "status:", input.status);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // USER FEEDBACK (Survey responses)
  // ==========================================================================

  feedback: router({
    // Submit feedback
    submit: protectedProcedure
      .input(
        z.object({
          sessionDurationMinutes: z.number().int().nonnegative().optional(),
          likes: z.array(z.string()).optional(),
          improvements: z.array(z.string()).optional(),
          featureRequests: z.string().optional(),
          npsScore: z.number().int().min(0).max(10).optional(),
          otherFeedback: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createUserFeedback({
          userId: ctx.user.id,
          sessionDurationMinutes: input.sessionDurationMinutes,
          likes: input.likes,
          improvements: input.improvements,
          featureRequests: input.featureRequests,
          npsScore: input.npsScore,
          otherFeedback: input.otherFeedback,
        });
        console.log("[RSIE] Submitted feedback from user:", ctx.user.id, "id:", id);
        return { id };
      }),

    // Mark feedback as dismissed without completing
    dismiss: protectedProcedure.mutation(async ({ ctx }) => {
      const id = await db.createUserFeedback({
        userId: ctx.user.id,
        dismissedWithoutCompleting: true,
      });
      return { id };
    }),

    // Check if user has submitted feedback
    hasSubmitted: protectedProcedure.query(async ({ ctx }) => {
      return await db.hasUserSubmittedFeedback(ctx.user.id);
    }),

    // Get feedback stats (admin only)
    stats: adminProcedure.query(async () => {
      return await db.getFeedbackStats();
    }),

    // List all feedback (admin only)
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(50),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.listUserFeedback({
          limit: input.limit,
          offset: input.offset,
        });
      }),
  }),

  // ==========================================================================
  // ADMIN OPERATIONS
  // ==========================================================================

  admin: router({
    // Seed Australian data sources
    seedDataSources: adminProcedure.mutation(async () => {
      const { AUSTRALIAN_DATA_SOURCES } = await import("./rsieDataSources.js");
      const results: { created: number; skipped: number; errors: string[] } = {
        created: 0,
        skipped: 0,
        errors: [],
      };

      for (const source of AUSTRALIAN_DATA_SOURCES) {
        try {
          // Check if source already exists
          const existing = await db.getDataSourceByKey(source.sourceKey);
          if (existing) {
            results.skipped++;
            continue;
          }

          await db.createDataSource({
            sourceKey: source.sourceKey,
            name: source.name,
            licenseClass: source.licenseClass,
            termsUrl: source.termsUrl,
            attributionText: source.attributionText,
            isEnabled: source.isEnabled,
          });
          results.created++;
        } catch (error) {
          results.errors.push(`${source.sourceKey}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      console.log("[RSIE] Seeded data sources:", results);
      return results;
    }),

    // Check weather API status
    checkWeatherApi: adminProcedure.query(async () => {
      const { checkWeatherApiStatus } = await import("./weatherService.js");
      return await checkWeatherApiStatus();
    }),

    // Ingest weather data
    ingestWeather: adminProcedure.mutation(async () => {
      const { ingestWeatherData } = await import("./weatherService.js");
      console.log("[RSIE] Starting weather ingestion...");
      const result = await ingestWeatherData();
      console.log("[RSIE] Weather ingestion complete:", result);
      return result;
    }),

    // Get Australian grid cells
    getGridCells: adminProcedure.query(async () => {
      const { AUSTRALIAN_GRID_CELLS } = await import("./weatherService.js");
      return AUSTRALIAN_GRID_CELLS;
    }),

    // Get weather alerts for a location
    getWeatherAlerts: adminProcedure
      .input(z.object({ lat: z.number(), lng: z.number() }))
      .query(async ({ input }) => {
        const { getWeatherAlerts } = await import("./weatherService.js");
        return await getWeatherAlerts(input.lat, input.lng);
      }),

    // Get available data source configurations
    getAvailableDataSources: adminProcedure.query(async () => {
      const { AUSTRALIAN_DATA_SOURCES } = await import("./rsieDataSources.js");
      return AUSTRALIAN_DATA_SOURCES;
    }),
  }),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a fingerprint for deduplication of risk events
 */
function generateEventFingerprint(
  eventType: string,
  geometryJson: string,
  detectedAt: Date
): string {
  const crypto = require("crypto");
  const data = `${eventType}:${geometryJson}:${detectedAt.toISOString().split("T")[0]}`;
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 32);
}

export default rsieRouter;
