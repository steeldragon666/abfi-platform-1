import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePortal } from "@/contexts/PortalContext";
import { NavItem, NavSection, NavSeparator } from "./NavItem";
import { PortalSwitcher } from "./PortalSwitcher";
import { GLOBAL_NAV_ITEMS } from "@/config/navigation";
import { useUserRole } from "@/contexts/UserRoleContext";

interface SideNavigationProps {
  className?: string;
}

export function SideNavigation({ className }: SideNavigationProps) {
  const {
    sidebarCollapsed,
    toggleSidebar,
    getFilteredPrimaryActions,
    getFilteredSecondaryActions,
    portalConfig,
  } = usePortal();
  const { role } = useUserRole();

  const primaryActions = getFilteredPrimaryActions();
  const secondaryActions = getFilteredSecondaryActions();

  // Filter global nav items by role
  const globalItems = GLOBAL_NAV_ITEMS.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col h-full border-r transition-all duration-300",
          "bg-white dark:bg-gray-950", // Solid background for legibility
          sidebarCollapsed ? "w-16" : "w-64",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Primary Navigation - TopBar has the PortalSwitcher */}
        <div className="flex-1 overflow-y-auto py-4 px-2 pt-6">
          <NavSection
            label={portalConfig.label}
            collapsed={sidebarCollapsed}
          >
            {primaryActions.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={sidebarCollapsed}
              />
            ))}
          </NavSection>

          {/* Secondary Navigation */}
          {secondaryActions.length > 0 && (
            <>
              <NavSeparator />
              <NavSection label="More" collapsed={sidebarCollapsed}>
                {secondaryActions.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    collapsed={sidebarCollapsed}
                  />
                ))}
              </NavSection>
            </>
          )}

          {/* Global Navigation */}
          {globalItems.length > 0 && (
            <>
              <NavSeparator />
              <NavSection label="Resources" collapsed={sidebarCollapsed}>
                {globalItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    collapsed={sidebarCollapsed}
                  />
                ))}
              </NavSection>
            </>
          )}
        </div>

        {/* Collapse Toggle - Bottom */}
        <div className="border-t p-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full min-h-[44px]", // WCAG touch target
              sidebarCollapsed ? "justify-center" : "justify-start"
            )}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeft className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// Mobile Sidebar Overlay
interface MobileSideNavigationProps {
  className?: string;
}

export function MobileSideNavigation({ className }: MobileSideNavigationProps) {
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
    getFilteredPrimaryActions,
    getFilteredSecondaryActions,
    portalConfig,
  } = usePortal();
  const { role } = useUserRole();

  const primaryActions = getFilteredPrimaryActions();
  const secondaryActions = getFilteredSecondaryActions();
  const globalItems = GLOBAL_NAV_ITEMS.filter((item) =>
    item.roles.includes(role)
  );

  if (!mobileMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <TooltipProvider>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 shadow-xl lg:hidden",
            "bg-white dark:bg-gray-950", // Solid background for legibility
            "animate-in slide-in-from-left duration-300",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b h-16 px-4">
            <PortalSwitcher variant="default" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Close menu"
            >
              <ChevronsLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <NavSection label={portalConfig.label}>
              {primaryActions.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </NavSection>

            {secondaryActions.length > 0 && (
              <>
                <NavSeparator />
                <NavSection label="More">
                  {secondaryActions.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </NavSection>
              </>
            )}

            {globalItems.length > 0 && (
              <>
                <NavSeparator />
                <NavSection label="Resources">
                  {globalItems.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </NavSection>
              </>
            )}
          </div>
        </aside>
      </TooltipProvider>
    </>
  );
}
