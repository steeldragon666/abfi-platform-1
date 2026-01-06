import { Link } from "wouter";
import { Menu, Bell, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePortal } from "@/contexts/PortalContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { PortalSwitcher } from "./PortalSwitcher";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { setMobileMenuOpen, portalConfig } = usePortal();
  const { role } = useUserRole();
  const { user, logout } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 lg:px-6",
        "bg-white dark:bg-gray-950", // Solid background for legibility
        className
      )}
      role="banner"
    >
      {/* Menu Button - Always visible */}
      <Button
        variant="ghost"
        size="icon"
        className="min-h-[40px] min-w-[40px]"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-foreground" aria-hidden="true" />
      </Button>

      {/* Logo - Links to current portal dashboard */}
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        aria-label="ABFI Home"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#D4AF37]">
          <span className="text-sm font-bold text-black">AB</span>
        </div>
        <span className="hidden sm:inline">ABFI</span>
      </Link>

      {/* Portal Switcher - Center on desktop */}
      <div className="hidden lg:flex flex-1 justify-center">
        <PortalSwitcher />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 ml-auto lg:ml-0">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative min-h-[44px] min-w-[44px]"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#D4AF37] text-black"
            aria-label="3 unread notifications"
          >
            3
          </Badge>
        </Button>

        {/* Help */}
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] hidden sm:flex"
          asChild
        >
          <Link href="/explainers" aria-label="Help and support">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="min-h-[44px] gap-2 px-2"
              aria-label="User menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user?.email || "Guest"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.email || "Guest User"}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  Role: {role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer">
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/preferences" className="w-full cursor-pointer">
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/explainers" className="w-full cursor-pointer">
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => logout()}
              >
                Sign Out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/login" className="w-full cursor-pointer">
                  Sign In
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
