import { Link } from "wouter";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { usePortal } from "@/contexts/PortalContext";
import { NavItem, NavSection, NavSeparator } from "./NavItem";
import { PortalSwitcher } from "./PortalSwitcher";
import { GLOBAL_NAV_ITEMS } from "@/config/navigation";
import { useUserRole } from "@/contexts/UserRoleContext";

// Portal accent colors for subtle theming
const PORTAL_COLORS: Record<string, string> = {
  grower: "#059669",      // Emerald
  developer: "#2563EB",   // Blue
  lender: "#7C3AED",      // Purple
  government: "#475569",  // Slate
};

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

  const portalColor = PORTAL_COLORS[portalConfig.id] || PORTAL_COLORS.grower;

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col h-full border-r transition-all duration-300",
          "bg-white dark:bg-gray-950",
          sidebarCollapsed ? "w-16" : "w-64",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Sidebar Header - Brand + Portal Switcher */}
        <div className="shrink-0 border-b">
          {/* Portal accent bar */}
          <div
            className="h-1 transition-colors duration-300"
            style={{ backgroundColor: portalColor }}
            aria-hidden="true"
          />

          {/* Brand Logo */}
          <div className={cn(
            "flex items-center h-14 px-3",
            sidebarCollapsed ? "justify-center" : "justify-start"
          )}>
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] shadow-sm hover:shadow-md transition-shadow"
                    aria-label="ABFI Home"
                  >
                    <span className="text-sm font-bold text-white tracking-tight">AB</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">ABFI Platform</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                aria-label="ABFI Home"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] shadow-sm">
                  <span className="text-sm font-bold text-white tracking-tight">AB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                    ABFI
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider -mt-0.5">
                    Platform
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Portal Switcher */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-3">
              <PortalSwitcher variant="sidebar" />
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2">
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
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <TooltipProvider>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 shadow-xl",
            "bg-white dark:bg-gray-950 border-r", // Solid background for legibility
            "animate-in slide-in-from-left duration-200",
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
