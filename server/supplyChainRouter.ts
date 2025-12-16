import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto from "crypto";
import {
  consignments,
  freightLegs,
  consignmentEvidence,
  feedstocks,
  suppliers,
} from "../drizzle/schema";

// ============================================================================
// SUPPLY CHAIN ROUTER - ABFI v3.1 Phase 3
// Consignments, freight legs, geotagged photos, evidence tracking
// ============================================================================

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

// Status enums matching schema
const consignmentStatuses = [
  "created",
  "dispatched",
  "in_transit",
  "delivered",
  "verified",
  "rejected",
] as const;

// Transport modes (matching schema enum - ISO 14083 aligned)
const transportModes = [
  "road_truck",
  "road_van",
  "rail_freight",
  "sea_container",
  "sea_bulk",
  "air_cargo",
  "barge",
  "pipeline",
] as const;

// Distance source (matching schema enum)
const distanceSources = [
  "gps_actual",
  "route_calculated",
  "straight_line",
  "declared",
] as const;

// Evidence types (matching schema enum)
const evidenceTypes = [
  "harvest_photo",
  "loading_photo",
  "transit_photo",
  "delivery_photo",
  "weighbridge_docket",
  "bill_of_lading",
  "delivery_note",
  "quality_certificate",
  "invoice",
  "gps_track",
  "other",
] as const;

// ============================================================================
// SUPPLY CHAIN ROUTER
// ============================================================================

export const supplyChainRouter = router({
  // --------------------------------------------------------------------------
  // CONSIGNMENTS
  // --------------------------------------------------------------------------

  createConsignment: protectedProcedure
    .input(
      z.object({
        originSupplierId: z.number(),
        originPropertyId: z.number().optional(),
        originLat: z.string().optional(),
        originLng: z.string().optional(),
        destinationName: z.string().optional(),
        destinationLat: z.string().optional(),
        destinationLng: z.string().optional(),
        feedstockId: z.number().optional(),
        feedstockType: z.string(),
        declaredVolumeTonnes: z.number().positive(),
        harvestDate: z.date().optional(),
        expectedArrivalDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Generate consignment ID
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const random = crypto.randomBytes(3).toString("hex").toUpperCase();
      const consignmentId = `CONS-${dateStr}-${random}`;

      const [result] = await db.insert(consignments).values({
        consignmentId,
        originSupplierId: input.originSupplierId,
        originPropertyId: input.originPropertyId || null,
        originLat: input.originLat || null,
        originLng: input.originLng || null,
        destinationName: input.destinationName || null,
        destinationLat: input.destinationLat || null,
        destinationLng: input.destinationLng || null,
        feedstockId: input.feedstockId || null,
        feedstockType: input.feedstockType,
        declaredVolumeTonnes: input.declaredVolumeTonnes.toString(),
        harvestDate: input.harvestDate || null,
        expectedArrivalDate: input.expectedArrivalDate || null,
        status: "created",
      });

      return { id: result.insertId, consignmentId, status: "created" };
    }),

  getConsignment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [consignment] = await db
        .select({
          consignment: consignments,
          supplier: suppliers,
          feedstock: feedstocks,
        })
        .from(consignments)
        .leftJoin(suppliers, eq(consignments.originSupplierId, suppliers.id))
        .leftJoin(feedstocks, eq(consignments.feedstockId, feedstocks.id))
        .where(eq(consignments.id, input.id))
        .limit(1);

      if (!consignment) return null;

      // Get freight legs
      const legs = await db
        .select()
        .from(freightLegs)
        .where(eq(freightLegs.consignmentId, input.id))
        .orderBy(freightLegs.legNumber);

      // Get evidence
      const evidence = await db
        .select()
        .from(consignmentEvidence)
        .where(eq(consignmentEvidence.consignmentId, input.id))
        .orderBy(desc(consignmentEvidence.capturedAt));

      return {
        ...consignment.consignment,
        supplier: consignment.supplier,
        feedstock: consignment.feedstock,
        freightLegs: legs,
        evidence,
      };
    }),

  listConsignments: protectedProcedure
    .input(
      z.object({
        supplierId: z.number().optional(),
        status: z.enum(consignmentStatuses).optional(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { consignments: [], total: 0 };

      const conditions = [];
      if (input.supplierId) {
        conditions.push(eq(consignments.originSupplierId, input.supplierId));
      }
      if (input.status) {
        conditions.push(eq(consignments.status, input.status));
      }
      if (input.fromDate) {
        conditions.push(gte(consignments.createdAt, input.fromDate));
      }
      if (input.toDate) {
        conditions.push(lte(consignments.createdAt, input.toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(consignments)
        .where(whereClause)
        .orderBy(desc(consignments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(consignments)
        .where(whereClause);

      return { consignments: results, total: countResult?.count || 0 };
    }),

  updateConsignmentStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(consignmentStatuses),
        actualVolumeTonnes: z.number().optional(),
        actualArrivalDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const updateData: any = { status: input.status };
      if (input.actualVolumeTonnes) {
        updateData.actualVolumeTonnes = input.actualVolumeTonnes.toString();
      }
      if (input.actualArrivalDate) {
        updateData.actualArrivalDate = input.actualArrivalDate;
      }

      await db.update(consignments).set(updateData).where(eq(consignments.id, input.id));

      return { success: true, id: input.id, status: input.status };
    }),

  // --------------------------------------------------------------------------
  // FREIGHT LEGS
  // --------------------------------------------------------------------------

  addFreightLeg: protectedProcedure
    .input(
      z.object({
        consignmentId: z.number(),
        legNumber: z.number().min(1),
        transportMode: z.enum(transportModes),
        carrierName: z.string().optional(),
        vehicleRegistration: z.string().optional(),
        driverName: z.string().optional(),
        originLat: z.string(),
        originLng: z.string(),
        originAddress: z.string().optional(),
        destinationLat: z.string(),
        destinationLng: z.string(),
        destinationAddress: z.string().optional(),
        distanceKm: z.number().positive(),
        distanceSource: z.enum(distanceSources).default("route_calculated"),
        departureTime: z.date().optional(),
        arrivalTime: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [result] = await db.insert(freightLegs).values({
        consignmentId: input.consignmentId,
        legNumber: input.legNumber,
        transportMode: input.transportMode,
        carrierName: input.carrierName || null,
        vehicleRegistration: input.vehicleRegistration || null,
        driverName: input.driverName || null,
        originLat: input.originLat,
        originLng: input.originLng,
        originAddress: input.originAddress || null,
        destinationLat: input.destinationLat,
        destinationLng: input.destinationLng,
        destinationAddress: input.destinationAddress || null,
        distanceKm: input.distanceKm.toString(),
        distanceSource: input.distanceSource,
        departureTime: input.departureTime || null,
        arrivalTime: input.arrivalTime || null,
      });

      return { id: result.insertId };
    }),

  updateFreightLeg: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        departureTime: z.date().optional(),
        arrivalTime: z.date().optional(),
        emissionsKgCo2e: z.number().optional(),
        emissionsFactor: z.number().optional(),
        emissionsMethodVersion: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const updateData: any = {};
      if (input.departureTime) updateData.departureTime = input.departureTime;
      if (input.arrivalTime) updateData.arrivalTime = input.arrivalTime;
      if (input.emissionsKgCo2e) updateData.emissionsKgCo2e = input.emissionsKgCo2e.toString();
      if (input.emissionsFactor) updateData.emissionsFactor = input.emissionsFactor.toString();
      if (input.emissionsMethodVersion) updateData.emissionsMethodVersion = input.emissionsMethodVersion;

      await db.update(freightLegs).set(updateData).where(eq(freightLegs.id, input.id));

      return { success: true, id: input.id };
    }),

  getFreightLegs: protectedProcedure
    .input(z.object({ consignmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(freightLegs)
        .where(eq(freightLegs.consignmentId, input.consignmentId))
        .orderBy(freightLegs.legNumber);
    }),

  // --------------------------------------------------------------------------
  // CONSIGNMENT EVIDENCE
  // --------------------------------------------------------------------------

  addEvidence: protectedProcedure
    .input(
      z.object({
        consignmentId: z.number(),
        evidenceType: z.enum(evidenceTypes),
        fileUrl: z.string(),
        fileHashSha256: z.string().length(64),
        mimeType: z.string(),
        fileSizeBytes: z.number().positive(),
        capturedAt: z.date().optional(),
        capturedLat: z.string().optional(),
        capturedLng: z.string().optional(),
        deviceInfo: z.string().optional(),
        exifData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [result] = await db.insert(consignmentEvidence).values({
        consignmentId: input.consignmentId,
        evidenceType: input.evidenceType,
        fileUrl: input.fileUrl,
        fileHashSha256: input.fileHashSha256,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        capturedAt: input.capturedAt || null,
        capturedLat: input.capturedLat || null,
        capturedLng: input.capturedLng || null,
        deviceInfo: input.deviceInfo || null,
        exifData: input.exifData || null,
        uploadedBy: ctx.user.id,
      });

      return { id: result.insertId, evidenceType: input.evidenceType };
    }),

  verifyEvidence: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await db
        .update(consignmentEvidence)
        .set({
          verified: true,
          verifiedBy: ctx.user.id,
          verifiedAt: new Date(),
        })
        .where(eq(consignmentEvidence.id, input.id));

      return { success: true, id: input.id };
    }),

  getConsignmentEvidence: protectedProcedure
    .input(
      z.object({
        consignmentId: z.number(),
        evidenceType: z.enum(evidenceTypes).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(consignmentEvidence.consignmentId, input.consignmentId)];
      if (input.evidenceType) {
        conditions.push(eq(consignmentEvidence.evidenceType, input.evidenceType));
      }

      return await db
        .select()
        .from(consignmentEvidence)
        .where(and(...conditions))
        .orderBy(desc(consignmentEvidence.capturedAt));
    }),

  // --------------------------------------------------------------------------
  // STATS
  // --------------------------------------------------------------------------

  getSupplyChainStats: protectedProcedure
    .input(z.object({ supplierId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { totalConsignments: 0, inTransit: 0, delivered: 0, verified: 0, totalVolumeTonnes: 0 };
      }

      const conditions = input.supplierId
        ? [eq(consignments.originSupplierId, input.supplierId)]
        : [];

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [stats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          inTransit: sql<number>`SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END)`,
          delivered: sql<number>`SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)`,
          verified: sql<number>`SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END)`,
          totalVolume: sql<number>`COALESCE(SUM(CAST(declaredVolumeTonnes AS DECIMAL)), 0)`,
        })
        .from(consignments)
        .where(whereClause);

      return {
        totalConsignments: stats?.total || 0,
        inTransit: stats?.inTransit || 0,
        delivered: stats?.delivered || 0,
        verified: stats?.verified || 0,
        totalVolumeTonnes: stats?.totalVolume || 0,
      };
    }),
});

export type SupplyChainRouter = typeof supplyChainRouter;
