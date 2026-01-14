import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortal } from "@/contexts/PortalContext";

interface BreadcrumbsProps {
  className?: string;
}

// Route to display name mapping
const routeLabels: Record<string, string> = {
  // Grower portal
  grower: "Grower Portal",
  dashboard: "Dashboard",
  listings: "Listings",
  contracts: "Contracts",
  compliance: "Compliance",
  analytics: "Analytics",
  intelligence: "Intelligence",
  climate: "Climate",
  settings: "Settings",
  // Developer portal
  developer: "Developer Portal",
  projects: "Projects",
  sourcing: "Sourcing",
  "demand-signals": "Demand Signals",
  // Lender portal
  lender: "Lender Portal",
  finance: "Finance",
  portfolio: "Portfolio",
  "risk-assessment": "Risk Assessment",
  // Government portal
  government: "Government Portal",
  regulatory: "Regulatory",
  reporting: "Reporting",
  // Common
  profile: "Profile",
  preferences: "Preferences",
  notifications: "Notifications",
  explainers: "Help & Support",
  marketplace: "Marketplace",
  map: "Map",
  // Detail pages
  new: "New",
  edit: "Edit",
  details: "Details",
};

function formatBreadcrumbLabel(segment: string): string {
  // Check if we have a predefined label
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // Handle UUIDs or IDs - show abbreviated version
  if (segment.match(/^[0-9a-f-]{36}$/i)) {
    return `#${segment.slice(0, 8)}`;
  }

  // Handle numeric IDs
  if (segment.match(/^\d+$/)) {
    return `#${segment}`;
  }

  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const [location] = useLocation();
  const { portalConfig } = usePortal();

  // Split path into segments and filter empty strings
  const segments = location.split("/").filter(Boolean);

  // Don't show breadcrumbs on home page or if only one segment
  if (segments.length <= 1) {
    return null;
  }

  // Build breadcrumb items with paths
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = formatBreadcrumbLabel(segment);
    const isLast = index === segments.length - 1;

    return { segment, path, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn(
        "flex items-center h-10 px-6 lg:px-8",
        "border-b border-gray-100 dark:border-gray-800",
        "bg-white dark:bg-gray-950",
        className
      )}
    >
      <ol className="flex items-center gap-1 text-sm" role="list">
        {/* Home link */}
        <li className="flex items-center">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-1 px-1.5 py-1 rounded",
              "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </li>

        {/* Separator after home */}
        <li aria-hidden="true" className="text-gray-300 dark:text-gray-600">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>

        {/* Dynamic breadcrumbs */}
        {breadcrumbs.map(({ segment, path, label, isLast }, index) => (
          <li key={path} className="flex items-center">
            {isLast ? (
              <span
                className="px-1.5 py-1 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]"
                aria-current="page"
              >
                {label}
              </span>
            ) : (
              <>
                <Link
                  href={path}
                  className={cn(
                    "px-1.5 py-1 rounded truncate max-w-[150px]",
                    "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  {label}
                </Link>
                <span aria-hidden="true" className="text-gray-300 dark:text-gray-600 ml-1">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
