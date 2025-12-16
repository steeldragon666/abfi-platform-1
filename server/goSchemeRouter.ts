import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto from "crypto";
import {
  goCertificates,
  auditPacks,
  suppliers,
  evidenceManifests,
  emissionCalculations,
  verifiableCredentials,
} from "../drizzle/schema";

// ============================================================================
// GO SCHEME ROUTER - ABFI v3.1 Phase 7
// REGO/PGO mapping, audit pack export, lender documentation
// ============================================================================

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

// GO Certificate scheme types (matching schema enum)
const goSchemeTypes = ["REGO", "PGO", "GO_AU", "ISCC_PLUS", "RSB"] as const;

// GO Certificate status (matching schema enum)
const goCertificateStatuses = [
  "issued",
  "transferred",
  "cancelled",
  "retired",
  "expired",
] as const;

// Audit pack types (matching schema enum)
const auditPackTypes = [
  "lender_assurance",
  "go_application",
  "sustainability_audit",
  "compliance_review",
  "annual_report",
] as const;

// Audit pack entity types (matching schema enum)
const auditPackEntityTypes = [
  "project",
  "supplier",
  "consignment",
  "product_batch",
] as const;

// Audit pack statuses (matching schema enum)
const auditPackStatuses = [
  "draft",
  "generated",
  "reviewed",
  "finalized",
] as const;

// ============================================================================
// GO SCHEME ROUTER
// ============================================================================

export const goSchemeRouter = router({
  // --------------------------------------------------------------------------
  // GO CERTIFICATES
  // --------------------------------------------------------------------------

  // Create GO Certificate
  createGoCertificate: protectedProcedure
    .input(
      z.object({
        goScheme: z.enum(goSchemeTypes),
        energySource: z.string(),
        productionPeriodStart: z.date(),
        productionPeriodEnd: z.date(),
        productionFacilityId: z.string().optional(),
        productionCountry: z.string().length(2).default("AU"),
        // Volume
        energyMwh: z.number().positive().optional(),
        volumeTonnes: z.number().positive().optional(),
        volumeUnit: z.string().optional(),
        // Carbon attributes
        ghgEmissionsKgCo2e: z.number().optional(),
        carbonIntensity: z.number().optional(),
        carbonIntensityUnit: z.string().default("gCO2e/MJ"),
        // Ownership
        currentHolderId: z.number(),
        originalIssuerId: z.number().optional(),
        // Registry
        externalRegistryId: z.string().optional(),
        externalRegistryUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Generate GO ID
      const goId = `${input.goScheme}-${Date.now().toString(36).toUpperCase()}-${crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase()}`;

      const issuedAt = new Date();

      const [result] = await db.insert(goCertificates).values({
        goId,
        goScheme: input.goScheme,
        energySource: input.energySource,
        productionPeriodStart: input.productionPeriodStart,
        productionPeriodEnd: input.productionPeriodEnd,
        productionFacilityId: input.productionFacilityId || null,
        productionCountry: input.productionCountry,
        energyMwh: input.energyMwh?.toString() || null,
        volumeTonnes: input.volumeTonnes?.toString() || null,
        volumeUnit: input.volumeUnit || null,
        ghgEmissionsKgCo2e: input.ghgEmissionsKgCo2e?.toString() || null,
        carbonIntensity: input.carbonIntensity?.toString() || null,
        carbonIntensityUnit: input.carbonIntensityUnit,
        currentHolderId: input.currentHolderId,
        originalIssuerId: input.originalIssuerId || input.currentHolderId,
        status: "issued",
        issuedAt,
        externalRegistryId: input.externalRegistryId || null,
        externalRegistryUrl: input.externalRegistryUrl || null,
      });

      return {
        id: result.insertId,
        goId,
        goScheme: input.goScheme,
        status: "issued",
        issuedAt,
      };
    }),

  // Get GO Certificate by ID
  getGoCertificate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [cert] = await db
        .select({
          certificate: goCertificates,
          holder: suppliers,
        })
        .from(goCertificates)
        .leftJoin(suppliers, eq(goCertificates.currentHolderId, suppliers.id))
        .where(eq(goCertificates.id, input.id))
        .limit(1);

      if (!cert) return null;

      return {
        ...cert.certificate,
        holder: cert.holder,
      };
    }),

  // Get GO Certificate by GO ID
  getByGoId: protectedProcedure
    .input(z.object({ goId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [cert] = await db
        .select()
        .from(goCertificates)
        .where(eq(goCertificates.goId, input.goId))
        .limit(1);

      return cert || null;
    }),

  // List GO Certificates
  listGoCertificates: protectedProcedure
    .input(
      z.object({
        currentHolderId: z.number().optional(),
        goScheme: z.enum(goSchemeTypes).optional(),
        status: z.enum(goCertificateStatuses).optional(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { certificates: [], total: 0 };

      const conditions = [];

      if (input.currentHolderId) {
        conditions.push(eq(goCertificates.currentHolderId, input.currentHolderId));
      }
      if (input.goScheme) {
        conditions.push(eq(goCertificates.goScheme, input.goScheme));
      }
      if (input.status) {
        conditions.push(eq(goCertificates.status, input.status));
      }
      if (input.fromDate) {
        conditions.push(gte(goCertificates.productionPeriodStart, input.fromDate));
      }
      if (input.toDate) {
        conditions.push(lte(goCertificates.productionPeriodEnd, input.toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const certificates = await db
        .select()
        .from(goCertificates)
        .where(whereClause)
        .orderBy(desc(goCertificates.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(goCertificates)
        .where(whereClause);

      return {
        certificates,
        total: countResult?.count || 0,
      };
    }),

  // Transfer GO Certificate
  transferGoCertificate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        newHolderId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [cert] = await db
        .select()
        .from(goCertificates)
        .where(eq(goCertificates.id, input.id))
        .limit(1);

      if (!cert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Certificate not found",
        });
      }

      if (cert.status !== "issued") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only issued certificates can be transferred",
        });
      }

      await db
        .update(goCertificates)
        .set({
          status: "transferred",
          currentHolderId: input.newHolderId,
        })
        .where(eq(goCertificates.id, input.id));

      return {
        success: true,
        id: input.id,
        newHolderId: input.newHolderId,
      };
    }),

  // Retire GO Certificate
  retireGoCertificate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        retiredFor: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [cert] = await db
        .select()
        .from(goCertificates)
        .where(eq(goCertificates.id, input.id))
        .limit(1);

      if (!cert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Certificate not found",
        });
      }

      if (cert.status !== "issued" && cert.status !== "transferred") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Certificate cannot be retired in current status",
        });
      }

      await db
        .update(goCertificates)
        .set({
          status: "retired",
          retiredFor: input.retiredFor,
        })
        .where(eq(goCertificates.id, input.id));

      return {
        success: true,
        id: input.id,
      };
    }),

  // Cancel GO Certificate
  cancelGoCertificate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await db
        .update(goCertificates)
        .set({ status: "cancelled" })
        .where(eq(goCertificates.id, input.id));

      return { success: true, id: input.id };
    }),

  // --------------------------------------------------------------------------
  // AUDIT PACKS
  // --------------------------------------------------------------------------

  // Generate Audit Pack
  generateAuditPack: protectedProcedure
    .input(
      z.object({
        packType: z.enum(auditPackTypes),
        entityType: z.enum(auditPackEntityTypes),
        entityId: z.number(),
        periodStart: z.date(),
        periodEnd: z.date(),
        // Include options
        includeEvidence: z.boolean().default(true),
        includeEmissions: z.boolean().default(true),
        includeCredentials: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Generate pack ID
      const packId = `PACK-${Date.now().toString(36).toUpperCase()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      // Collect relevant IDs for the pack
      const includedEvidenceIds: number[] = [];
      const includedCalculationIds: number[] = [];
      const includedCredentialIds: number[] = [];

      // Collect evidence manifests
      if (input.includeEvidence) {
        const evidenceData = await db
          .select({ id: evidenceManifests.id })
          .from(evidenceManifests)
          .where(
            and(
              gte(evidenceManifests.createdAt, input.periodStart),
              lte(evidenceManifests.createdAt, input.periodEnd)
            )
          )
          .limit(1000);

        includedEvidenceIds.push(...evidenceData.map(e => e.id));
      }

      // Collect emissions calculations (only for matching entity types)
      if (input.includeEmissions && (input.entityType === "project" || input.entityType === "consignment" || input.entityType === "product_batch")) {
        // Map audit pack entity type to emission calculation entity type
        const emissionEntityType = input.entityType as "project" | "consignment" | "product_batch";
        const emissionsData = await db
          .select({ id: emissionCalculations.id })
          .from(emissionCalculations)
          .where(
            and(
              eq(emissionCalculations.entityType, emissionEntityType),
              eq(emissionCalculations.entityId, input.entityId)
            )
          );

        includedCalculationIds.push(...emissionsData.map(e => e.id));
      }

      // Collect verifiable credentials (by subject DID - requires looking up entity's DID)
      if (input.includeCredentials) {
        const credData = await db
          .select({ id: verifiableCredentials.id })
          .from(verifiableCredentials)
          .where(eq(verifiableCredentials.status, "active"))
          .limit(100);

        includedCredentialIds.push(...credData.map(c => c.id));
      }

      // Generate pack content for hashing
      const packContent = {
        packId,
        packType: input.packType,
        entityType: input.entityType,
        entityId: input.entityId,
        periodStart: input.periodStart.toISOString(),
        periodEnd: input.periodEnd.toISOString(),
        includedEvidenceIds,
        includedCalculationIds,
        includedCredentialIds,
        generatedAt: new Date().toISOString(),
      };

      const packHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(packContent))
        .digest("hex");

      // In production, would upload to S3/IPFS
      const packUri = `s3://abfi-audit-packs/${packId}.zip`;
      const packSizeBytes = JSON.stringify(packContent).length; // Placeholder

      // Store audit pack record
      const [result] = await db.insert(auditPacks).values({
        packId,
        packType: input.packType,
        entityType: input.entityType,
        entityId: input.entityId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        packUri,
        packHash,
        packSizeBytes,
        includedEvidenceIds,
        includedCalculationIds,
        includedCredentialIds,
        status: "generated",
        generatedBy: ctx.user.id,
      });

      return {
        id: result.insertId,
        packId,
        packType: input.packType,
        packUri,
        packHash,
        includedEvidenceCount: includedEvidenceIds.length,
        includedCalculationCount: includedCalculationIds.length,
        includedCredentialCount: includedCredentialIds.length,
      };
    }),

  // Get Audit Pack
  getAuditPack: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [pack] = await db
        .select()
        .from(auditPacks)
        .where(eq(auditPacks.id, input.id))
        .limit(1);

      return pack || null;
    }),

  // Get Audit Pack by Pack ID
  getByPackId: protectedProcedure
    .input(z.object({ packId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [pack] = await db
        .select()
        .from(auditPacks)
        .where(eq(auditPacks.packId, input.packId))
        .limit(1);

      return pack || null;
    }),

  // List Audit Packs
  listAuditPacks: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(auditPackEntityTypes).optional(),
        entityId: z.number().optional(),
        packType: z.enum(auditPackTypes).optional(),
        status: z.enum(auditPackStatuses).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { packs: [], total: 0 };

      const conditions = [];

      if (input.entityType) {
        conditions.push(eq(auditPacks.entityType, input.entityType));
      }
      if (input.entityId) {
        conditions.push(eq(auditPacks.entityId, input.entityId));
      }
      if (input.packType) {
        conditions.push(eq(auditPacks.packType, input.packType));
      }
      if (input.status) {
        conditions.push(eq(auditPacks.status, input.status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const packs = await db
        .select()
        .from(auditPacks)
        .where(whereClause)
        .orderBy(desc(auditPacks.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(auditPacks)
        .where(whereClause);

      return {
        packs,
        total: countResult?.count || 0,
      };
    }),

  // Review Audit Pack
  reviewAuditPack: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await db
        .update(auditPacks)
        .set({
          status: "reviewed",
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
          reviewNotes: input.reviewNotes || null,
        })
        .where(eq(auditPacks.id, input.id));

      return { success: true, id: input.id, status: "reviewed" };
    }),

  // Finalize Audit Pack
  finalizeAuditPack: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [pack] = await db
        .select()
        .from(auditPacks)
        .where(eq(auditPacks.id, input.id))
        .limit(1);

      if (!pack) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audit pack not found",
        });
      }

      if (pack.status !== "reviewed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pack must be reviewed before finalization",
        });
      }

      await db
        .update(auditPacks)
        .set({ status: "finalized" })
        .where(eq(auditPacks.id, input.id));

      return { success: true, id: input.id, status: "finalized" };
    }),

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  // Get GO Scheme Statistics
  getGoStats: protectedProcedure
    .input(
      z.object({
        currentHolderId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          totalCertificates: 0,
          issuedCertificates: 0,
          retiredCertificates: 0,
          totalEnergyMwh: 0,
          totalGhgEmissions: 0,
          byScheme: {},
        };
      }

      const conditions = [];
      if (input.currentHolderId) {
        conditions.push(eq(goCertificates.currentHolderId, input.currentHolderId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [stats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          issued: sql<number>`SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END)`,
          retired: sql<number>`SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END)`,
          totalEnergy: sql<number>`COALESCE(SUM(CAST(energyMwh AS DECIMAL)), 0)`,
          totalGhg: sql<number>`COALESCE(SUM(CAST(ghgEmissionsKgCo2e AS DECIMAL)), 0)`,
        })
        .from(goCertificates)
        .where(whereClause);

      const byScheme = await db
        .select({
          goScheme: goCertificates.goScheme,
          count: sql<number>`COUNT(*)`,
        })
        .from(goCertificates)
        .where(whereClause)
        .groupBy(goCertificates.goScheme);

      const bySchemeMap: Record<string, number> = {};
      for (const row of byScheme) {
        bySchemeMap[row.goScheme] = row.count;
      }

      return {
        totalCertificates: stats?.total || 0,
        issuedCertificates: stats?.issued || 0,
        retiredCertificates: stats?.retired || 0,
        totalEnergyMwh: stats?.totalEnergy || 0,
        totalGhgEmissions: stats?.totalGhg || 0,
        byScheme: bySchemeMap,
      };
    }),

  // Get Audit Pack Statistics
  getAuditPackStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalPacks: 0,
        draftPacks: 0,
        generatedPacks: 0,
        reviewedPacks: 0,
        finalizedPacks: 0,
      };
    }

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        draft: sql<number>`SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END)`,
        generated: sql<number>`SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END)`,
        reviewed: sql<number>`SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END)`,
        finalized: sql<number>`SUM(CASE WHEN status = 'finalized' THEN 1 ELSE 0 END)`,
      })
      .from(auditPacks);

    return {
      totalPacks: stats?.total || 0,
      draftPacks: stats?.draft || 0,
      generatedPacks: stats?.generated || 0,
      reviewedPacks: stats?.reviewed || 0,
      finalizedPacks: stats?.finalized || 0,
    };
  }),
});

export type GoSchemeRouter = typeof goSchemeRouter;
