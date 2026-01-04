/**
 * Rating Badges Component
 * Displays the 6-dimension bankability rating badges for bioenergy projects
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Rating color mappings
const BANKABILITY_COLORS: Record<string, string> = {
  "AAA": "bg-emerald-600 text-white",
  "AA": "bg-emerald-500 text-white",
  "A": "bg-green-500 text-white",
  "BBB": "bg-yellow-500 text-black",
  "BB": "bg-amber-500 text-black",
  "B": "bg-orange-500 text-white",
  "CCC": "bg-red-500 text-white",
  "D": "bg-gray-500 text-white",
  "N/R": "bg-gray-400 text-white",
};

const GC_COLORS: Record<string, string> = {
  "GC1": "bg-emerald-600 text-white",
  "GC2": "bg-green-500 text-white",
  "GC3": "bg-amber-500 text-black",
  "GC4": "bg-red-500 text-white",
  "N/A": "bg-gray-400 text-white",
};

const TR_COLORS: Record<string, string> = {
  "TR1": "bg-emerald-600 text-white",
  "TR2": "bg-green-500 text-white",
  "TR3": "bg-amber-500 text-black",
  "TR4": "bg-red-500 text-white",
};

const CI_COLORS: Record<string, string> = {
  "CI-A": "bg-emerald-600 text-white",
  "CI-B": "bg-green-500 text-white",
  "CI-C": "bg-amber-500 text-black",
  "CI-D": "bg-red-500 text-white",
  "N/A": "bg-gray-400 text-white",
};

const SIGNAL_COLORS: Record<string, string> = {
  "BULLISH": "bg-emerald-600 text-white",
  "NEUTRAL-BULLISH": "bg-emerald-500 text-white",
  "NEUTRAL": "bg-yellow-500 text-black",
  "NEUTRAL-BEARISH": "bg-orange-500 text-white",
  "BEARISH": "bg-red-500 text-white",
  "ON HOLD": "bg-gray-500 text-white",
  "MOTHBALLED": "bg-gray-400 text-white",
  "CANCELLED": "bg-gray-600 text-white",
};

// Rating descriptions
const RATING_DESCRIPTIONS: Record<string, Record<string, string>> = {
  bankability: {
    "AAA": "Highest investment grade - Excellent bankability",
    "AA": "Very high investment grade",
    "A": "High investment grade",
    "BBB": "Medium investment grade",
    "BB": "Speculative grade",
    "B": "Highly speculative",
    "CCC": "Substantial risk",
    "D": "Default or distressed",
    "N/R": "Not rated - insufficient data",
  },
  growerContract: {
    "GC1": "Long-term contracts with price certainty",
    "GC2": "Medium-term contracts in place",
    "GC3": "Short-term or spot market reliance",
    "GC4": "No feedstock contracts secured",
    "N/A": "Not applicable",
  },
  techReadiness: {
    "TR1": "Commercially proven at scale",
    "TR2": "Demonstrated at commercial pilot",
    "TR3": "Technology proven at demonstration",
    "TR4": "Early stage / unproven",
  },
  carbonIntensity: {
    "CI-A": "Excellent (<20 gCO2e/MJ)",
    "CI-B": "Good (20-35 gCO2e/MJ)",
    "CI-C": "Moderate (35-50 gCO2e/MJ)",
    "CI-D": "High (>50 gCO2e/MJ)",
    "N/A": "Not applicable",
  },
  offtake: {
    "OQ1": "Binding offtake agreement",
    "OQ2": "Heads of Agreement / LOI signed",
    "OQ3": "MOU or discussions ongoing",
    "OQ4": "No offtake secured",
    "N/A": "Not applicable",
  },
  govSupport: {
    "GS1": "Committed government funding",
    "GS2": "Grant application approved",
    "GS3": "Policy support without direct funding",
    "GS4": "No government support",
    "N/A": "Not applicable",
  },
  signal: {
    "BULLISH": "Strong positive outlook",
    "NEUTRAL-BULLISH": "Cautiously optimistic",
    "NEUTRAL": "Balanced risk/reward",
    "NEUTRAL-BEARISH": "Cautious outlook",
    "BEARISH": "Negative outlook",
    "ON HOLD": "Project paused",
    "MOTHBALLED": "Operations suspended",
    "CANCELLED": "Project cancelled",
  },
};

interface RatingBadgeProps {
  rating: string | null;
  type: "bankability" | "growerContract" | "techReadiness" | "carbonIntensity" | "offtake" | "govSupport" | "signal";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function RatingBadge({
  rating,
  type,
  size = "md",
  showTooltip = true,
  className,
}: RatingBadgeProps) {
  if (!rating) return null;

  const colorMap = {
    bankability: BANKABILITY_COLORS,
    growerContract: GC_COLORS,
    techReadiness: TR_COLORS,
    carbonIntensity: CI_COLORS,
    offtake: GC_COLORS, // Similar scale
    govSupport: GC_COLORS, // Similar scale
    signal: SIGNAL_COLORS,
  };

  const colors = colorMap[type];
  const colorClass = colors[rating] || "bg-gray-400 text-white";
  const description = RATING_DESCRIPTIONS[type]?.[rating] || rating;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  const badge = (
    <Badge
      className={cn(
        colorClass,
        sizeClasses[size],
        "font-mono font-semibold",
        className
      )}
    >
      {rating}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface RatingBadgesRowProps {
  bankability?: string | null;
  growerContract?: string | null;
  techReadiness?: string | null;
  carbonIntensity?: string | null;
  offtake?: string | null;
  govSupport?: string | null;
  signal?: string | null;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
}

export function RatingBadgesRow({
  bankability,
  growerContract,
  techReadiness,
  carbonIntensity,
  offtake,
  govSupport,
  signal,
  size = "sm",
  compact = false,
}: RatingBadgesRowProps) {
  const ratings = [
    { rating: growerContract, type: "growerContract" as const },
    { rating: techReadiness, type: "techReadiness" as const },
    { rating: carbonIntensity, type: "carbonIntensity" as const },
    { rating: offtake, type: "offtake" as const },
    { rating: govSupport, type: "govSupport" as const },
  ].filter(r => r.rating);

  if (compact) {
    // Just show the first 3 ratings
    return (
      <div className="flex flex-wrap gap-1">
        {ratings.slice(0, 3).map((r) => (
          <RatingBadge key={r.type} rating={r.rating} type={r.type} size={size} />
        ))}
        {ratings.length > 3 && (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5")}>
            +{ratings.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ratings.map((r) => (
        <RatingBadge key={r.type} rating={r.rating} type={r.type} size={size} />
      ))}
    </div>
  );
}

interface SignalBadgeProps {
  signal: string | null;
  size?: "sm" | "md" | "lg";
}

export function SignalBadge({ signal, size = "md" }: SignalBadgeProps) {
  if (!signal) return null;
  return <RatingBadge rating={signal} type="signal" size={size} />;
}

interface BankabilityBadgeProps {
  rating: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function BankabilityBadge({ rating, size = "lg", showLabel = false }: BankabilityBadgeProps) {
  if (!rating) return null;

  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-xs text-muted-foreground">Bankability:</span>}
      <RatingBadge rating={rating} type="bankability" size={size} />
    </div>
  );
}
