/**
 * Certificate Verification API Route
 * Verifies ABFI certificates by their SHA-256 hash
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Rate limiting state (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(req: VercelRequest, res: VercelResponse): boolean {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
             req.headers["x-real-ip"]?.toString() ||
             "unknown";
  const now = Date.now();

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
    res.setHeader("X-RateLimit-Remaining", (RATE_LIMIT_MAX_REQUESTS - 1).toString());
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString());
    res.status(429).json({
      valid: false,
      error: "rate_limit_exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return false;
  }

  entry.count++;
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
  res.setHeader("X-RateLimit-Remaining", (RATE_LIMIT_MAX_REQUESTS - entry.count).toString());
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkRateLimit(req, res)) {
    return;
  }

  const { hash } = req.query;
  const hashStr = Array.isArray(hash) ? hash[0] : hash;

  // Validate hash format (SHA-256 = 64 hex characters)
  if (!hashStr || !/^[a-fA-F0-9]{64}$/.test(hashStr)) {
    res.status(400).json({
      valid: false,
      error: "invalid_hash",
      message: "Invalid hash format. Expected 64-character hexadecimal SHA-256 hash.",
    });
    return;
  }

  try {
    // Dynamically import db to reduce bundle size
    const db = await import("../../server/db");

    // Look up the certificate snapshot by hash
    const snapshot = await db.getCertificateSnapshotByHash(hashStr.toLowerCase());

    if (!snapshot) {
      res.status(404).json({
        valid: false,
        error: "certificate_not_found",
        message: "No certificate found with this hash.",
      });
      return;
    }

    // Get the certificate record
    const certificate = await db.getCertificate(snapshot.certificateId);

    if (!certificate) {
      res.status(404).json({
        valid: false,
        error: "certificate_not_found",
        message: "Certificate record not found.",
      });
      return;
    }

    // Return verification result
    res.json({
      valid: true,
      certificate: {
        snapshotDate: snapshot.snapshotDate,
        certificateType: certificate.certificateType,
        entityName: certificate.entityName,
        entityType: certificate.entityType,
        rating: snapshot.ratingGrade,
        score: snapshot.score,
        evidenceCount: snapshot.evidenceCount,
        issuer: {
          name: "ABFI Registry",
          platform: "Australian Biofuels Framework Initiative",
        },
        disclaimers: [
          "This certificate represents a point-in-time snapshot of the entity's ABFI rating.",
          "Ratings may change based on updated evidence and assessments.",
          "This verification confirms the certificate was issued by the ABFI Registry.",
        ],
      },
    });
  } catch (error) {
    console.error("[Verify] Error:", error);
    res.status(500).json({
      valid: false,
      error: "internal_error",
      message: "An error occurred while verifying the certificate.",
    });
  }
}
