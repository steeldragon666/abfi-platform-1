import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

// Enable test mode for deployed testing - provides a default admin user when not authenticated
// Set ENABLE_TEST_MODE=true in environment to enable
const TEST_MODE_ENABLED = process.env.ENABLE_TEST_MODE === "true" || process.env.NODE_ENV !== "production";

// Default test user for testing all features without login
const TEST_USER: User = {
  id: 1,
  openId: "test-admin-user",
  name: "Test Admin",
  email: "admin@test.abfi.io",
  role: "admin", // Admin role to access all features
  loginMethod: "test",
  lastSignedIn: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // In test mode, provide a default admin user when not authenticated
  // This allows testing all features without requiring login
  if (!user && TEST_MODE_ENABLED) {
    user = TEST_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
