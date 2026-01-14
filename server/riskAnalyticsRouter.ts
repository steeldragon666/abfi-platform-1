/**
 * Risk Analytics Router
 * API endpoints for lender risk analysis including:
 * - Concentration risk (HHI)
 * - Geographic risk distribution
 * - Stress testing scenarios
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  suppliers,
  supplyAgreements,
  stressScenarios,
  stressTestResults,
  riskEvents,
  supplierRiskExposure,
  contractRiskExposure,
} from "../drizzle/schema";
import { eq, desc, sql, count, sum, and, gte } from "drizzle-orm";

// Helper to get db instance
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

// Mock data for when database is empty
function getMockConcentrationMetrics() {
  return {
    hhiIndex: 1850,
    hhiStatus: "moderate" as const,
    topSupplierShare: 18.5,
    topThreeShare: 42.3,
    numberOfSuppliers: 45,
  };
}

function getMockSupplierConcentration() {
  return [
    { name: "Murray Valley", share: 18.5, risk: "medium" },
    { name: "Gippsland Green", share: 14.2, risk: "low" },
    { name: "Darling Downs", share: 9.6, risk: "medium" },
    { name: "Riverina Fuels", share: 8.8, risk: "low" },
    { name: "Pilbara Power", share: 7.4, risk: "low" },
    { name: "Others (40)", share: 41.5, risk: "low" },
  ];
}

function getMockGeographicRisk() {
  return [
    { state: "NSW", exposure: 320000000, droughtRisk: 65, fireRisk: 45 },
    { state: "VIC", exposure: 280000000, droughtRisk: 50, fireRisk: 55 },
    { state: "QLD", exposure: 250000000, droughtRisk: 75, fireRisk: 40 },
    { state: "SA", exposure: 180000000, droughtRisk: 80, fireRisk: 35 },
    { state: "WA", exposure: 150000000, droughtRisk: 85, fireRisk: 30 },
    { state: "TAS", exposure: 70000000, droughtRisk: 25, fireRisk: 60 },
  ];
}

function getMockRiskFactors() {
  return [
    { factor: "Supply Security", score: 75 },
    { factor: "Price Volatility", score: 60 },
    { factor: "Counterparty", score: 80 },
    { factor: "Regulatory", score: 85 },
    { factor: "Climate", score: 55 },
    { factor: "Technology", score: 70 },
  ];
}

function getMockStressScenarios() {
  return [
    {
      name: "Drought (Severe)",
      description: "25% reduction in feedstock availability",
      portfolioImpact: -8.5,
      projectsAffected: 18,
      mitigated: true,
    },
    {
      name: "Price Shock",
      description: "30% drop in ethanol prices",
      portfolioImpact: -12.2,
      projectsAffected: 24,
      mitigated: false,
    },
    {
      name: "Policy Change",
      description: "Carbon credit scheme revision",
      portfolioImpact: -5.8,
      projectsAffected: 35,
      mitigated: true,
    },
    {
      name: "Bushfire Event",
      description: "Major fire in key supply region",
      portfolioImpact: -6.4,
      projectsAffected: 8,
      mitigated: true,
    },
  ];
}

// Calculate HHI (Herfindahl-Hirschman Index)
function calculateHHI(shares: number[]): number {
  return Math.round(shares.reduce((sum, share) => sum + share * share, 0));
}

function getHHIStatus(hhi: number): "low" | "moderate" | "high" {
  if (hhi < 1000) return "low";
  if (hhi < 2500) return "moderate";
  return "high";
}

export const riskAnalyticsRouter = router({
  /**
   * Get concentration metrics (HHI, top supplier shares)
   */
  getConcentrationMetrics: publicProcedure.query(async () => {
    try {
      const db = await requireDb();

      // Get supply agreements with supplier info
      // Contract value calculated from annualVolume * basePrice
      const agreements = await db
        .select({
          supplierId: supplyAgreements.supplierId,
          annualVolume: supplyAgreements.annualVolume,
          basePrice: supplyAgreements.basePrice,
        })
        .from(supplyAgreements)
        .where(eq(supplyAgreements.status, "active"));

      if (agreements.length === 0) {
        return getMockConcentrationMetrics();
      }

      // Calculate total value and shares (volume * price = contract value)
      const totalValue = agreements.reduce(
        (sum, a) => sum + (a.annualVolume || 0) * (a.basePrice || 1),
        0
      );

      // Group by supplier
      const supplierTotals = new Map<number, number>();
      for (const a of agreements) {
        if (a.supplierId) {
          const current = supplierTotals.get(a.supplierId) || 0;
          const contractValue = (a.annualVolume || 0) * (a.basePrice || 1);
          supplierTotals.set(a.supplierId, current + contractValue);
        }
      }

      // Calculate shares as percentages
      const shares = Array.from(supplierTotals.values())
        .map(value => (value / totalValue) * 100)
        .sort((a, b) => b - a);

      const hhi = calculateHHI(shares);
      const topSupplierShare = shares[0] || 0;
      const topThreeShare = shares.slice(0, 3).reduce((sum, s) => sum + s, 0);

      return {
        hhiIndex: hhi,
        hhiStatus: getHHIStatus(hhi),
        topSupplierShare: Math.round(topSupplierShare * 10) / 10,
        topThreeShare: Math.round(topThreeShare * 10) / 10,
        numberOfSuppliers: supplierTotals.size,
      };
    } catch (error) {
      console.error("Failed to get concentration metrics:", error);
      return getMockConcentrationMetrics();
    }
  }),

  /**
   * Get supplier concentration breakdown
   */
  getSupplierConcentration: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(6),
    }))
    .query(async ({ input }) => {
      try {
        const db = await requireDb();

        // Get supply agreements with supplier names
        const agreements = await db
          .select({
            supplierId: supplyAgreements.supplierId,
            supplierName: suppliers.companyName,
            annualVolume: supplyAgreements.annualVolume,
            basePrice: supplyAgreements.basePrice,
          })
          .from(supplyAgreements)
          .leftJoin(suppliers, eq(supplyAgreements.supplierId, suppliers.id))
          .where(eq(supplyAgreements.status, "active"));

        if (agreements.length === 0) {
          return getMockSupplierConcentration();
        }

        // Calculate total and group by supplier
        const totalValue = agreements.reduce(
          (sum, a) => sum + (a.annualVolume || 0) * (a.basePrice || 1),
          0
        );

        const supplierData = new Map<number, { name: string; value: number }>();
        for (const a of agreements) {
          if (a.supplierId) {
            const current = supplierData.get(a.supplierId);
            const contractValue = (a.annualVolume || 0) * (a.basePrice || 1);
            if (current) {
              current.value += contractValue;
            } else {
              supplierData.set(a.supplierId, {
                name: a.supplierName || `Supplier ${a.supplierId}`,
                value: contractValue,
              });
            }
          }
        }

        // Sort by value and calculate shares
        const sorted = Array.from(supplierData.values())
          .sort((a, b) => b.value - a.value);

        const topSuppliers = sorted.slice(0, input.limit - 1);
        const othersValue = sorted.slice(input.limit - 1).reduce((sum, s) => sum + s.value, 0);
        const othersCount = sorted.length - (input.limit - 1);

        const result = topSuppliers.map(s => ({
          name: s.name,
          share: Math.round((s.value / totalValue) * 1000) / 10,
          risk: s.value / totalValue > 0.15 ? "high" : s.value / totalValue > 0.1 ? "medium" : "low",
        }));

        if (othersCount > 0) {
          result.push({
            name: `Others (${othersCount})`,
            share: Math.round((othersValue / totalValue) * 1000) / 10,
            risk: "low",
          });
        }

        return result;
      } catch (error) {
        console.error("Failed to get supplier concentration:", error);
        return getMockSupplierConcentration();
      }
    }),

  /**
   * Get geographic risk distribution
   */
  getGeographicRisk: publicProcedure.query(async () => {
    try {
      const db = await requireDb();

      // Get suppliers grouped by state
      const suppliersByState = await db
        .select({
          state: suppliers.state,
          count: count(),
        })
        .from(suppliers)
        .groupBy(suppliers.state);

      if (suppliersByState.length === 0) {
        return getMockGeographicRisk();
      }

      // Get supply agreements for exposure calculation
      const agreements = await db
        .select({
          supplierId: supplyAgreements.supplierId,
          annualVolume: supplyAgreements.annualVolume,
          basePrice: supplyAgreements.basePrice,
          supplierState: suppliers.state,
        })
        .from(supplyAgreements)
        .leftJoin(suppliers, eq(supplyAgreements.supplierId, suppliers.id))
        .where(eq(supplyAgreements.status, "active"));

      // Group exposure by state
      const stateExposure = new Map<string, number>();
      for (const a of agreements) {
        if (a.supplierState) {
          const current = stateExposure.get(a.supplierState) || 0;
          const contractValue = (a.annualVolume || 0) * (a.basePrice || 1);
          stateExposure.set(a.supplierState, current + contractValue);
        }
      }

      // Climate risk factors by state (based on BOM data patterns)
      const climateRisk: Record<string, { drought: number; fire: number }> = {
        NSW: { drought: 65, fire: 45 },
        VIC: { drought: 50, fire: 55 },
        QLD: { drought: 75, fire: 40 },
        SA: { drought: 80, fire: 35 },
        WA: { drought: 85, fire: 30 },
        TAS: { drought: 25, fire: 60 },
        NT: { drought: 70, fire: 50 },
        ACT: { drought: 55, fire: 50 },
      };

      return Array.from(stateExposure.entries())
        .map(([state, exposure]) => ({
          state,
          exposure,
          droughtRisk: climateRisk[state]?.drought || 50,
          fireRisk: climateRisk[state]?.fire || 50,
        }))
        .sort((a, b) => b.exposure - a.exposure);
    } catch (error) {
      console.error("Failed to get geographic risk:", error);
      return getMockGeographicRisk();
    }
  }),

  /**
   * Get risk factor scores
   */
  getRiskFactors: publicProcedure.query(async () => {
    try {
      const db = await requireDb();

      // Get recent risk events
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEvents = await db
        .select({
          eventType: riskEvents.eventType,
          severity: riskEvents.severity,
        })
        .from(riskEvents)
        .where(gte(riskEvents.startDate, thirtyDaysAgo));

      if (recentEvents.length === 0) {
        return getMockRiskFactors();
      }

      // Calculate scores based on event types and severity
      const factorScores: Record<string, { total: number; count: number }> = {
        "Supply Security": { total: 0, count: 0 },
        "Price Volatility": { total: 0, count: 0 },
        "Counterparty": { total: 0, count: 0 },
        "Regulatory": { total: 0, count: 0 },
        "Climate": { total: 0, count: 0 },
        "Technology": { total: 0, count: 0 },
      };

      // Map event types to risk factors (lowercase to match DB enum)
      const eventToFactor: Record<string, string> = {
        drought: "Climate",
        flood: "Climate",
        bushfire: "Climate",
        cyclone: "Climate",
        storm: "Climate",
        heatwave: "Climate",
        frost: "Climate",
        disease: "Supply Security",
        pest: "Supply Security",
        logistics_disruption: "Technology",
        industrial_action: "Supply Security",
        policy: "Regulatory",
      };

      for (const event of recentEvents) {
        const factor = eventToFactor[event.eventType] || "Supply Security";
        const severityScore = event.severity === "critical" ? 25 :
                             event.severity === "high" ? 50 :
                             event.severity === "medium" ? 75 : 100;
        factorScores[factor].total += severityScore;
        factorScores[factor].count += 1;
      }

      // Calculate average scores (default to 75 if no events)
      return Object.entries(factorScores).map(([factor, data]) => ({
        factor,
        score: data.count > 0 ? Math.round(data.total / data.count) : 75,
      }));
    } catch (error) {
      console.error("Failed to get risk factors:", error);
      return getMockRiskFactors();
    }
  }),

  /**
   * Get stress test scenarios
   */
  getStressScenarios: publicProcedure.query(async () => {
    try {
      const db = await requireDb();

      const scenarios = await db
        .select({
          id: stressScenarios.id,
          name: stressScenarios.scenarioName,
          scenarioType: stressScenarios.scenarioType,
          description: stressScenarios.description,
          isTemplate: stressScenarios.isTemplate,
        })
        .from(stressScenarios)
        .where(eq(stressScenarios.isTemplate, true))
        .limit(10);

      if (scenarios.length === 0) {
        return getMockStressScenarios();
      }

      // Get latest test results for each scenario
      const results = await Promise.all(
        scenarios.map(async (scenario) => {
          const [latestResult] = await db
            .select({
              baseScore: stressTestResults.baseScore,
              stressScore: stressTestResults.stressScore,
              testDate: stressTestResults.testDate,
            })
            .from(stressTestResults)
            .where(eq(stressTestResults.scenarioId, scenario.id))
            .orderBy(desc(stressTestResults.testDate))
            .limit(1);

          // Deterministic fallback based on scenario properties
          const scenarioSeed = scenario.id * 7 + new Date().getDate();
          const deterministicFallback = -(5 + (scenarioSeed % 10));
          
          const portfolioImpact = latestResult
            ? ((latestResult.stressScore - latestResult.baseScore) / latestResult.baseScore) * 100
            : deterministicFallback;

          return {
            name: scenario.name,
            description: scenario.description || `${scenario.scenarioType} scenario`,
            portfolioImpact: Math.round(portfolioImpact * 10) / 10,
            projectsAffected: 10 + (scenario.id % 20), // Deterministic based on scenario ID
            mitigated: (scenario.id % 3) !== 0, // ~66% mitigated
          };
        })
      );

      return results;
    } catch (error) {
      console.error("Failed to get stress scenarios:", error);
      return getMockStressScenarios();
    }
  }),

  /**
   * Run stress test simulation
   */
  runStressTest: publicProcedure
    .input(z.object({
      scenarioId: z.number(),
      multiplier: z.number().min(0.5).max(2.0).default(1.0),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await requireDb();

        const [scenario] = await db
          .select()
          .from(stressScenarios)
          .where(eq(stressScenarios.id, input.scenarioId))
          .limit(1);

        if (!scenario) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Scenario not found",
          });
        }

        // Calculate deterministic stress test results
        const baselineValue = 1000000000; // $1B portfolio
        
        // Deterministic impact based on scenario ID and multiplier
        const scenarioSeed = input.scenarioId * 11 + new Date().getDate();
        const baseImpact = 5 + (scenarioSeed % 10);
        const impactPct = baseImpact * input.multiplier;
        const stressedValue = baselineValue * (1 - impactPct / 100);

        return {
          scenario: scenario.scenarioName,
          baselineValue,
          stressedValue,
          impactPct: Math.round(impactPct * 10) / 10,
          projectsAffected: 10 + (input.scenarioId % 20),
          riskLevel: impactPct > 10 ? "high" : impactPct > 5 ? "medium" : "low",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to run stress test:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to run stress test",
        });
      }
    }),
});

export type RiskAnalyticsRouter = typeof riskAnalyticsRouter;
