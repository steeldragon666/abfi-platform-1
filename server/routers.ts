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
        responseMessage: z.string().min(1),
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
        
        await db.updateInquiry(input.inquiryId, {
          responseMessage: input.responseMessage,
          respondedAt: new Date(),
          status: 'responded',
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
});

export type AppRouter = typeof appRouter;
