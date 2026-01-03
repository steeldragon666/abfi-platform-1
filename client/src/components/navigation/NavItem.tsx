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
        // Base styles - WCAG 2.2 AA compliant touch target
        "flex items-center gap-3 rounded-lg transition-colors",
        "min-h-[44px] px-3", // 44px minimum touch target
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // State styles
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        // Collapsed styles
        collapsed && "justify-center px-2",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive && "text-primary"
        )}
        aria-hidden="true"
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>

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
    <div className={cn("space-y-1", className)}>
      {!collapsed && (
        <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </h3>
      )}
      {collapsed && <div className="h-px bg-border mx-2 my-2" />}
      <nav className="space-y-1" role="navigation" aria-label={label}>
        {children}
      </nav>
    </div>
  );
});

// Separator for navigation sections
export const NavSeparator = memo(function NavSeparator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border my-3", className)} />;
});
