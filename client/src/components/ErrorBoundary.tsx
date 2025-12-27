/**
 * Error Boundary Component
 *
 * Catches React errors and displays a user-friendly fallback UI.
 * Reports errors to Sentry for production monitoring.
 */

import { cn } from "@/lib/utils";
import { captureException } from "@/lib/sentry";
import { AlertTriangle, RotateCcw, Home, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show the reset button */
  showReset?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary that catches React rendering errors
 * and reports them to Sentry
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log in development
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error);
      console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
          <div className="mb-6 rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="size-12 text-destructive" />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            Something went wrong
          </h2>

          <p className="mb-6 max-w-md text-muted-foreground">
            We encountered an unexpected error. Our team has been notified and
            is working on a fix.
          </p>

          {/* Show error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mb-6 max-w-lg rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
              <p className="mb-2 font-mono text-sm font-semibold text-destructive">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {this.props.showReset !== false && (
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="gap-2"
              >
                <RefreshCw className="size-4" />
                Try Again
              </Button>
            )}

            <Button onClick={this.handleRefresh} className="gap-2">
              <RotateCcw className="size-4" />
              Refresh Page
            </Button>

            <Button variant="ghost" onClick={this.handleGoHome} className="gap-2">
              <Home className="size-4" />
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Minimal error fallback for inline components
 */
export function InlineErrorFallback({
  message = "Failed to load",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}): ReactNode {
  return (
    <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertTriangle className="size-4 shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-xs underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
