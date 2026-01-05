/**
 * CompactCard - Information-dense card with hover-to-expand detail
 * Optimized for dashboards with many cards
 */
import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './badge';
import { Button } from './Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompactCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  value?: string | number;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  };
  icon?: React.ReactNode;
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'outlined' | 'filled';
}

export function CompactCard({
  title,
  subtitle,
  value,
  badge,
  icon,
  expandable = false,
  expandedContent,
  defaultExpanded = false,
  actions,
  size = 'sm',
  variant = 'default',
  className,
  children,
  ...props
}: CompactCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  const sizeStyles = {
    xs: {
      padding: 'p-2',
      titleText: 'text-xs',
      valueText: 'text-sm',
      iconSize: 'h-3 w-3',
      gap: 'gap-1',
    },
    sm: {
      padding: 'p-3',
      titleText: 'text-sm',
      valueText: 'text-base',
      iconSize: 'h-4 w-4',
      gap: 'gap-1.5',
    },
    md: {
      padding: 'p-4',
      titleText: 'text-sm',
      valueText: 'text-lg',
      iconSize: 'h-5 w-5',
      gap: 'gap-2',
    },
  };

  const variantStyles = {
    default: 'border hover:border-primary/20 hover:shadow-sm',
    outlined: 'border-2 hover:border-primary/30',
    filled: 'bg-muted/50 border-transparent hover:bg-muted',
  };

  const styles = sizeStyles[size];

  return (
    <Card
      padding="none"
      className={cn(
        'transition-all duration-200',
        variantStyles[variant],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div className={cn(styles.padding, styles.gap, 'flex flex-col')}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {icon && (
              <div className={cn('text-muted-foreground flex-shrink-0 mt-0.5', styles.iconSize)}>
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className={cn('font-medium truncate', styles.titleText)}>
                  {title}
                </h4>
                {badge && (
                  <Badge
                    variant={badge.variant || 'secondary'}
                    className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Value or Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {value !== undefined && (
              <span className={cn('font-semibold tabular-nums', styles.valueText)}>
                {value}
              </span>
            )}
            {actions && (
              <div className={cn(
                'transition-opacity duration-150',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}>
                {actions}
              </div>
            )}
            {expandable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Inline Children (always visible) */}
        {children && (
          <div className="text-sm">{children}</div>
        )}

        {/* Expandable Content */}
        {expandable && isExpanded && expandedContent && (
          <div className="pt-2 border-t mt-1">
            {expandedContent}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * CompactCardGrid - Grid layout optimized for CompactCards
 */
export function CompactCardGrid({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-2', colStyles[cols], className)}>
      {children}
    </div>
  );
}

export default CompactCard;
