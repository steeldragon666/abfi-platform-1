import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Badge,
  RatingBadge as RatingBadgeComponent,
} from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import { useEffect, useRef, memo } from "react";
import { easeOut } from "@/lib/motion";

// Score tier configuration matching the design system
type ScoreTier = {
  tier: string;
  label: string;
  colorClass: string;
  bgClass: string;
  min: number;
};

const SCORE_TIERS: ScoreTier[] = [
  {
    tier: "A+",
    label: "Excellent",
    colorClass: "text-rating-a-plus",
    bgClass: "bg-rating-a-plus/10",
    min: 90,
  },
  {
    tier: "A",
    label: "Very Good",
    colorClass: "text-rating-a",
    bgClass: "bg-rating-a/10",
    min: 80,
  },
  {
    tier: "B+",
    label: "Good",
    colorClass: "text-rating-b-plus",
    bgClass: "bg-rating-b-plus/10",
    min: 70,
  },
  {
    tier: "B",
    label: "Above Average",
    colorClass: "text-rating-b",
    bgClass: "bg-rating-b/10",
    min: 60,
  },
  {
    tier: "C+",
    label: "Average",
    colorClass: "text-rating-c-plus",
    bgClass: "bg-rating-c-plus/10",
    min: 50,
  },
  {
    tier: "C",
    label: "Below Average",
    colorClass: "text-rating-c",
    bgClass: "bg-rating-c/10",
    min: 40,
  },
  {
    tier: "D",
    label: "Poor",
    colorClass: "text-rating-d",
    bgClass: "bg-rating-d/10",
    min: 25,
  },
  {
    tier: "F",
    label: "Failing",
    colorClass: "text-rating-f",
    bgClass: "bg-rating-f/10",
    min: 0,
  },
];

function getScoreTier(score: number): ScoreTier {
  for (const tier of SCORE_TIERS) {
    if (score >= tier.min) {
      return tier;
    }
  }
  return SCORE_TIERS[SCORE_TIERS.length - 1];
}

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  description?: string;
  variant?: "default" | "compact" | "detailed" | "gauge";
  showProgress?: boolean;
  icon?: "award" | "trending" | "shield";
  className?: string;
}

export const ScoreCard = memo(function ScoreCard({
  title,
  score,
  maxScore = 100,
  description,
  variant = "default",
  showProgress = true,
  icon = "award",
  className = "",
}: ScoreCardProps) {
  const percentage = (score / maxScore) * 100;
  const tier = getScoreTier(score);

  const IconComponent =
    icon === "award" ? Award : icon === "trending" ? TrendingUp : Shield;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-4 bg-card border rounded-xl",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", tier.bgClass)}>
            <IconComponent className={cn("h-4 w-4", tier.colorClass)} />
          </div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-mono font-bold text-lg", tier.colorClass)}>
            {score}
          </span>
          <span className="text-xs text-gray-600">/ {maxScore}</span>
        </div>
      </div>
    );
  }

  if (variant === "gauge") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-gray-600" />
              <span className="font-medium">{title}</span>
            </div>
            <Badge variant="outline" className={cn(tier.colorClass)}>
              {tier.tier}
            </Badge>
          </div>
          <ScoreGauge score={score} size="lg" />
          <p className="text-center text-sm text-gray-600 mt-3">
            {tier.label}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", tier.bgClass)}>
                <IconComponent className={cn("h-4 w-4", tier.colorClass)} />
              </div>
              {title}
            </CardTitle>
            <div className={cn("metric-lg", tier.colorClass)}>{score}</div>
          </div>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {showProgress && (
            <div>
              <Progress value={percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0</span>
                <span>{maxScore}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rating</span>
            <Badge
              variant="outline"
              className={cn("font-mono font-semibold", tier.colorClass)}
            >
              {tier.tier} - {tier.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant with centered score
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", tier.bgClass)}>
            <IconComponent className={cn("h-4 w-4", tier.colorClass)} />
          </div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={cn("metric-xl", tier.colorClass)}>{score}</div>
          <div className="text-sm text-gray-600">out of {maxScore}</div>
          <Badge
            variant="outline"
            className={cn("mt-2 font-mono", tier.colorClass)}
          >
            {tier.tier}
          </Badge>
        </div>
        {showProgress && <Progress value={percentage} className="h-2" />}
      </CardContent>
    </Card>
  );
});

/**
 * ScoreGauge - Animated circular gauge for scores
 */
interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showTier?: boolean;
  className?: string;
  animated?: boolean;
  duration?: number;
}

export function ScoreGauge({
  score,
  size = "md",
  showTier = true,
  className,
  animated = true,
  duration = 1.5,
}: ScoreGaugeProps) {
  const tier = getScoreTier(score);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Motion values for animation
  const progressValue = useMotionValue(0);
  const displayScore = useMotionValue(0);

  const sizeConfig = {
    sm: {
      outer: 48,
      inner: 40,
      stroke: 4,
      fontSize: "text-sm",
      tierSize: "text-[8px]",
    },
    md: {
      outer: 64,
      inner: 54,
      stroke: 5,
      fontSize: "text-lg",
      tierSize: "text-[10px]",
    },
    lg: {
      outer: 80,
      inner: 68,
      stroke: 6,
      fontSize: "text-2xl",
      tierSize: "text-xs",
    },
    xl: {
      outer: 120,
      inner: 104,
      stroke: 8,
      fontSize: "text-4xl",
      tierSize: "text-sm",
    },
  };

  const config = sizeConfig[size];
  const radius = (config.inner - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Transform progress value to stroke offset
  const strokeDashoffset = useTransform(
    progressValue,
    [0, 100],
    [circumference, 0]
  );

  // Transform display score to rounded integer
  const roundedScore = useTransform(displayScore, v => Math.round(v));

  // Animate when in view
  useEffect(() => {
    if (isInView && animated) {
      const progressControls = animate(progressValue, score, {
        duration,
        ease: easeOut,
      });
      const scoreControls = animate(displayScore, score, {
        duration,
        ease: easeOut,
      });
      return () => {
        progressControls.stop();
        scoreControls.stop();
      };
    } else if (!animated) {
      progressValue.set(score);
      displayScore.set(score);
    }
  }, [isInView, score, animated, duration, progressValue, displayScore]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center mx-auto",
        className
      )}
    >
      <svg
        width={config.outer}
        height={config.outer}
        viewBox={`0 0 ${config.outer} ${config.outer}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted/20"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          className={tier.colorClass}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn(
            "font-mono font-bold",
            config.fontSize,
            tier.colorClass
          )}
        >
          {roundedScore}
        </motion.span>
        {showTier && (
          <motion.span
            className={cn("font-medium text-gray-600", config.tierSize)}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: duration * 0.5, duration: 0.3 }}
          >
            {tier.tier}
          </motion.span>
        )}
      </div>
    </div>
  );
}

interface RatingBadgeProps {
  rating: string;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}

export const RatingBadge = memo(function RatingBadge({
  rating,
  size = "md",
  showDescription = false,
  className = "",
}: RatingBadgeProps) {
  const getRatingInfo = (r: string): { color: string; description: string } => {
    switch (r) {
      case "AAA":
        return { color: "bg-green-600 text-black", description: "Exceptional" };
      case "AA":
        return { color: "bg-green-500 text-black", description: "Very Strong" };
      case "A":
        return { color: "bg-blue-600 text-black", description: "Strong" };
      case "BBB":
        return { color: "bg-blue-500 text-black", description: "Good" };
      case "BB":
        return { color: "bg-yellow-600 text-black", description: "Adequate" };
      case "B":
        return { color: "bg-orange-600 text-black", description: "Marginal" };
      case "CCC":
        return { color: "bg-red-600 text-black", description: "Weak" };
      case "GQ1":
        return { color: "bg-green-600 text-black", description: "Premier" };
      case "GQ2":
        return { color: "bg-blue-600 text-black", description: "Qualified" };
      case "GQ3":
        return { color: "bg-yellow-600 text-black", description: "Developing" };
      case "GQ4":
        return {
          color: "bg-orange-600 text-black",
          description: "Provisional",
        };
      default:
        return { color: "bg-gray-500 text-black", description: "Unrated" };
    }
  };

  const info = getRatingInfo(rating);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  if (showDescription) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Badge className={`${info.color} ${sizeClasses[size]} font-bold`}>
          {rating}
        </Badge>
        <span className="text-sm text-gray-600">
          {info.description}
        </span>
      </div>
    );
  }

  return (
    <Badge
      className={`${info.color} ${sizeClasses[size]} font-bold ${className}`}
    >
      {rating}
    </Badge>
  );
});

interface ScoreBreakdownProps {
  scores: Array<{
    label: string;
    value: number;
    maxValue?: number;
    weight?: number;
  }>;
  className?: string;
}

export const ScoreBreakdown = memo(function ScoreBreakdown({
  scores,
  className = "",
}: ScoreBreakdownProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {scores.map((score, index) => {
        const percentage = (score.value / (score.maxValue || 100)) * 100;
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{score.label}</span>
                {score.weight && (
                  <span className="text-xs text-gray-600">
                    ({score.weight}%)
                  </span>
                )}
              </div>
              <span className="font-medium">{score.value}</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
});

interface ABFIScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const ABFIScoreBadge = memo(function ABFIScoreBadge({
  score,
  size = "md",
  showLabel = true,
  className = "",
}: ABFIScoreBadgeProps) {
  const getScoreColor = (s: number): string => {
    if (s >= 90) return "bg-green-600 text-black";
    if (s >= 80) return "bg-blue-600 text-black";
    if (s >= 70) return "bg-yellow-600 text-black";
    if (s >= 60) return "bg-orange-600 text-black";
    return "bg-red-600 text-black";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">ABFI Score:</span>
      )}
      <Badge
        className={`${getScoreColor(score)} ${sizeClasses[size]} font-bold`}
      >
        {score}/100
      </Badge>
    </div>
  );
});
