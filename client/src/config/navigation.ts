import {
  Leaf,
  Factory,
  TrendingUp,
  Building2,
  LayoutDashboard,
  FileText,
  Award,
  FileCheck,
  DollarSign,
  Search,
  Package,
  ClipboardList,
  BarChart3,
  Eye,
  Shield,
  Briefcase,
  LineChart,
  AlertTriangle,
  FileBarChart,
  Scale,
  Settings,
  HelpCircle,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/contexts/UserRoleContext";

// Portal types
export type Portal = "grower" | "developer" | "lender" | "government" | "admin";

// Navigation item structure
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: {
    type: "count" | "status" | "new";
    value?: string | number;
  };
  children?: NavItem[];
  description?: string;
}

// Portal configuration
export interface PortalConfig {
  id: Portal;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  primaryActions: NavItem[]; // Max 5 items
  secondaryActions: NavItem[];
  quickActions: NavItem[]; // Max 3 items for mobile
  allowedRoles: UserRole[];
}

// Grower Portal Configuration
const growerPortal: PortalConfig = {
  id: "grower",
  label: "Grower",
  description: "Manage feedstock, certifications, and contracts",
  icon: Leaf,
  color: "text-emerald-600",
  bgColor: "bg-emerald-50",
  borderColor: "border-emerald-200",
  allowedRoles: ["supplier", "admin", "guest"],
  primaryActions: [
    {
      id: "grower-dashboard",
      label: "Dashboard",
      href: "/grower/dashboard",
      icon: LayoutDashboard,
      roles: ["supplier", "admin", "guest"],
      description: "Overview and quick actions",
    },
    {
      id: "grower-feedstock",
      label: "My Feedstock",
      href: "/supplier/feedstocks",
      icon: Leaf,
      roles: ["supplier", "admin", "guest"],
      description: "Manage your feedstock inventory",
    },
    {
      id: "grower-certifications",
      label: "Certifications",
      href: "/certificate-verification",
      icon: Award,
      roles: ["supplier", "admin", "guest"],
      description: "Track certification status",
    },
    {
      id: "grower-contracts",
      label: "Contracts",
      href: "/producer-registration/contracts",
      icon: FileCheck,
      roles: ["supplier", "admin", "guest"],
      description: "View and manage contracts",
    },
    {
      id: "grower-prices",
      label: "Price Trends",
      href: "/feedstock-prices",
      icon: DollarSign,
      roles: ["supplier", "admin", "guest"],
      description: "View feedstock price trends",
    },
  ],
  secondaryActions: [
    {
      id: "grower-documents",
      label: "Upload Docs",
      href: "/certificate/upload",
      icon: FileText,
      roles: ["supplier", "admin", "guest"],
    },
    {
      id: "grower-settings",
      label: "Settings",
      href: "/grower/settings",
      icon: Settings,
      roles: ["supplier", "admin", "guest"],
    },
  ],
  quickActions: [
    {
      id: "grower-quick-feedstock",
      label: "Add Feedstock",
      href: "/feedstock/create",
      icon: Leaf,
      roles: ["supplier", "admin", "guest"],
    },
    {
      id: "grower-quick-dashboard",
      label: "Dashboard",
      href: "/grower/dashboard",
      icon: LayoutDashboard,
      roles: ["supplier", "admin", "guest"],
    },
    {
      id: "grower-quick-contracts",
      label: "Contracts",
      href: "/producer-registration/contracts",
      icon: FileCheck,
      roles: ["supplier", "admin", "guest"],
    },
  ],
};

// Developer Portal Configuration
const developerPortal: PortalConfig = {
  id: "developer",
  label: "Developer",
  description: "Find suppliers and secure feedstock supply",
  icon: Factory,
  color: "text-blue-600",
  bgColor: "bg-blue-50",
  borderColor: "border-blue-200",
  allowedRoles: ["buyer", "admin", "guest"],
  primaryActions: [
    {
      id: "developer-dashboard",
      label: "Dashboard",
      href: "/developer/dashboard",
      icon: LayoutDashboard,
      roles: ["buyer", "admin", "guest"],
      description: "Overview and insights",
    },
    {
      id: "developer-registry",
      label: "Registry Explorer",
      href: "/supplier-directory",
      icon: Search,
      roles: ["buyer", "admin", "guest"],
      description: "Browse verified suppliers",
    },
    {
      id: "developer-pipeline",
      label: "Supply Chain",
      href: "/supply-chain",
      icon: Package,
      roles: ["buyer", "admin", "guest"],
      description: "Track supply commitments",
    },
    {
      id: "developer-rfqs",
      label: "Request Quote",
      href: "/quote-request",
      icon: ClipboardList,
      roles: ["buyer", "admin", "guest"],
      description: "Manage quote requests",
    },
    {
      id: "developer-analytics",
      label: "Analytics",
      href: "/lender/risk-analytics",
      icon: BarChart3,
      roles: ["buyer", "admin", "guest"],
      description: "Supply chain analytics",
    },
  ],
  secondaryActions: [
    {
      id: "developer-futures",
      label: "Futures",
      href: "/futures",
      icon: FileCheck,
      roles: ["buyer", "admin", "guest"],
    },
    {
      id: "developer-demand",
      label: "Demand Signals",
      href: "/demand-signals",
      icon: Settings,
      roles: ["buyer", "admin", "guest"],
    },
  ],
  quickActions: [
    {
      id: "developer-quick-registry",
      label: "Find Suppliers",
      href: "/supplier-directory",
      icon: Search,
      roles: ["buyer", "admin", "guest"],
    },
    {
      id: "developer-quick-dashboard",
      label: "Dashboard",
      href: "/developer/dashboard",
      icon: LayoutDashboard,
      roles: ["buyer", "admin", "guest"],
    },
    {
      id: "developer-quick-rfq",
      label: "New Quote",
      href: "/quote-request",
      icon: ClipboardList,
      roles: ["buyer", "admin", "guest"],
    },
  ],
};

// Lender Portal Configuration
const lenderPortal: PortalConfig = {
  id: "lender",
  label: "Lender",
  description: "Risk analysis and market intelligence",
  icon: TrendingUp,
  color: "text-amber-600",
  bgColor: "bg-amber-50",
  borderColor: "border-amber-200",
  allowedRoles: ["buyer", "admin", "guest"],
  primaryActions: [
    {
      id: "lender-dashboard",
      label: "Dashboard",
      href: "/finance/dashboard",
      icon: LayoutDashboard,
      roles: ["buyer", "admin", "guest"],
      description: "Intelligence overview",
    },
    {
      id: "lender-stealth",
      label: "Stealth Discovery",
      href: "/finance/stealth",
      icon: Eye,
      roles: ["buyer", "admin"],
      description: "Private market signals",
      badge: { type: "new" },
    },
    {
      id: "lender-risk",
      label: "Risk Analysis",
      href: "/finance/risk",
      icon: AlertTriangle,
      roles: ["buyer", "admin"],
      description: "Project risk scoring",
    },
    {
      id: "lender-portfolio",
      label: "Portfolio",
      href: "/finance/portfolio",
      icon: Briefcase,
      roles: ["buyer", "admin"],
      description: "Track investments",
    },
    {
      id: "lender-intelligence",
      label: "Market Intel",
      href: "/market-intelligence",
      icon: LineChart,
      roles: ["buyer", "admin", "guest"],
      description: "Price trends and signals",
    },
  ],
  secondaryActions: [
    {
      id: "lender-reports",
      label: "Reports",
      href: "/finance/reports",
      icon: FileBarChart,
      roles: ["buyer", "admin"],
    },
    {
      id: "lender-settings",
      label: "Settings",
      href: "/finance/settings",
      icon: Settings,
      roles: ["buyer", "admin"],
    },
  ],
  quickActions: [
    {
      id: "lender-quick-stealth",
      label: "Stealth",
      href: "/finance/stealth",
      icon: Eye,
      roles: ["buyer", "admin"],
    },
    {
      id: "lender-quick-dashboard",
      label: "Dashboard",
      href: "/finance/dashboard",
      icon: LayoutDashboard,
      roles: ["buyer", "admin", "guest"],
    },
    {
      id: "lender-quick-intel",
      label: "Market Intel",
      href: "/market-intelligence",
      icon: LineChart,
      roles: ["buyer", "admin", "guest"],
    },
  ],
};

// Government Portal Configuration
const governmentPortal: PortalConfig = {
  id: "government",
  label: "Government",
  description: "Compliance monitoring and policy tools",
  icon: Building2,
  color: "text-purple-600",
  bgColor: "bg-purple-50",
  borderColor: "border-purple-200",
  allowedRoles: ["admin"],
  primaryActions: [
    {
      id: "gov-dashboard",
      label: "Dashboard",
      href: "/government/dashboard",
      icon: LayoutDashboard,
      roles: ["admin"],
      description: "Compliance overview",
    },
    {
      id: "gov-compliance",
      label: "Compliance Monitor",
      href: "/government/compliance",
      icon: Shield,
      roles: ["admin"],
      description: "Track compliance status",
    },
    {
      id: "gov-audit",
      label: "Registry Audit",
      href: "/government/audit",
      icon: FileCheck,
      roles: ["admin"],
      description: "Audit trail explorer",
    },
    {
      id: "gov-reports",
      label: "Reports",
      href: "/government/reports",
      icon: FileBarChart,
      roles: ["admin"],
      description: "Generate compliance reports",
    },
    {
      id: "gov-policy",
      label: "Policy Tools",
      href: "/government/policy",
      icon: Scale,
      roles: ["admin"],
      description: "Policy modeling",
    },
  ],
  secondaryActions: [
    {
      id: "gov-settings",
      label: "Settings",
      href: "/government/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ],
  quickActions: [
    {
      id: "gov-quick-compliance",
      label: "Compliance",
      href: "/government/compliance",
      icon: Shield,
      roles: ["admin"],
    },
    {
      id: "gov-quick-dashboard",
      label: "Dashboard",
      href: "/government/dashboard",
      icon: LayoutDashboard,
      roles: ["admin"],
    },
    {
      id: "gov-quick-reports",
      label: "Reports",
      href: "/government/reports",
      icon: FileBarChart,
      roles: ["admin"],
    },
  ],
};

// All portal configurations
export const PORTAL_CONFIGS: Record<Portal, PortalConfig> = {
  grower: growerPortal,
  developer: developerPortal,
  lender: lenderPortal,
  government: governmentPortal,
  admin: {
    id: "admin",
    label: "Admin",
    description: "System administration",
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    allowedRoles: ["admin"],
    primaryActions: [
      {
        id: "admin-dashboard",
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["admin"],
      },
      {
        id: "admin-users",
        label: "Users",
        href: "/admin/users",
        icon: Building2,
        roles: ["admin"],
      },
    ],
    secondaryActions: [],
    quickActions: [],
  },
};

// Global navigation items (always visible)
export const GLOBAL_NAV_ITEMS: NavItem[] = [
  {
    id: "help",
    label: "Help",
    href: "/explainers",
    icon: HelpCircle,
    roles: ["supplier", "buyer", "admin", "guest"],
  },
  {
    id: "resources",
    label: "Resources",
    href: "/platform-features",
    icon: BookOpen,
    roles: ["supplier", "buyer", "admin", "guest"],
  },
];

// Get available portals for a user role
export function getAvailablePortals(role: UserRole): Portal[] {
  return (Object.keys(PORTAL_CONFIGS) as Portal[]).filter((portalId) => {
    const config = PORTAL_CONFIGS[portalId];
    return config.allowedRoles.includes(role);
  });
}

// Get portal config by ID
export function getPortalConfig(portal: Portal): PortalConfig {
  return PORTAL_CONFIGS[portal];
}

// Filter nav items by role
export function filterNavItemsByRole(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}

// Get default portal for a role
export function getDefaultPortal(role: UserRole): Portal {
  switch (role) {
    case "supplier":
      return "grower";
    case "buyer":
      return "developer";
    case "admin":
      return "grower";
    case "guest":
      return "lender";
    default:
      return "lender";
  }
}

// Detect portal from URL path
export function detectPortalFromPath(path: string): Portal | null {
  if (path.startsWith("/grower")) return "grower";
  if (path.startsWith("/developer")) return "developer";
  if (path.startsWith("/finance") || path.startsWith("/lender")) return "lender";
  if (path.startsWith("/government")) return "government";
  if (path.startsWith("/admin")) return "admin";
  return null;
}
