import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeScheduler } from "../scheduler";
import { handleManusWebhook } from "../manus";
import { certificateVerificationRouter } from "../certificateVerificationApi";
import { didResolutionRouter } from "../didResolutionApi";
import { aiChatRouter } from "../aiChatRouter";
import { australianDataRouter } from "../apis/australianDataRouter";
import { securityHeaders, rateLimit, rateLimitConfigs } from "./security";
import { createSSERouter } from "./sse";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Hide Express server identifier for security
  app.disable("x-powered-by");

  // === Security Headers Middleware ===
  // Implements Essential Eight security controls (HSTS, CSP, X-Frame-Options, etc.)
  app.use(securityHeaders({
    // Additional trusted sources can be configured here
    trustedScriptSources: [],
    trustedConnectSources: [],
  }));

  // === Rate Limiting for Authentication ===
  // Strict limits: 5 attempts per 15 minutes
  app.use("/api/oauth", rateLimit(rateLimitConfigs.auth));
  app.use("/auth", rateLimit(rateLimitConfigs.auth));

  // === Rate Limiting for General API ===
  // Standard limits: 100 requests per hour
  app.use("/api/trpc", rateLimit(rateLimitConfigs.api));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Intelligence API proxy (forward to abfi-ai backend)
  const intelligenceApiProxy = createProxyMiddleware({
    target: "https://abfi-ai.vercel.app",
    changeOrigin: true,
    secure: true,
    logger: console,
    pathRewrite: undefined, // Keep original path
  });
  app.use("/api/v1/sentiment", (req, res, next) => {
    // Prepend the base path back since express strips it
    req.url = "/api/v1/sentiment" + req.url;
    return intelligenceApiProxy(req, res, next);
  });
  app.use("/api/v1/prices", (req, res, next) => {
    req.url = "/api/v1/prices" + req.url;
    return intelligenceApiProxy(req, res, next);
  });
  app.use("/api/v1/policy", (req, res, next) => {
    req.url = "/api/v1/policy" + req.url;
    return intelligenceApiProxy(req, res, next);
  });

  // Manus AI webhook endpoint
  app.post("/api/webhooks/manus", async (req, res) => {
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

  // AI Chat API for HeyGen Avatar Assistant
  app.use("/api/ai-chat", aiChatRouter);

  // Australian Data APIs (climate, soil, carbon credits)
  app.use("/api/australian-data", australianDataRouter);

  // Server-Sent Events for real-time notifications
  app.use("/api/sse", createSSERouter());

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Initialize automated job scheduler
    initializeScheduler();
  });
}

startServer().catch(console.error);
