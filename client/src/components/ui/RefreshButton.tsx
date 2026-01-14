/**
 * RefreshButton Component
 * 
 * A reusable button for refreshing data in dashboard components.
 * Shows loading state and provides visual feedback.
 */

import { RefreshCw } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface RefreshButtonProps extends Omit<ButtonProps, 'onClick'> {
  onRefresh: () => void | Promise<void>;
  isLoading?: boolean;
  lastUpdated?: Date | null;
  showTimestamp?: boolean;
  label?: string;
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  lastUpdated,
  showTimestamp = false,
  label = 'Refresh',
  className,
  variant = 'outline',
  size = 'sm',
  ...props
}: RefreshButtonProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2">
      {showTimestamp && lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Updated {formatTimestamp(lastUpdated)}
        </span>
      )}
      <Button
        variant={variant}
        size={size}
        onClick={onRefresh}
        disabled={isLoading}
        className={cn('gap-2', className)}
        {...props}
      >
        <RefreshCw 
          className={cn(
            'h-4 w-4',
            isLoading && 'animate-spin'
          )} 
        />
        {size !== 'icon' && label}
      </Button>
    </div>
  );
}

/**
 * Hook for managing refresh state
 */
import { useState, useCallback } from 'react';

export function useRefresh<T>(
  fetchFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await fetchFn();
      setLastUpdated(new Date());
      options?.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Refresh failed');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn, options]);

  return {
    refresh,
    isRefreshing,
    lastUpdated,
    error,
  };
}

export default RefreshButton;
