import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Home,
  Compass,
  Leaf,
  Factory,
  TrendingUp,
  Search,
  ShoppingCart,
  FileText,
  Eye,
  BarChart3,
  Clock,
  ShieldCheck,
  Truck,
  Calculator,
  BadgeCheck,
  TreeDeciduous,
  Users,
  Shield,
  Database,
  PieChart,
  LogOut,
  LogIn,
  PanelLeft,
  Menu,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import RoleHeader from "./RoleHeader";

// Menu structure
const mainMenuItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
];

const dashboardMenuItems = [
  { icon: Leaf, label: "Grower Dashboard", path: "/grower/dashboard" },
  { icon: Factory, label: "Developer Dashboard", path: "/developer/dashboard" },
  { icon: TrendingUp, label: "Finance Dashboard", path: "/finance/dashboard" },
];

const marketplaceMenuItems = [
  { icon: Search, label: "Browse Feedstocks", path: "/browse" },
  { icon: ShoppingCart, label: "Futures Marketplace", path: "/futures" },
  { icon: FileText, label: "Demand Signals", path: "/demand-signals" },
];

const intelligenceMenuItems = [
  { icon: Shield, label: "Bankability Ratings", path: "/ratings" },
  { icon: Eye, label: "Stealth Discovery", path: "/stealth-discovery" },
  { icon: TrendingUp, label: "Lending Sentiment", path: "/lending-sentiment" },
  { icon: BarChart3, label: "Feedstock Prices", path: "/feedstock-prices" },
  { icon: Clock, label: "Policy & Carbon", path: "/policy-carbon" },
];

const platformMenuItems = [
  { icon: ShieldCheck, label: "Evidence Vault", path: "/evidence-vault" },
  { icon: Truck, label: "Supply Chain", path: "/supply-chain" },
  { icon: Calculator, label: "Emissions", path: "/emissions" },
  { icon: BadgeCheck, label: "Credentials", path: "/credentials" },
];

const accountMenuItems = [
  { icon: TreeDeciduous, label: "My Futures", path: "/supplier/futures" },
  { icon: FileText, label: "My EOIs", path: "/buyer/eois" },
];

const adminMenuItems = [
  { icon: Shield, label: "Assessor Workflow", path: "/admin/assessor-workflow" },
  { icon: Database, label: "RSIE Dashboard", path: "/admin/rsie" },
  { icon: Clock, label: "Monitoring Jobs", path: "/admin/monitoring-jobs" },
  { icon: Users, label: "User Management", path: "/admin/users" },
  { icon: PieChart, label: "Admin Dashboard", path: "/admin" },
];

const SIDEBAR_WIDTH_KEY = "app-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AppLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  );
}

type AppLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AppLayoutContent({ children, setSidebarWidth }: AppLayoutContentProps) {
  const { user, logout, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const renderMenuSection = (
    title: string,
    items: typeof mainMenuItems,
    showTitle: boolean = true
  ) => (
    <>
      {showTitle && (
        <div className="px-4 py-2 mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!isCollapsed ? title : ""}
          </p>
        </div>
      )}
      <SidebarMenu className="px-2 py-1">
        {items.map((item) => {
          const isActive =
            location === item.path || location.startsWith(item.path + "/");
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => setLocation(item.path)}
                tooltip={item.label}
                className="h-10 transition-all font-normal"
              >
                <item.icon
                  className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </>
  );

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                {isCollapsed ? (
                  <Leaf className="h-5 w-5 text-sidebar-primary" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
                )}
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <Leaf className="h-5 w-5 text-sidebar-primary shrink-0" />
                  <span className="font-bold tracking-tight truncate text-sidebar-foreground">
                    ABFI Platform
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Main Menu */}
            <SidebarMenu className="px-2 py-1">
              {mainMenuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Dashboards */}
            {renderMenuSection("Dashboards", dashboardMenuItems)}

            {/* Marketplace */}
            {renderMenuSection("Marketplace", marketplaceMenuItems)}

            {/* Intelligence */}
            {renderMenuSection("Intelligence", intelligenceMenuItems)}

            {/* Platform Tools */}
            {renderMenuSection("Platform", platformMenuItems)}

            {/* Account Menu (only when logged in) */}
            {user && renderMenuSection("My Account", accountMenuItems)}

            {/* Admin Menu (only for admin users) */}
            {user?.role === "admin" && renderMenuSection("Admin", adminMenuItems)}
          </SidebarContent>

          <SidebarFooter className="p-3">
            {loading ? (
              <div className="h-11 animate-pulse bg-muted rounded-lg" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-medium truncate leading-none">
                        {user?.name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1.5">
                        {user?.email || "-"}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                variant="outline"
                className="w-full justify-start group-data-[collapsible=icon]:justify-center"
              >
                <LogIn className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Desktop Role Header */}
        {!isMobile && <RoleHeader />}

        {/* Mobile Header with Hamburger Menu */}
        {isMobile && (
          <header className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-teal-600" />
                <span className="font-semibold tracking-tight text-foreground">
                  ABFI
                </span>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
