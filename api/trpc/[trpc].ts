/**
 * tRPC API Route Handler for Vercel Serverless
 * Imports routers from server for full API functionality
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";
import { pricesRouter } from "../../server/pricesRouter";

// =============================================================================
// Middleware
// =============================================================================

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.PRODUCTION_URL || "",
].filter(Boolean);

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith(".vercel.app")
  );
  if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") { res.status(200).end(); return true; }
  return false;
}

function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function logRequest(req: VercelRequest, startTime: number): void {
  console.log(`[${req.method || "GET"}] ${req.url || "/"} - ${Date.now() - startTime}ms`);
}

function handleError(res: VercelResponse, error: unknown): void {
  console.error("[API Error]", error);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
  });
}

// =============================================================================
// Self-contained tRPC setup (no external server dependencies)
// =============================================================================

type Context = { user: null };

const t = initTRPC.context<Context>().create();
const publicProcedure = t.procedure;
const router = t.router;

// API router for Vercel with full functionality
const apiRouter = router({
  system: router({
    health: publicProcedure
      .input(z.object({ timestamp: z.number().min(0).optional() }).optional())
      .query(() => ({
        ok: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
      })),
  }),
  // Include prices router for feedstock price dashboard
  prices: pricesRouter,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    setSecurityHeaders(res);
    if (setCorsHeaders(req, res)) return;

    // Convert Vercel request to Fetch Request
    const url = new URL(req.url || "/", `https://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    let body: string | undefined;
    if (req.method === "POST" || req.method === "PUT") {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const request = new Request(url, { method: req.method, headers, body });

    // Use self-contained router with simple context (no auth needed for public endpoints)
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: apiRouter,
      createContext: async () => ({ user: null }),
    });

    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(response.status);
    res.send(await response.text());
  } catch (error) {
    handleError(res, error);
  } finally {
    logRequest(req, startTime);
  }
}
