/**
 * ABFI Score Display Components
 * Reusable components for displaying bankability ratings and scores
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================================================
// SCORE BADGE
// ============================================================================

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: '#10b981', text: 'white', label: 'Excellent' };
    if (score >= 80) return { bg: '#3b82f6', text: 'white', label: 'Very Good' };
    if (score >= 70) return { bg: '#f59e0b', text: 'white', label: 'Good' };
    if (score >= 60) return { bg: '#ef4444', text: 'white', label: 'Fair' };
    return { bg: '#991b1b', text: 'white', label: 'Poor' };
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const colors = getScoreColor(score);

  return (
    <div className="inline-flex items-center gap-2">
      <Badge 
        className={sizeClasses[size]}
        style={{ 
          background: colors.bg, 
          color: colors.text,
          fontWeight: 600
        }}
      >
        {score}/100
      </Badge>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{colors.label}</span>
      )}
    </div>
  );
}

// ============================================================================
// RATING BADGE
// ============================================================================

interface RatingBadgeProps {
  rating: string; // AAA, AA, A, BBB, BB, B, CCC
  size?: 'sm' | 'md' | 'lg';
}

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const getRatingColor = (rating: string) => {
    if (rating === 'AAA') return { bg: '#10b981', text: 'white' };
    if (rating === 'AA') return { bg: '#3b82f6', text: 'white' };
    if (rating === 'A') return { bg: '#8b5cf6', text: 'white' };
    if (rating === 'BBB') return { bg: '#f59e0b', text: 'white' };
    if (rating === 'BB') return { bg: '#f97316', text: 'white' };
    if (rating === 'B') return { bg: '#ef4444', text: 'white' };
    return { bg: '#991b1b', text: 'white' };
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-xl px-6 py-3',
  };

  const colors = getRatingColor(rating);

  return (
    <Badge 
      className={sizeClasses[size]}
      style={{ 
        background: colors.bg, 
        color: colors.text,
        fontWeight: 700,
        letterSpacing: '0.05em'
      }}
    >
      {rating}
    </Badge>
  );
}

// ============================================================================
// SCORE CARD
// ============================================================================

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  breakdown?: Array<{
    label: string;
    value: number;
    maxValue?: number;
  }>;
}

export function ScoreCard({ 
  title, 
  score, 
  maxScore = 100, 
  description,
  trend,
  trendValue,
  breakdown 
}: ScoreCardProps) {
  const percentage = (score / maxScore) * 100;
  const colors = getScoreColor(score);

  function getScoreColor(score: number) {
    if (score >= 90) return { primary: '#10b981', light: '#d1fae5' };
    if (score >= 80) return { primary: '#3b82f6', light: '#dbeafe' };
    if (score >= 70) return { primary: '#f59e0b', light: '#fef3c7' };
    if (score >= 60) return { primary: '#ef4444', light: '#fee2e2' };
    return { primary: '#991b1b', light: '#fecaca' };
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <Award className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Score Display */}
        <div className="flex items-end gap-3 mb-4">
          <div className="text-4xl font-bold" style={{ color: colors.primary }}>
            {score}
          </div>
          <div className="text-lg text-muted-foreground mb-1">
            / {maxScore}
          </div>
          {trend && trendValue !== undefined && (
            <div className={`flex items-center gap-1 mb-1 text-sm ${
              trend === 'up' ? 'text-emerald-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {trend === 'stable' && <Minus className="h-4 w-4" />}
              <span>{Math.abs(trendValue)}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full mb-4" style={{ background: colors.light }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${percentage}%`,
              background: colors.primary
            }}
          />
        </div>

        {/* Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  {item.value}{item.maxValue ? `/${item.maxValue}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT SCORE DISPLAY
// ============================================================================

interface CompactScoreProps {
  label: string;
  score: number;
  maxScore?: number;
}

export function CompactScore({ label, score, maxScore = 100 }: CompactScoreProps) {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#f59e0b';
    if (percentage >= 60) return '#ef4444';
    return '#991b1b';
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 rounded-full bg-gray-200">
          <div 
            className="h-full rounded-full transition-all"
            style={{ 
              width: `${percentage}%`,
              background: getColor()
            }}
          />
        </div>
        <span className="text-sm font-medium w-12 text-right">
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
}
