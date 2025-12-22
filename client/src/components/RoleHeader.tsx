/**
 * RoleHeader Component
 *
 * Sticky header with role switcher for the ABFI Platform redesign.
 * Provides navigation context based on user role (Grower, Developer, Lender).
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Bell,
  Leaf,
  Factory,
  TrendingUp,
  ChevronDown,
  User,
  Settings,
  LogOut,
  LogIn,
  HelpCircle,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

// Role definitions
export type UserRole = "grower" | "developer" | "lender";

interface RoleConfig {
  id: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  dashboardPath: string;
  description: string;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    id: "grower",
    label: "Grower",
    icon: Leaf,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    dashboardPath: "/grower/dashboard",
    description: "Feedstock producers & farmers",
  },
  {
    id: "developer",
    label: "Developer",
    icon: Factory,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    dashboardPath: "/developer/dashboard",
    description: "Project developers & processors",
  },
  {
    id: "lender",
    label: "Lender",
    icon: TrendingUp,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    dashboardPath: "/finance/dashboard",
    description: "Banks & financial institutions",
  },
];

const ROLE_STORAGE_KEY = "abfi-selected-role";

interface RoleHeaderProps {
  className?: string;
}

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "grower";
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return (saved as UserRole) || "grower";
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  };

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }, [role]);

  const roleConfig = ROLE_CONFIGS.find((r) => r.id === role) || ROLE_CONFIGS[0];

  return { role, setRole, roleConfig, allRoles: ROLE_CONFIGS };
}

export default function RoleHeader({ className }: RoleHeaderProps) {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { role, setRole, roleConfig, allRoles } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3); // Mock notification count

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const newRoleConfig = allRoles.find((r) => r.id === newRole);
    if (newRoleConfig) {
      setLocation(newRoleConfig.dashboardPath);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight hidden sm:inline">
              ABFI
            </span>
          </div>
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">
            I'm a:
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2 font-medium min-w-[120px]",
                  roleConfig.bgColor,
                  "border-transparent hover:border-border"
                )}
              >
                <roleConfig.icon className={cn("h-4 w-4", roleConfig.color)} />
                <span className={roleConfig.color}>{roleConfig.label}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              {allRoles.map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => handleRoleChange(r.id)}
                  className={cn(
                    "flex items-center gap-3 py-3 cursor-pointer",
                    role === r.id && "bg-accent"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", r.bgColor)}>
                    <r.icon className={cn("h-4 w-4", r.color)} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search - Hidden on small screens */}
          <form onSubmit={handleSearch} className="hidden lg:flex">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search feedstocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-8 h-9"
              />
            </div>
          </form>

          {/* Search button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setLocation("/browse")}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setLocation("/notifications")}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* Profile / Auth */}
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-medium bg-primary/10">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/supplier/profile")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/notifications")}
                  className="cursor-pointer"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {notificationCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {notificationCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/explainers")}
                  className="cursor-pointer"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/supplier/profile")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Export role config for use in other components
export { ROLE_CONFIGS };
