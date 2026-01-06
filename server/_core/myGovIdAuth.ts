/**
 * myGovID OAuth 2.0 / OpenID Connect Integration
 *
 * Implements the Australian Government's myGovID authentication system
 * for government portal access. Uses PKCE for enhanced security.
 *
 * Reference: https://developer.mygovid.gov.au/
 */

import { Router } from "express";
import { randomBytes, createHash } from "crypto";
import axios from "axios";
import { logger } from "../utils/logger";
import { COOKIE_NAME, SESSION_TIMEOUT_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { ENV } from "./env";

// PKCE code verifier storage (in production, use Redis or similar)
const pkceStore = new Map<string, { verifier: string; expiresAt: number }>();

// Scopes required for myGovID
const MYGOVID_SCOPES = [
  "openid",           // Required for OIDC
  "profile",          // Name, given_name, family_name
  "email",            // Email address
  "phone",            // Phone number (optional)
  "address",          // Address (optional)
].join(" ");

/**
 * Generate a cryptographically secure code verifier for PKCE
 */
function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Generate code challenge from verifier using S256 method
 */
function generateCodeChallenge(verifier: string): string {
  return createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/**
 * Generate a secure state parameter
 */
function generateState(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Clean up expired PKCE entries
 */
function cleanupPkceStore(): void {
  const now = Date.now();
  for (const [state, data] of Array.from(pkceStore.entries())) {
    if (data.expiresAt < now) {
      pkceStore.delete(state);
    }
  }
}

export function createMyGovIdRouter(): Router {
  const router = Router();

  // Cleanup expired entries periodically
  setInterval(cleanupPkceStore, 60000);

  /**
   * GET /api/mygovid/status - Check myGovID configuration status
   */
  router.get("/status", (_req, res) => {
    const configured = Boolean(
      ENV.myGovIdClientId &&
      ENV.myGovIdClientSecret
    );

    res.json({
      configured,
      issuer: ENV.myGovIdIssuer,
      environment: ENV.isProduction ? "production" : "development",
      message: configured
        ? "myGovID is configured and ready"
        : "myGovID requires configuration. Set MYGOVID_CLIENT_ID and MYGOVID_CLIENT_SECRET environment variables.",
    });
  });

  /**
   * GET /api/mygovid/authorize - Initiate myGovID login flow
   * Redirects to myGovID authorization endpoint
   */
  router.get("/authorize", (req, res) => {
    if (!ENV.myGovIdClientId) {
      res.status(503).json({
        error: "myGovID not configured",
        message: "Please configure MYGOVID_CLIENT_ID and MYGOVID_CLIENT_SECRET",
      });
      return;
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store verifier with 10-minute expiry
    pkceStore.set(state, {
      verifier: codeVerifier,
      expiresAt: Date.now() + 600000,
    });

    // Get optional return URL from query
    const returnUrl = typeof req.query.returnUrl === "string"
      ? req.query.returnUrl
      : "/";

    // Build authorization URL
    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: ENV.myGovIdClientId,
      redirect_uri: ENV.myGovIdRedirectUri,
      scope: MYGOVID_SCOPES,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      // myGovID specific parameters
      nonce: randomBytes(16).toString("hex"),
      acr_values: "urn:id.gov.au:tdif:acr:ip1:cl1", // Identity Proofing Level 1
    });

    // Store return URL in state (encoded)
    const fullState = `${state}:${Buffer.from(returnUrl).toString("base64url")}`;
    authParams.set("state", fullState);
    pkceStore.set(fullState, pkceStore.get(state)!);
    pkceStore.delete(state);

    const authUrl = `${ENV.myGovIdAuthEndpoint}?${authParams.toString()}`;

    logger.info("myGovID", Initiating authorization flow");
    res.redirect(authUrl);
  });

  /**
   * GET /api/mygovid/callback - Handle myGovID callback
   * Exchanges authorization code for tokens and creates session
   */
  router.get("/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;

    // Handle authorization errors
    if (error) {
      console.error("[myGovID] Authorization error:", error, error_description);
      res.redirect(`/login?error=${encodeURIComponent(String(error_description || error))}`);
      return;
    }

    if (typeof code !== "string" || typeof state !== "string") {
      res.status(400).json({ error: "Missing code or state parameter" });
      return;
    }

    // Retrieve and validate PKCE verifier
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
      console.error("[myGovID] Invalid or expired state");
      res.redirect("/login?error=session_expired");
      return;
    }
    pkceStore.delete(state);

    // Extract return URL from state
    const [, encodedReturnUrl] = state.split(":");
    const returnUrl = encodedReturnUrl
      ? Buffer.from(encodedReturnUrl, "base64url").toString()
      : "/";

    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post(
        ENV.myGovIdTokenEndpoint,
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: ENV.myGovIdRedirectUri,
          client_id: ENV.myGovIdClientId,
          client_secret: ENV.myGovIdClientSecret,
          code_verifier: pkceData.verifier,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, id_token } = tokenResponse.data;

      // Get user info from myGovID
      const userInfoResponse = await axios.get(ENV.myGovIdUserInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userInfo = userInfoResponse.data;
      logger.info("myGovID", User authenticated:", userInfo.sub);

      // Create or update user in database
      const openId = `mygovid:${userInfo.sub}`;
      await db.upsertUser({
        openId,
        name: userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || null,
        email: userInfo.email ?? null,
        loginMethod: "mygovid",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || userInfo.given_name || "Government User",
        expiresInMs: SESSION_TIMEOUT_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_TIMEOUT_MS,
      });

      logger.info("myGovID", Session created for user:", openId);
      res.redirect(returnUrl);
    } catch (error: any) {
      console.error("[myGovID] Token exchange failed:", error.response?.data || error.message);
      res.redirect(`/login?error=authentication_failed`);
    }
  });

  /**
   * POST /api/mygovid/logout - Logout from myGovID
   */
  router.post("/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME);

    // Optionally redirect to myGovID logout endpoint
    // For now, just clear local session
    res.json({
      success: true,
      message: "Logged out successfully",
      // myGovID end session endpoint would be:
      // logoutUrl: `${ENV.myGovIdIssuer}/oauth2/logout?...`
    });
  });

  /**
   * GET /api/mygovid/discovery - Return OIDC discovery information
   * Useful for debugging and configuration verification
   */
  router.get("/discovery", async (_req, res) => {
    try {
      const discoveryUrl = `${ENV.myGovIdIssuer}/.well-known/openid-configuration`;
      const response = await axios.get(discoveryUrl);
      res.json({
        configured: Boolean(ENV.myGovIdClientId),
        discovery: response.data,
      });
    } catch (error: any) {
      res.json({
        configured: Boolean(ENV.myGovIdClientId),
        error: "Could not fetch discovery document",
        message: error.message,
        // Provide expected configuration for reference
        expected: {
          issuer: ENV.myGovIdIssuer,
          authorization_endpoint: ENV.myGovIdAuthEndpoint,
          token_endpoint: ENV.myGovIdTokenEndpoint,
          userinfo_endpoint: ENV.myGovIdUserInfoEndpoint,
          jwks_uri: ENV.myGovIdJwksUri,
        },
      });
    }
  });

  /**
   * GET /api/mygovid/mock-login - Development mock login (non-production only)
   * Simulates myGovID login for development/testing
   */
  router.post("/mock-login", async (req, res) => {
    if (ENV.isProduction) {
      res.status(403).json({ error: "Mock login not available in production" });
      return;
    }

    const { name, email, sub } = req.body;

    const mockSub = sub || `mock-${Date.now()}`;
    const openId = `mygovid:${mockSub}`;
    const userName = name || "Government Test User";
    const userEmail = email || "test.user@gov.au";

    try {
      await db.upsertUser({
        openId,
        name: userName,
        email: userEmail,
        loginMethod: "mygovid-mock",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userName,
        expiresInMs: SESSION_TIMEOUT_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_TIMEOUT_MS,
      });

      res.json({
        success: true,
        user: {
          openId,
          name: userName,
          email: userEmail,
          loginMethod: "mygovid-mock",
        },
        message: "Mock myGovID login successful",
      });
    } catch (error) {
      console.error("[myGovID] Mock login failed:", error);
      res.status(500).json({ error: "Mock login failed" });
    }
  });

  return router;
}
