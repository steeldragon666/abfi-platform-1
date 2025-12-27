/**
 * Development Authentication System
 *
 * Provides a working auth system for local development without requiring
 * external OAuth providers. In production, use the real OAuth flow.
 */

import { Router } from "express";
import { COOKIE_NAME, SESSION_TIMEOUT_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

// Demo users for development
const DEV_USERS = [
  { id: 1, openId: "dev-user-1", name: "Alice Developer", email: "alice@dev.local", role: "admin" },
  { id: 2, openId: "dev-user-2", name: "Bob Producer", email: "bob@dev.local", role: "producer" },
  { id: 3, openId: "dev-user-3", name: "Carol Buyer", email: "carol@dev.local", role: "buyer" },
  { id: 4, openId: "dev-user-4", name: "Dan Analyst", email: "dan@dev.local", role: "analyst" },
];

export function createDevAuthRouter(): Router {
  const router = Router();

  // Only enable in development
  if (process.env.NODE_ENV === "production") {
    router.use((_req, res) => {
      res.status(403).json({ error: "Dev auth not available in production" });
    });
    return router;
  }

  // GET /api/dev-auth/users - List available dev users
  router.get("/users", (_req, res) => {
    res.json({
      message: "Development authentication - select a user to login",
      users: DEV_USERS.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
    });
  });

  // POST /api/dev-auth/login - Login as a dev user
  router.post("/login", async (req, res) => {
    const { userId, email } = req.body;

    // Find user by ID or email
    const devUser = DEV_USERS.find(u =>
      u.id === userId || u.email === email || u.openId === userId
    );

    if (!devUser) {
      res.status(400).json({
        error: "Invalid user",
        availableUsers: DEV_USERS.map(u => ({ id: u.id, name: u.name }))
      });
      return;
    }

    try {
      // Upsert user in database
      await db.upsertUser({
        openId: devUser.openId,
        name: devUser.name,
        email: devUser.email,
        loginMethod: "dev",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(devUser.openId, {
        name: devUser.name,
        expiresInMs: SESSION_TIMEOUT_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_TIMEOUT_MS,
      });

      res.json({
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
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/dev-auth/logout - Logout current user
  router.post("/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true, message: "Logged out" });
  });

  // GET /api/dev-auth/me - Get current user info
  router.get("/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({
        authenticated: true,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch {
      res.json({ authenticated: false, user: null });
    }
  });

  return router;
}
