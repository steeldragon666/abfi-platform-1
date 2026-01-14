/**
 * ABFI Platform - Premium Metric Card Component
 * "Australian Summer Dusk" Design System
 * 
 * High-end metric visualization with distinctive styling
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendUpIcon, TrendDownIcon } from './icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'ochre' | 'eucalyptus' | 'coastal' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card border-border',
  ochre: 'bg-gradient-to-br from-[#FFF9E8] to-[#FFF0C7] border-[#FFE08A] dark:from-[#78350F]/20 dark:to-[#92400E]/20 dark:border-[#B45309]/30',
  eucalyptus: 'bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border-[#A7F3D0] dark:from-[#064E3B]/20 dark:to-[#065F46]/20 dark:border-[#047857]/30',
  coastal: 'bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] border-[#99F6E4] dark:from-[#134E4A]/20 dark:to-[#115E59]/20 dark:border-[#0F766E]/30',
  glass: 'bg-white/70 dark:bg-[#18181B]/70 backdrop-blur-xl border-white/30 dark:border-white/10',
};

const sizeStyles = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const trendColors = {
  up: 'text-[#10B981]',
  down: 'text-[#EF4444]',
  neutral: 'text-[#71717A]',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  size = 'md',
  className,
  onClick,
}) => {
  const isClickable = !!onClick;
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        isClickable && 'cursor-pointer hover:shadow-lg hover:-translate-y-1',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F59E0B] via-[#10B981] to-[#14B8A6]" />
      
      {/* Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          
          {/* Value */}
          <p className={cn(
            'font-mono font-bold tracking-tight mt-1',
            size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'
          )}>
            {value}
          </p>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          
          {/* Trend */}
          {trend && (
            <div className={cn(
              'flex items-center gap-1.5 mt-2',
              trendColors[trend.direction]
            )}>
              {trend.direction === 'up' && <TrendUpIcon size="xs" />}
              {trend.direction === 'down' && <TrendDownIcon size="xs" />}
              <span className="text-sm font-semibold font-mono">
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '' : ''}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className={cn(
            'shrink-0 p-2.5 rounded-lg',
            variant === 'ochre' && 'bg-[#F59E0B]/10 text-[#B45309]',
            variant === 'eucalyptus' && 'bg-[#10B981]/10 text-[#047857]',
            variant === 'coastal' && 'bg-[#14B8A6]/10 text-[#0F766E]',
            variant === 'default' && 'bg-muted text-muted-foreground',
            variant === 'glass' && 'bg-white/50 dark:bg-white/10 text-foreground',
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Metric Card Grid - Responsive layout for multiple metrics
 */
interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  children,
  columns = 4,
  className,
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
};

export default MetricCard;
