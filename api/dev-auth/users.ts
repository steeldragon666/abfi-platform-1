/**
 * Vercel Serverless Function: GET /api/dev-auth/users
 * Lists available dev users for development/preview deployments
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// Demo users for development
const DEV_USERS = [
  { id: 1, name: "Alice Developer", email: "alice@dev.local", role: "admin" },
  { id: 2, name: "Bob Producer", email: "bob@dev.local", role: "producer" },
  { id: 3, name: "Carol Buyer", email: "carol@dev.local", role: "buyer" },
  { id: 4, name: "Dan Analyst", email: "dan@dev.local", role: "analyst" },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Dev auth is enabled for all Vercel deployments (demo mode)
  // In production with real OAuth, this endpoint would be disabled
  const isVercel = !!process.env.VERCEL;
  const devAuthEnabled = process.env.ENABLE_DEV_AUTH !== "false"; // Enabled by default

  if (!isVercel && !devAuthEnabled) {
    return res.status(403).json({
      error: "Dev auth not available",
      hint: "Running in non-Vercel environment without ENABLE_DEV_AUTH"
    });
  }

  return res.status(200).json({
    message: "Development authentication - select a user to login",
    users: DEV_USERS,
  });
}
