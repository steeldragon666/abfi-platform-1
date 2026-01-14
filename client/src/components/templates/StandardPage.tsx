/**
 * StandardPage - Consistent page layout template for dashboard pages
 *
 * Provides a unified structure with:
 * - Page header with title and optional action
 * - Content area with proper spacing
 * - Optional sidebar for secondary content
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageTitle({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-foreground tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}

interface StandardPageProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
  contentClassName?: string;
}

export function StandardPage({
  children,
  title,
  description,
  action,
  sidebar,
  sidebarPosition = "right",
  className,
  contentClassName,
}: StandardPageProps) {
  return (
    <div className={cn("min-h-full", className)}>
      {/* Page Header */}
      <div className="px-6 lg:px-8 py-5 border-b bg-background">
        <PageTitle title={title} description={description} action={action} />
      </div>

      {/* Page Content */}
      <div className="px-6 lg:px-8 py-6">
        {sidebar ? (
          <div
            className={cn(
              "grid gap-6 lg:gap-8",
              sidebarPosition === "right"
                ? "lg:grid-cols-[1fr_320px]"
                : "lg:grid-cols-[320px_1fr]"
            )}
          >
            {sidebarPosition === "left" && (
              <aside className="space-y-6 order-2 lg:order-1">{sidebar}</aside>
            )}
            <main
              className={cn(
                "space-y-6 min-w-0",
                sidebarPosition === "left" ? "order-1 lg:order-2" : "",
                contentClassName
              )}
            >
              {children}
            </main>
            {sidebarPosition === "right" && (
              <aside className="space-y-6">{sidebar}</aside>
            )}
          </div>
        ) : (
          <main className={cn("space-y-6", contentClassName)}>{children}</main>
        )}
      </div>
    </div>
  );
}

/**
 * Section - Groups related content within a page
 */
interface SectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base font-medium text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default StandardPage;
