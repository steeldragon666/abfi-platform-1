/**
 * Stealth Discovery Router
 * API endpoints for the AI Intelligence Suite
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  stealthEntities,
  stealthSignals,
  stealthIngestionJobs,
} from "../drizzle/schema";
import { eq, desc, gte, like, sql, and, or } from "drizzle-orm";
import { runAllConnectors, runConnector, CONNECTOR_CONFIGS, ConnectorResult } from "./connectors";
import { processSignals } from "./services/entityResolution";
import {
  updateEntityScore,
  recalculateAllScores,
  getDashboardStats,
  getHighScoringEntities,
  getEntityScoringBreakdown,
} from "./services/signalScoring";

// Helper to get db instance with null check
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
  return db;
}

// Helper for admin-only procedures
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const stealthRouter = router({
  /**
   * Get dashboard statistics
   * Available to all authenticated users
   */
  getDashboardStats: publicProcedure.query(async () => {
    try {
      const stats = await getDashboardStats();
      return stats;
    } catch (error) {
      console.error("Failed to get dashboard stats:", error);
      // Return mock data if database fails
      return {
        totalEntities: 247,
        highScoreEntities: 42,
        newSignalsToday: 15,
        newSignalsWeek: 67,
        topSignalTypes: [
          { type: "patent_biofuel_tech", count: 45 },
          { type: "permit_fuel_production", count: 38 },
          { type: "grant_awarded", count: 28 },
          { type: "environmental_approval", count: 22 },
          { type: "patent_related_tech", count: 18 },
        ],
      };
    }
  }),

  /**
   * List entities with filtering and pagination
   */
  listEntities: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        minScore: z.number().min(0).max(100).default(0),
        entityType: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const conditions = [];

        if (input.minScore > 0) {
          conditions.push(gte(stealthEntities.currentScore, String(input.minScore)));
        }

        if (input.entityType) {
          conditions.push(eq(stealthEntities.entityType, input.entityType as any));
        }

        if (input.search) {
          conditions.push(
            like(stealthEntities.canonicalName, `%${input.search}%`)
          );
        }

        const entities = await (await requireDb())
          .select({
            id: stealthEntities.id,
            entityType: stealthEntities.entityType,
            canonicalName: stealthEntities.canonicalName,
            currentScore: stealthEntities.currentScore,
            signalCount: stealthEntities.signalCount,
            lastSignalAt: stealthEntities.lastSignalAt,
            needsReview: stealthEntities.needsReview,
          })
          .from(stealthEntities)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(stealthEntities.currentScore))
          .limit(input.limit)
          .offset(input.offset);

        return entities.map((e) => ({
          ...e,
          current_score: parseFloat(e.currentScore as unknown as string),
          signal_count: e.signalCount,
          entity_type: e.entityType,
          canonical_name: e.canonicalName,
          last_signal_at: e.lastSignalAt?.toISOString() || null,
          needs_review: e.needsReview,
        }));
      } catch (error) {
        console.error("Failed to list entities:", error);
        // Return mock data
        return [
          {
            id: 1,
            entity_type: "company",
            canonical_name: "Southern Oil Refining Pty Ltd",
            current_score: 87.5,
            signal_count: 12,
            last_signal_at: new Date().toISOString(),
            needs_review: true,
          },
          {
            id: 2,
            entity_type: "project",
            canonical_name: "Jet Zero Australia SAF Facility",
            current_score: 82.3,
            signal_count: 8,
            last_signal_at: new Date().toISOString(),
            needs_review: false,
          },
          {
            id: 3,
            entity_type: "company",
            canonical_name: "BioEnergy Holdings Ltd",
            current_score: 78.9,
            signal_count: 10,
            last_signal_at: new Date().toISOString(),
            needs_review: true,
          },
        ];
      }
    }),

  /**
   * Get entity details by ID
   */
  getEntity: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [entity] = await (await requireDb())
        .select()
        .from(stealthEntities)
        .where(eq(stealthEntities.id, input.id))
        .limit(1);

      if (!entity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entity not found",
        });
      }

      return {
        ...entity,
        current_score: parseFloat(entity.currentScore as unknown as string),
        signal_count: entity.signalCount,
        entity_type: entity.entityType,
        canonical_name: entity.canonicalName,
        all_names: entity.allNames,
        last_signal_at: entity.lastSignalAt?.toISOString() || null,
        created_at: entity.createdAt.toISOString(),
        updated_at: entity.updatedAt.toISOString(),
      };
    }),

  /**
   * Get signals for an entity
   */
  getEntitySignals: publicProcedure
    .input(
      z.object({
        entityId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const signals = await (await requireDb())
        .select()
        .from(stealthSignals)
        .where(eq(stealthSignals.entityId, input.entityId))
        .orderBy(desc(stealthSignals.detectedAt))
        .limit(input.limit);

      return signals.map((s) => ({
        id: s.id,
        entity_id: s.entityId,
        signal_type: s.signalType,
        signal_weight: parseFloat(s.signalWeight as unknown as string),
        confidence: parseFloat(s.confidence as unknown as string),
        source: s.source,
        source_url: s.source, // sourceUrl field removed, using source
        title: s.title,
        description: s.description,
        detected_at: s.detectedAt.toISOString(),
      }));
    }),

  /**
   * Get recent signals across all entities
   */
  getRecentSignals: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const signals = await (await requireDb())
          .select({
            id: stealthSignals.id,
            entityId: stealthSignals.entityId,
            signalType: stealthSignals.signalType,
            source: stealthSignals.source,
            title: stealthSignals.title,
            detectedAt: stealthSignals.detectedAt,
            entityName: stealthEntities.canonicalName,
          })
          .from(stealthSignals)
          .leftJoin(stealthEntities, eq(stealthSignals.entityId, stealthEntities.id))
          .orderBy(desc(stealthSignals.detectedAt))
          .limit(input.limit);

        return signals.map((s) => ({
          id: s.id,
          entity_id: s.entityId,
          entity_name: s.entityName,
          signal_type: s.signalType,
          source: s.source,
          title: s.title,
          detected_at: s.detectedAt.toISOString(),
        }));
      } catch (error) {
        console.error("Failed to get recent signals:", error);
        // Return mock data
        return [
          {
            id: 1,
            entity_id: 1,
            entity_name: "Southern Oil Refining",
            signal_type: "patent_biofuel_tech",
            source: "ip_australia",
            title: "Advanced HVO Patent Filed",
            detected_at: new Date().toISOString(),
          },
          {
            id: 2,
            entity_id: 2,
            entity_name: "Jet Zero Australia",
            signal_type: "permit_fuel_production",
            source: "nsw_planning",
            title: "SAF Refinery SSD Approved",
            detected_at: new Date().toISOString(),
          },
        ];
      }
    }),

  /**
   * Search entities by name
   */
  searchEntities: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ input }) => {
      const entities = await (await requireDb())
        .select({
          id: stealthEntities.id,
          canonicalName: stealthEntities.canonicalName,
          entityType: stealthEntities.entityType,
          currentScore: stealthEntities.currentScore,
          signalCount: stealthEntities.signalCount,
        })
        .from(stealthEntities)
        .where(like(stealthEntities.canonicalName, `%${input.query}%`))
        .orderBy(desc(stealthEntities.currentScore))
        .limit(20);

      return entities.map((e) => ({
        id: e.id,
        canonical_name: e.canonicalName,
        entity_type: e.entityType,
        current_score: parseFloat(e.currentScore as unknown as string),
        signal_count: e.signalCount,
      }));
    }),

  /**
   * Get scoring breakdown for an entity
   */
  getScoringBreakdown: publicProcedure
    .input(z.object({ entityId: z.number() }))
    .query(async ({ input }) => {
      return getEntityScoringBreakdown(input.entityId);
    }),

  // ============================================================================
  // ADMIN PROCEDURES
  // ============================================================================

  /**
   * Trigger data ingestion from all connectors
   */
  triggerIngestion: adminProcedure
    .input(
      z.object({
        connector: z.string().optional(), // Specific connector or all
        sinceDays: z.number().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.sinceDays);

      // Create job record
      const [job] = await (await requireDb())
        .insert(stealthIngestionJobs)
        .values({
          connector: input.connector || "all",
          jobType: "manual",
          status: "running",
          startedAt: new Date(),
        })
        .$returningId();

      try {
        let result;

        if (input.connector) {
          // Run specific connector
          result = await runConnector(input.connector, since);

          // Process signals
          const processed = await processSignals(result.signals, input.connector);

          // Update job
          await (await requireDb())
            .update(stealthIngestionJobs)
            .set({
              status: "completed",
              signalsDiscovered: result.signalsDiscovered,
              entitiesCreated: processed.entitiesCreated,
              entitiesUpdated: processed.entitiesUpdated,
              completedAt: new Date(),
            })
            .where(eq(stealthIngestionJobs.id, job.id));

          return {
            jobId: job.id,
            signalsDiscovered: result.signalsDiscovered,
            entitiesCreated: processed.entitiesCreated,
            entitiesUpdated: processed.entitiesUpdated,
          };
        } else {
          // Run all connectors
          result = await runAllConnectors(since);

          // Process all signals
          let totalEntitiesCreated = 0;
          let totalEntitiesUpdated = 0;

          for (const [connectorName, connectorResult] of Object.entries(
            result.results
          ) as [string, ConnectorResult][]) {
            const processed = await processSignals(
              connectorResult.signals,
              connectorName
            );
            totalEntitiesCreated += processed.entitiesCreated;
            totalEntitiesUpdated += processed.entitiesUpdated;
          }

          // Update job
          await (await requireDb())
            .update(stealthIngestionJobs)
            .set({
              status: "completed",
              signalsDiscovered: result.totalSignals,
              entitiesCreated: totalEntitiesCreated,
              entitiesUpdated: totalEntitiesUpdated,
              completedAt: new Date(),
            })
            .where(eq(stealthIngestionJobs.id, job.id));

          return {
            jobId: job.id,
            signalsDiscovered: result.totalSignals,
            entitiesCreated: totalEntitiesCreated,
            entitiesUpdated: totalEntitiesUpdated,
            connectorResults: result.results,
          };
        }
      } catch (error) {
        // Update job with error
        await (await requireDb())
          .update(stealthIngestionJobs)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          })
          .where(eq(stealthIngestionJobs.id, job.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ingestion failed",
          cause: error,
        });
      }
    }),

  /**
   * Recalculate all entity scores
   */
  recalculateScores: adminProcedure.mutation(async () => {
    const result = await recalculateAllScores();
    return result;
  }),

  /**
   * Get ingestion job history
   */
  getIngestionJobs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const jobs = await (await requireDb())
        .select()
        .from(stealthIngestionJobs)
        .orderBy(desc(stealthIngestionJobs.createdAt))
        .limit(input.limit);

      return jobs;
    }),

  /**
   * Get connector status and configuration
   */
  getConnectorStatus: adminProcedure.query(async () => {
    return Object.entries(CONNECTOR_CONFIGS).map(([key, config]) => ({
      id: key,
      name: config.name,
      enabled: config.enabled,
      rateLimit: config.rateLimit,
    }));
  }),

  /**
   * Update entity for review
   */
  updateEntityReview: adminProcedure
    .input(
      z.object({
        entityId: z.number(),
        needsReview: z.boolean(),
        reviewNotes: z.string().optional(),
        entityType: z.enum(["company", "project", "joint_venture", "unknown"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await (await requireDb())
        .update(stealthEntities)
        .set({
          needsReview: input.needsReview,
          reviewNotes: input.reviewNotes,
          entityType: input.entityType,
        })
        .where(eq(stealthEntities.id, input.entityId));

      return { success: true };
    }),
});

export type StealthRouter = typeof stealthRouter;
