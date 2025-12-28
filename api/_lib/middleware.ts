/**
 * Shared Middleware for Vercel Serverless Functions
 * Provides CORS, authentication, logging, and security headers
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// =============================================================================
// CORS Configuration
// =============================================================================

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.PRODUCTION_URL || "",
].filter(Boolean);

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || "";

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith(".vercel.app")
  );

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // Request handled
  }

  return false; // Continue processing
}

// =============================================================================
// Security Headers (Essential Eight compliance)
// =============================================================================

export function setSecurityHeaders(res: VercelResponse): void {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

// =============================================================================
// Request Logging
// =============================================================================

export function logRequest(req: VercelRequest, startTime: number): void {
  const duration = Date.now() - startTime;
  const path = req.url || "/";
  const method = req.method || "GET";

  console.log(`[${method}] ${path} - ${duration}ms`);
}

// =============================================================================
// Error Handling
// =============================================================================

export function handleError(res: VercelResponse, error: unknown): void {
  console.error("[API Error]", error);

  if (error instanceof Error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// =============================================================================
// Middleware Wrapper
// =============================================================================

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

export function withMiddleware(handler: Handler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const startTime = Date.now();

    try {
      // Set security headers
      setSecurityHeaders(res);

      // Handle CORS (returns true if preflight handled)
      if (setCorsHeaders(req, res)) {
        return;
      }

      // Execute handler
      await handler(req, res);
    } catch (error) {
      handleError(res, error);
    } finally {
      logRequest(req, startTime);
    }
  };
}

// =============================================================================
// Vercel Config Export
// =============================================================================

export const vercelConfig = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

// =============================================================================
// tRPC Handler Factory (uses server's tRPC instance)
// =============================================================================

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sdk } from "../../server/_core/sdk";
import type { User } from "../../drizzle/schema";

/**
 * Create a Vercel handler for a server tRPC router
 * Uses the server's tRPC instance with a compatible context
 */
export function createServerRouterHandler<TRouter>(
  routerInstance: TRouter,
  endpoint: string
) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
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

      // Create context compatible with server routers
      // sdk.authenticateRequest expects Express-style req with .get() or .headers.cookie
      const cookieHeader = headers.get("cookie") || "";
      const expressLikeReq = {
        get: (name: string) => name === "cookie" ? cookieHeader : headers.get(name),
        headers: { cookie: cookieHeader },
      };

      const createContext = async () => {
        let user: User | null = null;
        try {
          user = await sdk.authenticateRequest(expressLikeReq);
        } catch {
          user = null;
        }
        return { req: request as any, res: res as any, user };
      };

      const response = await fetchRequestHandler({
        endpoint,
        req: request,
        router: routerInstance as any,
        createContext,
      });

      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(response.status);
      res.send(await response.text());
    } catch (error) {
      handleError(res, error);
    } finally {
      logRequest(req, startTime);
    }
  };
}
