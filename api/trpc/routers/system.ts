/**
 * System Router - Lightweight system operations
 * Called via /api/trpc/system.health, /api/trpc/system.getStats, etc.
 * This file exists for documentation but actual calls go through [trpc].ts
 */
import { z } from "zod";
import { router, publicProcedure } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

// Define system procedures using server's tRPC instance
// These are accessed via the main /api/trpc endpoint as system.health, etc.
export const systemRouter = router({
  health: publicProcedure
    .input(z.object({ timestamp: z.number().min(0).optional() }).optional())
    .query(() => ({ ok: true, timestamp: new Date().toISOString() })),

  getStats: publicProcedure.query(async () => {
    const db = await import("../../../server/db");
    const suppliers = await db.getAllSuppliers();
    const users = await db.getAllUsers();
    return {
      supplierCount: suppliers.length,
      userCount: users.length,
      timestamp: new Date().toISOString(),
    };
  }),
});

// For direct calls to /api/trpc/routers/system, wrap in namespace
const systemOnlyRouter = router({ system: systemRouter });

export default createServerRouterHandler(systemOnlyRouter, "/api/trpc/routers/system");
