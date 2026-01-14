import { Link } from "wouter";
import { Menu, Bell, HelpCircle, User, ChevronDown, Settings, LogOut, LogIn } from "lucide-react";
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
  const { setMobileMenuOpen } = usePortal();
  const { role } = useUserRole();
  const { user, logout } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center border-b",
        "bg-white dark:bg-gray-950",
        "shadow-sm", // Subtle elevation
        className
      )}
      role="banner"
    >
      {/* Left Section: Menu + Brand */}
      <div className="flex items-center h-full">
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-none border-r hover:bg-gray-50 dark:hover:bg-gray-900"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 h-full px-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label="ABFI Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] shadow-sm">
            <span className="text-sm font-bold text-white tracking-tight">AB</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              ABFI
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider -mt-0.5">
              Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Center Section: Portal Switcher */}
      <div className="hidden lg:flex flex-1 justify-center px-4">
        <PortalSwitcher />
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center h-full ml-auto">
        {/* Help Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-12 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 hidden sm:flex"
          asChild
        >
          <Link href="/explainers" aria-label="Help and support">
            <HelpCircle className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </Link>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-14 w-12 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900"
          aria-label="Notifications, 3 unread"
        >
          <Bell className="h-5 w-5 text-gray-500" aria-hidden="true" />
          <Badge
            className="absolute top-2.5 right-1.5 h-4 min-w-4 flex items-center justify-center px-1 text-[10px] font-semibold bg-[#D4AF37] text-black border-2 border-white dark:border-gray-950"
            aria-hidden="true"
          >
            3
          </Badge>
        </Button>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1" aria-hidden="true" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-14 gap-3 px-4 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900"
              aria-label="User menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 ring-2 ring-gray-200 dark:ring-gray-700">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
                  {user?.email?.split('@')[0] || "Guest"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {role}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuLabel className="px-2 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.email || "Guest User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {role} Account
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem asChild className="px-2 py-2.5 rounded-md">
              <Link href="/profile" className="w-full cursor-pointer flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-2 py-2.5 rounded-md">
              <Link href="/preferences" className="w-full cursor-pointer flex items-center gap-3">
                <Settings className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span>Preferences</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-2 py-2.5 rounded-md sm:hidden">
              <Link href="/explainers" className="w-full cursor-pointer flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span>Help & Support</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            {user ? (
              <DropdownMenuItem
                className="px-2 py-2.5 rounded-md text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-3 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild className="px-2 py-2.5 rounded-md">
                <Link href="/login" className="w-full cursor-pointer flex items-center gap-3 text-[#D4AF37]">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Sign In</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
