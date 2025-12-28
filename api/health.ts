/**
 * Health Check API Route
 * Lightweight endpoint for monitoring - no heavy dependencies
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
  });
}
