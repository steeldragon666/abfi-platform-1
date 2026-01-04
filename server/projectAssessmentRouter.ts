/**
 * Project Assessment Router
 * Endpoints for calculating and managing 6-dimension bankability ratings
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { bioenergyProjects } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Rating definitions
const BANKABILITY_RATINGS = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D", "N/R"] as const;
const GROWER_CONTRACT_RATINGS = ["GC1", "GC2", "GC3", "GC4", "N/A"] as const;
const TECH_READINESS_RATINGS = ["TR1", "TR2", "TR3", "TR4"] as const;
const CARBON_INTENSITY_RATINGS = ["CI-A", "CI-B", "CI-C", "CI-D", "N/A"] as const;
const OFFTAKE_RATINGS = ["OQ1", "OQ2", "OQ3", "OQ4", "N/A"] as const;
const GOV_SUPPORT_RATINGS = ["GS1", "GS2", "GS3", "GS4", "N/A"] as const;
const SIGNAL_OPTIONS = [
  "BULLISH", "NEUTRAL-BULLISH", "NEUTRAL", "NEUTRAL-BEARISH",
  "BEARISH", "ON HOLD", "MOTHBALLED", "CANCELLED"
] as const;

// Rating weights for overall bankability calculation
const RATING_WEIGHTS = {
  growerContract: 0.25,
  techReadiness: 0.20,
  carbonIntensity: 0.15,
  offtake: 0.20,
  govSupport: 0.10,
  biomassAvailability: 0.10,
};

// Numeric values for ratings
const GROWER_CONTRACT_VALUES: Record<string, number> = {
  "GC1": 100, "GC2": 75, "GC3": 50, "GC4": 25, "N/A": 0
};
const TECH_READINESS_VALUES: Record<string, number> = {
  "TR1": 100, "TR2": 75, "TR3": 50, "TR4": 25
};
const CARBON_INTENSITY_VALUES: Record<string, number> = {
  "CI-A": 100, "CI-B": 75, "CI-C": 50, "CI-D": 25, "N/A": 0
};
const OFFTAKE_VALUES: Record<string, number> = {
  "OQ1": 100, "OQ2": 75, "OQ3": 50, "OQ4": 25, "N/A": 0
};
const GOV_SUPPORT_VALUES: Record<string, number> = {
  "GS1": 100, "GS2": 75, "GS3": 50, "GS4": 25, "N/A": 0
};

// Calculate overall bankability from component ratings
function calculateBankability(
  gc: string | null,
  tr: string | null,
  ci: string | null,
  oq: string | null,
  gs: string | null,
  biomass50km: number | null
): string {
  // Check for disqualifying conditions
  if (!gc || !tr) return "N/R";
  if (["MOTHBALLED", "CANCELLED"].includes(gc)) return "D";
  if (gc === "N/A" && oq === "N/A") return "N/R";

  // Calculate weighted score
  const gcValue = GROWER_CONTRACT_VALUES[gc] ?? 0;
  const trValue = TECH_READINESS_VALUES[tr] ?? 0;
  const ciValue = ci ? (CARBON_INTENSITY_VALUES[ci] ?? 0) : 50;
  const oqValue = oq ? (OFFTAKE_VALUES[oq] ?? 0) : 50;
  const gsValue = gs ? (GOV_SUPPORT_VALUES[gs] ?? 0) : 50;

  // Biomass availability score (higher is better, capped at 1M tonnes)
  const biomassScore = biomass50km
    ? Math.min(100, (biomass50km / 1000000) * 100)
    : 50;

  const weightedScore =
    gcValue * RATING_WEIGHTS.growerContract +
    trValue * RATING_WEIGHTS.techReadiness +
    ciValue * RATING_WEIGHTS.carbonIntensity +
    oqValue * RATING_WEIGHTS.offtake +
    gsValue * RATING_WEIGHTS.govSupport +
    biomassScore * RATING_WEIGHTS.biomassAvailability;

  // Map score to rating
  if (weightedScore >= 95) return "AAA";
  if (weightedScore >= 85) return "AA";
  if (weightedScore >= 75) return "A";
  if (weightedScore >= 65) return "BBB";
  if (weightedScore >= 55) return "BB";
  if (weightedScore >= 45) return "B";
  if (weightedScore >= 30) return "CCC";
  return "D";
}

// Determine signal from ratings
function calculateSignal(
  bankability: string,
  status: string | null,
  gc: string | null,
  tr: string | null
): typeof SIGNAL_OPTIONS[number] {
  if (status === "halted" || status === "cancelled") {
    if (gc === "N/A") return "MOTHBALLED";
    return "ON HOLD";
  }

  if (bankability === "N/R") return "NEUTRAL";
  if (bankability === "D") return "CANCELLED";

  // Map bankability to signal
  if (["AAA", "AA"].includes(bankability)) return "BULLISH";
  if (bankability === "A") return "NEUTRAL-BULLISH";
  if (["BBB", "BB"].includes(bankability)) return "NEUTRAL";
  if (bankability === "B") return "NEUTRAL-BEARISH";
  return "BEARISH";
}

export const projectAssessmentRouter = router({
  // Calculate assessment for a project
  calculate: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [project] = await db
        .select()
        .from(bioenergyProjects)
        .where(eq(bioenergyProjects.id, input.projectId))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Calculate bankability
      const calculatedBankability = calculateBankability(
        project.growerContractRating,
        project.techReadinessRating,
        project.carbonIntensityRating,
        project.offtakeRating,
        project.govSupportRating,
        project.biomass50km
      );

      // Calculate signal
      const calculatedSignal = calculateSignal(
        calculatedBankability,
        project.status,
        project.growerContractRating,
        project.techReadinessRating
      );

      // Component scores for visualization
      const componentScores = {
        growerContract: {
          rating: project.growerContractRating,
          score: project.growerContractRating ? GROWER_CONTRACT_VALUES[project.growerContractRating] : null,
          weight: RATING_WEIGHTS.growerContract,
          description: getGCDescription(project.growerContractRating),
        },
        techReadiness: {
          rating: project.techReadinessRating,
          score: project.techReadinessRating ? TECH_READINESS_VALUES[project.techReadinessRating] : null,
          weight: RATING_WEIGHTS.techReadiness,
          description: getTRDescription(project.techReadinessRating),
        },
        carbonIntensity: {
          rating: project.carbonIntensityRating,
          score: project.carbonIntensityRating ? CARBON_INTENSITY_VALUES[project.carbonIntensityRating] : null,
          value: project.carbonIntensityValue,
          weight: RATING_WEIGHTS.carbonIntensity,
          description: getCIDescription(project.carbonIntensityRating),
        },
        offtake: {
          rating: project.offtakeRating,
          score: project.offtakeRating ? OFFTAKE_VALUES[project.offtakeRating] : null,
          weight: RATING_WEIGHTS.offtake,
          description: getOQDescription(project.offtakeRating),
        },
        govSupport: {
          rating: project.govSupportRating,
          score: project.govSupportRating ? GOV_SUPPORT_VALUES[project.govSupportRating] : null,
          weight: RATING_WEIGHTS.govSupport,
          description: getGSDescription(project.govSupportRating),
        },
        biomassAvailability: {
          value: project.biomass50km,
          score: project.biomass50km ? Math.min(100, (project.biomass50km / 1000000) * 100) : null,
          weight: RATING_WEIGHTS.biomassAvailability,
          description: project.biomass50km
            ? `${project.biomass50km.toLocaleString()} t/yr within 50km`
            : "Unknown",
        },
      };

      return {
        projectId: project.id,
        projectSlug: project.slug,
        projectName: project.name,
        currentBankability: project.bankabilityRating,
        calculatedBankability,
        currentSignal: project.signal,
        calculatedSignal,
        needsUpdate: project.bankabilityRating !== calculatedBankability || project.signal !== calculatedSignal,
        componentScores,
      };
    }),

  // Update assessment (admin only)
  update: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        growerContractRating: z.enum(GROWER_CONTRACT_RATINGS).optional(),
        techReadinessRating: z.enum(TECH_READINESS_RATINGS).optional(),
        carbonIntensityRating: z.enum(CARBON_INTENSITY_RATINGS).optional(),
        carbonIntensityValue: z.number().optional(),
        offtakeRating: z.enum(OFFTAKE_RATINGS).optional(),
        govSupportRating: z.enum(GOV_SUPPORT_RATINGS).optional(),
        assessmentNotes: z.string().optional(),
        recalculate: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [project] = await db
        .select()
        .from(bioenergyProjects)
        .where(eq(bioenergyProjects.id, input.projectId))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Build update object
      const updates: Record<string, any> = {
        lastUpdatedBy: ctx.user.id,
      };

      if (input.growerContractRating) updates.growerContractRating = input.growerContractRating;
      if (input.techReadinessRating) updates.techReadinessRating = input.techReadinessRating;
      if (input.carbonIntensityRating) updates.carbonIntensityRating = input.carbonIntensityRating;
      if (input.carbonIntensityValue !== undefined) updates.carbonIntensityValue = input.carbonIntensityValue.toString();
      if (input.offtakeRating) updates.offtakeRating = input.offtakeRating;
      if (input.govSupportRating) updates.govSupportRating = input.govSupportRating;
      if (input.assessmentNotes) updates.assessmentNotes = input.assessmentNotes;

      // Recalculate overall ratings if requested
      if (input.recalculate) {
        const gc = input.growerContractRating || project.growerContractRating;
        const tr = input.techReadinessRating || project.techReadinessRating;
        const ci = input.carbonIntensityRating || project.carbonIntensityRating;
        const oq = input.offtakeRating || project.offtakeRating;
        const gs = input.govSupportRating || project.govSupportRating;

        updates.bankabilityRating = calculateBankability(gc, tr, ci, oq, gs, project.biomass50km);
        updates.signal = calculateSignal(updates.bankabilityRating, project.status, gc, tr);
      }

      await db
        .update(bioenergyProjects)
        .set(updates)
        .where(eq(bioenergyProjects.id, input.projectId));

      return {
        message: "Assessment updated successfully",
        newBankability: updates.bankabilityRating,
        newSignal: updates.signal,
      };
    }),

  // Bulk recalculate all project assessments
  recalculateAll: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const projects = await db.select().from(bioenergyProjects);

    let updated = 0;
    for (const project of projects) {
      const newBankability = calculateBankability(
        project.growerContractRating,
        project.techReadinessRating,
        project.carbonIntensityRating,
        project.offtakeRating,
        project.govSupportRating,
        project.biomass50km
      );

      const newSignal = calculateSignal(
        newBankability,
        project.status,
        project.growerContractRating,
        project.techReadinessRating
      );

      if (project.bankabilityRating !== newBankability || project.signal !== newSignal) {
        await db
          .update(bioenergyProjects)
          .set({
            bankabilityRating: newBankability,
            signal: newSignal,
            lastUpdatedBy: ctx.user.id,
          })
          .where(eq(bioenergyProjects.id, project.id));
        updated++;
      }
    }

    return { message: `Recalculated ${updated} of ${projects.length} projects` };
  }),

  // Get rating distribution
  getRatingDistribution: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const distribution = await db
      .select({
        bankabilityRating: bioenergyProjects.bankabilityRating,
        signal: bioenergyProjects.signal,
        count: sql<number>`count(*)`,
      })
      .from(bioenergyProjects)
      .where(eq(bioenergyProjects.isPublic, true))
      .groupBy(bioenergyProjects.bankabilityRating, bioenergyProjects.signal);

    // Summarize by rating
    const byRating: Record<string, number> = {};
    const bySignal: Record<string, number> = {};

    for (const row of distribution) {
      if (row.bankabilityRating) {
        byRating[row.bankabilityRating] = (byRating[row.bankabilityRating] || 0) + Number(row.count);
      }
      if (row.signal) {
        bySignal[row.signal] = (bySignal[row.signal] || 0) + Number(row.count);
      }
    }

    return { byRating, bySignal };
  }),
});

// Helper functions for rating descriptions
function getGCDescription(rating: string | null): string {
  switch (rating) {
    case "GC1": return "Long-term contracts with price certainty";
    case "GC2": return "Medium-term contracts in place";
    case "GC3": return "Short-term or spot market reliance";
    case "GC4": return "No feedstock contracts secured";
    case "N/A": return "Not applicable";
    default: return "Not rated";
  }
}

function getTRDescription(rating: string | null): string {
  switch (rating) {
    case "TR1": return "Commercially proven at scale";
    case "TR2": return "Demonstrated at commercial pilot";
    case "TR3": return "Technology proven at demonstration";
    case "TR4": return "Early stage / unproven";
    default: return "Not rated";
  }
}

function getCIDescription(rating: string | null): string {
  switch (rating) {
    case "CI-A": return "Excellent (<20 gCO2e/MJ)";
    case "CI-B": return "Good (20-35 gCO2e/MJ)";
    case "CI-C": return "Moderate (35-50 gCO2e/MJ)";
    case "CI-D": return "High (>50 gCO2e/MJ)";
    case "N/A": return "Not applicable";
    default: return "Not rated";
  }
}

function getOQDescription(rating: string | null): string {
  switch (rating) {
    case "OQ1": return "Binding offtake agreement in place";
    case "OQ2": return "Heads of Agreement / LOI signed";
    case "OQ3": return "MOU or discussions ongoing";
    case "OQ4": return "No offtake secured";
    case "N/A": return "Not applicable";
    default: return "Not rated";
  }
}

function getGSDescription(rating: string | null): string {
  switch (rating) {
    case "GS1": return "Committed government funding";
    case "GS2": return "Grant application approved";
    case "GS3": return "Policy support without direct funding";
    case "GS4": return "No government support";
    case "N/A": return "Not applicable";
    default: return "Not rated";
  }
}
