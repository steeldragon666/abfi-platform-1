import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col rounded-lg border border-border",
  {
    variants: {
      variant: {
        default: "transition-colors duration-200",
        elevated: "shadow-md border-transparent transition-shadow duration-200",
        outlined: "border-2 transition-colors duration-200",
        glass:
          "bg-card/80 backdrop-blur-md shadow-lg border-white/10 transition-all duration-200",
        premium:
          "border-primary/10 bg-gradient-to-br from-card to-card/95 transition-all duration-200",
        stats: "stats-card",
      },
      padding: {
        default: "gap-5 py-5",
        compact: "gap-4 py-4",
        relaxed: "gap-6 py-6",
        none: "",
      },
      hover: {
        true: "hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors duration-150",
        subtle:
          "hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-colors duration-150",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      hover: false,
    },
  }
);

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ variant, padding, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-gray-600 text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

/**
 * StatsCard - Specialized card for dashboard metrics
 * Premium design with gradient accent on hover
 */
export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  variant?: "default" | "success" | "warning" | "info" | "premium";
  size?: "default" | "compact" | "large";
  className?: string;
}

const StatsCard = React.forwardRef<
  HTMLDivElement,
  StatsCardProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      title,
      value,
      description,
      icon,
      trend,
      variant = "default",
      size = "default",
      className,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "border-border hover:border-primary/20",
      success: "border-success/30 bg-success/5 hover:border-success/40",
      warning: "border-warning/30 bg-warning/5 hover:border-warning/40",
      info: "border-info/30 bg-info/5 hover:border-info/40",
      premium:
        "border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 hover:border-primary/30",
    };

    const iconVariantStyles = {
      default: "bg-[#D4AF37]/10 text-[#D4AF37]",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      info: "bg-info/10 text-info",
      premium: "bg-gradient-to-br from-primary/20 to-primary/10 text-[#D4AF37]",
    };

    const trendColors = {
      up: "text-success",
      down: "text-destructive",
      neutral: "text-gray-600",
    };

    const trendArrows = {
      up: "↑",
      down: "↓",
      neutral: "→",
    };

    const sizeStyles = {
      compact: { card: "p-3", value: "text-xl", icon: "p-1.5" },
      default: { card: "p-5", value: "text-2xl", icon: "p-2.5" },
      large: { card: "p-6", value: "text-3xl", icon: "p-3" },
    };

    const sizes = sizeStyles[size];

    return (
      <Card
        ref={ref}
        padding="none"
        hover="subtle"
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {/* Gradient accent line on top */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <CardContent className={sizes.card}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">
                {title}
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p
                  className={cn(
                    "font-semibold text-foreground tracking-tight tabular-nums",
                    sizes.value
                  )}
                >
                  {value}
                </p>
                {trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums",
                      trendColors[trend.direction]
                    )}
                  >
                    <span className="text-xs">
                      {trendArrows[trend.direction]}
                    </span>
                    {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-gray-600">{description}</p>
              )}
            </div>
            {icon && (
              <div
                className={cn(
                  "rounded-lg shrink-0 transition-transform duration-200 hover:scale-105",
                  iconVariantStyles[variant],
                  sizes.icon
                )}
              >
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
StatsCard.displayName = "StatsCard";

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  StatsCard,
};
