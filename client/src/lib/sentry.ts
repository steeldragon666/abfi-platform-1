/**
 * Sentry Error Tracking Configuration
 *
 * Implements production error monitoring for ABFI Platform.
 * Captures unhandled errors, React errors, and API failures.
 */

import * as Sentry from "@sentry/react";

// Check if running in production and DSN is configured
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const ENVIRONMENT = import.meta.env.MODE || "development";

/**
 * Initialize Sentry error tracking
 * Should be called before React renders
 */
export function initSentry(): void {
  // Skip initialization if no DSN configured
  if (!SENTRY_DSN) {
    if (IS_PRODUCTION) {
      console.warn("[Sentry] No DSN configured. Error tracking disabled.");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Only enable in production by default
    enabled: IS_PRODUCTION,

    // Sample rate for performance monitoring (0.0 to 1.0)
    // 10% of transactions in production to reduce costs
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

    // Sample rate for session replays (if enabled)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Configure which errors to ignore
    ignoreErrors: [
      // Network errors that are expected
      "Network request failed",
      "Failed to fetch",
      "Load failed",
      // User-initiated navigation
      "AbortError",
      // Browser extensions
      "chrome-extension://",
      "moz-extension://",
      // Third-party script errors
      "Script error.",
    ],

    // Don't send PII
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          // Redact auth tokens from URLs
          if (breadcrumb.data?.url) {
            breadcrumb.data.url = redactSensitiveParams(breadcrumb.data.url);
          }
          return breadcrumb;
        });
      }

      // Add ABFI-specific context
      event.tags = {
        ...event.tags,
        platform: "abfi",
        version: import.meta.env.VITE_APP_VERSION || "unknown",
      };

      return event;
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and inputs for privacy
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
  });
}

/**
 * Redact sensitive parameters from URLs
 */
function redactSensitiveParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = ["token", "key", "password", "secret", "auth"];

    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, "[REDACTED]");
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Set user context for error tracking
 * Call this after user authentication
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}): void {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    // Only include email in non-production for debugging
    email: IS_PRODUCTION ? undefined : user.email,
    // Include role for filtering errors by user type
    role: user.role,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext(): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Capture an exception manually
 * Use for caught errors that should still be tracked
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (!SENTRY_DSN) {
    console.error("[Error]", error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message/event
 * Use for non-error events that should be tracked
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>
): void {
  if (!SENTRY_DSN) {
    console.log(`[${level}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs appear in error reports to show what happened before the error
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

/**
 * Create a Sentry-wrapped error boundary for React components
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Parameters<typeof Sentry.withErrorBoundary>[1]
): React.ComponentType<P> {
  return Sentry.withErrorBoundary(Component, options);
}

// Re-export Sentry for direct access if needed
export { Sentry };
