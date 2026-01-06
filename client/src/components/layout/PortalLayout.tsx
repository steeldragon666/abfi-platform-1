import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { PortalProvider, usePortal } from "@/contexts/PortalContext";
import { TopBar } from "@/components/navigation/TopBar";
import { MobileSideNavigation } from "@/components/navigation/SideNavigation";
import { QuickActions } from "@/components/navigation/QuickActions";
import { TrustHeader } from "@/components/layout/TrustHeader";
import { IntelligenceRail } from "@/components/layout/IntelligenceRail";
import { ProvenanceFooter } from "@/components/layout/ProvenanceFooter";

interface PortalLayoutProps {
  children: ReactNode;
  className?: string;
}

function PortalLayoutInner({ children, className }: PortalLayoutProps) {
  const { portalConfig } = usePortal();
  const [railCollapsed, setRailCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-4 focus:left-4 focus:z-50",
          "focus:bg-primary focus:text-primary-foreground",
          "focus:px-4 focus:py-2 focus:rounded-md focus:outline-none"
        )}
      >
        Skip to main content
      </a>

      {/* Top Navigation Bar */}
      <TopBar />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Overlay - Always use hamburger menu */}
        <MobileSideNavigation />

        {/* Main Content Area */}
        <main
          id="main-content"
          className={cn(
            "flex-1 overflow-y-auto",
            "transition-all duration-300",
            className
          )}
          role="main"
          aria-label={`${portalConfig.label} portal content`}
        >
          <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col px-8 py-6">
            <TrustHeader />
            <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
              <section
                className={cn(
                  "min-w-0",
                  railCollapsed ? "lg:col-span-11" : "lg:col-span-9"
                )}
                aria-label="Primary content"
              >
                {children}
              </section>
              <div
                className={cn(
                  "lg:col-span-3",
                  railCollapsed && "lg:col-span-1"
                )}
              >
                <IntelligenceRail
                  collapsed={railCollapsed}
                  onToggle={() => setRailCollapsed((prev) => !prev)}
                />
              </div>
            </div>
            <ProvenanceFooter />
          </div>
        </main>
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
