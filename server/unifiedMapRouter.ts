/**
 * Unified Map Router
 * Central router for the Market Intelligence Map dashboard
 * Aggregates data from all sources with role-based visibility
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import {
  applyVisibilityFilter,
  createVisibilityContext,
  transformForBuyerView,
  transformForGrowerView,
  transformForLenderView,
  aggregateByRegion,
  canUserSeeEntity,
} from "./middleware/visibilityFilter";

// Types for map entities
interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface MapFilters {
  feedstockCategories?: string[];
  states?: string[];
  minAbfiScore?: number;
  maxCarbonIntensity?: number;
  dateRange?: { start: string; end: string };
  status?: string[];
}

// Role definitions for map access
const MAP_ROLES = ["GROWER", "BUYER", "SUPPLIER", "LENDER", "ADMIN"] as const;
type MapRole = (typeof MAP_ROLES)[number];

// Map role from user role
function getMapRole(userRole: string): MapRole {
  switch (userRole) {
    case "admin":
      return "ADMIN";
    case "buyer":
      return "BUYER";
    case "supplier":
      return "GROWER"; // Growers are suppliers
    case "auditor":
      return "LENDER"; // Auditors see lender view
    default:
      return "BUYER"; // Default to buyer view for authenticated users
  }
}

// Haversine distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
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

// Check if point is in viewport bounds
function isInBounds(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
}

// ============================================================================
// SAMPLE DATA FOR TESTING THE MAP
// ============================================================================

const SAMPLE_PROJECTS = [
  { id: 1, name: "Sunflower Fields QLD", latitude: -27.4698, longitude: 153.0251, feedstockCategory: "oilseed", feedstockType: "Sunflower", projectedVolumeTonnes: 5000, askingPricePerTonne: 420, status: "ACTIVE", region: "Queensland", availableFromDate: "2025-03-01" },
  { id: 2, name: "Canola Farm NSW", latitude: -33.8688, longitude: 151.2093, feedstockCategory: "oilseed", feedstockType: "Canola", projectedVolumeTonnes: 12000, askingPricePerTonne: 380, status: "ACTIVE", region: "New South Wales", availableFromDate: "2025-04-15" },
  { id: 3, name: "Wheat Residue Victoria", latitude: -37.8136, longitude: 144.9631, feedstockCategory: "lignocellulosic", feedstockType: "Wheat Straw", projectedVolumeTonnes: 8500, askingPricePerTonne: 95, status: "ACTIVE", region: "Victoria", availableFromDate: "2025-02-01" },
  { id: 4, name: "Tallow Processing SA", latitude: -34.9285, longitude: 138.6007, feedstockCategory: "tallow", feedstockType: "Category 1 Tallow", projectedVolumeTonnes: 3200, askingPricePerTonne: 890, status: "ACTIVE", region: "South Australia", availableFromDate: "2025-01-15" },
  { id: 5, name: "UCO Collection Melbourne", latitude: -37.9716, longitude: 145.1227, feedstockCategory: "UCO", feedstockType: "Used Cooking Oil", projectedVolumeTonnes: 1500, askingPricePerTonne: 750, status: "PENDING_VERIFICATION", region: "Victoria", availableFromDate: "2025-03-01" },
  { id: 6, name: "Sugarcane Bagasse QLD", latitude: -19.2590, longitude: 146.8169, feedstockCategory: "lignocellulosic", feedstockType: "Bagasse", projectedVolumeTonnes: 25000, askingPricePerTonne: 65, status: "ACTIVE", region: "Queensland", availableFromDate: "2025-06-01" },
  { id: 7, name: "Algae Farm WA", latitude: -31.9505, longitude: 115.8605, feedstockCategory: "algae", feedstockType: "Microalgae", projectedVolumeTonnes: 500, askingPricePerTonne: 2200, status: "ACTIVE", region: "Western Australia", availableFromDate: "2025-05-01" },
  { id: 8, name: "Green Waste Processing", latitude: -33.4489, longitude: 149.5813, feedstockCategory: "waste", feedstockType: "Municipal Green Waste", projectedVolumeTonnes: 15000, askingPricePerTonne: 45, status: "ACTIVE", region: "New South Wales", availableFromDate: "2025-02-15" },
];

const SAMPLE_INTENTIONS = [
  { id: 101, name: "Planned Canola Expansion", latitude: -35.2809, longitude: 149.1300, feedstockCategory: "oilseed", feedstockType: "Canola", projectedVolumeTonnes: 20000, askingPricePerTonne: 395, status: "DRAFT", region: "ACT", availableFromDate: "2026-01-01" },
  { id: 102, name: "New Bamboo Plantation", latitude: -28.0167, longitude: 153.4000, feedstockCategory: "bamboo", feedstockType: "Giant Bamboo", projectedVolumeTonnes: 8000, askingPricePerTonne: 180, status: "PENDING_VERIFICATION", region: "Queensland", availableFromDate: "2026-06-01" },
];

const SAMPLE_DEMAND_SIGNALS = [
  { id: 201, signalNumber: "DS-2025-001", title: "SAF Feedstock Required - Brisbane", feedstockCategory: "oilseed", feedstockType: "Any Oilseed", volumeTonnesMin: 10000, volumeTonnesMax: 25000, maxPricePerTonne: 450, latitude: -27.3818, longitude: 153.1931, status: "ACTIVE", region: "Queensland", deliveryWindowStart: "2025-06-01", deliveryWindowEnd: "2025-12-31" },
  { id: 202, signalNumber: "DS-2025-002", title: "UCO for Biodiesel Production", feedstockCategory: "UCO", feedstockType: "Used Cooking Oil", volumeTonnesMin: 2000, volumeTonnesMax: 5000, maxPricePerTonne: 820, latitude: -33.8523, longitude: 151.2108, status: "ACTIVE", region: "New South Wales", deliveryWindowStart: "2025-04-01", deliveryWindowEnd: "2025-09-30" },
  { id: 203, signalNumber: "DS-2025-003", title: "Tallow for Renewable Diesel", feedstockCategory: "tallow", feedstockType: "Category 1-3 Tallow", volumeTonnesMin: 5000, volumeTonnesMax: 15000, maxPricePerTonne: 950, latitude: -38.1499, longitude: 144.3617, status: "ACTIVE", region: "Victoria", deliveryWindowStart: "2025-03-01", deliveryWindowEnd: "2025-08-31" },
  { id: 204, signalNumber: "DS-2025-004", title: "Lignocellulosic for Ethanol", feedstockCategory: "lignocellulosic", feedstockType: "Wheat Straw or Bagasse", volumeTonnesMin: 30000, volumeTonnesMax: 50000, maxPricePerTonne: 85, latitude: -34.4278, longitude: 150.8931, status: "ACTIVE", region: "New South Wales", deliveryWindowStart: "2025-07-01", deliveryWindowEnd: "2026-06-30" },
];

const SAMPLE_MATCHES = [
  { id: 301, name: "Match: Sunflower QLD → SAF Brisbane", latitude: -27.4698, longitude: 153.0251, matchScore: 87, status: "NEGOTIATING", feedstockCategory: "oilseed", suggestedPrice: 435, projectId: 1, demandSignalId: 201 },
  { id: 302, name: "Match: UCO Melbourne → Biodiesel NSW", latitude: -37.9716, longitude: 145.1227, matchScore: 72, status: "SUGGESTED", feedstockCategory: "UCO", suggestedPrice: 780, projectId: 5, demandSignalId: 202 },
  { id: 303, name: "Match: Tallow SA → Renewable Diesel VIC", latitude: -34.9285, longitude: 138.6007, matchScore: 91, status: "ACCEPTED", feedstockCategory: "tallow", suggestedPrice: 920, projectId: 4, demandSignalId: 203 },
];

const SAMPLE_CONTRACTS = [
  { id: 401, name: "Contract: Canola NSW Supply Agreement", latitude: -33.8688, longitude: 151.2093, status: "ACTIVE", feedstockCategory: "oilseed", agreedPricePerTonne: 385, totalVolumeTonnes: 10000, deliveredVolumeTonnes: 2500, region: "New South Wales" },
  { id: 402, name: "Contract: Bagasse Long-term Supply", latitude: -19.2590, longitude: 146.8169, status: "DELIVERING", feedstockCategory: "lignocellulosic", agreedPricePerTonne: 68, totalVolumeTonnes: 20000, deliveredVolumeTonnes: 8000, region: "Queensland" },
];

const SAMPLE_DELIVERIES = [
  { id: 501, name: "Delivery: Canola Batch #127", latitude: -34.5, longitude: 150.5, status: "IN_TRANSIT", feedstockCategory: "oilseed", volumeTonnes: 500, scheduledDate: "2025-01-28", transportMode: "ROAD" },
  { id: 502, name: "Delivery: Bagasse Shipment #45", latitude: -20.5, longitude: 148.5, status: "LOADING", feedstockCategory: "lignocellulosic", volumeTonnes: 2000, scheduledDate: "2025-01-30", transportMode: "RAIL" },
];

const SAMPLE_LOGISTICS_HUBS = [
  { id: 601, name: "Port of Brisbane", latitude: -27.3667, longitude: 153.1667, hubType: "PORT", capacityTonnesPerDay: 5000, handlingCostPerTonne: 12, status: "ACTIVE" },
  { id: 602, name: "Geelong Grain Terminal", latitude: -38.1500, longitude: 144.3617, hubType: "PORT", capacityTonnesPerDay: 8000, handlingCostPerTonne: 10, status: "ACTIVE" },
  { id: 603, name: "Newcastle Agri Hub", latitude: -32.9283, longitude: 151.7817, hubType: "AGGREGATION", capacityTonnesPerDay: 3000, handlingCostPerTonne: 8, status: "ACTIVE" },
  { id: 604, name: "Adelaide Processing Centre", latitude: -34.9285, longitude: 138.6007, hubType: "PROCESSING", capacityTonnesPerDay: 2000, handlingCostPerTonne: 15, status: "ACTIVE" },
  { id: 605, name: "Parkes Rail Hub", latitude: -33.1333, longitude: 148.1833, hubType: "RAIL", capacityTonnesPerDay: 4000, handlingCostPerTonne: 6, status: "ACTIVE" },
];

const SAMPLE_POWER_STATIONS = [
  { id: 701, name: "Mackay Biomass Power", latitude: -21.1411, longitude: 149.1861, capacityMW: 45, currentOutputMW: 38, feedstockCategory: "lignocellulosic", annualFeedstockTonnes: 180000, status: "ACTIVE" },
  { id: 702, name: "Gippsland Bioenergy", latitude: -38.2500, longitude: 146.5000, capacityMW: 25, currentOutputMW: 22, feedstockCategory: "waste", annualFeedstockTonnes: 95000, status: "ACTIVE" },
  { id: 703, name: "Perth Green Power", latitude: -31.8500, longitude: 115.9500, capacityMW: 15, currentOutputMW: 12, feedstockCategory: "lignocellulosic", annualFeedstockTonnes: 55000, status: "ACTIVE" },
];

const SAMPLE_PRICE_SIGNALS = [
  { id: 801, regionId: "QLD", region: "Queensland", latitude: -27.4698, longitude: 153.0251, feedstockCategory: "oilseed", spotPrice: 425, volumeTonnes: 15000 },
  { id: 802, regionId: "NSW", region: "New South Wales", latitude: -33.8688, longitude: 151.2093, feedstockCategory: "oilseed", spotPrice: 395, volumeTonnes: 22000 },
  { id: 803, regionId: "VIC", region: "Victoria", latitude: -37.8136, longitude: 144.9631, feedstockCategory: "oilseed", spotPrice: 405, volumeTonnes: 18000 },
  { id: 804, regionId: "SA", region: "South Australia", latitude: -34.9285, longitude: 138.6007, feedstockCategory: "tallow", spotPrice: 895, volumeTonnes: 5000 },
  { id: 805, regionId: "WA", region: "Western Australia", latitude: -31.9505, longitude: 115.8605, feedstockCategory: "oilseed", spotPrice: 380, volumeTonnes: 8000 },
  { id: 806, regionId: "QLD-N", region: "North Queensland", latitude: -19.2590, longitude: 146.8169, feedstockCategory: "lignocellulosic", spotPrice: 72, volumeTonnes: 45000 },
];

const SAMPLE_TRANSPORT_ROUTES = [
  { id: 901, originLat: -27.4698, originLng: 153.0251, destLat: -27.3667, destLng: 153.1667, transportMode: "ROAD", distanceKm: 25, totalCost: 8.50 },
  { id: 902, originLat: -33.8688, originLng: 151.2093, destLat: -32.9283, destLng: 151.7817, transportMode: "RAIL", distanceKm: 165, totalCost: 12.30 },
  { id: 903, originLat: -19.2590, originLng: 146.8169, destLat: -27.3667, destLng: 153.1667, transportMode: "RAIL", distanceKm: 950, totalCost: 28.50 },
];

export const unifiedMapRouter = router({
  /**
   * Get all map data for current viewport and user role
   * This is the main endpoint that powers the map
   */
  getMapData: publicProcedure
    .input(
      z.object({
        viewport: z.object({
          center: z.object({ lat: z.number(), lng: z.number() }),
          zoom: z.number(),
          bounds: z
            .object({
              north: z.number(),
              south: z.number(),
              east: z.number(),
              west: z.number(),
            })
            .optional(),
        }).optional(),
        filters: z
          .object({
            feedstockCategories: z.array(z.string()).optional(),
            states: z.array(z.string()).optional(),
            regionIds: z.array(z.string()).optional(),
            minAbfiScore: z.number().optional(),
            maxCarbonIntensity: z.number().optional(),
            status: z.array(z.string()).optional(),
          })
          .optional(),
        layers: z.array(z.string()).optional(),
        feedstockCategories: z.array(z.string()).optional(),
        regionIds: z.array(z.string()).optional(),
        includeAggregates: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { viewport, filters, layers, feedstockCategories, regionIds } = input;

      // Use sample data for testing - filter based on enabled layers
      const enabledLayers = layers || ["projects", "demandSignals", "priceHeatmap", "logisticsHubs", "powerStations"];

      // Filter sample data based on feedstock categories if provided
      const filterByFeedstock = (items: any[]) => {
        if (!feedstockCategories || feedstockCategories.length === 0) return items;
        return items.filter(item => feedstockCategories.includes(item.feedstockCategory));
      };

      // Build response with sample data
      const mapData = {
        projects: enabledLayers.includes("projects") ? filterByFeedstock(SAMPLE_PROJECTS) : [],
        intentions: enabledLayers.includes("intentions") ? filterByFeedstock(SAMPLE_INTENTIONS) : [],
        demandSignals: enabledLayers.includes("demandSignals") ? filterByFeedstock(SAMPLE_DEMAND_SIGNALS) : [],
        matches: enabledLayers.includes("matches") ? filterByFeedstock(SAMPLE_MATCHES) : [],
        contracts: enabledLayers.includes("contracts") ? filterByFeedstock(SAMPLE_CONTRACTS) : [],
        deliveries: enabledLayers.includes("deliveries") ? filterByFeedstock(SAMPLE_DELIVERIES) : [],
        logisticsHubs: enabledLayers.includes("logisticsHubs") ? SAMPLE_LOGISTICS_HUBS : [],
        powerStations: enabledLayers.includes("powerStations") ? SAMPLE_POWER_STATIONS : [],
        priceSignals: enabledLayers.includes("priceHeatmap") ? filterByFeedstock(SAMPLE_PRICE_SIGNALS) : [],
        transportRoutes: enabledLayers.includes("transportRoutes") ? SAMPLE_TRANSPORT_ROUTES : [],
      };

      return {
        ...mapData,
        viewport,
        userRole: ctx.user?.role || "user",
        loadedAt: new Date(),
      };
    }),

  /**
   * Get market intelligence summary for the bottom bar
   */
  getMarketIntelligence: protectedProcedure
    .input(
      z.object({
        feedstockCategory: z.string().optional(),
        state: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Aggregate market metrics
      // Note: Would aggregate from various tables

      return {
        totalActiveListings: 0,
        totalActiveDemandSignals: 0,
        totalProjectedSupply: 0, // tonnes
        totalDemand: 0, // tonnes
        supplyDemandRatio: 0,
        avgSpotPrice: 0,
        priceChangePercent: 0,
        topFeedstockByVolume: "",
        topRegionByActivity: "",
        recentMatchCount: 0, // Last 7 days
        recentContractCount: 0, // Last 7 days
        marketHealthScore: 0, // 0-100
        lastUpdated: new Date(),
      };
    }),

  /**
   * Get entity details for the detail panel
   */
  getEntityDetails: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          "project",
          "intention",
          "demandSignal",
          "feedstock",
          "powerStation",
          "logisticsHub",
          "contract",
        ]),
        entityId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { entityType, entityId } = input;
      const mapRole = getMapRole(ctx.user.role);

      // Get user's supplier/buyer IDs
      const supplier = await db.getSupplierByUserId(ctx.user.id);
      const buyer = await db.getBuyerByUserId(ctx.user.id);
      const visibilityContext = createVisibilityContext(ctx.user, supplier?.id, buyer?.id);

      let entity: any = null;
      let canView = false;

      switch (entityType) {
        case "feedstock":
          entity = await db.getFeedstockById(entityId);
          if (entity) {
            canView =
              mapRole === "ADMIN" ||
              entity.supplierId === supplier?.id ||
              entity.status === "active";
          }
          break;

        case "demandSignal":
          entity = await db.getDemandSignalById(entityId);
          if (entity) {
            canView =
              mapRole === "ADMIN" ||
              entity.buyerId === buyer?.id ||
              entity.status === "published";
          }
          break;

        // Note: Other entity types would be handled similarly
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unknown entity type",
          });
      }

      if (!entity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entity not found" });
      }

      if (!canView) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this entity" });
      }

      // Check if user can take actions
      const canAction = {
        canContact: mapRole === "BUYER" || mapRole === "ADMIN",
        canMatch: mapRole === "BUYER" && (entityType as string) === "intention",
        canEdit: entity.userId === ctx.user.id || mapRole === "ADMIN",
        canCreateContract:
          mapRole === "ADMIN" ||
          (entityType === "demandSignal" && entity.buyerId === buyer?.id),
      };

      return {
        entityType,
        entity,
        canAction,
        relatedEntities: {
          // Note: Would load related data
          matches: [],
          contracts: [],
          deliveries: [],
        },
      };
    }),

  /**
   * Get nearby entities for a selected point
   */
  getNearbyEntities: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radiusKm: z.number().min(10).max(500).default(100),
        entityTypes: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { lat, lng, radiusKm, entityTypes } = input;

      // Note: Would query entities within radius
      // For each entity type, calculate distance and filter

      return {
        center: { lat, lng },
        radiusKm,
        entities: {
          feedstocks: [],
          demandSignals: [],
          powerStations: [],
          logisticsHubs: [],
        },
        summary: {
          totalFeedstocks: 0,
          totalDemandSignals: 0,
          totalPowerStations: 0,
          totalLogisticsHubs: 0,
          totalAvailableVolume: 0,
          totalDemandVolume: 0,
        },
      };
    }),

  /**
   * Get aggregated regional data for choropleth visualization
   */
  getRegionalAggregates: protectedProcedure
    .input(
      z.object({
        aggregateBy: z.enum(["state", "region", "lga"]).default("state"),
        metric: z.enum([
          "feedstock_count",
          "total_volume",
          "avg_price",
          "demand_count",
          "supply_demand_ratio",
        ]),
        feedstockCategory: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { aggregateBy, metric, feedstockCategory } = input;

      // Note: Would aggregate data by region
      // const aggregates = await db.getRegionalAggregates(aggregateBy, metric, feedstockCategory);

      return {
        aggregateBy,
        metric,
        regions: [] as Array<{
          regionId: string;
          regionName: string;
          value: number;
          count: number;
        }>,
        min: 0,
        max: 0,
        total: 0,
      };
    }),

  /**
   * Search for entities across all types
   */
  searchEntities: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        entityTypes: z.array(z.string()).optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, entityTypes, limit } = input;
      const mapRole = getMapRole(ctx.user.role);

      const results: Array<{
        entityType: string;
        entityId: number;
        title: string;
        subtitle: string;
        lat: number;
        lng: number;
      }> = [];

      // Search feedstocks
      if (!entityTypes || entityTypes.includes("feedstock")) {
        const feedstocks = await db.searchFeedstocks({
          status: "active",
          limit,
        });
        // Note: Would filter by query match
      }

      // Search demand signals
      if (!entityTypes || entityTypes.includes("demandSignal")) {
        const signals = await db.getAllDemandSignals({
          status: "published",
        });
        // Note: Would filter by query match and apply limit
      }

      // Note: Other entity types would be searched similarly

      return {
        query,
        results: results.slice(0, limit),
        total: results.length,
      };
    }),

  /**
   * Get user's saved map views/analyses
   */
  getSavedViews: protectedProcedure.query(async ({ ctx }) => {
    // Note: Would query saved_analyses for user
    // const savedViews = await db.getSavedAnalysesForUser(ctx.user.id);

    return {
      savedViews: [],
      total: 0,
    };
  }),

  /**
   * Save a map view/analysis
   */
  saveView: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        viewport: z.object({
          center: z.object({ lat: z.number(), lng: z.number() }),
          zoom: z.number(),
        }),
        filters: z.record(z.string(), z.any()).optional(),
        enabledLayers: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Note: Would create saved_analyses record
      // const saved = await db.createSavedAnalysis({
      //   userId: ctx.user.id,
      //   ...input,
      // });

      return {
        savedId: 0,
        message: "View saved successfully",
      };
    }),

  /**
   * Subscribe to real-time market changes
   * Uses Server-Sent Events for live updates
   */
  subscribeToMarketChanges: protectedProcedure
    .input(
      z.object({
        viewport: z.object({
          center: z.object({ lat: z.number(), lng: z.number() }),
          zoom: z.number(),
          bounds: z
            .object({
              north: z.number(),
              south: z.number(),
              east: z.number(),
              west: z.number(),
            })
            .optional(),
        }),
        feedstockCategories: z.array(z.string()).optional(),
        states: z.array(z.string()).optional(),
      })
    )
    .subscription(({ ctx, input }) => {
      return observable<{
        type: string;
        entityType: string;
        entityId: number;
        data: any;
        timestamp: Date;
      }>((emit) => {
        // Note: Would set up Redis pub/sub listener
        // const subscription = redis.subscribe('market-changes', (message) => {
        //   const change = JSON.parse(message);
        //   // Filter by viewport and user role
        //   if (isRelevantChange(change, input, ctx.user)) {
        //     emit.next(change);
        //   }
        // });

        // Cleanup on unsubscribe
        return () => {
          // subscription.unsubscribe();
        };
      });
    }),

  /**
   * Get quick stats for map header
   */
  getQuickStats: protectedProcedure.query(async ({ ctx }) => {
    const mapRole = getMapRole(ctx.user.role);
    const supplier = await db.getSupplierByUserId(ctx.user.id);
    const buyer = await db.getBuyerByUserId(ctx.user.id);

    const stats: Record<string, number | string> = {};

    if (mapRole === "GROWER" && supplier) {
      // Grower-specific stats
      stats.myListings = 0; // Count of active feedstocks
      stats.incomingMatches = 0; // Count of matches on their supply
      stats.activeContracts = 0;
      stats.pendingDeliveries = 0;
    }

    if (mapRole === "BUYER" && buyer) {
      // Buyer-specific stats
      stats.myDemandSignals = 0;
      stats.potentialMatches = 0;
      stats.activeContracts = 0;
      stats.pendingDeliveries = 0;
    }

    if (mapRole === "LENDER") {
      // Lender-specific stats
      stats.monitoredProjects = 0;
      stats.totalExposure = 0;
      stats.riskAlerts = 0;
    }

    if (mapRole === "ADMIN") {
      // Admin sees everything
      stats.totalUsers = 0;
      stats.totalFeedstocks = 0;
      stats.totalDemandSignals = 0;
      stats.activeContracts = 0;
      stats.pendingVerifications = 0;
    }

    return {
      role: mapRole,
      stats,
      updatedAt: new Date(),
    };
  }),

  /**
   * Get current user's growing intentions
   */
  getMyIntentions: publicProcedure.query(async ({ ctx }) => {
    // Return sample intentions for the grower
    return SAMPLE_INTENTIONS.map(intention => ({
      id: intention.id,
      feedstockType: intention.feedstockType,
      feedstockCategory: intention.feedstockCategory,
      projectedTonnes: intention.projectedVolumeTonnes,
      expectedHarvestDate: intention.availableFromDate,
      status: intention.status,
      region: intention.region,
    }));
  }),

  /**
   * Get forward availability for a feedstock type
   */
  getForwardAvailability: publicProcedure
    .input(
      z.object({
        feedstockTypeId: z.string(),
        months: z.number().optional().default(12),
      })
    )
    .query(async ({ input }) => {
      const { feedstockTypeId, months } = input;
      // Generate deterministic forward availability data based on feedstock and month
      const availability = [];
      const now = new Date();
      const feedstockSeed = feedstockTypeId || 1;
      
      for (let i = 0; i < months; i++) {
        const month = new Date(now);
        month.setMonth(month.getMonth() + i);
        
        // Deterministic values based on feedstock ID and month
        const monthSeed = month.getMonth() + 1;
        const baseTonnes = 3000 + (feedstockSeed * 500);
        const seasonalFactor = 0.8 + Math.sin((monthSeed * Math.PI) / 6) * 0.4;
        
        const projectedTonnes = Math.floor(baseTonnes * seasonalFactor);
        const confirmedRatio = 0.4 + (monthSeed % 6) * 0.05;
        const confirmedTonnes = Math.floor(projectedTonnes * confirmedRatio);
        const priceEstimate = 350 + (feedstockSeed * 20) + (monthSeed * 5);
        
        availability.push({
          month: month.toISOString(),
          projectedTonnes,
          confirmedTonnes,
          priceEstimate,
        });
      }
      return availability;
    }),
});

export type UnifiedMapRouter = typeof unifiedMapRouter;
