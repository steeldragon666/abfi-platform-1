import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, or } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { abfiGateEvents as gateEvents, abfiPaymentReleases as gateReleases, abfiPaymentGuarantees as paymentGuarantees } from "../drizzle/schema";

// ============================================================================
// GATE PAYMENT RAIL ROUTER
// ============================================================================

export const gateRouter = router({
  getGateTimeline: protectedProcedure
    .input(
      z
        .object({
          consignmentId: z.string().optional(),
          deliveryId: z.number().optional(),
        })
        .refine((input) => input.consignmentId || input.deliveryId, {
          message: "consignmentId or deliveryId is required",
        })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const eventConditions = [];
      // Note: consignmentId not available in abfiGateEvents schema
      if (input.deliveryId) {
        eventConditions.push(eq(gateEvents.deliveryId, input.deliveryId));
      }
      const eventWhere = eventConditions.length > 0 ? and(...eventConditions) : undefined;

      const events = await db
        .select()
        .from(gateEvents)
        .where(eventWhere)
        .orderBy(desc(gateEvents.recordedAt));

      const releaseConditions = [];
      // Note: consignmentId not available in abfiPaymentReleases schema
      if (input.deliveryId) {
        releaseConditions.push(eq(gateReleases.deliveryId, input.deliveryId));
      }
      const releaseWhere =
        releaseConditions.length > 0 ? and(...releaseConditions) : undefined;

      const releases = await db
        .select()
        .from(gateReleases)
        .where(releaseWhere)
        .orderBy(desc(gateReleases.createdAt));

      return { events, releases };
    }),

  getGateReleaseStatus: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const releases = await db
        .select()
        .from(gateReleases)
        .where(eq(gateReleases.deliveryId, input.deliveryId))
        .orderBy(desc(gateReleases.createdAt));

      return { releases };
    }),

  getPaymentGuaranteeStatus: protectedProcedure
    .input(
      z
        .object({
          contractId: z.number().optional(),
          deliveryId: z.number().optional(),
        })
        .refine((input) => input.contractId || input.deliveryId, {
          message: "contractId or deliveryId is required",
        })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Note: contractId and deliveryId not available in abfiPaymentGuarantees schema
      // Schema needs to be updated to include these fields
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Payment guarantee lookup by contractId/deliveryId not yet implemented - schema incomplete" });
    }),
});
