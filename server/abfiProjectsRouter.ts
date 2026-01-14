import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { eq, and, desc, asc, sql, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  abfiBankabilityAssessments,
  abfiAssessmentProponents,
  abfiAssessmentEvidence,
  abfiAssessmentImprovements,
  abfiAssessmentFrameworks,
} from "../drizzle/schema";

// ============================================================================
// ABFI PROJECTS ROUTER - ABFI Bankability Assessment Platform
// ============================================================================

async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(process.env.DATABASE_URL);
}

// ============================================================================
// PUBLIC PROCEDURES - Assessment Data Access
// ============================================================================

export const abfiProjectsRouter = router({
  /**
   * Get all public ABFI assessments with basic info
   */
  getAllAssessments: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      tier: z.enum(["1", "2", "3", "4"]).optional(),
      state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
      status: z.enum(["OPERATIONAL", "UNDER_CONSTRUCTION", "FEED", "PRE_FEED", "DEMONSTRATION", "PROPOSED", "ON_HOLD", "FAILED"]).optional(),
      sortBy: z.enum(["rank", "score", "name", "state"]).default("rank"),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const assessments = await db.select({
        id: abfiBankabilityAssessments.id,
        assessmentId: abfiBankabilityAssessments.assessmentId,
        projectName: abfiBankabilityAssessments.projectName,
        shortName: abfiBankabilityAssessments.shortName,
        status: abfiBankabilityAssessments.status,
        state: abfiBankabilityAssessments.state,
        latitude: abfiBankabilityAssessments.latitude,
        longitude: abfiBankabilityAssessments.longitude,
        technology: abfiBankabilityAssessments.technology,
        feedstock: abfiBankabilityAssessments.feedstock,
        capacityValue: abfiBankabilityAssessments.capacityValue,
        capacityUnit: abfiBankabilityAssessments.capacityUnit,
        overallScore: abfiBankabilityAssessments.overallScore,
        rating: abfiBankabilityAssessments.rating,
        tier: abfiBankabilityAssessments.tier,
        tierLabel: abfiBankabilityAssessments.tierLabel,
        rank: abfiBankabilityAssessments.rank,
        keyStrengths: abfiBankabilityAssessments.keyStrengths,
        keyRisks: abfiBankabilityAssessments.keyRisks,
        claimStatus: abfiBankabilityAssessments.claimStatus,
        isPublic: abfiBankabilityAssessments.isPublic,
      })
      .from(abfiBankabilityAssessments)
      .where(and(
        eq(abfiBankabilityAssessments.isPublic, true),
        input.tier ? eq(abfiBankabilityAssessments.tier, parseInt(input.tier)) : undefined,
        input.state ? eq(abfiBankabilityAssessments.state, input.state) : undefined,
        input.status ? eq(abfiBankabilityAssessments.status, input.status) : undefined,
      ))
      .orderBy(
        input.sortOrder === "desc"
          ? desc(input.sortBy === "rank" ? abfiBankabilityAssessments.rank :
                 input.sortBy === "score" ? abfiBankabilityAssessments.overallScore :
                 input.sortBy === "name" ? abfiBankabilityAssessments.projectName :
                 abfiBankabilityAssessments.state)
          : asc(input.sortBy === "rank" ? abfiBankabilityAssessments.rank :
                input.sortBy === "score" ? abfiBankabilityAssessments.overallScore :
                input.sortBy === "name" ? abfiBankabilityAssessments.projectName :
                abfiBankabilityAssessments.state)
      )
      .limit(input.limit)
      .offset(input.offset);

      // Get total count for pagination
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(abfiBankabilityAssessments)
        .where(and(
          eq(abfiBankabilityAssessments.isPublic, true),
          input.tier ? eq(abfiBankabilityAssessments.tier, parseInt(input.tier)) : undefined,
          input.state ? eq(abfiBankabilityAssessments.state, input.state) : undefined,
          input.status ? eq(abfiBankabilityAssessments.status, input.status) : undefined,
        ));

      return {
        assessments,
        totalCount: count,
        hasMore: input.offset + input.limit < count,
      };
    }),

  /**
   * Get detailed assessment by ID
   */
  getAssessmentById: publicProcedure
    .input(z.object({
      assessmentId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get assessment
      const [assessment] = await db.select()
        .from(abfiBankabilityAssessments)
        .where(and(
          eq(abfiBankabilityAssessments.assessmentId, input.assessmentId),
          eq(abfiBankabilityAssessments.isPublic, true)
        ))
        .limit(1);

      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      // Get proponents
      const proponents = await db.select()
        .from(abfiAssessmentProponents)
        .where(eq(abfiAssessmentProponents.assessmentId, assessment.id));

      // Get framework info
      const [framework] = await db.select({
        version: abfiAssessmentFrameworks.version,
        pillarWeights: abfiAssessmentFrameworks.pillarWeights,
        ratingScale: abfiAssessmentFrameworks.ratingScale,
        tierDefinitions: abfiAssessmentFrameworks.tierDefinitions,
      })
      .from(abfiAssessmentFrameworks)
      .where(eq(abfiAssessmentFrameworks.version, assessment.frameworkVersion))
      .limit(1);

      return {
        assessment,
        proponents,
        framework: framework || null,
      };
    }),

  /**
   * Get assessment statistics and summaries
   */
  getAssessmentStats: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Tier distribution
      const tierStats = await db.select({
        tier: abfiBankabilityAssessments.tier,
        tierLabel: abfiBankabilityAssessments.tierLabel,
        count: sql<number>`count(*)`,
      })
      .from(abfiBankabilityAssessments)
      .where(eq(abfiBankabilityAssessments.isPublic, true))
      .groupBy(abfiBankabilityAssessments.tier, abfiBankabilityAssessments.tierLabel)
      .orderBy(abfiBankabilityAssessments.tier);

      // State distribution
      const stateStats = await db.select({
        state: abfiBankabilityAssessments.state,
        count: sql<number>`count(*)`,
      })
      .from(abfiBankabilityAssessments)
      .where(and(
        eq(abfiBankabilityAssessments.isPublic, true),
        sql`${abfiBankabilityAssessments.state} is not null`
      ))
      .groupBy(abfiBankabilityAssessments.state)
      .orderBy(sql`count(*) desc`);

      // Technology distribution
      const techStats = await db.select({
        technology: abfiBankabilityAssessments.technology,
        count: sql<number>`count(*)`,
      })
      .from(abfiBankabilityAssessments)
      .where(and(
        eq(abfiBankabilityAssessments.isPublic, true),
        sql`${abfiBankabilityAssessments.technology} is not null`
      ))
      .groupBy(abfiBankabilityAssessments.technology)
      .orderBy(sql`count(*) desc`);

      // Score distribution
      const [{ avgScore, minScore, maxScore }] = await db.select({
        avgScore: sql<number>`avg(${abfiBankabilityAssessments.overallScore})`,
        minScore: sql<number>`min(${abfiBankabilityAssessments.overallScore})`,
        maxScore: sql<number>`max(${abfiBankabilityAssessments.overallScore})`,
      })
      .from(abfiBankabilityAssessments)
      .where(eq(abfiBankabilityAssessments.isPublic, true));

      return {
        totalProjects: tierStats.reduce((sum, t) => sum + t.count, 0),
        tierDistribution: tierStats,
        stateDistribution: stateStats,
        technologyDistribution: techStats,
        scoreStats: {
          average: Math.round(avgScore * 100) / 100,
          minimum: minScore,
          maximum: maxScore,
        },
      };
    }),

  /**
   * Get framework information
   */
  getFramework: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [framework] = await db.select()
        .from(abfiAssessmentFrameworks)
        .where(eq(abfiAssessmentFrameworks.isActive, true))
        .orderBy(desc(abfiAssessmentFrameworks.createdAt))
        .limit(1);

      return framework || null;
    }),

  // ============================================================================
  // PROTECTED PROCEDURES - Project Claiming & Evidence Management
  // ============================================================================

  /**
   * Claim a project (for project developers)
   */
  claimProject: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      claimReason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if project exists and is unclaimed
      const [project] = await db.select()
        .from(abfiBankabilityAssessments)
        .where(eq(abfiBankabilityAssessments.assessmentId, input.assessmentId))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (project.claimStatus !== "unclaimed") {
        throw new TRPCError({ code: "CONFLICT", message: "Project is already claimed or claimed by someone else" });
      }

      // Update claim status
      await db.update(abfiBankabilityAssessments)
        .set({
          claimedByUserId: ctx.user.id,
          claimStatus: "pending",
          claimedAt: new Date(),
        })
        .where(eq(abfiBankabilityAssessments.id, project.id));

      return {
        success: true,
        message: "Project claim submitted for review",
        projectId: project.id,
      };
    }),

  /**
   * Upload evidence for a claimed project
   */
  uploadEvidence: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      evidenceType: z.enum(["document", "certificate", "contract", "permit", "assessment", "other"]),
      title: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      documentUrl: z.string().url().optional(),
      documentKey: z.string().optional(),
      relevantPillars: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user owns the project
      const [project] = await db.select()
        .from(abfiBankabilityAssessments)
        .where(and(
          eq(abfiBankabilityAssessments.assessmentId, input.assessmentId),
          eq(abfiBankabilityAssessments.claimedByUserId, ctx.user.id)
        ))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to upload evidence for this project" });
      }

      // Insert evidence
      const result = await db.insert(abfiAssessmentEvidence).values({
        assessmentId: project.id,
        evidenceType: input.evidenceType,
        title: input.title,
        description: input.description,
        documentUrl: input.documentUrl,
        documentKey: input.documentKey,
        uploadedBy: ctx.user.id,
        relevantPillars: input.relevantPillars,
      });

      return {
        success: true,
        evidenceId: Number(result[0].insertId),
        message: "Evidence uploaded successfully",
      };
    }),

  /**
   * Get user's claimed projects
   */
  getMyProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const projects = await db.select({
        id: abfiBankabilityAssessments.id,
        assessmentId: abfiBankabilityAssessments.assessmentId,
        projectName: abfiBankabilityAssessments.projectName,
        shortName: abfiBankabilityAssessments.shortName,
        status: abfiBankabilityAssessments.status,
        claimStatus: abfiBankabilityAssessments.claimStatus,
        claimedAt: abfiBankabilityAssessments.claimedAt,
        overallScore: abfiBankabilityAssessments.overallScore,
        rating: abfiBankabilityAssessments.rating,
        tier: abfiBankabilityAssessments.tier,
      })
      .from(abfiBankabilityAssessments)
      .where(eq(abfiBankabilityAssessments.claimedByUserId, ctx.user.id))
      .orderBy(desc(abfiBankabilityAssessments.claimedAt));

      // Get evidence counts for each project
      for (const project of projects) {
        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
          .from(abfiAssessmentEvidence)
          .where(eq(abfiAssessmentEvidence.assessmentId, project.id));

        (project as any).evidenceCount = count;
      }

      return projects;
    }),

  /**
   * Get improvement suggestions for a project
   */
  getImprovementSuggestions: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user owns the project
      const [project] = await db.select()
        .from(abfiBankabilityAssessments)
        .where(and(
          eq(abfiBankabilityAssessments.assessmentId, input.assessmentId),
          eq(abfiBankabilityAssessments.claimedByUserId, ctx.user.id)
        ))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to view this project" });
      }

      // Get existing improvements
      const existingImprovements = await db.select()
        .from(abfiAssessmentImprovements)
        .where(eq(abfiAssessmentImprovements.assessmentId, project.id))
        .orderBy(abfiAssessmentImprovements.createdAt);

      // Generate AI-powered suggestions based on project scores
      const suggestions = generateImprovementSuggestions(project, existingImprovements);

      return {
        project: {
          id: project.id,
          assessmentId: project.assessmentId,
          projectName: project.projectName,
          overallScore: project.overallScore,
        },
        existingImprovements,
        suggestedImprovements: suggestions,
      };
    }),

  /**
   * Request ABFI service for improvement
   */
  requestImprovementService: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      improvementId: z.number(), // Reference to suggested improvement
      serviceDescription: z.string().min(10).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user owns the project
      const [project] = await db.select()
        .from(abfiBankabilityAssessments)
        .where(and(
          eq(abfiBankabilityAssessments.assessmentId, input.assessmentId),
          eq(abfiBankabilityAssessments.claimedByUserId, ctx.user.id)
        ))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission for this project" });
      }

      // Create improvement record
      const result = await db.insert(abfiAssessmentImprovements).values({
        assessmentId: project.id,
        pillarName: "general",
        improvementType: "other",
        title: "ABFI Service Request",
        description: input.serviceDescription,
        implementationComplexity: "medium",
        abfiServiceRecommended: true,
        serviceDescription: input.serviceDescription,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        improvementId: Number(result[0].insertId),
        message: "Service request submitted. ABFI will contact you within 2 business days.",
      };
    }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateImprovementSuggestions(project: any, existingImprovements: any[]): any[] {
  const suggestions = [];

  // Low volume security score
  if (project.volumeSecurityScore < 6) {
    if (!existingImprovements.some(i => i.pillarName === "volume_security")) {
      suggestions.push({
        pillarName: "volume_security",
        improvementType: "contract",
        title: "Secure Long-term Feedstock Agreements",
        description: "Establish 5+ year contracts with multiple growers to improve supply reliability",
        estimatedImpact: 1.5,
        implementationComplexity: "medium",
        timelineMonths: 6,
        abfiServiceRecommended: true,
        serviceDescription: "ABFI can help identify suitable growers and facilitate contract negotiations",
      });
    }
  }

  // Low counterparty quality score
  if (project.counterpartyQualityScore < 6) {
    if (!existingImprovements.some(i => i.pillarName === "counterparty_quality")) {
      suggestions.push({
        pillarName: "counterparty_quality",
        improvementType: "partnership",
        title: "Strengthen Offtaker Relationships",
        description: "Secure investment-grade offtake agreements to improve counterparty credibility",
        estimatedImpact: 2.0,
        implementationComplexity: "high",
        timelineMonths: 12,
        abfiServiceRecommended: true,
        serviceDescription: "ABFI can introduce investment-grade offtakers and facilitate negotiations",
      });
    }
  }

  // Low contract structure score
  if (project.contractStructureScore < 6) {
    if (!existingImprovements.some(i => i.pillarName === "contract_structure")) {
      suggestions.push({
        pillarName: "contract_structure",
        improvementType: "contract",
        title: "Develop Comprehensive Contract Framework",
        description: "Implement take-or-pay agreements with CPI escalation and force majeure protections",
        estimatedImpact: 1.8,
        implementationComplexity: "medium",
        timelineMonths: 9,
        abfiServiceRecommended: true,
        serviceDescription: "ABFI provides standard contract templates and legal review services",
      });
    }
  }

  // High concentration risk
  if (project.concentrationRiskScore < 6) {
    if (!existingImprovements.some(i => i.pillarName === "concentration_risk")) {
      suggestions.push({
        pillarName: "concentration_risk",
        improvementType: "partnership",
        title: "Diversify Supply Chain Partners",
        description: "Establish relationships with multiple feedstock sources and geographic regions",
        estimatedImpact: 1.2,
        implementationComplexity: "medium",
        timelineMonths: 8,
        abfiServiceRecommended: true,
        serviceDescription: "ABFI can identify alternative suppliers and geographic diversification opportunities",
      });
    }
  }

  // Low operational readiness
  if (project.operationalReadinessScore < 6) {
    if (!existingImprovements.some(i => i.pillarName === "operational_readiness")) {
      suggestions.push({
        pillarName: "operational_readiness",
        improvementType: "evidence",
        title: "Complete Technology Validation",
        description: "Provide evidence of commercial-scale technology operation and performance data",
        estimatedImpact: 1.6,
        implementationComplexity: "low",
        timelineMonths: 3,
        abfiServiceRecommended: false,
        serviceDescription: "Upload existing performance data or arrange technology validation testing",
      });
    }
  }

  return suggestions;
}