import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto from "crypto";
import {
  abfiPaymentGuarantees,
  abfiSupplyChainDeliveries,
  abfiGateEvents,
  abfiPaymentReleases,
  abfiBankabilityAssessments,
} from "../drizzle/schema";

// ============================================================================
// ABFI SUPPLY CHAIN ROUTER - Gate 0..4 JIT Payment Rail
// ============================================================================

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

const guaranteeTypes = ["sblc", "trust_account", "gnosis_safe"] as const;
const guaranteeStatuses = ["pending", "secured", "rejected", "expired", "released"] as const;
const deliveryStatuses = ["created", "in_progress", "completed", "disputed", "cancelled"] as const;
const gateDeviceTypes = [
  "harvester_yield_meter",
  "nir_probe",
  "load_cell",
  "arrival_scan",
  "lab_result",
] as const;

const toDecimalString = (value?: number | null) =>
  value === undefined || value === null ? null : value.toString();

const gatePercentages: Record<number, number> = {
  0: 30,
  1: 20,
  2: 30,
  3: 15,
  4: 5,
};

function buildId(prefix: string) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

function computeReleaseAmount(contractValue: number, percent: number) {
  return Number((contractValue * percent / 100).toFixed(2));
}

export const abfiSupplyChainRouter = router({
  // --------------------------------------------------------------------------
  // PAYMENT GUARANTEES
  // --------------------------------------------------------------------------
  createGuarantee: protectedProcedure
    .input(z.object({
      guaranteeType: z.enum(guaranteeTypes),
      amount: z.number().positive(),
      currency: z.string().length(3).default("AUD"),
      providerName: z.string().max(255).optional(),

      sblcSwiftRef: z.string().max(50).optional(),
      sblcDocumentUrl: z.string().url().optional(),
      sblcIssuerBank: z.string().max(255).optional(),
      sblcIssuedAt: z.date().optional(),
      sblcExpiresAt: z.date().optional(),

      trustAccountRef: z.string().max(100).optional(),
      trustAccountBalance: z.number().optional(),

      gnosisSafeAddress: z.string().max(100).optional(),
      gnosisChain: z.string().max(50).optional(),
      gnosisDepositTxHash: z.string().max(100).optional(),

      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const guaranteeId = buildId("GUAR");
      const [result] = await db.insert(abfiPaymentGuarantees).values({
        guaranteeId,
        guaranteeType: input.guaranteeType,
        status: "pending",
        amount: input.amount.toString(),
        currency: input.currency,
        providerName: input.providerName || null,
        sblcSwiftRef: input.sblcSwiftRef || null,
        sblcDocumentUrl: input.sblcDocumentUrl || null,
        sblcIssuerBank: input.sblcIssuerBank || null,
        sblcIssuedAt: input.sblcIssuedAt || null,
        sblcExpiresAt: input.sblcExpiresAt || null,
        trustAccountRef: input.trustAccountRef || null,
        trustAccountBalance: toDecimalString(input.trustAccountBalance),
        gnosisSafeAddress: input.gnosisSafeAddress || null,
        gnosisChain: input.gnosisChain || null,
        gnosisDepositTxHash: input.gnosisDepositTxHash || null,
        verifiedBy: ctx.user?.id || null,
        metadata: input.metadata || null,
      });

      return { id: result.insertId, guaranteeId, status: "pending" as const };
    }),

  markGuaranteeSecured: protectedProcedure
    .input(z.object({
      guaranteeId: z.string(),
      status: z.enum(guaranteeStatuses).default("secured"),
      verifiedAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [guarantee] = await db
        .select()
        .from(abfiPaymentGuarantees)
        .where(eq(abfiPaymentGuarantees.guaranteeId, input.guaranteeId))
        .limit(1);

      if (!guarantee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Guarantee not found" });
      }

      await db
        .update(abfiPaymentGuarantees)
        .set({
          status: input.status,
          verifiedAt: input.verifiedAt || new Date(),
          verifiedBy: ctx.user?.id || null,
        })
        .where(eq(abfiPaymentGuarantees.id, guarantee.id));

      return { success: true, status: input.status };
    }),

  // --------------------------------------------------------------------------
  // DELIVERIES
  // --------------------------------------------------------------------------
  createDelivery: protectedProcedure
    .input(z.object({
      assessmentId: z.string().optional(),
      projectId: z.number().optional(),
      buyerId: z.number().optional(),
      growerSupplierId: z.number().optional(),
      guaranteeId: z.string().optional(),
      contractValue: z.number().positive(),
      currency: z.string().length(3).default("AUD"),
      expectedTonnes: z.number().optional(),
      minGate0Tonnes: z.number().optional(),
      harvestStartAt: z.date().optional(),
      harvestEndAt: z.date().optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      let assessmentIdValue: number | null = null;
      if (input.assessmentId) {
        const [assessment] = await db
          .select({ id: abfiBankabilityAssessments.id })
          .from(abfiBankabilityAssessments)
          .where(eq(abfiBankabilityAssessments.assessmentId, input.assessmentId))
          .limit(1);
        assessmentIdValue = assessment?.id ?? null;
      }

      let guaranteeIdValue: number | null = null;
      if (input.guaranteeId) {
        const [guarantee] = await db
          .select({ id: abfiPaymentGuarantees.id })
          .from(abfiPaymentGuarantees)
          .where(eq(abfiPaymentGuarantees.guaranteeId, input.guaranteeId))
          .limit(1);
        guaranteeIdValue = guarantee?.id ?? null;
      }

      const deliveryId = buildId("DEL");
      const [result] = await db.insert(abfiSupplyChainDeliveries).values({
        deliveryId,
        assessmentId: assessmentIdValue,
        projectId: input.projectId || null,
        buyerId: input.buyerId || null,
        growerSupplierId: input.growerSupplierId || null,
        guaranteeId: guaranteeIdValue,
        contractValue: input.contractValue.toString(),
        currency: input.currency,
        expectedTonnes: toDecimalString(input.expectedTonnes),
        minGate0Tonnes: toDecimalString(input.minGate0Tonnes),
        harvestStartAt: input.harvestStartAt || null,
        harvestEndAt: input.harvestEndAt || null,
        status: "created",
        notes: input.notes || null,
      });

      return { id: result.insertId, deliveryId, status: "created" as const };
    }),

  listDeliveries: protectedProcedure
    .input(z.object({
      status: z.enum(deliveryStatuses).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { deliveries: [], total: 0 };

      const whereClause = input.status
        ? eq(abfiSupplyChainDeliveries.status, input.status)
        : undefined;

      const deliveries = await db
        .select()
        .from(abfiSupplyChainDeliveries)
        .where(whereClause)
        .orderBy(desc(abfiSupplyChainDeliveries.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(abfiSupplyChainDeliveries)
        .where(whereClause);

      return { deliveries, total: count };
    }),

  getDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [delivery] = await db
        .select()
        .from(abfiSupplyChainDeliveries)
        .where(eq(abfiSupplyChainDeliveries.deliveryId, input.deliveryId))
        .limit(1);

      if (!delivery) return null;

      const gateEvents = await db
        .select()
        .from(abfiGateEvents)
        .where(eq(abfiGateEvents.deliveryId, delivery.id))
        .orderBy(desc(abfiGateEvents.recordedAt));

      const releases = await db
        .select()
        .from(abfiPaymentReleases)
        .where(eq(abfiPaymentReleases.deliveryId, delivery.id))
        .orderBy(desc(abfiPaymentReleases.createdAt));

      return { delivery, gateEvents, releases };
    }),

  // --------------------------------------------------------------------------
  // GATE EVENTS + PAYMENT RELEASES
  // --------------------------------------------------------------------------
  recordGateEvent: protectedProcedure
    .input(z.object({
      deliveryId: z.string(),
      gateIndex: z.number().int().min(0).max(4),
      deviceType: z.enum(gateDeviceTypes),
      payload: z.record(z.any()).optional(),
      sensorTimestamp: z.date().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      cumulativeTonnes: z.number().optional(),
      instantaneousTonnesPerHour: z.number().optional(),
      moisturePct: z.number().optional(),
      dryMatterPct: z.number().optional(),
      ashPct: z.number().optional(),
      calorificValueGJPerT: z.number().optional(),
      fuelLiters: z.number().optional(),
      grossTonnes: z.number().optional(),
      tareTonnes: z.number().optional(),
      netDryTonnes: z.number().optional(),
      sealId: z.string().max(100).optional(),
      routeVariancePct: z.number().optional(),
      contaminationPpm: z.number().optional(),
      tamperFlag: z.boolean().optional(),
      gatewayId: z.string().max(100).optional(),
      gatewaySignature: z.string().max(255).optional(),
      adjustmentPercent: z.number().optional(),
      releaseRef: z.string().max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [delivery] = await db
        .select()
        .from(abfiSupplyChainDeliveries)
        .where(eq(abfiSupplyChainDeliveries.deliveryId, input.deliveryId))
        .limit(1);

      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }

      const existingGate = await db
        .select({ id: abfiGateEvents.id })
        .from(abfiGateEvents)
        .where(and(
          eq(abfiGateEvents.deliveryId, delivery.id),
          eq(abfiGateEvents.gateIndex, input.gateIndex)
        ))
        .limit(1);

      if (existingGate.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Gate already recorded for this delivery" });
      }

      if (delivery.lastGateIndex === null || delivery.lastGateIndex === undefined) {
        if (input.gateIndex !== 0) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gate 0 must be recorded first" });
        }
      } else if (input.gateIndex !== delivery.lastGateIndex + 1) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gate sequence out of order" });
      }

      if (input.gateIndex === 0 && delivery.minGate0Tonnes && input.cumulativeTonnes !== undefined) {
        const minGate0 = Number(delivery.minGate0Tonnes);
        if (input.cumulativeTonnes < minGate0) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Below minimum Gate-0 tonnes" });
        }
      }

      if (delivery.guaranteeId) {
        const [guarantee] = await db
          .select()
          .from(abfiPaymentGuarantees)
          .where(eq(abfiPaymentGuarantees.id, delivery.guaranteeId))
          .limit(1);

        if (!guarantee || guarantee.status !== "secured") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Funds not secured" });
        }
      }

      const [eventResult] = await db.insert(abfiGateEvents).values({
        deliveryId: delivery.id,
        gateIndex: input.gateIndex,
        deviceType: input.deviceType,
        payload: input.payload || null,
        sensorTimestamp: input.sensorTimestamp || null,
        latitude: toDecimalString(input.latitude),
        longitude: toDecimalString(input.longitude),
        cumulativeTonnes: toDecimalString(input.cumulativeTonnes),
        instantaneousTonnesPerHour: toDecimalString(input.instantaneousTonnesPerHour),
        moisturePct: toDecimalString(input.moisturePct),
        dryMatterPct: toDecimalString(input.dryMatterPct),
        ashPct: toDecimalString(input.ashPct),
        calorificValueGJPerT: toDecimalString(input.calorificValueGJPerT),
        fuelLiters: toDecimalString(input.fuelLiters),
        grossTonnes: toDecimalString(input.grossTonnes),
        tareTonnes: toDecimalString(input.tareTonnes),
        netDryTonnes: toDecimalString(input.netDryTonnes),
        sealId: input.sealId || null,
        routeVariancePct: toDecimalString(input.routeVariancePct),
        contaminationPpm: toDecimalString(input.contaminationPpm),
        tamperFlag: input.tamperFlag ?? false,
        gatewayId: input.gatewayId || null,
        gatewaySignature: input.gatewaySignature || null,
        validationStatus: "accepted",
      });

      const basePercent = gatePercentages[input.gateIndex] ?? 0;
      const adjustment = input.gateIndex === 4 ? (input.adjustmentPercent || 0) : 0;
      const releasePercent = basePercent + adjustment;
      const contractValue = Number(delivery.contractValue);
      const releaseAmount = computeReleaseAmount(contractValue, releasePercent);

      const [releaseResult] = await db.insert(abfiPaymentReleases).values({
        deliveryId: delivery.id,
        gateIndex: input.gateIndex,
        percent: releasePercent,
        amount: releaseAmount.toString(),
        currency: delivery.currency,
        status: "released",
        releasedAt: new Date(),
        releaseRef: input.releaseRef || null,
      });

      const nextStatus = input.gateIndex === 4 ? "completed" : "in_progress";
      await db.update(abfiSupplyChainDeliveries)
        .set({
          lastGateIndex: input.gateIndex,
          status: nextStatus,
          fundsSecured: true,
          fundsSecuredAt: delivery.fundsSecuredAt || new Date(),
          harvestStartAt: delivery.harvestStartAt || (input.gateIndex === 0 ? new Date() : null),
          harvestEndAt: input.gateIndex === 4 ? new Date() : delivery.harvestEndAt,
        })
        .where(eq(abfiSupplyChainDeliveries.id, delivery.id));

      return {
        gateEventId: eventResult.insertId,
        paymentReleaseId: releaseResult.insertId,
        releasePercent,
        releaseAmount,
      };
    }),
});
