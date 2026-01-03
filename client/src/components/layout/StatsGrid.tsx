/**
 * StatsGrid - Consistent stats display grid with animated numbers.
 * Memoized for performance optimization.
 */
import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 5;
  variant?: "default" | "cards" | "minimal";
  className?: string;
}

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

export const StatsGrid = memo(function StatsGrid({
  stats,
  columns = 4,
  variant = "default",
  className,
}: StatsGridProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4", columnClasses[columns], className)}>
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl lg:text-3xl font-bold font-mono">
                  {stat.value}
                </p>
                {stat.change && (
                  <p
                    className={cn(
                      "text-xs mt-1",
                      stat.changeType === "positive" && "text-[#D4AF37]",
                      stat.changeType === "negative" && "text-red-600",
                      stat.changeType === "neutral" && "text-gray-600"
                    )}
                  >
                    {stat.change}
                  </p>
                )}
              </div>
              {stat.icon && (
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    stat.iconColor || "bg-[#D4AF37]/10 text-[#D4AF37]"
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("grid gap-6", columnClasses[columns], className)}>
        {stats.map((stat, index) => (
          <div key={index}>
            <p className="text-3xl lg:text-4xl font-bold font-mono">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "grid gap-4 p-6 bg-muted/50 rounded-xl border",
        columnClasses[columns],
        className
      )}
    >
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <p className="text-2xl lg:text-3xl font-bold font-mono">
            {stat.value}
          </p>
          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          {stat.change && (
            <p
              className={cn(
                "text-xs mt-1",
                stat.changeType === "positive" && "text-[#D4AF37]",
                stat.changeType === "negative" && "text-red-600",
                stat.changeType === "neutral" && "text-gray-600"
              )}
            >
              {stat.change}
            </p>
          )}
        </div>
      ))}
    </div>
  );
});

export default StatsGrid;
