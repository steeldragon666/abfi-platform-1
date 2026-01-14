import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { PortalProvider, usePortal } from "@/contexts/PortalContext";
import { TopBar } from "@/components/navigation/TopBar";
import { SideNavigation, MobileSideNavigation } from "@/components/navigation/SideNavigation";
import { QuickActions } from "@/components/navigation/QuickActions";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ProvenanceFooter } from "@/components/layout/ProvenanceFooter";

interface PortalLayoutProps {
  children: ReactNode;
  className?: string;
}

function PortalLayoutInner({ children, className }: PortalLayoutProps) {
  const { portalConfig, sidebarCollapsed } = usePortal();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
      {/* Skip Link for Accessibility - WCAG 2.1 AA */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
          "focus:bg-[#D4AF37] focus:text-black focus:font-medium",
          "focus:px-4 focus:py-2 focus:rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "focus:shadow-lg"
        )}
      >
        Skip to main content
      </a>

      <div className="flex h-screen">
        {/* Desktop Sidebar - Persistent */}
        <div className="hidden lg:block">
          <SideNavigation />
        </div>

        {/* Mobile Sidebar Overlay */}
        <MobileSideNavigation />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navigation Bar */}
          <TopBar />

          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Scrollable Content */}
          <main
            id="main-content"
            className={cn(
              "flex-1 overflow-y-auto",
              className
            )}
            role="main"
            aria-label={`${portalConfig.label} portal content`}
          >
            <div className="mx-auto w-full max-w-[1280px] px-6 py-6 lg:px-8">
              {children}
              <ProvenanceFooter />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <QuickActions />
    </div>
  );
}

// Wrapped with PortalProvider
export function PortalLayout({ children, className }: PortalLayoutProps) {
  return (
    <PortalProvider>
      <PortalLayoutInner className={className}>{children}</PortalLayoutInner>
    </PortalProvider>
  );
}

// Portal-specific layout wrappers
interface PortalSpecificLayoutProps {
  children: ReactNode;
  className?: string;
}

export function GrowerPortalLayout({ children, className }: PortalSpecificLayoutProps) {
  return (
    <PortalLayout className={cn("grower-portal", className)}>
      {children}
    </PortalLayout>
  );
}

export function DeveloperPortalLayout({ children, className }: PortalSpecificLayoutProps) {
  return (
    <PortalLayout className={cn("developer-portal", className)}>
      {children}
    </PortalLayout>
  );
}

export function LenderPortalLayout({ children, className }: PortalSpecificLayoutProps) {
  return (
    <PortalLayout className={cn("lender-portal", className)}>
      {children}
    </PortalLayout>
  );
}

export function GovernmentPortalLayout({ children, className }: PortalSpecificLayoutProps) {
  return (
    <PortalLayout className={cn("government-portal", className)}>
      {children}
    </PortalLayout>
  );
}
