/**
 * Vercel Serverless Function: POST /api/dev-auth/login
 * Logs in as a dev user for development/preview deployments
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT } from "jose";

// Demo users for development
const DEV_USERS = [
  { id: 1, openId: "dev-user-1", name: "Alice Developer", email: "alice@dev.local", role: "admin" },
  { id: 2, openId: "dev-user-2", name: "Bob Producer", email: "bob@dev.local", role: "producer" },
  { id: 3, openId: "dev-user-3", name: "Carol Buyer", email: "carol@dev.local", role: "buyer" },
  { id: 4, openId: "dev-user-4", name: "Dan Analyst", email: "dan@dev.local", role: "analyst" },
];

const COOKIE_NAME = "abfi_session";
const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Dev auth is enabled for all Vercel deployments (demo mode)
  const isVercel = !!process.env.VERCEL;
  const devAuthEnabled = process.env.ENABLE_DEV_AUTH !== "false";

  if (!isVercel && !devAuthEnabled) {
    return res.status(403).json({
      error: "Dev auth not available",
    });
  }

  const { userId, email } = req.body || {};

  // Find user by ID or email
  const devUser = DEV_USERS.find(u =>
    u.id === userId || u.email === email || u.openId === userId
  );

  if (!devUser) {
    return res.status(400).json({
      error: "Invalid user",
      availableUsers: DEV_USERS.map(u => ({ id: u.id, name: u.name }))
    });
  }

  try {
    // Create a simple JWT token
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || "dev-secret-key-change-in-production"
    );

    const token = await new SignJWT({
      sub: devUser.openId,
      name: devUser.name,
      email: devUser.email,
      role: devUser.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // Set session cookie
    const isSecure = req.headers.host?.includes("vercel.app") || req.headers["x-forwarded-proto"] === "https";

    res.setHeader("Set-Cookie", [
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TIMEOUT_MS / 1000}${isSecure ? "; Secure" : ""}`
    ]);

    return res.status(200).json({
      success: true,
      user: {
        id: devUser.id,
        name: devUser.name,
        email: devUser.email,
        role: devUser.role,
      },
      message: `Logged in as ${devUser.name}`,
    });
  } catch (error) {
    console.error("[DevAuth] Login failed:", error);
    return res.status(500).json({ error: "Login failed" });
  }
}
