import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc.js";
import { monitoringJobsRouter } from "./monitoringJobsRouter";
import { demandSignalsRouter } from "./demandSignalsRouter";
import { futuresRouter } from "./futuresRouter";
import { rsieRouter } from "./rsieRouter";
// ABFI v3.1 Routers
import { evidenceVaultRouter } from "./evidenceVaultRouter";
import { supplyChainRouter } from "./supplyChainRouter";
import { emissionsRouter } from "./emissionsRouter";
import { vcRouter } from "./vcRouter";
import { goSchemeRouter } from "./goSchemeRouter";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { calculateAbfiScore, generateRatingImprovements } from "./rating";
import { generateAbfiId, validateABN } from "./utils";
import { createAuditLog } from "./db";
import { lookupABN } from "./abnValidation";

// ============================================================================
// HELPER PROCEDURES
// ============================================================================

const supplierProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const supplier = await db.getSupplierByUserId(ctx.user.id);
  if (!supplier) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Supplier profile required",
    });
  }
  return next({ ctx: { ...ctx, supplier } });
});

const buyerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const buyer = await db.getBuyerByUserId(ctx.user.id);
  if (!buyer) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Buyer profile required",
    });
  }
  return next({ ctx: { ...ctx, buyer } });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  monitoringJobs: monitoringJobsRouter,
  demandSignals: demandSignalsRouter,
  futures: futuresRouter,
  rsie: rsieRouter,

  // ============================================================================
  // ABFI v3.1 ROUTERS
  // ============================================================================
  evidenceVault: evidenceVaultRouter,
  supplyChain: supplyChainRouter,
  emissions: emissionsRouter,
  vc: vcRouter,
  goScheme: goSchemeRouter,

  // ============================================================================
  // AUTH
  // ============================================================================

  // ============================================================================
  // UTILITIES
  // ============================================================================

  utils: router({
    validateABN: publicProcedure
      .input(z.object({ abn: z.string().length(11) }))
      .query(async ({ input }) => {
        const result = await lookupABN(input.abn);
        return result;
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const supplier = await db.getSupplierByUserId(ctx.user.id);
      const buyer = await db.getBuyerByUserId(ctx.user.id);

      return {
        user: ctx.user,
        supplier,
        buyer,
      };
    }),
  }),

  // ============================================================================
  // SUPPLIERS
  // ============================================================================

  suppliers: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const supplier = await db.getSupplierByUserId(ctx.user.id);
      if (!supplier) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Supplier profile not found",
        });
      }
      return supplier;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSupplierById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          abn: z.string().length(11),
          companyName: z.string().min(1),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          state: z
            .enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"])
            .optional(),
          postcode: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          description: z.string().optional(),
          website: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate ABN
        if (!validateABN(input.abn)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid ABN",
          });
        }

        // Check if ABN already exists
        const existing = await db.getSupplierByABN(input.abn);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "ABN already registered",
          });
        }

        // Check if user already has a supplier profile
        const existingSupplier = await db.getSupplierByUserId(ctx.user.id);
        if (existingSupplier) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Supplier profile already exists",
          });
        }

        const supplierId = await db.createSupplier({
          userId: ctx.user.id,
          ...input,
        });

        // Update user role
        await db.updateUserRole(ctx.user.id, "supplier");

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_supplier",
          entityType: "supplier",
          entityId: supplierId,
        });

        return { supplierId };
      }),

    update: supplierProcedure
      .input(
        z.object({
          companyName: z.string().min(1).optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          state: z
            .enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"])
            .optional(),
          postcode: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          description: z.string().optional(),
          website: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateSupplier(ctx.supplier.id, input);

        await createAuditLog({
          userId: ctx.user.id,
          action: "update_supplier",
          entityType: "supplier",
          entityId: ctx.supplier.id,
        });

        return { success: true };
      }),

    getStats: supplierProcedure.query(async ({ ctx }) => {
      return await db.getSupplierStats(ctx.supplier.id);
    }),

    // Comprehensive producer registration (7-step flow)
    registerProducer: protectedProcedure
      .input(
        z.object({
          // Account Setup
          abn: z.string().length(11),
          companyName: z.string().min(1),
          tradingName: z.string().optional(),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),
          website: z.string().optional(),

          // Property Details
          properties: z
            .array(
              z.object({
                propertyName: z.string(),
                primaryAddress: z.string().optional(),
                latitude: z.string().optional(),
                longitude: z.string().optional(),
                state: z
                  .enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"])
                  .optional(),
                postcode: z.string().optional(),
                region: z.string().optional(),
                totalLandArea: z.number().optional(),
                cultivatedArea: z.number().optional(),
              })
            )
            .optional(),

          // Production Profile
          feedstockTypes: z.array(z.string()).optional(),
          annualProduction: z.number().optional(),

          // Visibility preferences
          profilePublic: z.boolean().default(true),
          showContactDetails: z.boolean().default(false),
          showExactLocation: z.boolean().default(false),
          allowDirectInquiries: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate ABN
        if (!validateABN(input.abn)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid ABN",
          });
        }

        // Check if ABN already exists
        const existing = await db.getSupplierByABN(input.abn);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "ABN already registered",
          });
        }

        // Check if user already has a supplier profile
        const existingSupplier = await db.getSupplierByUserId(ctx.user.id);
        if (existingSupplier) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Supplier profile already exists",
          });
        }

        // Create supplier profile
        const supplierId = await db.createSupplier({
          userId: ctx.user.id,
          abn: input.abn,
          companyName: input.companyName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          website: input.website,
        });

        // Create properties if provided
        if (input.properties && input.properties.length > 0) {
          for (const property of input.properties) {
            await db.createProperty({
              supplierId,
              ...property,
            });
          }
        }

        // Update user role
        await db.updateUserRole(ctx.user.id, "supplier");

        await createAuditLog({
          userId: ctx.user.id,
          action: "register_producer",
          entityType: "supplier",
          entityId: supplierId,
        });

        return { supplierId, success: true };
      }),
  }),

  // ============================================================================
  // BUYERS
  // ============================================================================

  buyers: router({
    create: protectedProcedure
      .input(
        z.object({
          abn: z.string().length(11),
          companyName: z.string().min(1),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),
          facilityName: z.string().optional(),
          facilityAddress: z.string().optional(),
          facilityLatitude: z.string().optional(),
          facilityLongitude: z.string().optional(),
          facilityState: z
            .enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"])
            .optional(),
          description: z.string().optional(),
          website: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate ABN
        if (!validateABN(input.abn)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid ABN",
          });
        }

        // Check if user already has a buyer profile
        const existingBuyer = await db.getBuyerByUserId(ctx.user.id);
        if (existingBuyer) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Buyer profile already exists",
          });
        }

        const buyerId = await db.createBuyer({
          userId: ctx.user.id,
          ...input,
        });

        // Update user role
        await db.updateUserRole(ctx.user.id, "buyer");

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_buyer",
          entityType: "buyer",
          entityId: buyerId,
        });

        return { buyerId };
      }),

    get: buyerProcedure.query(async ({ ctx }) => {
      return await db.getBuyerById(ctx.buyer.id);
    }),

    update: buyerProcedure
      .input(
        z.object({
          companyName: z.string().min(1).optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
          facilityName: z.string().optional(),
          facilityAddress: z.string().optional(),
          facilityLatitude: z.string().optional(),
          facilityLongitude: z.string().optional(),
          facilityState: z
            .enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"])
            .optional(),
          description: z.string().optional(),
          website: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateBuyer(ctx.buyer.id, input);

        await createAuditLog({
          userId: ctx.user.id,
          action: "update_buyer",
          entityType: "buyer",
          entityId: ctx.buyer.id,
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // FINANCIAL INSTITUTIONS
  // ============================================================================

  financialInstitutions: router({
    register: protectedProcedure
      .input(
        z.object({
          // Institution Details
          institutionName: z.string().min(1),
          abn: z.string().length(11),
          institutionType: z.enum([
            "commercial_bank",
            "investment_bank",
            "private_equity",
            "venture_capital",
            "insurance",
            "superannuation",
            "government_agency",
            "development_finance",
            "other",
          ]),
          regulatoryBody: z.string().optional(),
          licenseNumber: z.string().optional(),

          // Authorized Representative
          contactName: z.string().min(1),
          contactTitle: z.string().optional(),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),

          // Verification
          verificationMethod: z
            .enum(["mygov_id", "document_upload", "manual_review"])
            .optional(),

          // Access Tier
          accessTier: z
            .enum(["basic", "professional", "enterprise"])
            .default("basic"),
          dataCategories: z.array(z.string()).optional(),

          // Compliance Declarations
          authorizedRepresentative: z.boolean(),
          dataProtection: z.boolean(),
          regulatoryCompliance: z.boolean(),
          termsAccepted: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate ABN
        if (!validateABN(input.abn)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid ABN",
          });
        }

        // Validate all declarations are accepted
        if (
          !input.authorizedRepresentative ||
          !input.dataProtection ||
          !input.regulatoryCompliance ||
          !input.termsAccepted
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "All compliance declarations must be accepted",
          });
        }

        // Check if ABN already exists
        const existing = await db.getFinancialInstitutionByABN(input.abn);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "ABN already registered",
          });
        }

        // Check if user already has a financial institution profile
        const existingInstitution = await db.getFinancialInstitutionByUserId(
          ctx.user.id
        );
        if (existingInstitution) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Financial institution profile already exists",
          });
        }

        // Create financial institution profile
        const institutionId = await db.createFinancialInstitution({
          userId: ctx.user.id,
          ...input,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "register_financial_institution",
          entityType: "financial_institution",
          entityId: institutionId,
        });

        return { institutionId, success: true };
      }),
  }),

  // ============================================================================
  // FEEDSTOCKS
  // ============================================================================

  feedstocks: router({
    create: supplierProcedure
      .input(
        z.object({
          category: z.enum([
            "oilseed",
            "UCO",
            "tallow",
            "lignocellulosic",
            "waste",
            "algae",
            "other",
          ]),
          type: z.string().min(1),
          sourceName: z.string().optional(),
          sourceAddress: z.string().optional(),
          latitude: z.string(),
          longitude: z.string(),
          state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
          region: z.string().optional(),
          productionMethod: z.enum([
            "crop",
            "waste",
            "residue",
            "processing_byproduct",
          ]),
          annualCapacityTonnes: z.number().int().positive(),
          availableVolumeCurrent: z.number().int().nonnegative(),
          carbonIntensityValue: z.number().int().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const abfiId = generateAbfiId(input.category, input.state);

        const feedstockId = await db.createFeedstock({
          abfiId,
          supplierId: ctx.supplier.id,
          ...input,
          status: "draft",
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_feedstock",
          entityType: "feedstock",
          entityId: feedstockId,
        });

        return { feedstockId, abfiId };
      }),

    update: supplierProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.string().min(1).optional(),
          sourceName: z.string().optional(),
          sourceAddress: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          region: z.string().optional(),
          annualCapacityTonnes: z.number().int().positive().optional(),
          availableVolumeCurrent: z.number().int().nonnegative().optional(),
          carbonIntensityValue: z.number().int().optional(),
          description: z.string().optional(),
          pricePerTonne: z.number().int().optional(),
          priceVisibility: z
            .enum(["public", "private", "on_request"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;

        // Verify ownership
        const feedstock = await db.getFeedstockById(id);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        await db.updateFeedstock(id, data);

        await createAuditLog({
          userId: ctx.user.id,
          action: "update_feedstock",
          entityType: "feedstock",
          entityId: id,
        });

        return { success: true };
      }),

    list: supplierProcedure.query(async ({ ctx }) => {
      return await db.getFeedstocksBySupplierId(ctx.supplier.id);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const feedstock = await db.getFeedstockById(input.id);
        if (!feedstock || feedstock.status !== "active") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feedstock not found",
          });
        }
        return feedstock;
      }),

    search: publicProcedure
      .input(
        z.object({
          category: z.array(z.string()).optional(),
          state: z.array(z.string()).optional(),
          minAbfiScore: z.number().optional(),
          maxCarbonIntensity: z.number().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.searchFeedstocks({
          ...input,
          status: "active",
        });
      }),

    calculateRating: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        // Get related data
        const certificates = await db.getCertificatesByFeedstockId(
          input.feedstockId
        );
        const qualityTests = await db.getQualityTestsByFeedstockId(
          input.feedstockId
        );
        const transactions = await db.getTransactionsBySupplierId(
          ctx.supplier.id
        );

        // Calculate scores
        const scores = calculateAbfiScore(
          feedstock,
          certificates,
          qualityTests,
          transactions
        );

        // Update feedstock with new scores
        await db.updateFeedstock(input.feedstockId, scores);

        // Generate improvement suggestions
        const improvements = generateRatingImprovements(
          scores,
          feedstock,
          certificates
        );

        return { scores, improvements };
      }),

    submitForReview: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        if (feedstock.status !== "draft") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only draft feedstocks can be submitted for review",
          });
        }

        await db.updateFeedstock(input.feedstockId, {
          status: "pending_review",
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "submit_feedstock_review",
          entityType: "feedstock",
          entityId: input.feedstockId,
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // CERTIFICATES
  // ============================================================================

  certificates: router({
    create: supplierProcedure
      .input(
        z.object({
          feedstockId: z.number(),
          type: z.enum([
            "ISCC_EU",
            "ISCC_PLUS",
            "RSB",
            "RED_II",
            "GO",
            "ABFI",
            "OTHER",
          ]),
          certificateNumber: z.string().optional(),
          issuedDate: z.date().optional(),
          expiryDate: z.date().optional(),
          documentUrl: z.string().optional(),
          documentKey: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        const certId = await db.createCertificate(input);

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_certificate",
          entityType: "certificate",
          entityId: certId,
        });

        return { certificateId: certId };
      }),

    list: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        return await db.getCertificatesByFeedstockId(input.feedstockId);
      }),

    // Generate ABFI Rating Certificate PDF
    generateABFICertificate: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { generateABFICertificate, calculateRatingGrade } =
          await import("./certificateGenerator");
        const { storagePut } = await import("./storage");

        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        // Check if feedstock has ABFI scores
        if (!feedstock.abfiScore) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Feedstock must have ABFI rating before generating certificate",
          });
        }

        // Get supplier details
        const supplier = await db.getSupplierById(feedstock.supplierId);
        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Supplier not found",
          });
        }

        // Get existing certificates for this feedstock
        const certificates = await db.getCertificatesByFeedstockId(
          input.feedstockId
        );
        const certifications = certificates
          .filter(c => c.status === "active" && c.type !== "ABFI")
          .map(c => c.type);

        // Calculate rating grade
        const ratingGrade = calculateRatingGrade(feedstock.abfiScore);

        // Generate certificate number
        const certificateNumber = `ABFI-${Date.now()}-${feedstock.id}`;
        const issueDate = new Date().toISOString().split("T")[0];
        const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]; // 1 year validity

        // Prepare certificate data
        const certificateData: any = {
          feedstockId: feedstock.id,
          feedstockName: feedstock.sourceName || "Unknown Feedstock",
          feedstockCategory: feedstock.category,
          supplierName: supplier.companyName,
          supplierABN: supplier.abn,
          location: `${supplier.city || "Unknown"}`,
          state: feedstock.state || "Unknown",

          abfiScore: feedstock.abfiScore,
          sustainabilityScore: feedstock.sustainabilityScore || 0,
          carbonIntensityScore: feedstock.carbonIntensityScore || 0,
          qualityScore: feedstock.qualityScore || 0,
          reliabilityScore: feedstock.reliabilityScore || 0,

          ratingGrade,
          certificateNumber,
          issueDate,
          validUntil,
          assessmentDate: issueDate,

          carbonIntensity: feedstock.carbonIntensityValue,
          annualVolume: feedstock.annualCapacityTonnes,
          certifications,
        };

        // Generate PDF
        const pdfBuffer = await generateABFICertificate(certificateData);

        // Upload to S3
        const pdfKey = `certificates/abfi/${feedstock.id}/${certificateNumber}.pdf`;
        const { url: pdfUrl } = await storagePut(
          pdfKey,
          pdfBuffer,
          "application/pdf"
        );

        // Create certificate record
        const certId = await db.createCertificate({
          feedstockId: input.feedstockId,
          type: "ABFI",
          certificateNumber,
          issuedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "active",
          documentUrl: pdfUrl,
          documentKey: pdfKey,
          ratingGrade,
          assessmentDate: new Date(),
          certificatePdfUrl: pdfUrl,
          certificatePdfKey: pdfKey,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "generate_abfi_certificate",
          entityType: "certificate",
          entityId: certId,
          changes: {
            after: {
              certificateNumber,
              ratingGrade,
              abfiScore: feedstock.abfiScore,
            },
          },
        });

        return {
          certificateId: certId,
          certificateNumber,
          pdfUrl,
          ratingGrade,
        };
      }),

    // Generate Biological Asset Data Pack (BADP)
    generateBADP: supplierProcedure
      .input(
        z.object({
          feedstockId: z.number(),
          preparedFor: z.string(), // Client/investor name
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { generateBADP } = await import("./badpGenerator");
        const { calculateRatingGrade } = await import("./certificateGenerator");
        const { storagePut } = await import("./storage");

        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        // Get supplier details
        const supplier = await db.getSupplierById(feedstock.supplierId);
        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Supplier not found",
          });
        }

        // Get related data
        const certificates = await db.getCertificatesByFeedstockId(
          input.feedstockId
        );
        const qualityTests = await db.getQualityTestsByFeedstockId(
          input.feedstockId
        );
        const transactions = await db.getTransactionsBySupplierId(
          ctx.supplier.id
        );

        // Generate BADP number
        const badpNumber = `BADP-${Date.now()}-${feedstock.id}`;
        const issueDate = new Date().toISOString().split("T")[0];
        const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        // Prepare BADP data
        const badpData: any = {
          assetId: feedstock.id,
          assetName: feedstock.sourceName || "Biological Asset",
          assetType: feedstock.category,
          location: {
            address: `${supplier.addressLine1 || ""}, ${supplier.city || ""}`,
            state: feedstock.state || supplier.state || "Unknown",
            latitude: supplier.latitude
              ? parseFloat(supplier.latitude)
              : undefined,
            longitude: supplier.longitude
              ? parseFloat(supplier.longitude)
              : undefined,
            landArea: undefined, // Would come from separate land registry
          },

          plantingDate: undefined, // Would come from asset management system
          maturityDate: undefined,
          harvestCycle: undefined,
          expectedLifespan: undefined,

          yieldData: {
            p50: [feedstock.annualCapacityTonnes], // Simplified - would pull from yieldEstimates table
            p75: [Math.floor(feedstock.annualCapacityTonnes * 0.85)],
            p90: [Math.floor(feedstock.annualCapacityTonnes * 0.7)],
            methodology: "Historical yield data and agronomic modeling",
            historicalValidation:
              transactions.length > 0
                ? `Based on ${transactions.length} historical transactions`
                : undefined,
          },

          carbonProfile: {
            intensityGco2eMj: feedstock.carbonIntensityValue || 0,
            certificationStatus: certificates
              .filter(c => c.status === "active")
              .map(c => c.type),
            projectionMethodology:
              feedstock.carbonIntensityMethod || "LCA methodology per RED II",
            sequestrationRate: undefined, // Would be calculated from LCA
          },

          offtakeContracts: [], // Would pull from supplyAgreements table

          supplierProfile: {
            name: supplier.companyName,
            abn: supplier.abn,
            operatingHistory: `Registered since ${supplier.createdAt.getFullYear()}`,
            financialStrength:
              supplier.verificationStatus === "verified"
                ? "Verified"
                : "Pending verification",
          },

          riskAssessment: {
            concentrationRisk: "Low - diversified supply base",
            geographicRisk: [`Located in ${feedstock.state || "Australia"}`],
            climateRisk: "Moderate - subject to seasonal weather variations",
            operationalRisk: "Low - established production methods",
          },

          stressScenarios: [
            {
              scenario: "Drought (1 in 10 year event)",
              impact: "30% yield reduction",
              mitigationStrategy:
                "Diversified geographic sourcing, insurance coverage",
            },
            {
              scenario: "Logistics disruption",
              impact: "Delivery delays up to 2 weeks",
              mitigationStrategy:
                "Multiple transport providers, buffer inventory",
            },
          ],

          abfiRating: {
            score: feedstock.abfiScore || 0,
            grade: feedstock.abfiScore
              ? calculateRatingGrade(feedstock.abfiScore)
              : "N/A",
            sustainabilityScore: feedstock.sustainabilityScore || 0,
            carbonScore: feedstock.carbonIntensityScore || 0,
            qualityScore: feedstock.qualityScore || 0,
            reliabilityScore: feedstock.reliabilityScore || 0,
          },

          badpNumber,
          issueDate,
          validUntil,
          preparedFor: input.preparedFor,
        };

        // Generate PDF
        const pdfBuffer = await generateBADP(badpData);

        // Upload to S3
        const pdfKey = `badp/${feedstock.id}/${badpNumber}.pdf`;
        const { url: pdfUrl } = await storagePut(
          pdfKey,
          pdfBuffer,
          "application/pdf"
        );

        await createAuditLog({
          userId: ctx.user.id,
          action: "generate_badp",
          entityType: "feedstock",
          entityId: feedstock.id,
          changes: { after: { badpNumber, preparedFor: input.preparedFor } },
        });

        return {
          badpNumber,
          pdfUrl,
          issueDate,
          validUntil,
        };
      }),
  }),

  // ============================================================================
  // QUALITY TESTS
  // ============================================================================

  qualityTests: router({
    create: supplierProcedure
      .input(
        z.object({
          feedstockId: z.number(),
          testDate: z.date(),
          laboratory: z.string().optional(),
          parameters: z.any(),
          overallPass: z.boolean().optional(),
          reportUrl: z.string().optional(),
          reportKey: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        const testId = await db.createQualityTest(input);

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_quality_test",
          entityType: "quality_test",
          entityId: testId,
        });

        return { testId };
      }),

    list: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        return await db.getQualityTestsByFeedstockId(input.feedstockId);
      }),
  }),

  // ============================================================================
  // INQUIRIES
  // ============================================================================

  inquiries: router({
    create: buyerProcedure
      .input(
        z.object({
          supplierId: z.number(),
          feedstockId: z.number().optional(),
          subject: z.string().min(1),
          message: z.string().min(1),
          volumeRequired: z.number().int().optional(),
          deliveryLocation: z.string().optional(),
          deliveryTimeframeStart: z.date().optional(),
          deliveryTimeframeEnd: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const inquiryId = await db.createInquiry({
          buyerId: ctx.buyer.id,
          ...input,
        });

        // Create notification for supplier
        const supplier = await db.getSupplierById(input.supplierId);
        if (supplier) {
          await db.createNotification({
            userId: supplier.userId,
            type: "inquiry_received",
            title: "New Inquiry Received",
            message: `You have received a new inquiry: ${input.subject}`,
            relatedEntityType: "inquiry",
            relatedEntityId: inquiryId,
          });
        }

        return { inquiryId };
      }),

    respond: supplierProcedure
      .input(
        z.object({
          inquiryId: z.number(),
          response: z.string().min(1),
          pricePerTonne: z.number().optional(),
          availableVolume: z.number().optional(),
          deliveryTimeframe: z.string().optional(),
          deliveryTerms: z.string().optional(),
          minimumOrder: z.number().optional(),
          status: z.enum(["responded", "closed"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const inquiry = await db.getInquiriesBySupplierId(ctx.supplier.id);
        const targetInquiry = inquiry.find(i => i.id === input.inquiryId);

        if (!targetInquiry) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        // Build response details object
        const responseDetails: any = {};
        if (input.pricePerTonne)
          responseDetails.pricePerTonne = input.pricePerTonne;
        if (input.availableVolume)
          responseDetails.availableVolume = input.availableVolume;
        if (input.deliveryTimeframe)
          responseDetails.deliveryTimeframe = input.deliveryTimeframe;
        if (input.deliveryTerms)
          responseDetails.deliveryTerms = input.deliveryTerms;
        if (input.minimumOrder)
          responseDetails.minimumOrder = input.minimumOrder;

        await db.updateInquiry(input.inquiryId, {
          responseMessage: input.response,
          responseDetails:
            Object.keys(responseDetails).length > 0
              ? responseDetails
              : undefined,
          respondedAt: new Date(),
          status: input.status || "responded",
        });

        // Create notification for buyer
        const buyer = await db.getBuyerById(targetInquiry.buyerId);
        if (buyer) {
          await db.createNotification({
            userId: buyer.userId,
            type: "inquiry_response",
            title: "Inquiry Response Received",
            message: `A supplier has responded to your inquiry`,
            relatedEntityType: "inquiry",
            relatedEntityId: input.inquiryId,
          });
        }

        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInquiryById(input.id);
      }),

    listForBuyer: buyerProcedure.query(async ({ ctx }) => {
      return await db.getInquiriesByBuyerId(ctx.buyer.id);
    }),

    listForSupplier: supplierProcedure.query(async ({ ctx }) => {
      return await db.getInquiriesBySupplierId(ctx.supplier.id);
    }),
  }),

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getNotificationsByUserId(ctx.user.id, input.unreadOnly);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============================================================================
  // SAVED SEARCHES
  // ============================================================================

  savedSearches: router({
    create: buyerProcedure
      .input(
        z.object({
          name: z.string().min(1),
          criteria: z.any(),
          notifyOnNewMatches: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const searchId = await db.createSavedSearch({
          buyerId: ctx.buyer.id,
          ...input,
        });
        return { searchId };
      }),

    list: buyerProcedure.query(async ({ ctx }) => {
      return await db.getSavedSearchesByBuyerId(ctx.buyer.id);
    }),

    delete: buyerProcedure
      .input(z.object({ searchId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSavedSearch(input.searchId);
        return { success: true };
      }),
  }),

  // ============================================================================
  // ADMIN
  // ============================================================================

  admin: router({
    getPlatformStats: adminProcedure.query(async () => {
      return await db.getPlatformStats();
    }),

    getPendingSuppliers: adminProcedure.query(async () => {
      return await db.getAllSuppliers({ verificationStatus: "pending" });
    }),

    verifySupplier: adminProcedure
      .input(
        z.object({
          supplierId: z.number(),
          approved: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateSupplier(input.supplierId, {
          verificationStatus: input.approved ? "verified" : "suspended",
        });

        const supplier = await db.getSupplierById(input.supplierId);
        if (supplier) {
          await db.createNotification({
            userId: supplier.userId,
            type: "verification_update",
            title: input.approved
              ? "Supplier Verified"
              : "Verification Declined",
            message: input.approved
              ? "Your supplier profile has been verified"
              : "Your supplier verification was declined",
          });
        }

        await createAuditLog({
          userId: ctx.user.id,
          action: "verify_supplier",
          entityType: "supplier",
          entityId: input.supplierId,
          changes: { after: { approved: input.approved } } as any,
        });

        return { success: true };
      }),

    getPendingFeedstocks: adminProcedure.query(async () => {
      return await db.searchFeedstocks({ status: "pending_review" });
    }),

    verifyFeedstock: adminProcedure
      .input(
        z.object({
          feedstockId: z.number(),
          approved: z.boolean(),
          verificationLevel: z
            .enum([
              "self_declared",
              "document_verified",
              "third_party_audited",
              "abfi_certified",
            ])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateFeedstock(input.feedstockId, {
          status: input.approved ? "active" : "suspended",
          verificationLevel: input.verificationLevel,
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
        });

        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (feedstock) {
          const supplier = await db.getSupplierById(feedstock.supplierId);
          if (supplier) {
            await db.createNotification({
              userId: supplier.userId,
              type: "verification_update",
              title: input.approved
                ? "Feedstock Verified"
                : "Feedstock Verification Declined",
              message: input.approved
                ? `Your feedstock ${feedstock.abfiId} has been verified`
                : `Your feedstock ${feedstock.abfiId} verification was declined`,
            });
          }
        }

        await createAuditLog({
          userId: ctx.user.id,
          action: "verify_feedstock",
          entityType: "feedstock",
          entityId: input.feedstockId,
          changes: { after: { approved: input.approved } } as any,
        });

        return { success: true };
      }),

    getAuditLogs: adminProcedure
      .input(
        z.object({
          entityType: z.string().optional(),
          entityId: z.number().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getAuditLogs(input);
      }),

    // User Management
    listUsers: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    updateUserRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["admin", "supplier", "buyer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Prevent changing own role
        if (input.userId === ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot change your own role",
          });
        }

        await db.updateUser(input.userId, { role: input.role });

        await createAuditLog({
          userId: ctx.user.id,
          action: "update_user_role",
          entityType: "user",
          entityId: input.userId,
          changes: { after: { role: input.role } } as any,
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // BANKABILITY MODULE
  // ============================================================================

  bankability: router({
    // Projects
    createProject: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          facilityLocation: z.string().optional(),
          state: z
            .enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"])
            .optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          nameplateCapacity: z.number(),
          feedstockType: z.string().optional(),
          targetCOD: z.date().optional(),
          financialCloseTarget: z.date().optional(),
          debtTenor: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          userId: ctx.user.id,
          ...input,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_project",
          entityType: "project",
          entityId: projectId,
        });

        return { projectId };
      }),

    // Project Registration Flow (7 steps)
    registerProject: protectedProcedure
      .input(
        z.object({
          // Step 1: Project Overview
          projectName: z.string(),
          developerName: z.string().optional(),
          abn: z.string().optional(),
          website: z.string().optional(),
          region: z.string().optional(),
          siteAddress: z.string().optional(),
          developmentStage: z
            .enum([
              "concept",
              "prefeasibility",
              "feasibility",
              "fid",
              "construction",
              "operational",
            ])
            .optional(),

          // Step 2: Technology Details
          conversionTechnology: z.string().optional(),
          technologyProvider: z.string().optional(),
          primaryOutput: z.string().optional(),
          secondaryOutputs: z.string().optional(),
          nameplateCapacity: z.string().optional(),
          outputCapacity: z.string().optional(),
          outputUnit: z.string().optional(),

          // Step 3: Feedstock Requirements
          feedstockType: z.string().optional(),
          secondaryFeedstocks: z.string().optional(),
          annualFeedstockVolume: z.string().optional(),
          feedstockQualitySpecs: z.string().optional(),
          supplyRadius: z.string().optional(),
          logisticsRequirements: z.string().optional(),

          // Step 4: Funding Status
          totalCapex: z.string().optional(),
          fundingSecured: z.string().optional(),
          fundingSources: z.string().optional(),
          investmentStage: z
            .enum([
              "seed",
              "series_a",
              "series_b",
              "pre_fid",
              "post_fid",
              "operational",
            ])
            .optional(),
          seekingInvestment: z.boolean().optional(),
          investmentAmount: z.string().optional(),

          // Step 5: Approvals & Permits
          environmentalApproval: z.boolean().optional(),
          planningPermit: z.boolean().optional(),
          epaLicense: z.boolean().optional(),
          otherApprovals: z.string().optional(),
          approvalsNotes: z.string().optional(),

          // Step 6: Verification
          verificationDocuments: z.array(z.string()).optional(),
          verificationNotes: z.string().optional(),

          // Step 7: Opportunities
          feedstockMatchingEnabled: z.boolean().optional(),
          financingInterest: z.boolean().optional(),
          partnershipInterest: z.boolean().optional(),
          publicVisibility: z
            .enum(["private", "investors_only", "suppliers_only", "public"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Convert string numbers to integers where needed
        const projectData: any = {
          userId: ctx.user.id,
          name: input.projectName,
          developerName: input.developerName,
          abn: input.abn,
          website: input.website,
          region: input.region,
          siteAddress: input.siteAddress,
          developmentStage: input.developmentStage,
          conversionTechnology: input.conversionTechnology,
          technologyProvider: input.technologyProvider,
          primaryOutput: input.primaryOutput,
          secondaryOutputs: input.secondaryOutputs,
          nameplateCapacity: input.nameplateCapacity
            ? parseInt(input.nameplateCapacity)
            : null,
          outputCapacity: input.outputCapacity
            ? parseInt(input.outputCapacity)
            : null,
          outputUnit: input.outputUnit,
          feedstockType: input.feedstockType,
          secondaryFeedstocks: input.secondaryFeedstocks,
          annualFeedstockVolume: input.annualFeedstockVolume
            ? parseInt(input.annualFeedstockVolume)
            : null,
          feedstockQualitySpecs: input.feedstockQualitySpecs,
          supplyRadius: input.supplyRadius
            ? parseInt(input.supplyRadius)
            : null,
          logisticsRequirements: input.logisticsRequirements,
          totalCapex: input.totalCapex ? parseInt(input.totalCapex) : null,
          fundingSecured: input.fundingSecured
            ? parseInt(input.fundingSecured)
            : null,
          fundingSources: input.fundingSources,
          investmentStage: input.investmentStage,
          seekingInvestment: input.seekingInvestment,
          investmentAmount: input.investmentAmount
            ? parseInt(input.investmentAmount)
            : null,
          environmentalApproval: input.environmentalApproval,
          planningPermit: input.planningPermit,
          epaLicense: input.epaLicense,
          otherApprovals: input.otherApprovals,
          approvalsNotes: input.approvalsNotes,
          verificationDocuments: input.verificationDocuments,
          verificationNotes: input.verificationNotes,
          feedstockMatchingEnabled: input.feedstockMatchingEnabled,
          financingInterest: input.financingInterest,
          partnershipInterest: input.partnershipInterest,
          publicVisibility: input.publicVisibility,
          registrationComplete: true,
          status: "submitted",
        };

        const projectId = await db.createProject(projectData);

        await createAuditLog({
          userId: ctx.user.id,
          action: "register_project",
          entityType: "project",
          entityId: projectId,
        });

        return { projectId };
      }),

    getMyProjects: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProjectsByUserId(ctx.user.id);
    }),

    listProjects: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProjectsByUserId(ctx.user.id);
    }),

    getProjectById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return project;
      }),

    updateProject: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          status: z
            .enum([
              "planning",
              "development",
              "financing",
              "construction",
              "operational",
              "suspended",
            ])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const project = await db.getProjectById(id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await db.updateProject(id, updates);

        await createAuditLog({
          userId: ctx.user.id,
          action: "update_project",
          entityType: "project",
          entityId: id,
        });

        return { success: true };
      }),

    // Supply Agreements
    createAgreement: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          supplierId: z.number(),
          tier: z.enum(["tier1", "tier2", "option", "rofr"]),
          annualVolume: z.number(),
          termYears: z.number(),
          startDate: z.date(),
          endDate: z.date(),
          pricingMechanism: z.enum([
            "fixed",
            "fixed_with_escalation",
            "index_linked",
            "index_with_floor_ceiling",
            "spot_reference",
          ]),
          takeOrPayPercentage: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const agreementId = await db.createSupplyAgreement(input);

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_agreement",
          entityType: "supply_agreement",
          entityId: agreementId,
        });

        return { agreementId };
      }),

    getProjectAgreements: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getSupplyAgreementsByProjectId(input.projectId);
      }),

    // Grower Qualifications
    createQualification: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          level: z.enum(["GQ1", "GQ2", "GQ3", "GQ4"]),
          levelName: z.string().optional(),
          compositeScore: z.number(),
          assessmentDate: z.date().optional(),
          validFrom: z.date(),
          validUntil: z.date(),
          operatingHistoryScore: z.number().optional(),
          financialStrengthScore: z.number().optional(),
          landTenureScore: z.number().optional(),
          productionCapacityScore: z.number().optional(),
          creditScore: z.number().optional(),
          insuranceScore: z.number().optional(),
          assessmentNotes: z.string().optional(),
          status: z
            .enum(["pending", "approved", "expired", "revoked"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const qualificationData = {
          ...input,
          assessedBy: ctx.user.id,
          assessmentDate: input.assessmentDate || new Date(),
        };
        const qualificationId =
          await db.createGrowerQualification(qualificationData);

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_qualification",
          entityType: "grower_qualification",
          entityId: qualificationId,
        });

        return { qualificationId };
      }),

    createGrowerQualification: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          level: z.enum(["GQ1", "GQ2", "GQ3", "GQ4"]),
          levelName: z.string().optional(),
          compositeScore: z.number(),
          assessmentDate: z.date().optional(),
          validFrom: z.date(),
          validUntil: z.date(),
          operatingHistoryScore: z.number().optional(),
          financialStrengthScore: z.number().optional(),
          landTenureScore: z.number().optional(),
          productionCapacityScore: z.number().optional(),
          creditScore: z.number().optional(),
          insuranceScore: z.number().optional(),
          assessmentNotes: z.string().optional(),
          status: z
            .enum(["pending", "approved", "expired", "revoked"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const qualificationData = {
          ...input,
          assessedBy: ctx.user.id,
          assessmentDate: input.assessmentDate || new Date(),
        };
        const qualificationId =
          await db.createGrowerQualification(qualificationData);

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_qualification",
          entityType: "grower_qualification",
          entityId: qualificationId,
        });

        return { qualificationId };
      }),

    getSupplierQualifications: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return await db.getGrowerQualificationsBySupplierId(input.supplierId);
      }),

    // Bankability Assessments
    createAssessment: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          assessmentNumber: z.string(),
          assessmentDate: z.date(),
          volumeSecurityScore: z.number(),
          counterpartyQualityScore: z.number(),
          contractStructureScore: z.number(),
          concentrationRiskScore: z.number(),
          operationalReadinessScore: z.number(),
          compositeScore: z.number(),
          rating: z.enum(["AAA", "AA", "A", "BBB", "BB", "B", "CCC"]),
          ratingDescription: z.string().optional(),
          tier1Volume: z.number().optional(),
          tier1Percent: z.number().optional(),
          tier2Volume: z.number().optional(),
          tier2Percent: z.number().optional(),
          optionsVolume: z.number().optional(),
          optionsPercent: z.number().optional(),
          rofrVolume: z.number().optional(),
          rofrPercent: z.number().optional(),
          totalAgreements: z.number().optional(),
          strengths: z.array(z.string()).optional(),
          monitoringItems: z.array(z.string()).optional(),
          status: z
            .enum([
              "draft",
              "submitted",
              "under_review",
              "approved",
              "rejected",
            ])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const assessmentData = {
          ...input,
          assessedBy: ctx.user.id,
        };
        const assessmentId =
          await db.createBankabilityAssessment(assessmentData);

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_assessment",
          entityType: "bankability_assessment",
          entityId: assessmentId,
        });

        return { assessmentId };
      }),

    getProjectAssessments: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getBankabilityAssessmentsByProjectId(input.projectId);
      }),

    getLatestAssessment: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getLatestBankabilityAssessment(input.projectId);
      }),

    // Admin Assessor Workflow
    listAssessments: protectedProcedure.query(async ({ ctx }) => {
      // Only admins can list all assessments
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getAllBankabilityAssessments();
    }),

    approveAssessment: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          approverNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Only admins can approve assessments
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.updateBankabilityAssessment(input.assessmentId, {
          status: "approved",
          // Note: approvalDate, approvedBy, approverNotes fields don't exist in schema
          // Using assessmentNotes for approval notes
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "approve_assessment",
          entityType: "bankability_assessment",
          entityId: input.assessmentId,
          changes: { after: { status: "approved", approvedBy: ctx.user.id } },
        });

        return { success: true };
      }),

    rejectAssessment: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          rejectionReason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Only admins can reject assessments
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.updateBankabilityAssessment(input.assessmentId, {
          status: "rejected",
          reassessmentReason: input.rejectionReason,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "reject_assessment",
          entityType: "bankability_assessment",
          entityId: input.assessmentId,
          changes: { after: { status: "rejected", rejectedBy: ctx.user.id } },
        });

        return { success: true };
      }),

    adjustAssessmentScore: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          adjustedScores: z.record(z.string(), z.number()),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Only admins can adjust scores
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const assessment = await db.getBankabilityAssessmentById(
          input.assessmentId
        );
        if (!assessment) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Apply score adjustments
        const updates: any = {};
        if (input.adjustedScores.volumeSecurity !== undefined) {
          updates.volumeSecurityScore = input.adjustedScores.volumeSecurity;
        }
        if (input.adjustedScores.counterpartyQuality !== undefined) {
          updates.counterpartyQualityScore =
            input.adjustedScores.counterpartyQuality;
        }
        if (input.adjustedScores.contractStructure !== undefined) {
          updates.contractStructureScore =
            input.adjustedScores.contractStructure;
        }
        if (input.adjustedScores.concentrationRisk !== undefined) {
          updates.concentrationRiskScore =
            input.adjustedScores.concentrationRisk;
        }
        if (input.adjustedScores.operationalReadiness !== undefined) {
          updates.operationalReadinessScore =
            input.adjustedScores.operationalReadiness;
        }

        // Recalculate composite score with adjusted values
        const scores = {
          volumeSecurity:
            updates.volumeSecurityScore || assessment.volumeSecurityScore,
          counterpartyQuality:
            updates.counterpartyQualityScore ||
            assessment.counterpartyQualityScore,
          contractStructure:
            updates.contractStructureScore || assessment.contractStructureScore,
          concentrationRisk:
            updates.concentrationRiskScore || assessment.concentrationRiskScore,
          operationalReadiness:
            updates.operationalReadinessScore ||
            assessment.operationalReadinessScore,
        };

        const compositeScore = Math.round(
          scores.volumeSecurity * 0.3 +
            scores.counterpartyQuality * 0.25 +
            scores.contractStructure * 0.2 +
            scores.concentrationRisk * 0.15 +
            scores.operationalReadiness * 0.1
        );

        updates.compositeScore = compositeScore;
        updates.reassessmentReason = input.reason;

        await db.updateBankabilityAssessment(input.assessmentId, updates);

        await createAuditLog({
          userId: ctx.user.id,
          action: "adjust_assessment_scores",
          entityType: "bankability_assessment",
          entityId: input.assessmentId,
          changes: {
            before: {
              volumeSecurityScore: assessment.volumeSecurityScore,
              counterpartyQualityScore: assessment.counterpartyQualityScore,
              contractStructureScore: assessment.contractStructureScore,
              concentrationRiskScore: assessment.concentrationRiskScore,
              operationalReadinessScore: assessment.operationalReadinessScore,
              compositeScore: assessment.compositeScore,
            },
            after: updates,
          },
        });

        return { success: true, newCompositeScore: compositeScore };
      }),

    // Lender Access
    grantLenderAccess: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          lenderName: z.string(),
          lenderEmail: z.string(),
          lenderContact: z.string().optional(),
          validFrom: z.date(),
          validUntil: z.date(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const accessToken = Math.random().toString(36).substring(2, 15);

        const accessId = await db.createLenderAccess({
          ...input,
          accessToken,
          grantedBy: ctx.user.id,
        });

        return { accessId, accessToken };
      }),

    getProjectLenderAccess: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getLenderAccessByProjectId(input.projectId);
      }),

    // Get projects that the current user has lender access to (by email)
    getMyLenderProjects: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required",
        });
      }
      // Get projects the current user has lender access to
      const lenderProjects = await db.getProjectsForLender(ctx.user.email);
      return lenderProjects;
    }),

    // Get lender access records for the current user
    getMyLenderAccess: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required",
        });
      }
      return await db.getLenderAccessByEmail(ctx.user.email);
    }),

    // Download Certificate
    downloadCertificate: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const assessment = await db.getBankabilityAssessmentById(
          input.assessmentId
        );
        if (!assessment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assessment not found",
          });
        }

        // Only allow download for approved assessments
        if (assessment.status !== "approved") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Certificate can only be downloaded for approved assessments",
          });
        }

        const project = await db.getProjectById(assessment.projectId);
        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Check permissions: owner or admin
        if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { generateBankabilityCertificate, getBankabilityRating } =
          await import("./bankabilityCertificate");

        const certificateData = {
          assessmentId: assessment.id,
          projectName: project.name,
          projectLocation:
            project.facilityLocation ||
            project.siteAddress ||
            project.region ||
            "Australia",
          feedstockType: project.feedstockType || "Mixed Feedstock",
          annualVolume: project.annualFeedstockVolume || 0,
          compositeScore: assessment.compositeScore,
          rating: getBankabilityRating(assessment.compositeScore),
          volumeSecurityScore: assessment.volumeSecurityScore,
          counterpartyQualityScore: assessment.counterpartyQualityScore,
          contractStructureScore: assessment.contractStructureScore,
          concentrationRiskScore: assessment.concentrationRiskScore,
          operationalReadinessScore: assessment.operationalReadinessScore,
          assessmentDate: assessment.createdAt,
          approvedBy: assessment.assessedBy
            ? String(assessment.assessedBy)
            : undefined,
          approvedDate: assessment.updatedAt,
        };

        const pdfBuffer = await generateBankabilityCertificate(certificateData);

        // Convert buffer to base64 for transmission
        const base64Pdf = pdfBuffer.toString("base64");

        return {
          filename: `ABFI-Bankability-Certificate-${project.name.replace(/\s+/g, "-")}-${assessment.id}.pdf`,
          data: base64Pdf,
          mimeType: "application/pdf",
        };
      }),
  }),

  // Evidence Chain & Data Provenance
  evidence: router({
    // Upload evidence with automatic hashing
    upload: protectedProcedure
      .input(
        z.object({
          type: z.enum([
            "lab_test",
            "audit_report",
            "registry_cert",
            "contract",
            "insurance_policy",
            "financial_statement",
            "land_title",
            "sustainability_cert",
            "quality_test",
            "delivery_record",
            "other",
          ]),
          fileUrl: z.string(),
          fileHash: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          originalFilename: z.string(),
          issuerType: z.enum([
            "lab",
            "auditor",
            "registry",
            "counterparty",
            "supplier",
            "government",
            "certification_body",
            "self_declared",
          ]),
          issuerName: z.string(),
          issuerCredentials: z.string().optional(),
          issuedDate: z.date(),
          expiryDate: z.date().optional(),
          metadata: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const evidenceId = await db.createEvidence({
          ...input,
          uploadedBy: ctx.user.id,
          status: "valid",
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "upload_evidence",
          entityType: "evidence",
          entityId: evidenceId,
          changes: { after: input },
        });

        return { evidenceId };
      }),

    // Get evidence by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEvidenceById(input.id);
      }),

    // Get evidence by entity
    getByEntity: protectedProcedure
      .input(
        z.object({
          entityType: z.enum([
            "feedstock",
            "supplier",
            "certificate",
            "abfi_score",
            "bankability_assessment",
            "grower_qualification",
            "supply_agreement",
            "project",
          ]),
          entityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await db.getEvidenceLinkagesByEntity(
          input.entityType,
          input.entityId
        );
      }),

    // Get expiring evidence
    getExpiring: protectedProcedure
      .input(z.object({ daysAhead: z.number().default(30) }))
      .query(async ({ input }) => {
        return await db.getExpiringEvidence(input.daysAhead);
      }),

    // Link evidence to entity
    linkToEntity: protectedProcedure
      .input(
        z.object({
          evidenceId: z.number(),
          linkedEntityType: z.enum([
            "feedstock",
            "supplier",
            "certificate",
            "abfi_score",
            "bankability_assessment",
            "grower_qualification",
            "supply_agreement",
            "project",
          ]),
          linkedEntityId: z.number(),
          linkageType: z
            .enum([
              "supports",
              "validates",
              "contradicts",
              "supersedes",
              "references",
            ])
            .default("supports"),
          weightInCalculation: z.number().optional(),
          linkageNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const linkageId = await db.createEvidenceLinkage({
          ...input,
          linkedBy: ctx.user.id,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "link_evidence",
          entityType: "evidence_linkage",
          entityId: linkageId,
          changes: { after: input },
        });

        return { linkageId };
      }),

    // Supersede evidence
    supersede: protectedProcedure
      .input(
        z.object({
          oldEvidenceId: z.number(),
          newEvidenceId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.supersedeEvidence(
          input.oldEvidenceId,
          input.newEvidenceId,
          input.reason
        );

        await createAuditLog({
          userId: ctx.user.id,
          action: "supersede_evidence",
          entityType: "evidence",
          entityId: input.oldEvidenceId,
          changes: {
            before: { status: "valid" },
            after: {
              status: "superseded",
              supersededById: input.newEvidenceId,
            },
          },
        });

        return { success: true };
      }),

    // Verify evidence
    verify: protectedProcedure
      .input(z.object({ evidenceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admins or auditors can verify evidence
        if (ctx.user.role !== "admin" && ctx.user.role !== "auditor") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.updateEvidence(input.evidenceId, {
          verifiedBy: ctx.user.id,
          verifiedAt: new Date(),
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "verify_evidence",
          entityType: "evidence",
          entityId: input.evidenceId,
          changes: { after: { verifiedBy: ctx.user.id } },
        });

        return { success: true };
      }),

    // Create certificate snapshot
    createSnapshot: protectedProcedure
      .input(
        z.object({
          certificateId: z.number(),
          frozenScoreData: z.record(z.string(), z.any()),
          frozenEvidenceSet: z.array(
            z.object({
              evidenceId: z.number(),
              fileHash: z.string(),
              type: z.string(),
              issuedDate: z.string(),
              issuerName: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Calculate snapshot hash
        const { generateSnapshotHash } = await import("./evidence.js");
        const snapshotHash = generateSnapshotHash(
          input.frozenScoreData,
          input.frozenEvidenceSet
        );

        const snapshotId = await db.createCertificateSnapshot({
          certificateId: input.certificateId,
          snapshotHash,
          frozenScoreData: input.frozenScoreData,
          frozenEvidenceSet: input.frozenEvidenceSet,
          createdBy: ctx.user.id,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "create_certificate_snapshot",
          entityType: "certificate_snapshot",
          entityId: snapshotId,
          changes: {
            after: { certificateId: input.certificateId, snapshotHash },
          },
        });

        return { snapshotId, snapshotHash };
      }),

    // Get certificate snapshots
    getSnapshotsByCertificate: protectedProcedure
      .input(z.object({ certificateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCertificateSnapshotsByCertificate(
          input.certificateId
        );
      }),
  }),

  // Temporal Versioning & Validity
  temporal: router({
    // Get entity as of specific date
    getAsOfDate: protectedProcedure
      .input(
        z.object({
          entityType: z.enum([
            "feedstock",
            "certificate",
            "supply_agreement",
            "bankability_assessment",
          ]),
          entityId: z.number(),
          asOfDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        const { getEntityAsOfDate } = await import("./temporal.js");
        return await getEntityAsOfDate(
          input.entityType,
          input.entityId,
          input.asOfDate
        );
      }),

    // Get current version
    getCurrent: protectedProcedure
      .input(
        z.object({
          entityType: z.enum([
            "feedstock",
            "certificate",
            "supply_agreement",
            "bankability_assessment",
          ]),
          entityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getCurrentVersion } = await import("./temporal.js");
        return await getCurrentVersion(input.entityType, input.entityId);
      }),

    // Get version history
    getHistory: protectedProcedure
      .input(
        z.object({
          entityType: z.enum([
            "feedstock",
            "certificate",
            "supply_agreement",
            "bankability_assessment",
          ]),
          entityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getEntityHistory } = await import("./temporal.js");
        return await getEntityHistory(input.entityType, input.entityId);
      }),

    // Get version timeline
    getTimeline: protectedProcedure
      .input(
        z.object({
          entityType: z.enum([
            "feedstock",
            "certificate",
            "supply_agreement",
            "bankability_assessment",
          ]),
          entityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getVersionTimeline } = await import("./temporal.js");
        return await getVersionTimeline(input.entityType, input.entityId);
      }),

    // Compare two versions
    compareVersions: protectedProcedure
      .input(
        z.object({
          entityType: z.enum([
            "feedstock",
            "certificate",
            "supply_agreement",
            "bankability_assessment",
          ]),
          oldVersionId: z.number(),
          newVersionId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getCurrentVersion, compareVersions } =
          await import("./temporal.js");

        const oldVersion = await getCurrentVersion(
          input.entityType,
          input.oldVersionId
        );
        const newVersion = await getCurrentVersion(
          input.entityType,
          input.newVersionId
        );

        if (!oldVersion || !newVersion) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Version not found",
          });
        }

        return compareVersions(oldVersion, newVersion);
      }),
  }),

  // Physical Reality & Supply Risk (Phase 3)
  physicalReality: router({
    // Delivery Events
    recordDelivery: protectedProcedure
      .input(
        z.object({
          agreementId: z.number(),
          scheduledDate: z.date(),
          actualDate: z.date().optional(),
          committedVolume: z.number(),
          actualVolume: z.number().optional(),
          onTime: z.boolean().optional(),
          qualityMet: z.boolean().optional(),
          status: z.enum([
            "scheduled",
            "in_transit",
            "delivered",
            "partial",
            "cancelled",
            "failed",
          ]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const variancePercent =
          input.actualVolume && input.committedVolume
            ? Math.round(
                ((input.actualVolume - input.committedVolume) /
                  input.committedVolume) *
                  100
              )
            : null;

        return await db.createDeliveryEvent({
          ...input,
          variancePercent,
          varianceReason: null,
          qualityTestId: null,
        });
      }),

    getDeliveryHistory: protectedProcedure
      .input(z.object({ agreementId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryEventsByAgreement(input.agreementId);
      }),

    getDeliveryPerformance: protectedProcedure
      .input(z.object({ agreementId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryPerformanceMetrics(input.agreementId);
      }),

    // Seasonality
    addSeasonality: protectedProcedure
      .input(
        z.object({
          feedstockId: z.number(),
          month: z.number().min(1).max(12),
          availabilityPercent: z.number().min(0).max(100),
          isPeakSeason: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createSeasonalityProfile({
          ...input,
          harvestWindowStart: null,
          harvestWindowEnd: null,
          historicalYield: null,
        });
      }),

    getSeasonality: protectedProcedure
      .input(z.object({ feedstockId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSeasonalityByFeedstock(input.feedstockId);
      }),

    // Climate Exposure
    addClimateRisk: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          feedstockId: z.number().optional(),
          exposureType: z.enum([
            "drought",
            "flood",
            "bushfire",
            "frost",
            "heatwave",
            "cyclone",
            "pest_outbreak",
          ]),
          riskLevel: z.enum(["low", "medium", "high", "extreme"]),
          probabilityPercent: z.number().min(0).max(100).optional(),
          impactSeverity: z
            .enum(["minor", "moderate", "major", "catastrophic"])
            .optional(),
          mitigationMeasures: z.string().optional(),
          insuranceCoverage: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createClimateExposure({
          ...input,
          assessedDate: new Date(),
          assessedBy: ctx.user.id,
          nextReviewDate: null,
          lastEventDate: null,
          lastEventImpact: null,
          insuranceValue: null,
        });
      }),

    getSupplierClimateRisks: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return await db.getClimateExposureBySupplier(input.supplierId);
      }),

    getFeedstockClimateRisks: protectedProcedure
      .input(z.object({ feedstockId: z.number() }))
      .query(async ({ input }) => {
        return await db.getClimateExposureByFeedstock(input.feedstockId);
      }),

    // Yield Estimates
    addYieldEstimate: protectedProcedure
      .input(
        z.object({
          feedstockId: z.number(),
          year: z.number(),
          season: z
            .enum(["summer", "autumn", "winter", "spring", "annual"])
            .optional(),
          p50Yield: z.number(),
          p75Yield: z.number().optional(),
          p90Yield: z.number().optional(),
          confidenceLevel: z.enum(["low", "medium", "high"]),
          methodology: z.string().optional(),
          weatherDependencyScore: z.number().min(1).max(10).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createYieldEstimate({
          ...input,
          estimatedBy: ctx.user.id,
          estimatedDate: new Date(),
        });
      }),

    getYieldEstimates: protectedProcedure
      .input(z.object({ feedstockId: z.number() }))
      .query(async ({ input }) => {
        return await db.getYieldEstimatesByFeedstock(input.feedstockId);
      }),

    getLatestYield: protectedProcedure
      .input(z.object({ feedstockId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLatestYieldEstimate(input.feedstockId);
      }),
  }),

  // Stress-Testing Engine (Phase 6)
  stressTesting: router({
    // Run stress test (legacy - supports original 3 scenarios)
    runStressTest: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          scenarioType: z.enum([
            "supplier_loss",
            "supply_shortfall",
            "regional_shock",
          ]),
          scenarioParams: z.object({
            supplierId: z.number().optional(),
            shortfallPercent: z.number().optional(),
            region: z.string().optional(),
          }),
          baseScore: z.number(),
          baseRating: z.string(),
          covenants: z
            .array(
              z.object({
                type: z.string(),
                threshold: z.number(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get project agreements
        const agreements = await db.getSupplyAgreementsByProjectId(
          input.projectId
        );
        const agreementData = agreements.map(a => ({
          id: a.id,
          supplierId: a.supplierId,
          committedVolume: (a as any).committedVolume || 0,
        }));

        const { runStressTest } = await import("./stressTesting.js");
        return await runStressTest({
          ...input,
          agreements: agreementData,
          testedBy: ctx.user.id,
        });
      }),

    // Run comprehensive stress test (supports all 4 scenarios including price_shock)
    runComprehensiveTest: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          scenarioType: z.enum([
            "supplier_loss",
            "supply_shortfall",
            "regional_shock",
            "price_spike",
          ]),
          scenarioParams: z.object({
            supplierId: z.number().optional(),
            shortfallPercent: z.number().optional(),
            region: z.string().optional(),
            reductionPercent: z.number().optional(),
            priceIncreasePercent: z.number().optional(),
          }),
          baseScore: z.number(),
          baseRating: z.string(),
          projectEconomics: z.object({
            baseRevenue: z.number(),
            baseCost: z.number(),
            targetMargin: z.number(),
          }).optional(),
          covenants: z
            .array(
              z.object({
                type: z.string(),
                threshold: z.number(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get project agreements with additional fields
        const agreements = await db.getSupplyAgreementsByProjectId(
          input.projectId
        );
        const agreementData = agreements.map(a => ({
          id: a.id,
          supplierId: a.supplierId,
          committedVolume: (a as any).committedVolume || 0,
          supplierState: (a as any).supplierState,
          pricePerTonne: (a as any).pricePerTonne,
        }));

        const { runComprehensiveStressTest } = await import("./stressTesting.js");
        return await runComprehensiveStressTest({
          ...input,
          agreements: agreementData,
          testedBy: ctx.user.id,
        });
      }),

    // Run price shock scenario analysis
    runPriceShockAnalysis: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          priceIncreases: z.array(z.number()).default([20, 40, 60]),
          projectEconomics: z.object({
            baseRevenue: z.number(),
            baseCost: z.number(),
            targetMargin: z.number(),
          }),
        })
      )
      .query(async ({ input }) => {
        const agreements = await db.getSupplyAgreementsByProjectId(
          input.projectId
        );
        const agreementData = agreements.map(a => ({
          id: a.id,
          supplierId: a.supplierId,
          committedVolume: (a as any).committedVolume || 0,
          pricePerTonne: (a as any).pricePerTonne,
        }));

        const { runPriceShockScenario } = await import("./stressTesting.js");

        // Run analysis for each price increase level
        const results = await Promise.all(
          input.priceIncreases.map(async (priceIncrease) => {
            const result = await runPriceShockScenario(
              input.projectId,
              priceIncrease,
              agreementData,
              input.projectEconomics
            );
            return { priceIncrease, ...result };
          })
        );

        return results;
      }),

    // Run regional shock scenario analysis
    runRegionalAnalysis: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          region: z.string(),
          reductionPercent: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        const agreements = await db.getSupplyAgreementsByProjectId(
          input.projectId
        );
        const agreementData = agreements.map(a => ({
          id: a.id,
          supplierId: a.supplierId,
          committedVolume: (a as any).committedVolume || 0,
          supplierState: (a as any).supplierState,
        }));

        const { runRegionalEventScenario } = await import("./stressTesting.js");
        return await runRegionalEventScenario(
          input.projectId,
          input.region,
          input.reductionPercent,
          agreementData
        );
      }),

    // Get stress test results for a project
    getProjectResults: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getStressTestResults } = await import("./stressTesting.js");
        return await getStressTestResults(input.projectId);
      }),

    // Get specific stress test result
    getResult: protectedProcedure
      .input(z.object({ resultId: z.number() }))
      .query(async ({ input }) => {
        const { getStressTestResult } = await import("./stressTesting.js");
        return await getStressTestResult(input.resultId);
      }),

    // Assess contract enforceability
    assessEnforceability: protectedProcedure
      .input(
        z.object({
          agreementId: z.number(),
          governingLaw: z.string(),
          jurisdiction: z.string(),
          disputeResolution: z.enum([
            "litigation",
            "arbitration",
            "mediation",
            "expert_determination",
          ]),
          hasTerminationProtections: z.boolean(),
          hasStepInRights: z.boolean(),
          hasSecurityPackage: z.boolean(),
          hasRemedies: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { assessContractEnforceability } =
          await import("./stressTesting.js");
        return await assessContractEnforceability({
          ...input,
          assessedBy: ctx.user.id,
        });
      }),

    // Get contract enforceability score
    getEnforceabilityScore: protectedProcedure
      .input(z.object({ agreementId: z.number() }))
      .query(async ({ input }) => {
        const { getContractEnforceabilityScore } =
          await import("./stressTesting.js");
        return await getContractEnforceabilityScore(input.agreementId);
      }),
  }),

  // Lender Portal Enhancement (Phase 7)
  lender: router({
    // Get dashboard data
    getDashboard: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getLenderDashboardData } = await import("./lenderPortal.js");
        return await getLenderDashboardData(input.projectId);
      }),

    // Get active alerts
    getAlerts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getActiveAlerts } = await import("./lenderPortal.js");
        return await getActiveAlerts(input.projectId);
      }),

    // Get covenant breach history
    getBreachHistory: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          unresolved: z.boolean().optional(),
          since: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getCovenantBreachHistory } = await import("./lenderPortal.js");
        return await getCovenantBreachHistory(input.projectId, {
          unresolved: input.unresolved,
          since: input.since,
        });
      }),

    // Resolve covenant breach
    resolveBreach: protectedProcedure
      .input(
        z.object({
          breachId: z.number(),
          resolutionNotes: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { resolveCovenantBreach } = await import("./lenderPortal.js");
        await resolveCovenantBreach({
          ...input,
          resolvedBy: ctx.user.id,
        });
        return { success: true };
      }),

    // Generate monthly report
    generateReport: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          reportMonth: z.string(),
          executiveSummary: z.string().optional(),
          scoreChangesNarrative: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { generateMonthlyReport } = await import("./lenderPortal.js");
        return await generateMonthlyReport({
          ...input,
          generatedBy: ctx.user.id,
        });
      }),

    // Get latest report
    getLatestReport: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getLatestReport } = await import("./lenderPortal.js");
        return await getLatestReport(input.projectId);
      }),

    // Get all reports
    getReports: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectReports } = await import("./lenderPortal.js");
        return await getProjectReports(input.projectId);
      }),

    // Finalize report
    finalizeReport: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          reportPdfUrl: z.string().optional(),
          evidencePackUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { finalizeReport } = await import("./lenderPortal.js");
        await finalizeReport(input);
        return { success: true };
      }),

    // Mark report as sent
    markReportSent: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ input }) => {
        const { markReportSent } = await import("./lenderPortal.js");
        await markReportSent(input.reportId);
        return { success: true };
      }),
  }),

  // Compliance & Audit (Phase 8)
  compliance: router({
    // Audit logs
    queryAuditLogs: protectedProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          entityType: z.string().optional(),
          entityId: z.number().optional(),
          action: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const { queryAuditLogs } = await import("./compliance.js");
        return await queryAuditLogs(input);
      }),

    // Admin overrides
    recordOverride: protectedProcedure
      .input(
        z.object({
          overrideType: z.enum([
            "score",
            "rating",
            "status",
            "expiry",
            "certification",
            "evidence_validity",
          ]),
          entityType: z.string(),
          entityId: z.number(),
          originalValue: z.any(),
          overrideValue: z.any(),
          justification: z.string(),
          riskAssessment: z.string().optional(),
          expiryDate: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { recordAdminOverride } = await import("./compliance.js");
        return await recordAdminOverride({
          ...input,
          requestedBy: ctx.user.id,
          approvedBy: ctx.user.role === "admin" ? ctx.user.id : undefined,
        });
      }),

    getActiveOverrides: protectedProcedure
      .input(
        z.object({
          entityType: z.string(),
          entityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getActiveOverrides } = await import("./compliance.js");
        return await getActiveOverrides(input.entityType, input.entityId);
      }),

    revokeOverride: protectedProcedure
      .input(
        z.object({
          overrideId: z.number(),
          revocationReason: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { revokeOverride } = await import("./compliance.js");
        await revokeOverride({
          ...input,
          revokedBy: ctx.user.id,
        });
        return { success: true };
      }),

    // User consents
    recordConsent: protectedProcedure
      .input(
        z.object({
          consentType: z.enum([
            "terms_of_service",
            "privacy_policy",
            "data_processing",
            "marketing",
            "third_party_sharing",
            "certification_reliance",
          ]),
          consentVersion: z.string(),
          consentText: z.string(),
          granted: z.boolean(),
          ipAddress: z.string().optional(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { recordUserConsent } = await import("./compliance.js");
        return await recordUserConsent({
          ...input,
          userId: ctx.user.id,
        });
      }),

    getUserConsents: protectedProcedure
      .input(
        z.object({
          consentType: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const { getUserConsents } = await import("./compliance.js");
        return await getUserConsents(ctx.user.id, input.consentType);
      }),

    withdrawConsent: protectedProcedure
      .input(z.object({ consentId: z.number() }))
      .mutation(async ({ input }) => {
        const { withdrawConsent } = await import("./compliance.js");
        await withdrawConsent(input.consentId);
        return { success: true };
      }),

    // Certificate legal metadata
    createCertificateLegalMetadata: protectedProcedure
      .input(
        z.object({
          certificateId: z.number(),
          issuerName: z.string(),
          issuerRole: z.string(),
          certificationScope: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createCertificateLegalMetadata } =
          await import("./compliance.js");
        return await createCertificateLegalMetadata({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Disputes
    submitDispute: protectedProcedure
      .input(
        z.object({
          disputeType: z.enum([
            "score_accuracy",
            "certificate_validity",
            "evidence_authenticity",
            "contract_interpretation",
            "service_quality",
            "billing",
          ]),
          respondent: z.number().optional(),
          relatedEntityType: z.string().optional(),
          relatedEntityId: z.number().optional(),
          title: z.string(),
          description: z.string(),
          desiredOutcome: z.string().optional(),
          supportingEvidence: z
            .array(
              z.object({
                type: z.string(),
                url: z.string(),
                description: z.string(),
              })
            )
            .optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { submitDispute } = await import("./compliance.js");
        return await submitDispute({
          ...input,
          raisedBy: ctx.user.id,
        });
      }),

    updateDisputeStatus: protectedProcedure
      .input(
        z.object({
          disputeId: z.number(),
          status: z.enum([
            "submitted",
            "under_review",
            "investigation",
            "mediation",
            "arbitration",
            "resolved",
            "closed",
          ]),
          assignedTo: z.number().optional(),
          resolutionSummary: z.string().optional(),
          resolutionOutcome: z
            .enum([
              "upheld",
              "partially_upheld",
              "rejected",
              "withdrawn",
              "settled",
            ])
            .optional(),
          remediationActions: z
            .array(
              z.object({
                action: z.string(),
                responsible: z.string(),
                deadline: z.string(),
                completed: z.boolean(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateDisputeStatus } = await import("./compliance.js");
        await updateDisputeStatus(input);
        return { success: true };
      }),

    getUserDisputes: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const { getUserDisputes } = await import("./compliance.js");
        return await getUserDisputes(ctx.user.id, input.status);
      }),

    // Legal templates
    getLegalTemplates: publicProcedure.query(async () => {
      const { LEGAL_TEMPLATES } = await import("./compliance.js");
      return LEGAL_TEMPLATES;
    }),

    // Retention policies
    getRetentionPolicy: protectedProcedure
      .input(z.object({ entityType: z.string() }))
      .query(async ({ input }) => {
        const { getRetentionPolicy } = await import("./compliance.js");
        return await getRetentionPolicy(input.entityType);
      }),
  }),

  // Compliance Reporting
  complianceReporting: router({
    // Get current quarter
    getCurrentQuarter: protectedProcedure.query(async () => {
      const { getCurrentQuarter } = await import("./complianceReporting.js");
      return getCurrentQuarter();
    }),

    // Generate report for specific period
    generateReport: protectedProcedure
      .input(
        z.object({
          quarter: z.number().min(1).max(4),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { generateComplianceReport } =
          await import("./complianceReporting.js");
        const startMonth = (input.quarter - 1) * 3;
        const startDate = new Date(input.year, startMonth, 1);
        const endDate = new Date(
          input.year,
          startMonth + 3,
          0,
          23,
          59,
          59,
          999
        );
        const period = {
          startDate,
          endDate,
          quarter: input.quarter,
          year: input.year,
        };
        return await generateComplianceReport(period);
      }),

    // Generate report for current quarter
    generateCurrentReport: protectedProcedure.query(async () => {
      const { getCurrentQuarter, generateComplianceReport } =
        await import("./complianceReporting.js");
      const period = getCurrentQuarter();
      return await generateComplianceReport(period);
    }),

    // Get report summary as text
    getReportSummary: protectedProcedure
      .input(
        z.object({
          quarter: z.number().min(1).max(4),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { generateComplianceReport, formatReportSummary } =
          await import("./complianceReporting.js");
        const startMonth = (input.quarter - 1) * 3;
        const startDate = new Date(input.year, startMonth, 1);
        const endDate = new Date(
          input.year,
          startMonth + 3,
          0,
          23,
          59,
          59,
          999
        );
        const period = {
          startDate,
          endDate,
          quarter: input.quarter,
          year: input.year,
        };
        const report = await generateComplianceReport(period);
        return formatReportSummary(report);
      }),

    // Get audit metrics only
    getAuditMetrics: protectedProcedure
      .input(
        z.object({
          quarter: z.number().min(1).max(4),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getAuditMetrics } = await import("./complianceReporting.js");
        const startMonth = (input.quarter - 1) * 3;
        const startDate = new Date(input.year, startMonth, 1);
        const endDate = new Date(
          input.year,
          startMonth + 3,
          0,
          23,
          59,
          59,
          999
        );
        const period = {
          startDate,
          endDate,
          quarter: input.quarter,
          year: input.year,
        };
        return await getAuditMetrics(period);
      }),

    // Get override metrics only
    getOverrideMetrics: protectedProcedure
      .input(
        z.object({
          quarter: z.number().min(1).max(4),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getOverrideMetrics } = await import("./complianceReporting.js");
        const startMonth = (input.quarter - 1) * 3;
        const startDate = new Date(input.year, startMonth, 1);
        const endDate = new Date(
          input.year,
          startMonth + 3,
          0,
          23,
          59,
          59,
          999
        );
        const period = {
          startDate,
          endDate,
          quarter: input.quarter,
          year: input.year,
        };
        return await getOverrideMetrics(period);
      }),

    // Get dispute metrics only
    getDisputeMetrics: protectedProcedure
      .input(
        z.object({
          quarter: z.number().min(1).max(4),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getDisputeMetrics } = await import("./complianceReporting.js");
        const startMonth = (input.quarter - 1) * 3;
        const startDate = new Date(input.year, startMonth, 1);
        const endDate = new Date(
          input.year,
          startMonth + 3,
          0,
          23,
          59,
          59,
          999
        );
        const period = {
          startDate,
          endDate,
          quarter: input.quarter,
          year: input.year,
        };
        return await getDisputeMetrics(period);
      }),
  }),

  // ============================================================================
  // SAVED ANALYSES (Feedstock Map)
  // ============================================================================

  savedAnalyses: router({
    // Save a new radius analysis
    save: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          radiusKm: z.number().int().min(10).max(200),
          centerLat: z.string(),
          centerLng: z.string(),
          results: z.object({
            feasibilityScore: z.number(),
            facilities: z.object({
              sugarMills: z.number(),
              biogasFacilities: z.number(),
              biofuelPlants: z.number(),
              ports: z.number(),
              grainHubs: z.number(),
            }),
            feedstockTonnes: z.object({
              bagasse: z.number(),
              grainStubble: z.number(),
              forestryResidue: z.number(),
              biogas: z.number(),
              total: z.number(),
            }),
            infrastructure: z.object({
              ports: z.array(z.string()),
              railLines: z.array(z.string()),
            }),
            recommendations: z.array(z.string()),
          }),
          filterState: z
            .object({
              selectedStates: z.array(z.string()),
              visibleLayers: z.array(z.string()),
              capacityRanges: z.record(
                z.string(),
                z.object({
                  min: z.number(),
                  max: z.number(),
                })
              ),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const analysisId = await db.createSavedAnalysis({
          userId: ctx.user.id,
          ...input,
        });

        return { id: analysisId, success: true };
      }),

    // List all saved analyses for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedAnalysesByUserId(ctx.user.id);
    }),

    // Get a specific saved analysis by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getSavedAnalysisById(input.id);

        if (!analysis) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Analysis not found",
          });
        }

        // Verify ownership
        if (analysis.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this analysis",
          });
        }

        return analysis;
      }),

    // Update a saved analysis
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;

        // Verify ownership
        const analysis = await db.getSavedAnalysisById(id);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this analysis",
          });
        }

        await db.updateSavedAnalysis(id, updates);
        return { success: true };
      }),

    // Delete a saved analysis
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const analysis = await db.getSavedAnalysisById(input.id);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this analysis",
          });
        }

        await db.deleteSavedAnalysis(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // PRODUCER REGISTRATION
  // ============================================================================

  producer: router({
    // Submit complete producer registration
    register: protectedProcedure
      .input(
        z.object({
          // Account info
          abn: z.string(),
          companyName: z.string(),
          contactName: z.string(),
          email: z.string().email(),
          phone: z.string(),

          // Property info
          propertyName: z.string(),
          primaryAddress: z.string(),
          state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
          postcode: z.string(),
          latitude: z.string(),
          longitude: z.string(),
          totalLandArea: z.number(),
          waterAccessType: z
            .enum([
              "irrigated_surface",
              "irrigated_groundwater",
              "irrigated_recycled",
              "dryland",
              "mixed_irrigation",
            ])
            .optional(),
          boundaries: z.string().optional(),

          // Production profile
          feedstockType: z.string(),
          currentSeasonYield: z.number(),
          historicalYields: z.array(
            z.object({
              seasonYear: z.number(),
              cropType: z.string().optional(),
              totalHarvest: z.number(),
              plantedArea: z.number().optional(),
              notes: z.string().optional(),
            })
          ),

          // Carbon practices (simplified for MVP - can expand later)
          tillagePractice: z
            .enum([
              "no_till",
              "minimum_till",
              "conventional",
              "multiple_passes",
            ])
            .optional(),
          nitrogenKgPerHa: z.number().optional(),
          fertiliserType: z
            .enum([
              "urea",
              "anhydrous_ammonia",
              "dap_map",
              "organic_compost",
              "controlled_release",
              "mixed_blend",
            ])
            .optional(),
          carbonScore: z.number().optional(),

          // Existing contracts
          existingContracts: z.array(
            z.object({
              buyerName: z.string(),
              contractedVolumeTonnes: z.number(),
              contractEndDate: z.string(), // Will be converted to Date
              isConfidential: z.boolean().optional(),
            })
          ),

          // Marketplace listing
          tonnesAvailableThisSeason: z.number(),
          tonnesAvailableAnnually: z.number(),
          minimumAcceptablePricePerTonne: z.number(),
          deliveryTermsPreferred: z.enum([
            "ex_farm",
            "delivered_to_buyer",
            "fob_port",
            "flexible",
          ]),
          qualitySpecs: z.string(),
          visibility: z
            .enum([
              "public_marketplace",
              "verified_buyers_only",
              "private_network",
              "unlisted",
            ])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Create or get supplier profile
        let supplier = await db.getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          await db.createSupplier({
            userId: ctx.user.id,
            companyName: input.companyName,
            abn: input.abn,
            contactEmail: input.email,
            verificationStatus: "pending",
          });
          supplier = await db.getSupplierByUserId(ctx.user.id);
        }

        if (!supplier) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create supplier profile",
          });
        }

        // Insert property
        const propertyId = await db.createProperty({
          supplierId: supplier.id,
          propertyName: input.propertyName,
          primaryAddress: input.primaryAddress,
          state: input.state,
          postcode: input.postcode,
          latitude: input.latitude,
          longitude: input.longitude,
          totalLandArea: input.totalLandArea,
          waterAccessType: input.waterAccessType,
          boundaryFileUrl: input.boundaries,
        });

        // Insert production history
        for (const record of input.historicalYields) {
          await db.createProductionHistory({
            propertyId,
            seasonYear: record.seasonYear,
            cropType: record.cropType,
            totalHarvest: record.totalHarvest,
            plantedArea: record.plantedArea,
            notes: record.notes,
          });
        }

        // Insert carbon practices (simplified for MVP)
        if (
          input.tillagePractice ||
          input.nitrogenKgPerHa ||
          input.fertiliserType
        ) {
          await db.createCarbonPractice({
            propertyId,
            tillagePractice: input.tillagePractice,
            nitrogenKgPerHa: input.nitrogenKgPerHa,
            fertiliserType: input.fertiliserType,
          });
        }

        // Insert existing contracts
        for (const contract of input.existingContracts) {
          await db.createExistingContract({
            supplierId: supplier.id,
            buyerName: contract.buyerName,
            contractedVolumeTonnes: contract.contractedVolumeTonnes,
            contractEndDate: new Date(contract.contractEndDate),
            isConfidential: contract.isConfidential,
          });
        }

        // Insert marketplace listing
        await db.createMarketplaceListing({
          supplierId: supplier.id,
          tonnesAvailableThisSeason: input.tonnesAvailableThisSeason,
          tonnesAvailableAnnually: input.tonnesAvailableAnnually,
          minimumAcceptablePricePerTonne: input.minimumAcceptablePricePerTonne,
          deliveryTermsPreferred: input.deliveryTermsPreferred,
        });

        return {
          success: true,
          supplierId: supplier.id,
          propertyId,
        };
      }),
  }),

  // ============================================================================
  // CERTIFICATE VERIFICATION
  // ============================================================================
  certificateVerification: router({
    generateCertificate: protectedProcedure
      .input(
        z.object({
          feedstockId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get feedstock details
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feedstock not found",
          });
        }

        // Get supplier details
        const supplier = await db.getSupplierById(feedstock.supplierId);
        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Supplier not found",
          });
        }

        // Generate certificate data
        const certificateNumber = `ABFI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const issueDate = new Date();
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1); // Valid for 1 year

        const certificateData = {
          feedstockId: feedstock.id,
          feedstockName: feedstock.sourceName || feedstock.type,
          feedstockCategory: feedstock.category || feedstock.type || "Unknown",
          supplierName: supplier.companyName,
          supplierABN: supplier.abn || "N/A",
          location: supplier.city || "Unknown",
          state: supplier.state || "Unknown",
          abfiScore: feedstock.abfiScore || 0,
          sustainabilityScore: feedstock.sustainabilityScore || 0,
          carbonIntensityScore: feedstock.carbonIntensityScore || 0,
          qualityScore: feedstock.qualityScore || 0,
          reliabilityScore: feedstock.reliabilityScore || 0,
          ratingGrade: "N/A", // Rating grade not in feedstocks table
          certificateNumber,
          issueDate: issueDate.toLocaleDateString("en-AU"),
          validUntil: validUntil.toLocaleDateString("en-AU"),
          assessmentDate: feedstock.createdAt
            ? new Date(feedstock.createdAt).toLocaleDateString("en-AU")
            : issueDate.toLocaleDateString("en-AU"),
          carbonIntensity: feedstock.carbonIntensityScore || 0,
          annualVolume: feedstock.annualCapacityTonnes || 0,
          certifications: [],
        };

        // Generate certificate hash
        const { generateCertificateHash, generateABFICertificate } =
          await import("./certificateGenerator");
        const certificateHash = generateCertificateHash(certificateData);

        // Generate PDF
        const pdfBuffer = await generateABFICertificate({
          ...certificateData,
          certificateHash,
        });

        // Save certificate snapshot to database
        await db.createCertificateSnapshot({
          certificateId: feedstock.id,
          snapshotHash: certificateHash,
          frozenScoreData: {
            abfiScore: feedstock.abfiScore || 0,
            pillarScores: {
              sustainability: feedstock.sustainabilityScore || 0,
              carbon: feedstock.carbonIntensityScore || 0,
              quality: feedstock.qualityScore || 0,
              reliability: feedstock.reliabilityScore || 0,
            },
            rating: "N/A", // Rating grade not in feedstocks table
            calculationDate: new Date().toISOString(),
          },
          frozenEvidenceSet: [],
          createdBy: ctx.user.id,
        });

        // Return PDF as base64
        return {
          certificateNumber,
          certificateHash,
          pdfBase64: pdfBuffer.toString("base64"),
        };
      }),

    verifyHash: publicProcedure
      .input(
        z.object({
          hash: z.string().length(64), // SHA-256 hash is 64 hex characters
        })
      )
      .query(async ({ input }) => {
        const snapshot = await db.getCertificateSnapshotByHash(input.hash);

        if (!snapshot) {
          return { valid: false, message: "Certificate hash not found" };
        }

        const certificate = await db.getCertificateById(snapshot.certificateId);
        if (!certificate) {
          return { valid: false, message: "Certificate not found" };
        }

        const feedstock = await db.getFeedstockById(certificate.feedstockId);
        const supplier = feedstock
          ? await db.getSupplierById(feedstock.supplierId)
          : null;

        return {
          valid: true,
          certificate: {
            id: certificate.id,
            certificateNumber: certificate.certificateNumber,
            type: certificate.type,
            status: certificate.status,
            issuedDate: certificate.issuedDate,
            expiryDate: certificate.expiryDate,
            ratingGrade: certificate.ratingGrade,
          },
          supplier: supplier
            ? {
                companyName: supplier.companyName,
              }
            : null,
          feedstock: feedstock
            ? {
                type: feedstock.type,
                category: feedstock.category,
              }
            : null,
          snapshot: {
            snapshotDate: snapshot.snapshotDate,
            frozenScoreData: snapshot.frozenScoreData,
          },
        };
      }),

    generateHash: protectedProcedure
      .input(
        z.object({
          certificateId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const certificate = await db.getCertificateById(input.certificateId);
        if (!certificate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Certificate not found",
          });
        }

        // Check if snapshot already exists
        const existingSnapshot = await db.getCertificateSnapshotByCertificateId(
          input.certificateId
        );
        if (existingSnapshot) {
          return { hash: existingSnapshot.snapshotHash, existing: true };
        }

        // Generate hash from certificate data
        const crypto = await import("crypto");
        const dataToHash = JSON.stringify({
          certificateId: certificate.id,
          certificateNumber: certificate.certificateNumber,
          type: certificate.type,
          issuedDate: certificate.issuedDate,
          expiryDate: certificate.expiryDate,
          feedstockId: certificate.feedstockId,
        });
        const hash = crypto
          .createHash("sha256")
          .update(dataToHash)
          .digest("hex");

        // Create snapshot
        await db.createCertificateSnapshot({
          certificateId: input.certificateId,
          snapshotHash: hash,
          frozenScoreData: {},
          frozenEvidenceSet: [],
          createdBy: ctx.user.id,
        });

        return { hash, existing: false };
      }),
  }),
});

export type AppRouter = typeof appRouter;
