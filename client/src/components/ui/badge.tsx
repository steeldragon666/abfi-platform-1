import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        secondary:
          "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        destructive:
          "border-transparent bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
        outline:
          "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-transparent",
        success: "border-transparent bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
        warning: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
        info: "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        // Rating tiers (A+ through F) - subtle backgrounds
        "rating-a-plus":
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-semibold",
        "rating-a":
          "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400 font-semibold",
        "rating-b-plus":
          "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-400 font-semibold",
        "rating-b":
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 font-semibold",
        "rating-c-plus":
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 font-semibold",
        "rating-c":
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400 font-semibold",
        "rating-d":
          "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400 font-semibold",
        "rating-f":
          "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-300 font-semibold",
        // Status variants
        draft: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
        pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
        verified: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
        rejected: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[11px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/**
 * StatusBadge - For workflow/document statuses
 */
type StatusType =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "active"
  | "expired";

const statusConfig: Record<
  StatusType,
  { label: string; variant: VariantProps<typeof badgeVariants>["variant"] }
> = {
  draft: { label: "Draft", variant: "draft" },
  pending: { label: "Pending Review", variant: "pending" },
  verified: { label: "Verified", variant: "verified" },
  rejected: { label: "Rejected", variant: "rejected" },
  active: { label: "Active", variant: "success" },
  expired: { label: "Expired", variant: "destructive" },
};

function StatusBadge({
  status,
  className,
  ...props
}: { status: StatusType } & Omit<React.ComponentProps<"span">, "children">) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className} {...props}>
      {config.label}
    </Badge>
  );
}

/**
 * RatingBadge - For ABFI score ratings
 */
type RatingTier = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

const ratingVariantMap: Record<
  RatingTier,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  "A+": "rating-a-plus",
  A: "rating-a",
  "B+": "rating-b-plus",
  B: "rating-b",
  "C+": "rating-c-plus",
  C: "rating-c",
  D: "rating-d",
  F: "rating-f",
};

function RatingBadge({
  rating,
  score,
  className,
  ...props
}: { rating: RatingTier; score?: number } & Omit<
  React.ComponentProps<"span">,
  "children"
>) {
  const variant = ratingVariantMap[rating];
  return (
    <Badge variant={variant} className={cn("font-mono", className)} {...props}>
      {rating}
      {score !== undefined && <span className="opacity-75">({score})</span>}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, RatingBadge };
