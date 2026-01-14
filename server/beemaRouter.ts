/**
 * Beema Bamboo tRPC Router
 * 
 * Handles all Beema Bamboo related operations:
 * - Suitability map queries
 * - Economics calculations
 * - Plot creation and management
 * - Verification workflows
 * - Yield tracking
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './_core/trpc';

// ============================================================================
// CONSTANTS
// ============================================================================

const BEEMA_ECONOMICS = {
  yieldTonnesDMPerHa: 55,      // Full yield from Year 3+
  establishmentYield: 25,      // Year 2 yield
  basePrice: 85,               // AUD per tonne
  priceEscalation: 0.03,       // 3% annual increase
  carbonSequestration: 48,     // t CO2 per ha per year
  accuPrice: 30,               // AUD per ACCU
  discountRate: 0.10,          // 10% for NPV
  plantingCostPerHa: 4500,     // Establishment cost
  harvestCostPerTonne: 35,     // Variable harvest cost
  contractYears: 15,
  lifespanYears: 30,
};

// Yield class multipliers
const YIELD_CLASS_MULTIPLIERS: Record<string, number> = {
  A: 1.0,   // >90% of max yield
  B: 0.85,  // 70-90%
  C: 0.65,  // <70%
};

// ============================================================================
// SCHEMAS
// ============================================================================

const BBoxSchema = z.object({
  minLat: z.number(),
  minLng: z.number(),
  maxLat: z.number(),
  maxLng: z.number(),
});

const EconomicsInputSchema = z.object({
  hectares: z.number().min(1).max(10000),
  pricePerTonne: z.number().min(50).max(200).optional(),
  discountRate: z.number().min(0.01).max(0.20).optional(),
  yieldClass: z.enum(['A', 'B', 'C']).optional(),
});

const CreatePlotSchema = z.object({
  geometry: z.string().min(10), // WKT polygon
  plantingDate: z.string().transform(s => new Date(s)),
  yieldClass: z.enum(['A', 'B', 'C']).optional(),
  notes: z.string().optional(),
});

const VerificationDocSchema = z.object({
  plotId: z.number(),
  documentType: z.enum(['planting_invoice', 'nursery_certificate', 'geo_photo', 'ndvi_report', 'other']),
  documentUrl: z.string().url(),
  photoLat: z.number().optional(),
  photoLng: z.number().optional(),
  photoTimestamp: z.string().transform(s => new Date(s)).optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const beemaRouter = router({
  /**
   * Get suitability map data for a bounding box
   * Returns GeoJSON features with suitability scores
   */
  suitabilityMap: publicProcedure
    .input(BBoxSchema)
    .query(async ({ input }) => {
      // In production, this would query the beema_suitability_grid table
      // For now, generate sample data based on coordinates
      const { minLat, minLng, maxLat, maxLng } = input;
      
      const features = [];
      const gridSize = 0.5; // degrees
      
      for (let lat = minLat; lat <= maxLat; lat += gridSize) {
        for (let lng = minLng; lng <= maxLng; lng += gridSize) {
          // Simulate suitability based on location
          // Higher in Queensland/Northern NSW, lower in southern/arid areas
          let baseSuitability = 70;
          
          // Queensland bonus
          if (lat > -28 && lat < -20 && lng > 145 && lng < 155) {
            baseSuitability = 90;
          }
          // NSW coastal
          else if (lat > -35 && lat < -28 && lng > 148 && lng < 154) {
            baseSuitability = 80;
          }
          // Arid central
          else if (lng < 140 || lat < -35) {
            baseSuitability = 30;
          }
          
          // Add some variation
          const suitability = Math.max(0, Math.min(100, 
            baseSuitability + Math.sin(lat * 10) * 10 + Math.cos(lng * 10) * 10
          ));
          
          const yieldEstimate = (suitability / 100) * BEEMA_ECONOMICS.yieldTonnesDMPerHa;
          
          features.push({
            type: 'Feature',
            properties: {
              cellId: `10_${Math.floor(lat * 10)}_${Math.floor(lng * 10)}`,
              suitability: Math.round(suitability),
              yieldTDMHaYr: Math.round(yieldEstimate * 10) / 10,
              category: suitability >= 90 ? 'optimal' : suitability >= 70 ? 'suitable' : 'unsuitable',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [lng, lat],
                [lng + gridSize, lat],
                [lng + gridSize, lat + gridSize],
                [lng, lat + gridSize],
                [lng, lat],
              ]],
            },
          });
        }
      }
      
      return {
        type: 'FeatureCollection',
        features,
      };
    }),
    
  /**
   * Calculate economics for a given planting area
   */
  economics: publicProcedure
    .input(EconomicsInputSchema)
    .query(async ({ input }) => {
      const hectares = input.hectares;
      const pricePerTonne = input.pricePerTonne || BEEMA_ECONOMICS.basePrice;
      const discountRate = input.discountRate || BEEMA_ECONOMICS.discountRate;
      const yieldMultiplier = YIELD_CLASS_MULTIPLIERS[input.yieldClass || 'B'];
      
      const years = BEEMA_ECONOMICS.contractYears;
      const fullYield = BEEMA_ECONOMICS.yieldTonnesDMPerHa * yieldMultiplier;
      const establishmentYield = BEEMA_ECONOMICS.establishmentYield * yieldMultiplier;
      
      // Calculate year-by-year cash flows
      const cashFlows: {
        year: number;
        revenue: number;
        carbonCredits: number;
        costs: number;
        netCashFlow: number;
        cumulativeCashFlow: number;
      }[] = [];
      
      let cumulativeCashFlow = 0;
      let totalRevenue = 0;
      let totalCarbonCredits = 0;
      let npv = 0;
      
      for (let year = 0; year <= years; year++) {
        let yieldT = 0;
        let harvestCost = 0;
        let plantingCost = 0;
        
        if (year === 0) {
          plantingCost = BEEMA_ECONOMICS.plantingCostPerHa * hectares;
        } else if (year === 1) {
          plantingCost = 800 * hectares; // Maintenance costs
        } else if (year === 2) {
          yieldT = establishmentYield * hectares;
          harvestCost = BEEMA_ECONOMICS.harvestCostPerTonne * yieldT;
        } else {
          yieldT = fullYield * hectares;
          harvestCost = BEEMA_ECONOMICS.harvestCostPerTonne * yieldT;
        }
        
        // Price with annual escalation
        const adjustedPrice = pricePerTonne * Math.pow(1 + BEEMA_ECONOMICS.priceEscalation, year);
        const revenue = yieldT * adjustedPrice;
        
        // Carbon credits from year 1 onwards
        const carbonCredits = year >= 1 
          ? BEEMA_ECONOMICS.carbonSequestration * hectares * BEEMA_ECONOMICS.accuPrice 
          : 0;
        
        const costs = harvestCost + plantingCost;
        const netCashFlow = revenue + carbonCredits - costs;
        cumulativeCashFlow += netCashFlow;
        
        const discountedCashFlow = netCashFlow / Math.pow(1 + discountRate, year);
        npv += discountedCashFlow;
        
        totalRevenue += revenue;
        totalCarbonCredits += carbonCredits;
        
        cashFlows.push({
          year,
          revenue: Math.round(revenue),
          carbonCredits: Math.round(carbonCredits),
          costs: Math.round(costs),
          netCashFlow: Math.round(netCashFlow),
          cumulativeCashFlow: Math.round(cumulativeCashFlow),
        });
      }
      
      // Calculate IRR using Newton-Raphson
      const netCashFlowArray = cashFlows.map(cf => cf.netCashFlow);
      let irr = 0.15;
      for (let i = 0; i < 100; i++) {
        let npvCalc = 0;
        let derivative = 0;
        for (let t = 0; t < netCashFlowArray.length; t++) {
          npvCalc += netCashFlowArray[t] / Math.pow(1 + irr, t);
          derivative -= t * netCashFlowArray[t] / Math.pow(1 + irr, t + 1);
        }
        if (derivative === 0) break;
        const newIrr = irr - npvCalc / derivative;
        if (Math.abs(newIrr - irr) < 0.0001) break;
        irr = Math.max(0, Math.min(1, newIrr));
      }
      
      // Calculate payback period
      let paybackYear = years;
      for (let i = 0; i < cashFlows.length; i++) {
        if (cashFlows[i].cumulativeCashFlow >= 0) {
          paybackYear = i;
          break;
        }
      }
      
      // Calculate DSCR (Debt Service Coverage Ratio) assuming 60% debt
      const debtRatio = 0.6;
      const interestRate = 0.06;
      const totalInvestment = BEEMA_ECONOMICS.plantingCostPerHa * hectares;
      const debtAmount = totalInvestment * debtRatio;
      const annualDebtService = debtAmount * (interestRate * Math.pow(1 + interestRate, years)) / 
                                (Math.pow(1 + interestRate, years) - 1);
      const avgAnnualCashFlow = cashFlows.slice(3).reduce((sum, cf) => sum + cf.netCashFlow, 0) / 
                                 (cashFlows.length - 3);
      const dscr = avgAnnualCashFlow / annualDebtService;
      
      return {
        summary: {
          hectares,
          yieldClass: input.yieldClass || 'B',
          annualYieldTonnes: Math.round(fullYield * hectares),
          totalRevenueOverContract: Math.round(totalRevenue),
          totalCarbonCredits: Math.round(totalCarbonCredits),
          npv: Math.round(npv),
          irr: Math.round(irr * 1000) / 10, // Percentage with 1 decimal
          paybackYears: paybackYear,
          dscr: Math.round(dscr * 100) / 100,
        },
        annualMetrics: {
          annualGreenTonnes: Math.round(fullYield * hectares),
          annualCarbonCredits: Math.round(BEEMA_ECONOMICS.carbonSequestration * hectares * BEEMA_ECONOMICS.accuPrice),
          annualCarbonSequestration: Math.round(BEEMA_ECONOMICS.carbonSequestration * hectares),
        },
        assumptions: {
          basePrice: pricePerTonne,
          priceEscalation: BEEMA_ECONOMICS.priceEscalation * 100,
          discountRate: discountRate * 100,
          accuPrice: BEEMA_ECONOMICS.accuPrice,
          contractYears: years,
          yieldMultiplier,
        },
        cashFlows,
      };
    }),
    
  /**
   * Create a new Beema plot (requires authentication)
   */
  createPlot: protectedProcedure
    .input(CreatePlotSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      
      // In production, this would insert into beema_plots table
      // and calculate centroid from WKT geometry
      
      // Parse WKT to extract approximate center and area
      // For now, return mock response
      const plotId = Date.now();
      
      return {
        id: plotId,
        growerId: userId,
        geometry: input.geometry,
        areaHa: 50, // Would be calculated from geometry
        plantingDate: input.plantingDate,
        yieldClass: input.yieldClass || 'B',
        status: 'planned',
        createdAt: new Date(),
        message: 'Plot created successfully. Please upload verification documents.',
      };
    }),
    
  /**
   * Get grower's Beema plots
   */
  getMyPlots: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      // In production, query beema_plots where grower_id = userId
      // Return mock data for now
      return {
        plots: [
          {
            id: 1,
            areaHa: 50,
            plantingDate: '2024-06-15',
            firstHarvestDate: '2026-06-15',
            yieldClass: 'A',
            status: 'establishment',
            verifiedAt: '2024-07-20',
            projectedAnnualTonnes: 2750,
            contractedPrice: 85,
            contractEndDate: '2039-06-15',
          },
        ],
        summary: {
          totalHectares: 50,
          totalProjectedTonnes: 2750,
          totalCarbonCredits: 2400 * 30, // 48 t CO2/ha * 50 ha * $30
          activeContracts: 1,
        },
      };
    }),
    
  /**
   * Upload verification document
   */
  uploadVerification: protectedProcedure
    .input(VerificationDocSchema)
    .mutation(async ({ input, ctx }) => {
      // In production:
      // 1. Store in beema_verifications table
      // 2. Check geo-tagged photo coords against plot polygon
      // 3. Queue for accreditor review
      // 4. If NDVI >= 0.4 within 6 months, auto-verify
      
      return {
        id: Date.now(),
        plotId: input.plotId,
        documentType: input.documentType,
        status: 'pending_review',
        message: 'Document uploaded. An accreditor will review within 3 business days.',
      };
    }),
    
  /**
   * Get verification status for a plot
   */
  getVerificationStatus: protectedProcedure
    .input(z.object({ plotId: z.number() }))
    .query(async ({ input }) => {
      // In production, query beema_verifications for this plot
      return {
        plotId: input.plotId,
        documents: [
          {
            type: 'nursery_certificate',
            status: 'verified',
            uploadedAt: '2024-06-10',
            verifiedAt: '2024-06-12',
          },
          {
            type: 'geo_photo',
            status: 'verified',
            uploadedAt: '2024-06-15',
            verifiedAt: '2024-06-18',
            photoMatch: true, // EXIF coords matched polygon
          },
          {
            type: 'ndvi_report',
            status: 'pending',
            uploadedAt: '2024-12-01',
            ndviScore: 0.42,
          },
        ],
        overallStatus: 'partially_verified',
        nextSteps: ['Wait for NDVI verification (current score: 0.42, required: 0.40)'],
      };
    }),
});

export type BeemaRouter = typeof beemaRouter;
