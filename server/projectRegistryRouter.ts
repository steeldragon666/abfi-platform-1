/**
 * Project Registry Router
 * Endpoints for the Australian Bioenergy Projects public registry
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { bioenergyProjects, projectClaims, users, suppliers } from "../drizzle/schema";
import { eq, and, desc, like, or, sql, inArray, asc } from "drizzle-orm";

// Rating system for gap analysis
const REQUIRED_FIELDS = [
  { field: "technology", label: "Technology Type", weight: 10 },
  { field: "feedstock", label: "Primary Feedstock", weight: 10 },
  { field: "capacity", label: "Capacity", weight: 8 },
  { field: "biomass50km", label: "Biomass Availability (50km)", weight: 8 },
  { field: "bankabilityRating", label: "Bankability Rating", weight: 15 },
  { field: "growerContractRating", label: "Grower Contract Rating", weight: 12 },
  { field: "techReadinessRating", label: "Tech Readiness Rating", weight: 10 },
  { field: "carbonIntensityRating", label: "Carbon Intensity Rating", weight: 12 },
  { field: "offtakeRating", label: "Offtake Rating", weight: 10 },
  { field: "publicDescription", label: "Public Description", weight: 5 },
];

export const projectRegistryRouter = router({
  // List all projects with filters
  list: publicProcedure
    .input(
      z.object({
        status: z.enum([
          "announced", "feasibility", "development", "construction",
          "operational", "halted", "cancelled"
        ]).optional(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        technology: z.string().optional(),
        feedstock: z.string().optional(),
        bankabilityMin: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["name", "updatedAt", "bankability", "capacity"]).default("name"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Build conditions
      const conditions = [eq(bioenergyProjects.isPublic, true)];

      if (input.status) {
        conditions.push(eq(bioenergyProjects.status, input.status));
      }
      if (input.state) {
        conditions.push(eq(bioenergyProjects.state, input.state));
      }
      if (input.technology) {
        conditions.push(like(bioenergyProjects.technology, `%${input.technology}%`));
      }
      if (input.feedstock) {
        conditions.push(like(bioenergyProjects.feedstock, `%${input.feedstock}%`));
      }
      if (input.search) {
        conditions.push(
          or(
            like(bioenergyProjects.name, `%${input.search}%`),
            like(bioenergyProjects.company, `%${input.search}%`),
            like(bioenergyProjects.location, `%${input.search}%`)
          )!
        );
      }

      // Build order by
      let orderBy;
      const sortDir = input.sortOrder === "asc" ? asc : desc;
      switch (input.sortBy) {
        case "updatedAt":
          orderBy = sortDir(bioenergyProjects.updatedAt);
          break;
        case "bankability":
          orderBy = sortDir(bioenergyProjects.bankabilityRating);
          break;
        case "capacity":
          orderBy = sortDir(bioenergyProjects.capacityValue);
          break;
        default:
          orderBy = sortDir(bioenergyProjects.name);
      }

      const [projects, countResult] = await Promise.all([
        db
          .select()
          .from(bioenergyProjects)
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(bioenergyProjects)
          .where(and(...conditions)),
      ]);

      return {
        projects,
        total: countResult[0]?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  // Get project by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [project] = await db
        .select()
        .from(bioenergyProjects)
        .where(eq(bioenergyProjects.slug, input.slug))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Increment view count
      await db
        .update(bioenergyProjects)
        .set({ viewCount: sql`${bioenergyProjects.viewCount} + 1` })
        .where(eq(bioenergyProjects.id, project.id));

      return project;
    }),

  // Get gap analysis for a project
  getGapAnalysis: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [project] = await db
        .select()
        .from(bioenergyProjects)
        .where(eq(bioenergyProjects.slug, input.slug))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Calculate completeness
      const gaps: { field: string; label: string; weight: number; status: "complete" | "missing" | "partial" }[] = [];
      let totalWeight = 0;
      let earnedWeight = 0;

      for (const { field, label, weight } of REQUIRED_FIELDS) {
        const value = (project as any)[field];
        let status: "complete" | "missing" | "partial" = "missing";

        if (value !== null && value !== undefined && value !== "" && value !== "N/A" && value !== "N/R") {
          status = "complete";
          earnedWeight += weight;
        } else if (value === "N/A" || value === "N/R") {
          status = "partial"; // Not applicable but acknowledged
          earnedWeight += weight * 0.5;
        }

        totalWeight += weight;
        gaps.push({ field, label, weight, status });
      }

      const completenessScore = Math.round((earnedWeight / totalWeight) * 100);
      const missingFields = gaps.filter(g => g.status === "missing");
      const partialFields = gaps.filter(g => g.status === "partial");

      return {
        projectSlug: project.slug,
        projectName: project.name,
        completenessScore,
        totalFields: REQUIRED_FIELDS.length,
        completeFields: gaps.filter(g => g.status === "complete").length,
        missingFields: missingFields.map(g => g.label),
        partialFields: partialFields.map(g => g.label),
        gaps,
        recommendations: missingFields
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 3)
          .map(g => `Add ${g.label} to improve your rating by up to ${g.weight}%`),
      };
    }),

  // Get unique filter options
  getFilterOptions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const projects = await db
      .select({
        technology: bioenergyProjects.technology,
        feedstock: bioenergyProjects.feedstock,
        state: bioenergyProjects.state,
        status: bioenergyProjects.status,
      })
      .from(bioenergyProjects)
      .where(eq(bioenergyProjects.isPublic, true));

    // Extract unique values
    const technologies = Array.from(new Set(projects.map(p => p.technology).filter(Boolean))) as string[];
    const feedstocks = Array.from(new Set(projects.map(p => p.feedstock).filter(Boolean))) as string[];
    const states = Array.from(new Set(projects.map(p => p.state).filter(Boolean))) as string[];
    const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean))) as string[];

    return { technologies, feedstocks, states, statuses };
  }),

  // Submit a claim for a project
  submitClaim: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        claimType: z.enum(["owner", "operator", "developer", "representative"]),
        companyName: z.string(),
        abn: z.string().optional(),
        contactName: z.string(),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        position: z.string().optional(),
        verificationNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check project exists and is unclaimed
      const [project] = await db
        .select()
        .from(bioenergyProjects)
        .where(eq(bioenergyProjects.id, input.projectId))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (project.claimStatus === "verified") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This project has already been claimed and verified",
        });
      }

      // Check for existing pending claim from this user
      const existingClaim = await db
        .select()
        .from(projectClaims)
        .where(
          and(
            eq(projectClaims.projectId, input.projectId),
            eq(projectClaims.userId, ctx.user.id),
            or(
              eq(projectClaims.status, "pending"),
              eq(projectClaims.status, "under_review")
            )
          )
        )
        .limit(1);

      if (existingClaim.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending claim for this project",
        });
      }

      // Get supplier ID if exists
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.userId, ctx.user.id))
        .limit(1);

      // Create claim
      const [claim] = await db
        .insert(projectClaims)
        .values({
          projectId: input.projectId,
          userId: ctx.user.id,
          supplierId: supplier?.id,
          claimType: input.claimType,
          companyName: input.companyName,
          abn: input.abn,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          position: input.position,
          verificationNotes: input.verificationNotes,
          status: "pending",
        })
        .$returningId();

      // Update project claim status
      await db
        .update(bioenergyProjects)
        .set({ claimStatus: "pending" })
        .where(eq(bioenergyProjects.id, input.projectId));

      return { claimId: claim.id, message: "Claim submitted successfully. Our team will review your request." };
    }),

  // Get user's claims
  getMyClaims: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const claims = await db
      .select({
        claim: projectClaims,
        project: {
          id: bioenergyProjects.id,
          slug: bioenergyProjects.slug,
          name: bioenergyProjects.name,
          company: bioenergyProjects.company,
          location: bioenergyProjects.location,
        },
      })
      .from(projectClaims)
      .leftJoin(bioenergyProjects, eq(projectClaims.projectId, bioenergyProjects.id))
      .where(eq(projectClaims.userId, ctx.user.id))
      .orderBy(desc(projectClaims.createdAt));

    return claims;
  }),

  // Admin: List pending claims
  listPendingClaims: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const claims = await db
      .select({
        claim: projectClaims,
        project: {
          id: bioenergyProjects.id,
          slug: bioenergyProjects.slug,
          name: bioenergyProjects.name,
          company: bioenergyProjects.company,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(projectClaims)
      .leftJoin(bioenergyProjects, eq(projectClaims.projectId, bioenergyProjects.id))
      .leftJoin(users, eq(projectClaims.userId, users.id))
      .where(
        or(
          eq(projectClaims.status, "pending"),
          eq(projectClaims.status, "under_review")
        )
      )
      .orderBy(asc(projectClaims.createdAt));

    return claims;
  }),

  // Admin: Review claim
  reviewClaim: protectedProcedure
    .input(
      z.object({
        claimId: z.number(),
        action: z.enum(["approve", "reject", "request_more_info"]),
        notes: z.string().optional(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [claim] = await db
        .select()
        .from(projectClaims)
        .where(eq(projectClaims.id, input.claimId))
        .limit(1);

      if (!claim) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      if (input.action === "approve") {
        // Update claim
        await db
          .update(projectClaims)
          .set({
            status: "verified",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            verificationNotes: input.notes,
          })
          .where(eq(projectClaims.id, input.claimId));

        // Update project
        await db
          .update(bioenergyProjects)
          .set({
            claimStatus: "verified",
            claimedByUserId: claim.userId,
            claimedBySupplierId: claim.supplierId,
            claimedAt: new Date(),
            claimVerifiedAt: new Date(),
          })
          .where(eq(bioenergyProjects.id, claim.projectId));

        return { message: "Claim approved successfully" };
      } else if (input.action === "reject") {
        if (!input.rejectionReason) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Rejection reason required" });
        }

        await db
          .update(projectClaims)
          .set({
            status: "rejected",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            rejectionReason: input.rejectionReason,
          })
          .where(eq(projectClaims.id, input.claimId));

        // Reset project claim status if no other pending claims
        const otherClaims = await db
          .select()
          .from(projectClaims)
          .where(
            and(
              eq(projectClaims.projectId, claim.projectId),
              or(
                eq(projectClaims.status, "pending"),
                eq(projectClaims.status, "under_review")
              )
            )
          )
          .limit(1);

        if (otherClaims.length === 0) {
          await db
            .update(bioenergyProjects)
            .set({ claimStatus: "unclaimed" })
            .where(eq(bioenergyProjects.id, claim.projectId));
        }

        return { message: "Claim rejected" };
      } else {
        // Request more info
        await db
          .update(projectClaims)
          .set({
            status: "under_review",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            verificationNotes: input.notes,
          })
          .where(eq(projectClaims.id, input.claimId));

        return { message: "Request for more information sent" };
      }
    }),

  // Update project (verified owner only)
  updateProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        updates: z.object({
          publicDescription: z.string().optional(),
          publicContactEmail: z.string().email().optional(),
          publicWebsite: z.string().url().optional(),
          capacity: z.string().optional(),
          technology: z.string().optional(),
          feedstock: z.string().optional(),
          status: z.enum([
            "announced", "feasibility", "development", "construction",
            "operational", "halted", "cancelled"
          ]).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user owns this project
      const [project] = await db
        .select()
        .from(bioenergyProjects)
        .where(
          and(
            eq(bioenergyProjects.id, input.projectId),
            eq(bioenergyProjects.claimedByUserId, ctx.user.id),
            eq(bioenergyProjects.claimStatus, "verified")
          )
        )
        .limit(1);

      if (!project && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this project",
        });
      }

      await db
        .update(bioenergyProjects)
        .set({
          ...input.updates,
          lastUpdatedBy: ctx.user.id,
        })
        .where(eq(bioenergyProjects.id, input.projectId));

      return { message: "Project updated successfully" };
    }),

  // List projects optimized for map display
  listForMap: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const projects = await db
      .select({
        id: bioenergyProjects.id,
        slug: bioenergyProjects.slug,
        name: bioenergyProjects.name,
        company: bioenergyProjects.company,
        location: bioenergyProjects.location,
        latitude: bioenergyProjects.latitude,
        longitude: bioenergyProjects.longitude,
        status: bioenergyProjects.status,
        products: bioenergyProjects.products,
        capacity: bioenergyProjects.capacity,
        technology: bioenergyProjects.technology,
        feedstock: bioenergyProjects.feedstock,
        biomass50km: bioenergyProjects.biomass50km,
        bankabilityRating: bioenergyProjects.bankabilityRating,
        growerContractRating: bioenergyProjects.growerContractRating,
        techReadinessRating: bioenergyProjects.techReadinessRating,
        carbonIntensityRating: bioenergyProjects.carbonIntensityRating,
        carbonIntensityValue: bioenergyProjects.carbonIntensityValue,
        offtakeRating: bioenergyProjects.offtakeRating,
        govSupportRating: bioenergyProjects.govSupportRating,
        signal: bioenergyProjects.signal,
        description: bioenergyProjects.publicDescription,
      })
      .from(bioenergyProjects)
      .where(eq(bioenergyProjects.isPublic, true));

    return projects;
  }),

  // Get statistics
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        operational: sql<number>`sum(case when ${bioenergyProjects.status} = 'operational' then 1 else 0 end)`,
        development: sql<number>`sum(case when ${bioenergyProjects.status} = 'development' then 1 else 0 end)`,
        feasibility: sql<number>`sum(case when ${bioenergyProjects.status} = 'feasibility' then 1 else 0 end)`,
        halted: sql<number>`sum(case when ${bioenergyProjects.status} = 'halted' then 1 else 0 end)`,
        claimed: sql<number>`sum(case when ${bioenergyProjects.claimStatus} = 'verified' then 1 else 0 end)`,
      })
      .from(bioenergyProjects)
      .where(eq(bioenergyProjects.isPublic, true));

    return stats[0];
  }),
});
