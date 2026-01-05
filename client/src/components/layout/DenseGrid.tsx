/**
 * DenseGrid - Information-dense grid layout
 * Tighter spacing with more columns on wide screens
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DenseGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  responsive?: boolean;
  minWidth?: string;
}

/**
 * DenseGrid - Tighter grid with configurable columns
 */
export function DenseGrid({
  children,
  cols = 4,
  gap = 'sm',
  responsive = true,
  className,
  ...props
}: DenseGridProps) {
  const gapStyles = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  // Responsive column configurations
  const colStyles = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-4',
    5: responsive ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-5',
    6: responsive ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-6',
  };

  return (
    <div
      className={cn('grid', colStyles[cols], gapStyles[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DenseStatsGrid - Specialized grid for stats cards
 * Extra dense with support for many columns
 */
export interface DenseStatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'ultra-compact';
}

export function DenseStatsGrid({
  children,
  variant = 'default',
  className,
  ...props
}: DenseStatsGridProps) {
  const variantStyles = {
    default: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4',
    compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2',
    'ultra-compact': 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1',
  };

  return (
    <div
      className={cn('grid', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DenseList - Tight vertical list layout
 */
export interface DenseListProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md';
  dividers?: boolean;
}

export function DenseList({
  children,
  gap = 'xs',
  dividers = false,
  className,
  ...props
}: DenseListProps) {
  const gapStyles = {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
  };

  return (
    <div
      className={cn(
        gapStyles[gap],
        dividers && 'divide-y divide-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DenseFlex - Flexible dense layout
 * Wraps items with tight spacing
 */
export interface DenseFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md';
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  direction?: 'row' | 'col';
}

export function DenseFlex({
  children,
  gap = 'sm',
  wrap = true,
  align = 'center',
  justify = 'start',
  direction = 'row',
  className,
  ...props
}: DenseFlexProps) {
  const gapStyles = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
  };

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const directionStyles = {
    row: 'flex-row',
    col: 'flex-col',
  };

  return (
    <div
      className={cn(
        'flex',
        directionStyles[direction],
        gapStyles[gap],
        alignStyles[align],
        justifyStyles[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * AutoGrid - CSS Grid with auto-fit columns
 * Automatically creates as many columns as fit
 */
export interface AutoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minWidth?: string;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export function AutoGrid({
  children,
  minWidth = '200px',
  gap = 'sm',
  className,
  style,
  ...props
}: AutoGridProps) {
  const gapStyles = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={cn('grid', gapStyles[gap], className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * MasonryGrid - Masonry-style layout using CSS columns
 * Good for varying height items
 */
export interface MasonryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4;
  gap?: 'none' | 'xs' | 'sm' | 'md';
}

export function MasonryGrid({
  children,
  cols = 3,
  gap = 'sm',
  className,
  ...props
}: MasonryGridProps) {
  const colStyles = {
    1: 'columns-1',
    2: 'columns-1 sm:columns-2',
    3: 'columns-1 sm:columns-2 lg:columns-3',
    4: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
  };

  const gapStyles = {
    none: 'gap-0',
    xs: '[column-gap:0.25rem]',
    sm: '[column-gap:0.5rem]',
    md: '[column-gap:1rem]',
  };

  return (
    <div
      className={cn(colStyles[cols], gapStyles[gap], className)}
      {...props}
    >
      {React.Children.map(children, (child) => (
        <div className="break-inside-avoid mb-2">
          {child}
        </div>
      ))}
    </div>
  );
}

export default DenseGrid;
