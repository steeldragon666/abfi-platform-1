/**
 * CollapsibleSection - Accordion-style section with persistent state
 * Remembers open/closed state in localStorage
 */
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleSectionProps {
  id: string; // Unique ID for localStorage persistence
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  };
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  persistState?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'bordered' | 'filled' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

const STORAGE_KEY_PREFIX = 'collapsible-section-';

export function CollapsibleSection({
  id,
  title,
  description,
  badge,
  icon,
  defaultOpen = true,
  persistState = true,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
  size = 'md',
}: CollapsibleSectionProps) {
  // Initialize state from localStorage or default
  const [isOpen, setIsOpen] = useState(() => {
    if (!persistState) return defaultOpen;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultOpen;
  });

  // Persist state to localStorage
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, String(isOpen));
    }
  }, [id, isOpen, persistState]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const variantStyles = {
    default: {
      container: 'border-b',
      header: 'py-3',
      content: 'pb-4',
    },
    bordered: {
      container: 'border rounded-lg',
      header: 'p-4 border-b',
      content: 'p-4',
    },
    filled: {
      container: 'bg-muted/30 rounded-lg',
      header: 'p-4',
      content: 'p-4 pt-0',
    },
    minimal: {
      container: '',
      header: 'py-2',
      content: 'pb-2',
    },
  };

  const sizeStyles = {
    sm: {
      title: 'text-sm',
      icon: 'h-4 w-4',
      chevron: 'h-3 w-3',
    },
    md: {
      title: 'text-base',
      icon: 'h-5 w-5',
      chevron: 'h-4 w-4',
    },
    lg: {
      title: 'text-lg',
      icon: 'h-6 w-6',
      chevron: 'h-5 w-5',
    },
  };

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div className={cn(styles.container, className)}>
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'w-full flex items-center justify-between gap-3 text-left',
          'hover:bg-muted/50 transition-colors duration-150 rounded-sm',
          styles.header,
          headerClassName
        )}
        aria-expanded={isOpen}
        aria-controls={`section-content-${id}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Chevron */}
          <div className={cn(
            'text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-90'
          )}>
            <ChevronRight className={sizes.chevron} />
          </div>

          {/* Icon */}
          {icon && (
            <div className={cn('text-muted-foreground flex-shrink-0', sizes.icon)}>
              {icon}
            </div>
          )}

          {/* Title & Description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn('font-semibold truncate', sizes.title)}>
                {title}
              </h3>
              {badge && (
                <Badge
                  variant={badge.variant || 'secondary'}
                  className="text-xs flex-shrink-0"
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions (prevent event propagation) */}
        {actions && (
          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </button>

      {/* Content */}
      <div
        id={`section-content-${id}`}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn(styles.content, contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * CollapsibleSectionGroup - Container for multiple collapsible sections
 * Optionally allows only one section open at a time (accordion mode)
 */
export function CollapsibleSectionGroup({
  children,
  accordion = false,
  className,
}: {
  children: React.ReactNode;
  accordion?: boolean;
  className?: string;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  // In accordion mode, we need to clone children and manage their state
  // For simplicity, this version just provides styling - full accordion
  // mode would require more complex state management

  return (
    <div className={cn('space-y-1', className)}>
      {children}
    </div>
  );
}

/**
 * Hook to manage collapsible section state externally
 */
export function useCollapsibleState(id: string, defaultOpen = true, persist = true) {
  const [isOpen, setIsOpen] = useState(() => {
    if (!persist || typeof window === 'undefined') return defaultOpen;
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    return stored !== null ? stored === 'true' : defaultOpen;
  });

  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, String(isOpen));
    }
  }, [id, isOpen, persist]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, toggle, open, close, setIsOpen };
}

export default CollapsibleSection;
