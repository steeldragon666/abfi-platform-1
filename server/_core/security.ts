/**
 * Security Headers Middleware
 * Implements Essential Eight security controls for ABFI Platform
 *
 * Headers implemented:
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Content-Security-Policy (CSP) with nonce
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Generate a cryptographically secure nonce for CSP
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

// Extend Express Request to include nonce
declare global {
  namespace Express {
    interface Request {
      cspNonce?: string;
    }
    interface Response {
      locals: {
        cspNonce?: string;
        [key: string]: any;
      };
    }
  }
}

interface SecurityHeadersOptions {
  /** Enable HSTS (default: true in production) */
  enableHSTS?: boolean;
  /** HSTS max-age in seconds (default: 2 years) */
  hstsMaxAge?: number;
  /** Include subdomains in HSTS (default: true) */
  hstsIncludeSubDomains?: boolean;
  /** Enable HSTS preload (default: true) */
  hstsPreload?: boolean;
  /** Additional trusted script sources for CSP */
  trustedScriptSources?: string[];
  /** Additional trusted style sources for CSP */
  trustedStyleSources?: string[];
  /** Additional trusted image sources for CSP */
  trustedImageSources?: string[];
  /** Additional trusted connect sources for CSP */
  trustedConnectSources?: string[];
  /** Additional trusted font sources for CSP */
  trustedFontSources?: string[];
  /** Additional trusted frame sources for CSP */
  trustedFrameSources?: string[];
}

const defaultOptions: SecurityHeadersOptions = {
  enableHSTS: process.env.NODE_ENV === "production",
  hstsMaxAge: 63072000, // 2 years in seconds
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  trustedScriptSources: [],
  trustedStyleSources: [],
  trustedImageSources: [],
  trustedConnectSources: [],
  trustedFontSources: [],
  trustedFrameSources: [],
};

/**
 * Security Headers Middleware
 * Adds comprehensive security headers to all responses
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate unique nonce for this request
    const nonce = generateNonce();
    req.cspNonce = nonce;
    res.locals.cspNonce = nonce;

    // === HSTS (HTTP Strict Transport Security) ===
    // Forces browsers to use HTTPS for all future requests
    if (config.enableHSTS) {
      let hstsValue = `max-age=${config.hstsMaxAge}`;
      if (config.hstsIncludeSubDomains) {
        hstsValue += "; includeSubDomains";
      }
      if (config.hstsPreload) {
        hstsValue += "; preload";
      }
      res.setHeader("Strict-Transport-Security", hstsValue);
    }

    // === X-Frame-Options ===
    // Prevents clickjacking by disallowing framing
    res.setHeader("X-Frame-Options", "DENY");

    // === X-Content-Type-Options ===
    // Prevents MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // === X-XSS-Protection ===
    // Legacy XSS protection (still useful for older browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // === Referrer-Policy ===
    // Controls how much referrer information is sent
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // === Permissions-Policy ===
    // Restricts browser features (camera, microphone, geolocation, etc.)
    res.setHeader(
      "Permissions-Policy",
      [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "interest-cohort=()", // Disable FLoC
        "accelerometer=()",
        "gyroscope=()",
        "magnetometer=()",
        "payment=()",
        "usb=()",
        "bluetooth=()",
      ].join(", ")
    );

    // === Content-Security-Policy ===
    // Comprehensive CSP to prevent XSS and data injection attacks
    const cspDirectives = buildCSPDirectives(nonce, config);
    res.setHeader("Content-Security-Policy", cspDirectives);

    // === X-DNS-Prefetch-Control ===
    // Controls DNS prefetching
    res.setHeader("X-DNS-Prefetch-Control", "off");

    // === X-Download-Options ===
    // Prevents IE from executing downloads in site context
    res.setHeader("X-Download-Options", "noopen");

    // === X-Permitted-Cross-Domain-Policies ===
    // Restricts Adobe Flash/Acrobat cross-domain access
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    // === Cross-Origin Headers ===
    // Additional cross-origin protections
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");

    next();
  };
}

/**
 * Build Content-Security-Policy directives
 */
function buildCSPDirectives(nonce: string, config: SecurityHeadersOptions): string {
  const directives: string[] = [];
  const isDevelopment = process.env.NODE_ENV === "development";

  // default-src: Fallback for all resource types
  directives.push("default-src 'self'");

  // script-src: JavaScript sources
  // In development, allow unsafe-inline and unsafe-eval for Vite HMR
  const scriptSources = isDevelopment
    ? [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Required for Vite HMR
        // Google Maps
        "https://maps.googleapis.com",
        "https://*.googleapis.com",
      ]
    : [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'", // Allows scripts loaded by trusted scripts
        // Trusted external scripts
        "https://js.sentry.io",
        "https://www.googletagmanager.com",
        "https://va.vercel-scripts.com", // Vercel Analytics
        // Google Maps
        "https://maps.googleapis.com",
        "https://*.googleapis.com",
        ...(config.trustedScriptSources || []),
      ];
  directives.push(`script-src ${scriptSources.join(" ")}`);

  // style-src: CSS sources
  const styleSources = [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind/CSS-in-JS (consider removing with nonce)
    "https://fonts.googleapis.com",
    ...(config.trustedStyleSources || []),
  ];
  directives.push(`style-src ${styleSources.join(" ")}`);

  // font-src: Font sources
  const fontSources = [
    "'self'",
    "https://fonts.gstatic.com",
    "data:", // For inline fonts
    ...(config.trustedFontSources || []),
  ];
  directives.push(`font-src ${fontSources.join(" ")}`);

  // img-src: Image sources
  const imageSources = [
    "'self'",
    "data:",
    "blob:",
    // Map tiles and imagery
    "https://*.tile.openstreetmap.org",
    "https://*.arcgisonline.com",
    "https://server.arcgisonline.com",
    "https://*.basemaps.cartocdn.com",
    // HeyGen avatars
    "https://*.heygen.com",
    "https://files.heygen.ai",
    // AWS S3 for uploads
    "https://*.s3.amazonaws.com",
    "https://*.s3.ap-southeast-2.amazonaws.com",
    // Supabase storage
    "https://*.supabase.co",
    // Google Maps
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    // TerriaJS/National Map WMS
    "https://terria-catalog-services.data.gov.au",
    "https://*.data.gov.au",
    ...(config.trustedImageSources || []),
  ];
  directives.push(`img-src ${imageSources.join(" ")}`);

  // connect-src: XHR, WebSocket, EventSource destinations
  const connectSources = [
    "'self'",
    // Vite HMR websocket in development
    ...(isDevelopment ? ["ws://localhost:*", "ws://127.0.0.1:*"] : []),
    // Authentication
    "https://api.okta.com",
    "https://*.okta.com",
    // Error tracking
    "https://*.ingest.sentry.io",
    "https://*.sentry.io",
    // AI services
    "https://api.openai.com",
    "https://api.heygen.com",
    "https://*.heygen.com",
    // Vercel Analytics
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    // External AI backend
    "https://abfi-ai.vercel.app",
    // Manus AI
    "https://api.manus.ai",
    // Supabase
    "https://*.supabase.co",
    // Google Maps API
    "https://*.googleapis.com",
    // Australian Government APIs
    "https://www.longpaddock.qld.gov.au", // SILO
    "https://esoil.io", // SLGA
    "https://data.cer.gov.au", // CER
    "https://abr.business.gov.au", // ABR
    // TerriaJS WMS
    "https://terria-catalog-services.data.gov.au",
    "https://*.data.gov.au",
    // WebSocket for real-time
    "wss://*.supabase.co",
    ...(config.trustedConnectSources || []),
  ];
  directives.push(`connect-src ${connectSources.join(" ")}`);

  // media-src: Audio/video sources
  const mediaSources = [
    "'self'",
    "blob:",
    "https://*.heygen.com",
    "https://files.heygen.ai",
  ];
  directives.push(`media-src ${mediaSources.join(" ")}`);

  // frame-src: Iframe sources
  const frameSources = [
    "'self'",
    "https://*.heygen.com", // HeyGen embeds
    ...(config.trustedFrameSources || []),
  ];
  directives.push(`frame-src ${frameSources.join(" ")}`);

  // worker-src: Web Worker sources
  directives.push("worker-src 'self' blob:");

  // child-src: Deprecated but still used by some browsers
  directives.push("child-src 'self' blob:");

  // object-src: Plugin sources (Flash, etc.)
  directives.push("object-src 'none'");

  // base-uri: Restrict <base> element
  directives.push("base-uri 'self'");

  // form-action: Restrict form submissions
  directives.push("form-action 'self'");

  // frame-ancestors: Who can embed this page (replaces X-Frame-Options in modern browsers)
  directives.push("frame-ancestors 'none'");

  // upgrade-insecure-requests: Upgrade HTTP to HTTPS
  if (process.env.NODE_ENV === "production") {
    directives.push("upgrade-insecure-requests");
  }

  // report-uri / report-to: CSP violation reporting (optional)
  // Uncomment and configure if you have a CSP reporting endpoint
  // directives.push("report-uri /api/csp-report");
  // directives.push("report-to csp-endpoint");

  return directives.join("; ");
}

/**
 * Middleware to add CSP nonce to HTML responses
 * Use this with your HTML template to inject the nonce
 */
export function injectNonceToHTML(html: string, nonce: string): string {
  // Replace placeholder with actual nonce
  return html.replace(/__CSP_NONCE__/g, nonce);
}

/**
 * Rate limiting configuration for authentication endpoints
 * Implements Essential Eight application control
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Error message
}

// In-memory rate limit store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting middleware
 * For production, consider using @upstash/ratelimit with Redis
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = "Too many requests" } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    // Get client identifier (IP address)
    const clientId = getClientIP(req);
    const now = Date.now();
    const key = `${clientId}:${req.path}`;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count).toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000).toString());

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString());
      return res.status(429).json({
        error: "rate_limit_exceeded",
        message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: Request): string {
  // Check common proxy headers
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(",")[0];
    return ips.trim();
  }

  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  },
  // Standard limit for API endpoints
  api: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 requests per hour
    message: "Rate limit exceeded. Please try again later.",
  },
  // Relaxed limit for public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: "Too many requests. Please slow down.",
  },
};

export default securityHeaders;
