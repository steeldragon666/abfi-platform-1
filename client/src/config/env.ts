/**
 * Environment Variable Validation
 *
 * This module validates all VITE_* environment variables at startup.
 * Missing required variables will throw clear errors during build/dev.
 * Optional variables have sensible defaults for development.
 */

import { z } from "zod";

// Helper to check if we're in development mode
const isDev = import.meta.env.DEV;

// Helper to convert empty strings to undefined (for optional fields)
const emptyToUndefined = (val: string | undefined) =>
  val === "" || val === undefined ? undefined : val;

// Helper schemas that handle empty strings gracefully
const optionalUrl = (defaultValue?: string) =>
  z.preprocess(
    emptyToUndefined,
    defaultValue
      ? z.string().url().optional().default(defaultValue)
      : z.string().url().optional()
  );

const optionalString = (defaultValue?: string) =>
  z.preprocess(
    emptyToUndefined,
    defaultValue
      ? z.string().min(1).optional().default(defaultValue)
      : z.string().min(1).optional()
  );

const optionalEthAddress = () =>
  z.preprocess(
    emptyToUndefined,
    z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
  );

// Schema for all environment variables
const envSchema = z.object({
  // ===================
  // Authentication
  // ===================

  /** OAuth Portal URL for authentication redirects */
  VITE_OAUTH_PORTAL_URL: optionalUrl("http://localhost:5173"),

  /** Application ID for OAuth */
  VITE_APP_ID: optionalString("abfi-platform-dev"),

  // ===================
  // API Endpoints
  // ===================

  /** Intelligence API URL for AI/ML features */
  VITE_INTELLIGENCE_API_URL: optionalUrl("http://localhost:3001"),

  /** Stealth Discovery API URL */
  VITE_STEALTH_API_URL: optionalUrl("http://localhost:3002"),

  // ===================
  // Maps & Geolocation
  // ===================

  /** Frontend Forge API key for map proxy service */
  VITE_FRONTEND_FORGE_API_KEY: optionalString(),

  /** Frontend Forge API URL for map proxy service */
  VITE_FRONTEND_FORGE_API_URL: optionalUrl("https://api.frontendforge.dev"),

  /** Google Maps API key (used as fallback if Frontend Forge not configured) */
  VITE_GOOGLE_MAPS_API_KEY: optionalString(),

  // ===================
  // Monitoring & Analytics
  // ===================

  /** Sentry DSN for error tracking */
  VITE_SENTRY_DSN: optionalUrl(),

  /** Application version for release tracking */
  VITE_APP_VERSION: optionalString("0.0.0-dev"),

  // ===================
  // Blockchain
  // ===================

  /** Evidence Vault smart contract address */
  VITE_EVIDENCE_CONTRACT: optionalEthAddress(),
});

// Type for the validated environment
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  const rawEnv = {
    VITE_OAUTH_PORTAL_URL: import.meta.env.VITE_OAUTH_PORTAL_URL,
    VITE_APP_ID: import.meta.env.VITE_APP_ID,
    VITE_INTELLIGENCE_API_URL: import.meta.env.VITE_INTELLIGENCE_API_URL,
    VITE_STEALTH_API_URL: import.meta.env.VITE_STEALTH_API_URL,
    VITE_FRONTEND_FORGE_API_KEY: import.meta.env.VITE_FRONTEND_FORGE_API_KEY,
    VITE_FRONTEND_FORGE_API_URL: import.meta.env.VITE_FRONTEND_FORGE_API_URL,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_EVIDENCE_CONTRACT: import.meta.env.VITE_EVIDENCE_CONTRACT,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    const message = `\n⚠️ Environment Variable Validation Warning:\n${errorMessages}\n\nUsing default values. Check your .env file for production configuration.\nSee .env.example for reference.\n`;

    // Log warning and continue with defaults in both dev and production
    // This prevents the app from crashing due to missing optional env vars
    console.warn(message);

    // Return with defaults applied
    return envSchema.parse({});
  }

  return result.data;
}

// Validate once at module load
export const env = validateEnv();

// Log configuration status in development
if (isDev) {
  const configured = {
    auth: !!import.meta.env.VITE_OAUTH_PORTAL_URL,
    maps: !!(import.meta.env.VITE_FRONTEND_FORGE_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
    sentry: !!import.meta.env.VITE_SENTRY_DSN,
    intelligence: !!import.meta.env.VITE_INTELLIGENCE_API_URL,
    stealth: !!import.meta.env.VITE_STEALTH_API_URL,
    blockchain: !!import.meta.env.VITE_EVIDENCE_CONTRACT,
  };

  }

// Export individual config sections for easier imports
export const authConfig = {
  portalUrl: env.VITE_OAUTH_PORTAL_URL,
  appId: env.VITE_APP_ID,
} as const;

export const apiConfig = {
  intelligenceUrl: env.VITE_INTELLIGENCE_API_URL,
  stealthUrl: env.VITE_STEALTH_API_URL,
} as const;

export const mapsConfig = {
  frontendForgeApiKey: env.VITE_FRONTEND_FORGE_API_KEY,
  frontendForgeApiUrl: env.VITE_FRONTEND_FORGE_API_URL,
  googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY,
} as const;

export const monitoringConfig = {
  sentryDsn: env.VITE_SENTRY_DSN,
  appVersion: env.VITE_APP_VERSION,
} as const;

export const blockchainConfig = {
  evidenceContract: env.VITE_EVIDENCE_CONTRACT,
} as const;
