/**
 * Core Router - Auth, Utils, Audit, Suppliers, Buyers
 * Handles inline routers from the main routers.ts file
 */
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../../../server/db";
import { lookupABN } from "../../../server/abnValidation";

export const config = vercelConfig;

// Helper procedures
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

// Core router with inline namespaces
const coreRouter = router({
  // Auth namespace
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      // Note: In serverless, cookie clearing happens via headers
      return { success: true } as const;
    }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const supplier = await db.getSupplierByUserId(ctx.user.id);
      const buyer = await db.getBuyerByUserId(ctx.user.id);
      return { user: ctx.user, supplier, buyer };
    }),
  }),

  // Utils namespace
  utils: router({
    validateABN: publicProcedure
      .input(z.object({ abn: z.string().length(11) }))
      .query(async ({ input }) => {
        const result = await lookupABN(input.abn);
        return result;
      }),
  }),

  // Audit namespace
  audit: router({
    getLogs: adminProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          entityType: z.string().optional(),
          entityId: z.number().optional(),
          action: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.number().min(1).max(500).default(100),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const logs = await db.getAuditLogs({
          userId: input.userId,
          entityType: input.entityType,
          entityId: input.entityId,
          limit: input.limit,
        });
        return logs;
      }),

    getStats: adminProcedure.query(async () => {
      const allLogs = await db.getAuditLogs({ limit: 1000 });
      const actionCounts: Record<string, number> = {};
      const entityCounts: Record<string, number> = {};
      const userCounts: Record<string, number> = {};

      for (const log of allLogs) {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
        if (log.userId) {
          const userId = String(log.userId);
          userCounts[userId] = (userCounts[userId] || 0) + 1;
        }
      }

      return {
        totalLogs: allLogs.length,
        actionCounts,
        entityCounts,
        userCounts,
        recentLogs: allLogs.slice(0, 10),
      };
    }),
  }),

  // Suppliers namespace (simplified)
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
  }),

  // Buyers namespace (simplified)
  buyers: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const buyer = await db.getBuyerByUserId(ctx.user.id);
      if (!buyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Buyer profile not found",
        });
      }
      return buyer;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getBuyerById(input.id);
      }),
  }),
});

export default createServerRouterHandler(coreRouter, "/api/trpc/routers/core");
