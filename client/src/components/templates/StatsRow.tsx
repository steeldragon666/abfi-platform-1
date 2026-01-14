/**
 * StatsRow - Clean, minimal stats display for dashboards
 *
 * Design principles:
 * - Subtle borders, no shadows
 * - Clear hierarchy: large value, small label
 * - Optional trend indicator
 * - Responsive grid layout
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface StatItemProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function StatItem({
  label,
  value,
  trend,
  icon: Icon,
  iconClassName,
  className,
}: StatItemProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === "up"
      ? "text-green-600"
      : trend?.direction === "down"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border bg-card",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-2xl font-semibold text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trendColor
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatsRowProps {
  stats: StatItemProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function StatsRow({ stats, columns = 4, className }: StatsRowProps) {
  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {stats.map((stat, index) => (
        <StatItem key={index} {...stat} />
      ))}
    </div>
  );
}

/**
 * CompactStats - Horizontal inline stats for tight spaces
 */
interface CompactStatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconClassName?: string;
}

export function CompactStats({
  stats,
  className,
}: {
  stats: CompactStatProps[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 sm:gap-6 py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-900 border",
        className
      )}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4 text-gray-500 dark:text-gray-400",
                  stat.iconClassName
                )}
              />
            )}
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {stat.value}
            </span>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default StatsRow;
