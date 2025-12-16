import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto from "crypto";
import {
  emissionCalculations,
  emissionFactors,
} from "../drizzle/schema";

// ============================================================================
// EMISSIONS ENGINE ROUTER - ABFI v3.1 Phase 4
// ISO 14083, ISO 14064-1, CORSIA calculations
// ============================================================================

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

// Calculation types (matching schema enum)
const calculationTypes = [
  "transport_iso14083",
  "facility_scope1",
  "facility_scope2",
  "scope3_upstream",
  "scope3_downstream",
  "corsia_saf",
  "full_lifecycle",
] as const;

// Methodology standards (matching schema enum)
const methodologyStandards = [
  "ISO_14083",
  "ISO_14064_1",
  "GHG_PROTOCOL",
  "CORSIA",
  "RED_II",
  "ABFI_INTERNAL",
] as const;

// Entity types (matching schema enum - ORDER MATTERS)
const entityTypes = [
  "consignment",
  "freight_leg",
  "facility",
  "feedstock",
  "project",
  "product_batch",
] as const;

// Category types (matching schema enum)
const factorCategories = [
  "transport_road",
  "transport_rail",
  "transport_sea",
  "transport_air",
  "electricity_grid",
  "fuel_combustion",
  "process_emissions",
  "fertilizer",
  "land_use",
] as const;

// CORSIA default CI values (gCO2e/MJ)
const corsiaDefaults = {
  conventional_jet: 89,
  saf_hefa_used_cooking_oil: 13.9,
  saf_hefa_tallow: 22.5,
  saf_hefa_palm_fatty_acid: 37.4,
  saf_ft_municipal_waste: 5.2,
  saf_atj_sugarcane: 24.0,
  saf_atj_corn: 55.8,
};

// Default transport factors
const transportFactors: Record<string, number> = {
  rigid_truck: 120,
  articulated_truck: 80,
  b_double: 60,
  road_train: 45,
  rail_freight: 25,
  bulk_carrier: 8,
  container_ship: 12,
  barge: 35,
  cargo_aircraft: 600,
  road_truck: 80,
  road_van: 100,
  sea_container: 12,
  sea_bulk: 8,
  air_cargo: 600,
  pipeline: 5,
};

// ============================================================================
// EMISSIONS ROUTER
// ============================================================================

export const emissionsRouter = router({
  // --------------------------------------------------------------------------
  // EMISSION FACTORS
  // --------------------------------------------------------------------------

  // Get factors by category
  getFactorsByCategory: publicProcedure
    .input(
      z.object({
        category: z.enum(factorCategories),
        region: z.string().optional(),
        currentOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(emissionFactors.category, input.category)];

      if (input.region) {
        conditions.push(eq(emissionFactors.region, input.region));
      }
      if (input.currentOnly) {
        conditions.push(eq(emissionFactors.isCurrent, true));
      }

      return await db
        .select()
        .from(emissionFactors)
        .where(and(...conditions));
    }),

  // List all factor categories
  listFactorCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const categories = await db
      .selectDistinct({ category: emissionFactors.category })
      .from(emissionFactors)
      .where(eq(emissionFactors.isCurrent, true));

    return categories.map(c => c.category);
  }),

  // --------------------------------------------------------------------------
  // EMISSION CALCULATIONS
  // --------------------------------------------------------------------------

  // Create emission calculation
  createCalculation: protectedProcedure
    .input(
      z.object({
        calculationType: z.enum(calculationTypes),
        entityType: z.enum(entityTypes),
        entityId: z.number(),
        methodologyStandard: z.enum(methodologyStandards),
        methodologyVersion: z.string(),
        totalEmissionsKgCo2e: z.number(),
        emissionsIntensity: z.number().optional(),
        intensityUnit: z.string().optional(),
        emissionsBreakdown: z.object({
          scope1: z.number().optional(),
          scope2: z.number().optional(),
          scope3: z.number().optional(),
          transport: z.number().optional(),
          processing: z.number().optional(),
          feedstock: z.number().optional(),
          distribution: z.number().optional(),
        }).optional(),
        inputSnapshot: z.record(z.string(), z.any()),
        uncertaintyPercent: z.number().optional(),
        dataQualityScore: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Compute input snapshot hash
      const inputSnapshotHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(input.inputSnapshot))
        .digest("hex");

      const [result] = await db.insert(emissionCalculations).values({
        calculationType: input.calculationType,
        entityType: input.entityType,
        entityId: input.entityId,
        methodologyVersion: input.methodologyVersion,
        methodologyStandard: input.methodologyStandard,
        totalEmissionsKgCo2e: input.totalEmissionsKgCo2e.toString(),
        emissionsIntensity: input.emissionsIntensity?.toString() || null,
        intensityUnit: input.intensityUnit || null,
        emissionsBreakdown: input.emissionsBreakdown || null,
        inputSnapshot: input.inputSnapshot,
        inputSnapshotHash,
        uncertaintyPercent: input.uncertaintyPercent?.toString() || null,
        dataQualityScore: input.dataQualityScore || null,
        calculatedBy: ctx.user.id,
      });

      return {
        id: result.insertId,
        totalEmissionsKgCo2e: input.totalEmissionsKgCo2e,
        methodologyStandard: input.methodologyStandard,
      };
    }),

  // Get calculations for entity
  getCalculations: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(entityTypes),
        entityId: z.number(),
        methodologyStandard: z.enum(methodologyStandards).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [
        eq(emissionCalculations.entityType, input.entityType),
        eq(emissionCalculations.entityId, input.entityId),
      ];

      if (input.methodologyStandard) {
        conditions.push(eq(emissionCalculations.methodologyStandard, input.methodologyStandard));
      }

      return await db
        .select()
        .from(emissionCalculations)
        .where(and(...conditions))
        .orderBy(desc(emissionCalculations.calculatedAt));
    }),

  // --------------------------------------------------------------------------
  // ISO 14083 TRANSPORT EMISSIONS
  // --------------------------------------------------------------------------

  calculateTransportEmissions: publicProcedure
    .input(
      z.object({
        distanceKm: z.number().positive(),
        massKg: z.number().positive(),
        transportMode: z.enum(["road_truck", "road_van", "rail_freight", "sea_container", "sea_bulk", "air_cargo", "barge", "pipeline"]),
        vehicleType: z.string().optional(),
        loadFactor: z.number().min(0).max(1).optional(),
        returnEmpty: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      let factorGCo2eTkm = transportFactors[input.vehicleType || ""] ||
                          transportFactors[input.transportMode] || 80;

      if (input.loadFactor && input.loadFactor < 1) {
        factorGCo2eTkm = factorGCo2eTkm / input.loadFactor;
      }

      const tonneKm = (input.massKg / 1000) * input.distanceKm;
      let emissionsKgCo2e = (tonneKm * factorGCo2eTkm) / 1000;

      if (input.returnEmpty) {
        emissionsKgCo2e *= 1.3;
      }

      const carbonIntensity = (emissionsKgCo2e * 1000) / tonneKm;

      return {
        emissionsKgCo2e: Math.round(emissionsKgCo2e * 100) / 100,
        carbonIntensityGCo2eTkm: Math.round(carbonIntensity * 10) / 10,
        tonneKm: Math.round(tonneKm * 100) / 100,
        methodology: "ISO 14083:2023",
        factorUsed: factorGCo2eTkm,
        factorUnit: "gCO2e/tonne-km",
      };
    }),

  // --------------------------------------------------------------------------
  // CORSIA SAF CALCULATIONS
  // --------------------------------------------------------------------------

  calculateCorsiaCI: publicProcedure
    .input(
      z.object({
        safPathway: z.enum([
          "hefa_used_cooking_oil",
          "hefa_tallow",
          "hefa_palm_fatty_acid",
          "ft_municipal_waste",
          "atj_sugarcane",
          "atj_corn",
          "custom",
        ]),
        customCI: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      let carbonIntensity: number;

      if (input.safPathway === "custom" && input.customCI !== undefined) {
        carbonIntensity = input.customCI;
      } else {
        const pathwayKey = `saf_${input.safPathway}` as keyof typeof corsiaDefaults;
        carbonIntensity = corsiaDefaults[pathwayKey] || 89;
      }

      const conventionalCI = corsiaDefaults.conventional_jet;
      const reduction = ((conventionalCI - carbonIntensity) / conventionalCI) * 100;

      return {
        carbonIntensityGCo2eMJ: Math.round(carbonIntensity * 10) / 10,
        conventionalJetCI: conventionalCI,
        ghgReductionPercent: Math.round(reduction * 10) / 10,
        meetsCorsia: reduction >= 10,
        meetsRedII: reduction >= 65,
        pathway: input.safPathway,
        methodology: "CORSIA_default_values",
      };
    }),

  // --------------------------------------------------------------------------
  // FEEDSTOCK CARBON INTENSITY
  // --------------------------------------------------------------------------

  calculateFeedstockCI: publicProcedure
    .input(
      z.object({
        feedstockType: z.string(),
        massKg: z.number().positive(),
        nitrogenFertilizerKg: z.number().optional(),
        dieselLiters: z.number().optional(),
        electricityKwh: z.number().optional(),
        transportDistanceKm: z.number().optional(),
        transportMode: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let cultivationEmissions = 0;
      let transportEmissions = 0;

      if (input.nitrogenFertilizerKg) {
        cultivationEmissions += input.nitrogenFertilizerKg * 5.88;
      }
      if (input.dieselLiters) {
        cultivationEmissions += input.dieselLiters * 2.68;
      }
      if (input.electricityKwh) {
        cultivationEmissions += input.electricityKwh * 0.68;
      }

      const baseEmissions: Record<string, number> = {
        sugarcane: 45, wheat: 120, canola: 180, sorghum: 100,
        corn: 150, soybeans: 100, used_cooking_oil: 5, tallow: 10,
      };

      const basePerTonne = baseEmissions[input.feedstockType.toLowerCase()] || 100;
      cultivationEmissions += (basePerTonne * input.massKg) / 1000;

      if (input.transportDistanceKm) {
        const tonneKm = (input.massKg / 1000) * input.transportDistanceKm;
        const transportFactor = input.transportMode === "rail" ? 25 : 80;
        transportEmissions = (tonneKm * transportFactor) / 1000;
      }

      const totalEmissions = cultivationEmissions + transportEmissions;
      const carbonIntensity = (totalEmissions / input.massKg) * 1000;

      return {
        totalEmissionsKgCo2e: Math.round(totalEmissions * 100) / 100,
        cultivationEmissionsKgCo2e: Math.round(cultivationEmissions * 100) / 100,
        transportEmissionsKgCo2e: Math.round(transportEmissions * 100) / 100,
        carbonIntensityGCo2eKg: Math.round(carbonIntensity * 10) / 10,
        methodology: "ISO 14064-1 aligned",
      };
    }),

  // Get CORSIA defaults
  getCorsiaDefaults: publicProcedure.query(() => corsiaDefaults),

  // Get transport factors
  getTransportFactors: publicProcedure.query(() => transportFactors),
});

export type EmissionsRouter = typeof emissionsRouter;
