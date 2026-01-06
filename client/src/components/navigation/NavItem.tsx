import { memo } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NavItem as NavItemType } from "@/config/navigation";

interface NavItemProps {
  item: NavItemType;
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NavItem = memo(function NavItem({ item, collapsed = false, onClick, className }: NavItemProps) {
  const [location] = useLocation();
  const isActive = location === item.href || location.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        // Base styles - compact touch target
        "flex items-center gap-2 rounded-md transition-colors",
        "min-h-[36px] px-2.5 text-sm", // Smaller, more compact
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // State styles with better contrast
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-foreground/80 hover:bg-accent hover:text-foreground",
        // Collapsed styles
        collapsed && "justify-center px-2",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0", // Smaller icons
          isActive ? "text-primary-foreground" : "text-foreground"
        )}
        aria-hidden="true"
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate text-sm">{item.label}</span>

          {item.badge && (
            <Badge
              variant={item.badge.type === "new" ? "default" : "secondary"}
              className={cn(
                "ml-auto text-xs",
                item.badge.type === "new" && "bg-[#D4AF37] text-black"
              )}
            >
              {item.badge.type === "new" ? "New" : item.badge.value}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  // Wrap in tooltip when collapsed
  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{item.label}</span>
          {item.badge && (
            <Badge
              variant={item.badge.type === "new" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                item.badge.type === "new" && "bg-[#D4AF37] text-black"
              )}
            >
              {item.badge.type === "new" ? "New" : item.badge.value}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

// Section header for grouped navigation
interface NavSectionProps {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const NavSection = memo(function NavSection({ label, collapsed, children, className }: NavSectionProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {!collapsed && (
        <h3 className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </h3>
      )}
      {collapsed && <div className="h-px bg-border mx-2 my-1" />}
      <nav className="space-y-0.5" role="navigation" aria-label={label}>
        {children}
      </nav>
    </div>
  );
});

// Separator for navigation sections
export const NavSeparator = memo(function NavSeparator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border my-3", className)} />;
});
