/**
 * Contract Matching Router
 * Handles the pipeline: Intention -> Match -> Negotiation -> Contract -> Delivery
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./db";
import { eq, and, or, desc, asc, sql, gte, lte, isNull } from "drizzle-orm";
import {
  applyVisibilityFilter,
  createVisibilityContext,
  transformForBuyerView,
  transformForGrowerView,
} from "./middleware/visibilityFilter";

// Helper to generate unique IDs
function generateMatchId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const uniqueId = crypto.randomUUID().replace(/-/g, "").substring(0, 5).toUpperCase();
  return `ABFI-MATCH-${dateStr}-${uniqueId}`;
}

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const uniqueId = crypto.randomUUID().replace(/-/g, "").substring(0, 5).toUpperCase();
  return `ABFI-CON-${year}-${uniqueId}`;
}

function generateDeliveryId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const uniqueId = crypto.randomUUID().replace(/-/g, "").substring(0, 5).toUpperCase();
  return `ABFI-DEL-${dateStr}-${uniqueId}`;
}

// Haversine distance calculation
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate match score between demand signal and supply
function calculateMatchScore(
  demand: any,
  supply: any,
  distanceKm: number
): {
  score: number;
  factors: Record<string, { value: number; weight: number; score: number }>;
} {
  const factors: Record<string, { value: number; weight: number; score: number }> = {};

  // Distance score (closer is better, max 200km)
  const maxDistance = demand.maxTransportDistance || 200;
  const distanceScore = Math.max(0, 100 - (distanceKm / maxDistance) * 100);
  factors.distance = { value: distanceKm, weight: 0.25, score: distanceScore };

  // Volume score (how much of demand can be fulfilled)
  const supplyVolume = supply.projectedVolumeTonnes || supply.availableVolumeCurrent || 0;
  const demandVolume = demand.annualVolume || 0;
  const volumeMatchPercent = Math.min(100, (supplyVolume / demandVolume) * 100);
  factors.volume = { value: volumeMatchPercent, weight: 0.25, score: volumeMatchPercent };

  // Timing score (harvest date vs required date alignment)
  let timingScore = 50; // Default if dates not available
  if (supply.availableFromDate && demand.supplyStartDate) {
    const supplyDate = new Date(supply.availableFromDate);
    const demandDate = new Date(demand.supplyStartDate);
    const daysDiff = Math.abs(
      (supplyDate.getTime() - demandDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    timingScore = Math.max(0, 100 - daysDiff * 2); // -2 points per day difference
  }
  factors.timing = { value: timingScore, weight: 0.2, score: timingScore };

  // Price compatibility (if both have price info)
  let priceScore = 70; // Default if price not available
  if (supply.askingPricePerTonne && demand.indicativePriceMax) {
    if (supply.askingPricePerTonne <= demand.indicativePriceMax) {
      priceScore = 100;
    } else if (supply.askingPricePerTonne <= demand.indicativePriceMax * 1.1) {
      priceScore = 80;
    } else if (supply.askingPricePerTonne <= demand.indicativePriceMax * 1.2) {
      priceScore = 60;
    } else {
      priceScore = 30;
    }
  }
  factors.price = { value: priceScore, weight: 0.15, score: priceScore };

  // Quality match score
  let qualityScore = 70; // Default
  if (supply.expectedCarbonIntensity && demand.feedstockCategory) {
    // Better carbon intensity = higher score
    qualityScore = Math.max(0, 100 - supply.expectedCarbonIntensity);
  }
  factors.quality = { value: qualityScore, weight: 0.15, score: qualityScore };

  // Calculate weighted total
  const totalScore = Object.values(factors).reduce(
    (sum, f) => sum + f.score * f.weight,
    0
  );

  return { score: totalScore, factors };
}

// Estimate transport cost
function estimateTransportCost(distanceKm: number, volumeTonnes: number): number {
  // Base rate: $0.15 per tonne-km for road transport
  const baseRate = 0.15;
  // Volume discount: 5% discount per 100 tonnes
  const volumeDiscount = Math.min(0.2, (volumeTonnes / 100) * 0.05);
  // Distance efficiency: longer distances slightly cheaper per km
  const distanceEfficiency = distanceKm > 100 ? 0.95 : 1.0;

  return distanceKm * volumeTonnes * baseRate * (1 - volumeDiscount) * distanceEfficiency;
}

export const contractMatchingRouter = router({
  /**
   * Generate matches for a demand signal
   * Finds compatible supply sources and creates match records
   */
  generateMatches: protectedProcedure
    .input(
      z.object({
        demandSignalId: z.number(),
        maxMatches: z.number().default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { demandSignalId, maxMatches } = input;

      // Get demand signal details
      const demandSignal = await db.getDemandSignalById(demandSignalId);
      if (!demandSignal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demand signal not found",
        });
      }

      // Check authorization
      const buyer = await db.getBuyerByUserId(ctx.user.id);
      if (!buyer || buyer.id !== demandSignal.buyerId) {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to generate matches for this demand signal",
          });
        }
      }

      // Get delivery location
      const deliveryLat = parseFloat(demandSignal.deliveryLatitude || "-33.8688");
      const deliveryLng = parseFloat(demandSignal.deliveryLongitude || "151.2093");
      const maxDistance = demandSignal.maxTransportDistance || 200;

      // Find matching supply sources
      // 1. Active feedstocks
      const feedstocks = await db.searchFeedstocks({
        category: [demandSignal.feedstockCategory],
        status: "active",
        limit: 100,
      });

      // 2. Published growing intentions (from schema-market-intelligence)
      // Note: This would need the db function to be implemented
      // const intentions = await db.searchGrowingIntentions({...});

      // Calculate matches
      const matches: Array<{
        supplyType: "feedstock" | "intention" | "project";
        supplyId: number;
        supply: any;
        distanceKm: number;
        matchScore: number;
        factors: any;
        estimatedTransportCost: number;
        volumeMatchPercent: number;
      }> = [];

      for (const feedstock of feedstocks) {
        const supplyLat = parseFloat(feedstock.latitude);
        const supplyLng = parseFloat(feedstock.longitude);
        const distanceKm = calculateDistance(deliveryLat, deliveryLng, supplyLat, supplyLng);

        if (distanceKm <= maxDistance) {
          const { score, factors } = calculateMatchScore(demandSignal, feedstock, distanceKm);
          const volumeMatchPercent = Math.min(
            100,
            ((feedstock.availableVolumeCurrent || 0) / demandSignal.annualVolume) * 100
          );
          const estimatedTransportCost = estimateTransportCost(
            distanceKm,
            Math.min(feedstock.availableVolumeCurrent || 0, demandSignal.annualVolume)
          );

          matches.push({
            supplyType: "feedstock",
            supplyId: feedstock.id,
            supply: feedstock,
            distanceKm,
            matchScore: score,
            factors,
            estimatedTransportCost,
            volumeMatchPercent,
          });
        }
      }

      // Sort by match score and take top matches
      matches.sort((a, b) => b.matchScore - a.matchScore);
      const topMatches = matches.slice(0, maxMatches);

      // Create match records
      const createdMatches = [];
      for (const match of topMatches) {
        const matchRecord = {
          matchId: generateMatchId(),
          demandSignalId,
          feedstockId: match.supplyType === "feedstock" ? match.supplyId : null,
          intentionId: match.supplyType === "intention" ? match.supplyId : null,
          projectId: match.supplyType === "project" ? match.supplyId : null,
          matchScore: match.matchScore,
          distanceKm: match.distanceKm,
          estimatedTransportCost: match.estimatedTransportCost.toFixed(2),
          volumeMatchPercent: match.volumeMatchPercent,
          priceCompatibilityScore: match.factors.price?.score || null,
          timingAlignmentScore: match.factors.timing?.score || null,
          qualityMatchScore: match.factors.quality?.score || null,
          matchFactors: match.factors,
          status: "SUGGESTED",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        // Note: Would need db.createContractMatch to be implemented
        createdMatches.push(matchRecord);
      }

      return {
        demandSignalId,
        matchesGenerated: createdMatches.length,
        matches: createdMatches,
      };
    }),

  /**
   * Get matches for a demand signal (buyer view)
   */
  getMatchesForDemand: protectedProcedure
    .input(
      z.object({
        demandSignalId: z.number(),
        status: z.enum(["SUGGESTED", "VIEWED", "NEGOTIATING", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
        sortBy: z.enum(["matchScore", "distance", "price"]).default("matchScore"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { demandSignalId, status, sortBy } = input;

      // Verify buyer owns this demand signal
      const demandSignal = await db.getDemandSignalById(demandSignalId);
      if (!demandSignal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Demand signal not found" });
      }

      const buyer = await db.getBuyerByUserId(ctx.user.id);
      if (!buyer || (buyer.id !== demandSignal.buyerId && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Note: Would query contract_matches table
      // const matches = await db.getMatchesForDemandSignal(demandSignalId, { status, sortBy });

      // Apply visibility filtering to grower details
      const visibilityContext = createVisibilityContext(ctx.user, undefined, buyer?.id);

      // Return matches with transformed grower data
      return {
        demandSignalId,
        matches: [], // Would be populated from DB
        total: 0,
      };
    }),

  /**
   * Get matches for a grower's supply
   */
  getMatchesForGrower: protectedProcedure.query(async ({ ctx }) => {
    // Get supplier profile
    const supplier = await db.getSupplierByUserId(ctx.user.id);
    if (!supplier) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Supplier profile not found",
      });
    }

    // Note: Would query matches where grower's feedstocks/intentions are matched
    // const matches = await db.getMatchesForSupplier(supplier.id);

    return {
      supplierId: supplier.id,
      matches: [],
      total: 0,
    };
  }),

  /**
   * Start negotiation on a match
   */
  startNegotiation: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        initialOffer: z.object({
          pricePerTonne: z.number().positive(),
          volumeTonnes: z.number().positive(),
          proposedDeliveryDate: z.string(),
          deliveryTerms: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { matchId, initialOffer } = input;

      // Note: Would get match and verify authorization
      // const match = await db.getContractMatchById(matchId);

      // Update match status
      // await db.updateContractMatch(matchId, { status: "NEGOTIATING", negotiationStartedAt: new Date() });

      // Create initial negotiation message
      const message = {
        matchId,
        senderId: ctx.user.id,
        senderRole: "BUYER", // or "GROWER" based on who initiated
        messageType: "INITIAL_OFFER",
        offerDetails: initialOffer,
        createdAt: new Date(),
      };

      // Note: Would create negotiation message
      // await db.createNegotiationMessage(message);

      // Note: Would send notification to counterparty

      return {
        matchId,
        status: "NEGOTIATING",
        message: "Negotiation started successfully",
      };
    }),

  /**
   * Accept a match and create contract
   */
  acceptMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        contractTerms: z.object({
          volumeTonnes: z.number().positive(),
          pricePerTonne: z.number().positive(),
          deliverySchedule: z.array(
            z.object({
              date: z.string(),
              volumeTonnes: z.number().positive(),
            })
          ),
          qualitySpecs: z.object({
            maxMoisture: z.number().optional(),
            minEnergyContent: z.number().optional(),
            maxAshContent: z.number().optional(),
            maxContamination: z.number().optional(),
          }),
          paymentTerms: z.enum(["UPFRONT", "ON_DELIVERY", "NET_30", "MILESTONE"]),
          deliveryLocation: z.object({
            lat: z.number(),
            lng: z.number(),
            address: z.string(),
          }),
          incoterm: z.string().default("DAP"),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { matchId, contractTerms } = input;

      // Note: Would get match details
      // const match = await db.getContractMatchById(matchId);

      // Calculate total value
      const totalValue = contractTerms.volumeTonnes * contractTerms.pricePerTonne;

      // Create contract
      const contract = {
        contractNumber: generateContractNumber(),
        matchId,
        buyerId: 0, // from match.demandSignal.buyerId
        growerId: 0, // from match supply owner
        feedstockCategory: "", // from match
        feedstockType: "", // from match
        volumeTonnes: contractTerms.volumeTonnes.toFixed(2),
        pricePerTonne: contractTerms.pricePerTonne.toFixed(2),
        totalValue: totalValue.toFixed(2),
        deliveryTerms: {
          incoterm: contractTerms.incoterm,
          deliveryLocation: contractTerms.deliveryLocation,
          schedule: contractTerms.deliverySchedule,
        },
        qualitySpecs: contractTerms.qualitySpecs,
        paymentTerms: contractTerms.paymentTerms,
        status: "PENDING_GROWER",
        createdAt: new Date(),
      };

      // Note: Would create contract and update match status
      // const createdContract = await db.createContract(contract);
      // await db.updateContractMatch(matchId, { status: "ACCEPTED" });

      // Create delivery schedule records
      for (const delivery of contractTerms.deliverySchedule) {
        const deliveryRecord = {
          deliveryId: generateDeliveryId(),
          contractId: 0, // createdContract.id
          scheduledDate: new Date(delivery.date),
          scheduledVolumeTonnes: delivery.volumeTonnes.toFixed(2),
          deliveryLocation: contractTerms.deliveryLocation,
          status: "SCHEDULED",
        };
        // await db.createDelivery(deliveryRecord);
      }

      return {
        contractNumber: contract.contractNumber,
        status: "PENDING_GROWER",
        message: "Contract created and awaiting grower acceptance",
      };
    }),

  /**
   * Sign contract (by either party)
   */
  signContract: protectedProcedure
    .input(
      z.object({
        contractId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { contractId } = input;

      // Note: Would get contract and verify authorization
      // const contract = await db.getContractById(contractId);

      // Determine if user is buyer or grower
      const buyer = await db.getBuyerByUserId(ctx.user.id);
      const supplier = await db.getSupplierByUserId(ctx.user.id);

      // Note: Would check if user is party to contract and hasn't already signed
      // Update appropriate signature field

      // If both parties signed, activate contract
      // if (contract.signedByBuyerAt && contract.signedByGrowerAt) {
      //   await db.updateContract(contractId, { status: "ACTIVE" });
      // }

      return {
        contractId,
        message: "Contract signed successfully",
      };
    }),

  /**
   * Update delivery status
   */
  updateDeliveryStatus: protectedProcedure
    .input(
      z.object({
        deliveryId: z.number(),
        status: z.enum([
          "SCHEDULED",
          "IN_TRANSIT",
          "DELIVERED",
          "QUALITY_VERIFIED",
          "DISPUTED",
          "SETTLED",
        ]),
        actualVolumeTonnes: z.number().optional(),
        qualityResults: z
          .object({
            moisture: z.number().optional(),
            energyContent: z.number().optional(),
            ashContent: z.number().optional(),
            contamination: z.number().optional(),
            overallPass: z.boolean().optional(),
          })
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { deliveryId, status, actualVolumeTonnes, qualityResults, notes } = input;

      // Note: Would verify authorization and update delivery
      const updateData: any = { status };

      if (status === "DELIVERED") {
        updateData.actualDate = new Date();
        if (actualVolumeTonnes) {
          updateData.actualVolumeTonnes = actualVolumeTonnes.toFixed(2);
        }
      }

      if (status === "QUALITY_VERIFIED" && qualityResults) {
        updateData.qualityResults = qualityResults;
        updateData.qualityPassed = qualityResults.overallPass ?? true;
      }

      if (notes) {
        updateData.notes = notes;
      }

      // await db.updateDelivery(deliveryId, updateData);

      // Update contract delivery progress
      // Note: Would recalculate and update contract.totalDelivered and deliveryProgress

      return {
        deliveryId,
        status,
        message: "Delivery status updated",
      };
    }),

  /**
   * Get contract details
   */
  getContract: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Note: Would get contract and verify authorization
      // Only buyer, grower, and admin can view

      return null;
    }),

  /**
   * List contracts for current user
   */
  listContracts: protectedProcedure
    .input(
      z.object({
        status: z
          .enum([
            "DRAFT",
            "PENDING_GROWER",
            "PENDING_BUYER",
            "ACTIVE",
            "DELIVERING",
            "COMPLETED",
            "DISPUTED",
            "CANCELLED",
          ])
          .optional(),
        role: z.enum(["BUYER", "GROWER"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const buyer = await db.getBuyerByUserId(ctx.user.id);
      const supplier = await db.getSupplierByUserId(ctx.user.id);

      // Note: Would query contracts where user is buyer or grower
      // Apply filters and pagination

      return {
        contracts: [],
        total: 0,
      };
    }),

  /**
   * Get deliveries for a contract
   */
  getContractDeliveries: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Note: Would verify authorization and return deliveries

      return {
        contractId: input.contractId,
        deliveries: [],
        total: 0,
      };
    }),

  /**
   * Expire old matches (admin job)
   */
  expireOldMatches: adminProcedure.mutation(async () => {
    // Note: Would update all matches past expiresAt to status: "EXPIRED"
    // const expired = await db.expireOldMatches();

    return {
      expiredCount: 0,
      message: "Old matches expired",
    };
  }),
});

export type ContractMatchingRouter = typeof contractMatchingRouter;
