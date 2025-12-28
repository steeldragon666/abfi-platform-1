/**
 * System Router - Lightweight system operations
 * Bundle size: ~20KB
 */
import { z } from "zod";
import { createTrpcHandler, router, publicProcedure, adminProcedure, vercelConfig } from "../../_lib/trpc";

export const config = vercelConfig;

// Define system procedures directly using API's tRPC instance
const systemRouter = router({
  health: publicProcedure
    .input(z.object({ timestamp: z.number().min(0).optional() }).optional())
    .query(() => ({ ok: true })),

  getStats: publicProcedure.query(async () => {
    // Lazy import to keep bundle small
    const db = await import("../../../server/db");
    const suppliers = await db.getAllSuppliers();
    const buyers = await db.getAllBuyers();
    return {
      supplierCount: suppliers.length,
      buyerCount: buyers.length,
      timestamp: new Date().toISOString(),
    };
  }),
});

// Create router with system namespace
const systemOnlyRouter = router({
  system: systemRouter,
});

export default createTrpcHandler(systemOnlyRouter, "/api/trpc/routers/system");
