import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/* ==========================================================================
   EmptyState - Phase 4 UI/UX Enhanced Component
   Displays contextual empty, error, or status states with optional actions
   Supports dark mode, multiple variants, and preset configurations
   ========================================================================== */

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center rounded-xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border border-dashed border-border",
        subtle: "bg-muted/30 border border-dashed border-border/50",
        card: "bg-card border border-border shadow-sm",
        error: "bg-destructive/5 border border-dashed border-destructive/30 dark:bg-destructive/10",
        success: "bg-success/5 border border-dashed border-success/30 dark:bg-success/10",
        warning: "bg-warning/5 border border-dashed border-warning/30 dark:bg-warning/10",
        info: "bg-info/5 border border-dashed border-info/30 dark:bg-info/10",
      },
      size: {
        sm: "py-8 px-6 gap-3",
        default: "py-12 px-8 gap-4",
        lg: "py-16 px-10 gap-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const iconContainerVariants = cva(
  "flex items-center justify-center rounded-full transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        subtle: "bg-muted/50 text-muted-foreground",
        card: "bg-muted text-muted-foreground",
        error: "bg-destructive/10 text-destructive dark:bg-destructive/20",
        success: "bg-success/10 text-success dark:bg-success/20",
        warning: "bg-warning/10 text-warning dark:bg-warning/20",
        info: "bg-info/10 text-info dark:bg-info/20",
      },
      size: {
        sm: "w-12 h-12 p-2.5",
        default: "w-16 h-16 p-3.5",
        lg: "w-20 h-20 p-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Icon to display - typically a Lucide icon or SVG */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Descriptive text below the title */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom content to render below description */
  children?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      title,
      description,
      action,
      secondaryAction,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant, size }), className)}
        role="status"
        aria-label={title}
        {...props}
      >
        {icon && (
          <div className={cn(iconContainerVariants({ variant, size }))}>
            {icon}
          </div>
        )}

        <div className="space-y-2 max-w-md">
          <h3
            className={cn(
              "font-semibold text-foreground",
              size === "sm" && "text-base",
              size === "default" && "text-lg",
              size === "lg" && "text-xl"
            )}
          >
            {title}
          </h3>
          {description && (
            <p
              className={cn(
                "text-muted-foreground leading-relaxed",
                size === "sm" && "text-sm",
                size === "default" && "text-sm",
                size === "lg" && "text-base"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {children}

        {(action || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {action && (
              <Button
                variant={action.variant || "default"}
                size={size === "sm" ? "sm" : "default"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="ghost"
                size={size === "sm" ? "sm" : "default"}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

/* ==========================================================================
   SVG Icons for preset empty states
   ========================================================================== */

const IconInbox = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const IconSearch = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const IconAlert = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const IconWifi = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);

const IconLock = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const IconDocument = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={cn("w-7 h-7", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ==========================================================================
   Pre-configured Empty State Presets for common use cases
   ========================================================================== */

interface PresetEmptyStateProps extends Omit<EmptyStateProps, "title" | "icon"> {
  title?: string;
  icon?: React.ReactNode;
}

/** No data found state */
export const EmptyStateNoData: React.FC<PresetEmptyStateProps> = ({
  title = "No data yet",
  description = "Get started by creating your first item.",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    icon={<IconInbox />}
    {...props}
  />
);

/** Search returned no results */
export const EmptyStateNoResults: React.FC<PresetEmptyStateProps> = ({
  title = "No results found",
  description = "Try adjusting your search or filter criteria to find what you're looking for.",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    icon={<IconSearch />}
    {...props}
  />
);

/** Error state */
export const EmptyStateError: React.FC<PresetEmptyStateProps> = ({
  title = "Something went wrong",
  description = "We encountered an error loading this content. Please try again.",
  variant = "error",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    variant={variant}
    icon={<IconAlert />}
    {...props}
  />
);

/** Offline state */
export const EmptyStateOffline: React.FC<PresetEmptyStateProps> = ({
  title = "You're offline",
  description = "Please check your internet connection and try again.",
  variant = "warning",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    variant={variant}
    icon={<IconWifi />}
    {...props}
  />
);

/** Permission denied state */
export const EmptyStatePermission: React.FC<PresetEmptyStateProps> = ({
  title = "Access restricted",
  description = "You don't have permission to view this content. Contact your administrator for access.",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    icon={<IconLock />}
    {...props}
  />
);

/** Empty documents/files state */
export const EmptyStateDocuments: React.FC<PresetEmptyStateProps> = ({
  title = "No documents",
  description = "Upload or create your first document to get started.",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    icon={<IconDocument />}
    {...props}
  />
);

/** Success/completed state */
export const EmptyStateSuccess: React.FC<PresetEmptyStateProps> = ({
  title = "All done!",
  description = "You've completed all items. Great work!",
  variant = "success",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    variant={variant}
    icon={<IconCheck />}
    {...props}
  />
);

export {
  EmptyState,
  emptyStateVariants,
  iconContainerVariants,
};

export default EmptyState;
