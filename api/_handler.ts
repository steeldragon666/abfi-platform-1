/**
 * Vercel Serverless Function Adapter
 * Wraps the Express app for Vercel deployment
 */

import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { handleManusWebhook } from "../server/manus";
import { certificateVerificationRouter } from "../server/certificateVerificationApi";
import { didResolutionRouter } from "../server/didResolutionApi";

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// Manus AI webhook endpoint
app.post("/api/webhooks/manus", async (req: any, res: any) => {
  try {
    const result = await handleManusWebhook(req.body);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("[Manus Webhook] Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Public Certificate Verification API
app.use("/api/verify", certificateVerificationRouter);

// DID Resolution API (W3C DID Resolution specification)
app.use("/api/did", didResolutionRouter);
// Also mount at root for .well-known paths
app.use(didResolutionRouter);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/api/health", (_req: any, res: any) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
  });
});

// Export for Vercel serverless
export default app;
