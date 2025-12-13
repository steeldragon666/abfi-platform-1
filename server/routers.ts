import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { calculateAbfiScore, generateRatingImprovements } from "./rating";
import { generateAbfiId, validateABN } from "./utils";
import { createAuditLog } from "./db";

// ============================================================================
// HELPER PROCEDURES
// ============================================================================

const supplierProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const supplier = await db.getSupplierByUserId(ctx.user.id);
  if (!supplier) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Supplier profile required',
    });
  }
  return next({ ctx: { ...ctx, supplier } });
});

const buyerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const buyer = await db.getBuyerByUserId(ctx.user.id);
  if (!buyer) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Buyer profile required',
    });
  }
  return next({ ctx: { ...ctx, buyer } });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  // ============================================================================
  // AUTH
  // ============================================================================
  
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
    get: protectedProcedure
      .query(async ({ ctx }) => {
        const supplier = await db.getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Supplier profile not found',
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
      .input(z.object({
        abn: z.string().length(11),
        companyName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        postcode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate ABN
        if (!validateABN(input.abn)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid ABN',
          });
        }
        
        // Check if ABN already exists
        const existing = await db.getSupplierByABN(input.abn);
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'ABN already registered',
          });
        }
        
        // Check if user already has a supplier profile
        const existingSupplier = await db.getSupplierByUserId(ctx.user.id);
        if (existingSupplier) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Supplier profile already exists',
          });
        }
        
        const supplierId = await db.createSupplier({
          userId: ctx.user.id,
          ...input,
        });
        
        // Update user role
        await db.updateUserRole(ctx.user.id, 'supplier');
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_supplier',
          entityType: 'supplier',
          entityId: supplierId,
        });
        
        return { supplierId };
      }),
    
    update: supplierProcedure
      .input(z.object({
        companyName: z.string().min(1).optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        postcode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateSupplier(ctx.supplier.id, input);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'update_supplier',
          entityType: 'supplier',
          entityId: ctx.supplier.id,
        });
        
        return { success: true };
      }),
    
    getStats: supplierProcedure.query(async ({ ctx }) => {
      return await db.getSupplierStats(ctx.supplier.id);
    }),
  }),
  
  // ============================================================================
  // BUYERS
  // ============================================================================
  
  buyers: router({
    create: protectedProcedure
      .input(z.object({
        abn: z.string().length(11),
        companyName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        facilityName: z.string().optional(),
        facilityAddress: z.string().optional(),
        facilityLatitude: z.string().optional(),
        facilityLongitude: z.string().optional(),
        facilityState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        description: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate ABN
        if (!validateABN(input.abn)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid ABN',
          });
        }
        
        // Check if user already has a buyer profile
        const existingBuyer = await db.getBuyerByUserId(ctx.user.id);
        if (existingBuyer) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Buyer profile already exists',
          });
        }
        
        const buyerId = await db.createBuyer({
          userId: ctx.user.id,
          ...input,
        });
        
        // Update user role
        await db.updateUserRole(ctx.user.id, 'buyer');
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_buyer',
          entityType: 'buyer',
          entityId: buyerId,
        });
        
        return { buyerId };
      }),
    
    get: buyerProcedure.query(async ({ ctx }) => {
      return await db.getBuyerById(ctx.buyer.id);
    }),
    
    update: buyerProcedure
      .input(z.object({
        companyName: z.string().min(1).optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        facilityName: z.string().optional(),
        facilityAddress: z.string().optional(),
        facilityLatitude: z.string().optional(),
        facilityLongitude: z.string().optional(),
        facilityState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        description: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateBuyer(ctx.buyer.id, input);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'update_buyer',
          entityType: 'buyer',
          entityId: ctx.buyer.id,
        });
        
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // FEEDSTOCKS
  // ============================================================================
  
  feedstocks: router({
    create: supplierProcedure
      .input(z.object({
        category: z.enum(["oilseed", "UCO", "tallow", "lignocellulosic", "waste", "algae", "other"]),
        type: z.string().min(1),
        sourceName: z.string().optional(),
        sourceAddress: z.string().optional(),
        latitude: z.string(),
        longitude: z.string(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
        region: z.string().optional(),
        productionMethod: z.enum(["crop", "waste", "residue", "processing_byproduct"]),
        annualCapacityTonnes: z.number().int().positive(),
        availableVolumeCurrent: z.number().int().nonnegative(),
        carbonIntensityValue: z.number().int().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const abfiId = generateAbfiId(input.category, input.state);
        
        const feedstockId = await db.createFeedstock({
          abfiId,
          supplierId: ctx.supplier.id,
          ...input,
          status: 'draft',
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_feedstock',
          entityType: 'feedstock',
          entityId: feedstockId,
        });
        
        return { feedstockId, abfiId };
      }),
    
    update: supplierProcedure
      .input(z.object({
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
        priceVisibility: z.enum(["public", "private", "on_request"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Verify ownership
        const feedstock = await db.getFeedstockById(id);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        await db.updateFeedstock(id, data);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'update_feedstock',
          entityType: 'feedstock',
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
        if (!feedstock || feedstock.status !== 'active') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Feedstock not found',
          });
        }
        return feedstock;
      }),
    
    search: publicProcedure
      .input(z.object({
        category: z.array(z.string()).optional(),
        state: z.array(z.string()).optional(),
        minAbfiScore: z.number().optional(),
        maxCarbonIntensity: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchFeedstocks({
          ...input,
          status: 'active',
        });
      }),
    
    calculateRating: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        // Get related data
        const certificates = await db.getCertificatesByFeedstockId(input.feedstockId);
        const qualityTests = await db.getQualityTestsByFeedstockId(input.feedstockId);
        const transactions = await db.getTransactionsBySupplierId(ctx.supplier.id);
        
        // Calculate scores
        const scores = calculateAbfiScore(feedstock, certificates, qualityTests, transactions);
        
        // Update feedstock with new scores
        await db.updateFeedstock(input.feedstockId, scores);
        
        // Generate improvement suggestions
        const improvements = generateRatingImprovements(scores, feedstock, certificates);
        
        return { scores, improvements };
      }),
    
    submitForReview: supplierProcedure
      .input(z.object({ feedstockId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        if (feedstock.status !== 'draft') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only draft feedstocks can be submitted for review',
          });
        }
        
        await db.updateFeedstock(input.feedstockId, {
          status: 'pending_review',
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'submit_feedstock_review',
          entityType: 'feedstock',
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
      .input(z.object({
        feedstockId: z.number(),
        type: z.enum(["ISCC_EU", "ISCC_PLUS", "RSB", "RED_II", "GO", "ABFI", "OTHER"]),
        certificateNumber: z.string().optional(),
        issuedDate: z.date().optional(),
        expiryDate: z.date().optional(),
        documentUrl: z.string().optional(),
        documentKey: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        const certId = await db.createCertificate(input);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_certificate',
          entityType: 'certificate',
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
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        return await db.getCertificatesByFeedstockId(input.feedstockId);
      }),
  }),
  
  // ============================================================================
  // QUALITY TESTS
  // ============================================================================
  
  qualityTests: router({
    create: supplierProcedure
      .input(z.object({
        feedstockId: z.number(),
        testDate: z.date(),
        laboratory: z.string().optional(),
        parameters: z.any(),
        overallPass: z.boolean().optional(),
        reportUrl: z.string().optional(),
        reportKey: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify feedstock ownership
        const feedstock = await db.getFeedstockById(input.feedstockId);
        if (!feedstock || feedstock.supplierId !== ctx.supplier.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        const testId = await db.createQualityTest(input);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_quality_test',
          entityType: 'quality_test',
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
            code: 'FORBIDDEN',
            message: 'Not authorized',
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
      .input(z.object({
        supplierId: z.number(),
        feedstockId: z.number().optional(),
        subject: z.string().min(1),
        message: z.string().min(1),
        volumeRequired: z.number().int().optional(),
        deliveryLocation: z.string().optional(),
        deliveryTimeframeStart: z.date().optional(),
        deliveryTimeframeEnd: z.date().optional(),
      }))
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
            type: 'inquiry_received',
            title: 'New Inquiry Received',
            message: `You have received a new inquiry: ${input.subject}`,
            relatedEntityType: 'inquiry',
            relatedEntityId: inquiryId,
          });
        }
        
        return { inquiryId };
      }),
    
    respond: supplierProcedure
      .input(z.object({
        inquiryId: z.number(),
        response: z.string().min(1),
        pricePerTonne: z.number().optional(),
        availableVolume: z.number().optional(),
        deliveryTimeframe: z.string().optional(),
        deliveryTerms: z.string().optional(),
        minimumOrder: z.number().optional(),
        status: z.enum(["responded", "closed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const inquiry = await db.getInquiriesBySupplierId(ctx.supplier.id);
        const targetInquiry = inquiry.find(i => i.id === input.inquiryId);
        
        if (!targetInquiry) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized',
          });
        }
        
        // Build response details object
        const responseDetails: any = {};
        if (input.pricePerTonne) responseDetails.pricePerTonne = input.pricePerTonne;
        if (input.availableVolume) responseDetails.availableVolume = input.availableVolume;
        if (input.deliveryTimeframe) responseDetails.deliveryTimeframe = input.deliveryTimeframe;
        if (input.deliveryTerms) responseDetails.deliveryTerms = input.deliveryTerms;
        if (input.minimumOrder) responseDetails.minimumOrder = input.minimumOrder;
        
        await db.updateInquiry(input.inquiryId, {
          responseMessage: input.response,
          responseDetails: Object.keys(responseDetails).length > 0 ? responseDetails : undefined,
          respondedAt: new Date(),
          status: input.status || 'responded',
        });
        
        // Create notification for buyer
        const buyer = await db.getBuyerById(targetInquiry.buyerId);
        if (buyer) {
          await db.createNotification({
            userId: buyer.userId,
            type: 'inquiry_response',
            title: 'Inquiry Response Received',
            message: `A supplier has responded to your inquiry`,
            relatedEntityType: 'inquiry',
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
      .input(z.object({
        name: z.string().min(1),
        criteria: z.any(),
        notifyOnNewMatches: z.boolean().optional(),
      }))
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
      return await db.getAllSuppliers({ verificationStatus: 'pending' });
    }),
    
    verifySupplier: adminProcedure
      .input(z.object({
        supplierId: z.number(),
        approved: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateSupplier(input.supplierId, {
          verificationStatus: input.approved ? 'verified' : 'suspended',
        });
        
        const supplier = await db.getSupplierById(input.supplierId);
        if (supplier) {
          await db.createNotification({
            userId: supplier.userId,
            type: 'verification_update',
            title: input.approved ? 'Supplier Verified' : 'Verification Declined',
            message: input.approved 
              ? 'Your supplier profile has been verified'
              : 'Your supplier verification was declined',
          });
        }
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'verify_supplier',
          entityType: 'supplier',
          entityId: input.supplierId,
          changes: { after: { approved: input.approved } } as any,
        });
        
        return { success: true };
      }),
    
    getPendingFeedstocks: adminProcedure.query(async () => {
      return await db.searchFeedstocks({ status: 'pending_review' });
    }),
    
    verifyFeedstock: adminProcedure
      .input(z.object({
        feedstockId: z.number(),
        approved: z.boolean(),
        verificationLevel: z.enum(["self_declared", "document_verified", "third_party_audited", "abfi_certified"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateFeedstock(input.feedstockId, {
          status: input.approved ? 'active' : 'suspended',
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
              type: 'verification_update',
              title: input.approved ? 'Feedstock Verified' : 'Feedstock Verification Declined',
              message: input.approved 
                ? `Your feedstock ${feedstock.abfiId} has been verified`
                : `Your feedstock ${feedstock.abfiId} verification was declined`,
            });
          }
        }
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'verify_feedstock',
          entityType: 'feedstock',
          entityId: input.feedstockId,
          changes: { after: { approved: input.approved } } as any,
        });
        
        return { success: true };
      }),
    
    getAuditLogs: adminProcedure
      .input(z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAuditLogs(input);
      }),
  }),
  
  // ============================================================================
  // BANKABILITY MODULE
  // ============================================================================
  
  bankability: router({
    // Projects
    createProject: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        facilityLocation: z.string().optional(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        nameplateCapacity: z.number(),
        feedstockType: z.string().optional(),
        targetCOD: z.date().optional(),
        financialCloseTarget: z.date().optional(),
        debtTenor: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          userId: ctx.user.id,
          ...input,
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_project',
          entityType: 'project',
          entityId: projectId,
        });
        
        return { projectId };
      }),
    
    getMyProjects: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getProjectsByUserId(ctx.user.id);
      }),
    
    listProjects: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getProjectsByUserId(ctx.user.id);
      }),
    
    getProjectById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return project;
      }),
    
    updateProject: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["planning", "development", "financing", "construction", "operational", "suspended"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const project = await db.getProjectById(id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        await db.updateProject(id, updates);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'update_project',
          entityType: 'project',
          entityId: id,
        });
        
        return { success: true };
      }),
    
    // Supply Agreements
    createAgreement: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        supplierId: z.number(),
        tier: z.enum(["tier1", "tier2", "option", "rofr"]),
        annualVolume: z.number(),
        termYears: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        pricingMechanism: z.enum(["fixed", "fixed_with_escalation", "index_linked", "index_with_floor_ceiling", "spot_reference"]),
        takeOrPayPercentage: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const agreementId = await db.createSupplyAgreement(input);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_agreement',
          entityType: 'supply_agreement',
          entityId: agreementId,
        });
        
        return { agreementId };
      }),
    
    getProjectAgreements: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getSupplyAgreementsByProjectId(input.projectId);
      }),
    
    // Grower Qualifications
    createQualification: protectedProcedure
      .input(z.object({
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
        status: z.enum(["pending", "approved", "expired", "revoked"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const qualificationData = {
          ...input,
          assessedBy: ctx.user.id,
          assessmentDate: input.assessmentDate || new Date(),
        };
        const qualificationId = await db.createGrowerQualification(qualificationData);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_qualification',
          entityType: 'grower_qualification',
          entityId: qualificationId,
        });
        
        return { qualificationId };
      }),
    
    createGrowerQualification: protectedProcedure
      .input(z.object({
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
        status: z.enum(["pending", "approved", "expired", "revoked"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const qualificationData = {
          ...input,
          assessedBy: ctx.user.id,
          assessmentDate: input.assessmentDate || new Date(),
        };
        const qualificationId = await db.createGrowerQualification(qualificationData);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_qualification',
          entityType: 'grower_qualification',
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
      .input(z.object({
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
        status: z.enum(["draft", "submitted", "under_review", "approved", "rejected"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const assessmentData = {
          ...input,
          assessedBy: ctx.user.id,
        };
        const assessmentId = await db.createBankabilityAssessment(assessmentData);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_assessment',
          entityType: 'bankability_assessment',
          entityId: assessmentId,
        });
        
        return { assessmentId };
      }),
    
    getProjectAssessments: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getBankabilityAssessmentsByProjectId(input.projectId);
      }),
    
    getLatestAssessment: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getLatestBankabilityAssessment(input.projectId);
      }),
    
    // Lender Access
    grantLenderAccess: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        lenderName: z.string(),
        lenderEmail: z.string(),
        lenderContact: z.string().optional(),
        validFrom: z.date(),
        validUntil: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
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
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getLenderAccessByProjectId(input.projectId);
      }),
  }),
  
  // Evidence Chain & Data Provenance
  evidence: router({
    // Upload evidence with automatic hashing
    upload: protectedProcedure
      .input(z.object({
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
          "other"
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
          "self_declared"
        ]),
        issuerName: z.string(),
        issuerCredentials: z.string().optional(),
        issuedDate: z.date(),
        expiryDate: z.date().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const evidenceId = await db.createEvidence({
          ...input,
          uploadedBy: ctx.user.id,
          status: "valid",
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'upload_evidence',
          entityType: 'evidence',
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
      .input(z.object({
        entityType: z.enum([
          "feedstock",
          "supplier",
          "certificate",
          "abfi_score",
          "bankability_assessment",
          "grower_qualification",
          "supply_agreement",
          "project"
        ]),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getEvidenceLinkagesByEntity(input.entityType, input.entityId);
      }),
    
    // Get expiring evidence
    getExpiring: protectedProcedure
      .input(z.object({ daysAhead: z.number().default(30) }))
      .query(async ({ input }) => {
        return await db.getExpiringEvidence(input.daysAhead);
      }),
    
    // Link evidence to entity
    linkToEntity: protectedProcedure
      .input(z.object({
        evidenceId: z.number(),
        linkedEntityType: z.enum([
          "feedstock",
          "supplier",
          "certificate",
          "abfi_score",
          "bankability_assessment",
          "grower_qualification",
          "supply_agreement",
          "project"
        ]),
        linkedEntityId: z.number(),
        linkageType: z.enum(["supports", "validates", "contradicts", "supersedes", "references"]).default("supports"),
        weightInCalculation: z.number().optional(),
        linkageNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const linkageId = await db.createEvidenceLinkage({
          ...input,
          linkedBy: ctx.user.id,
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'link_evidence',
          entityType: 'evidence_linkage',
          entityId: linkageId,
          changes: { after: input },
        });
        
        return { linkageId };
      }),
    
    // Supersede evidence
    supersede: protectedProcedure
      .input(z.object({
        oldEvidenceId: z.number(),
        newEvidenceId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.supersedeEvidence(input.oldEvidenceId, input.newEvidenceId, input.reason);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'supersede_evidence',
          entityType: 'evidence',
          entityId: input.oldEvidenceId,
          changes: {
            before: { status: 'valid' },
            after: { status: 'superseded', supersededById: input.newEvidenceId },
          },
        });
        
        return { success: true };
      }),
    
    // Verify evidence
    verify: protectedProcedure
      .input(z.object({ evidenceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admins or auditors can verify evidence
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'auditor') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        await db.updateEvidence(input.evidenceId, {
          verifiedBy: ctx.user.id,
          verifiedAt: new Date(),
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'verify_evidence',
          entityType: 'evidence',
          entityId: input.evidenceId,
          changes: { after: { verifiedBy: ctx.user.id } },
        });
        
        return { success: true };
      }),
    
    // Create certificate snapshot
    createSnapshot: protectedProcedure
      .input(z.object({
        certificateId: z.number(),
        frozenScoreData: z.record(z.string(), z.any()),
        frozenEvidenceSet: z.array(z.object({
          evidenceId: z.number(),
          fileHash: z.string(),
          type: z.string(),
          issuedDate: z.string(),
          issuerName: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Calculate snapshot hash
        const { generateSnapshotHash } = await import('./evidence.js');
        const snapshotHash = generateSnapshotHash(input.frozenScoreData, input.frozenEvidenceSet);
        
        const snapshotId = await db.createCertificateSnapshot({
          certificateId: input.certificateId,
          snapshotHash,
          frozenScoreData: input.frozenScoreData,
          frozenEvidenceSet: input.frozenEvidenceSet,
          createdBy: ctx.user.id,
        });
        
        await createAuditLog({
          userId: ctx.user.id,
          action: 'create_certificate_snapshot',
          entityType: 'certificate_snapshot',
          entityId: snapshotId,
          changes: { after: { certificateId: input.certificateId, snapshotHash } },
        });
        
        return { snapshotId, snapshotHash };
      }),
    
    // Get certificate snapshots
    getSnapshotsByCertificate: protectedProcedure
      .input(z.object({ certificateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCertificateSnapshotsByCertificate(input.certificateId);
      }),
  }),
  
  // Temporal Versioning & Validity
  temporal: router({
    // Get entity as of specific date
    getAsOfDate: protectedProcedure
      .input(z.object({
        entityType: z.enum(["feedstock", "certificate", "supply_agreement", "bankability_assessment"]),
        entityId: z.number(),
        asOfDate: z.date(),
      }))
      .query(async ({ input }) => {
        const { getEntityAsOfDate } = await import('./temporal.js');
        return await getEntityAsOfDate(input.entityType, input.entityId, input.asOfDate);
      }),
    
    // Get current version
    getCurrent: protectedProcedure
      .input(z.object({
        entityType: z.enum(["feedstock", "certificate", "supply_agreement", "bankability_assessment"]),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getCurrentVersion } = await import('./temporal.js');
        return await getCurrentVersion(input.entityType, input.entityId);
      }),
    
    // Get version history
    getHistory: protectedProcedure
      .input(z.object({
        entityType: z.enum(["feedstock", "certificate", "supply_agreement", "bankability_assessment"]),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getEntityHistory } = await import('./temporal.js');
        return await getEntityHistory(input.entityType, input.entityId);
      }),
    
    // Get version timeline
    getTimeline: protectedProcedure
      .input(z.object({
        entityType: z.enum(["feedstock", "certificate", "supply_agreement", "bankability_assessment"]),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getVersionTimeline } = await import('./temporal.js');
        return await getVersionTimeline(input.entityType, input.entityId);
      }),
    
    // Compare two versions
    compareVersions: protectedProcedure
      .input(z.object({
        entityType: z.enum(["feedstock", "certificate", "supply_agreement", "bankability_assessment"]),
        oldVersionId: z.number(),
        newVersionId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getCurrentVersion, compareVersions } = await import('./temporal.js');
        
        const oldVersion = await getCurrentVersion(input.entityType, input.oldVersionId);
        const newVersion = await getCurrentVersion(input.entityType, input.newVersionId);
        
        if (!oldVersion || !newVersion) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Version not found' });
        }
        
        return compareVersions(oldVersion, newVersion);
      }),
  }),
});

export type AppRouter = typeof appRouter;
