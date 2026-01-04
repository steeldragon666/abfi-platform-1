/**
 * ClimateAlertsBar - Displays active weather warnings and climate alerts
 * Shows as a horizontal strip at the top of the Climate Hub
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  CloudLightning,
  Flame,
  Droplets,
  Wind,
  Thermometer,
  X,
  ChevronRight,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClimateAlert {
  type: string;
  severity: string;
  title: string;
  description?: string;
  affectedAreas?: string[];
  expiryTime?: string;
}

interface ClimateAlertsBarProps {
  alerts: ClimateAlert[];
  isLoading?: boolean;
  className?: string;
}

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  extreme: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  severe: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  warning: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
  watch: { bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-500' },
  advisory: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
};

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  storm: CloudLightning,
  fire: Flame,
  flood: Droplets,
  wind: Wind,
  heat: Thermometer,
  default: AlertTriangle,
};

export function ClimateAlertsBar({ alerts, isLoading, className }: ClimateAlertsBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) {
    return null;
  }

  const currentAlert = alerts[currentIndex];
  const severityConfig = SEVERITY_CONFIG[currentAlert.severity.toLowerCase()] || SEVERITY_CONFIG.advisory;
  const IconComponent = TYPE_ICONS[currentAlert.type.toLowerCase()] || TYPE_ICONS.default;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % alerts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
  };

  return (
    <div
      className={cn(
        'w-full py-2 px-4 flex items-center justify-between gap-4',
        severityConfig.bg,
        severityConfig.text,
        className
      )}
    >
      {/* Alert Content */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <IconComponent className="h-5 w-5 flex-shrink-0" />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge variant="outline" className={cn('border', severityConfig.border, severityConfig.text, 'bg-white/10')}>
            {currentAlert.severity.toUpperCase()}
          </Badge>
          <span className="font-semibold truncate">{currentAlert.title}</span>
          {currentAlert.affectedAreas && currentAlert.affectedAreas.length > 0 && (
            <span className="text-sm opacity-80 hidden md:inline">
              - {currentAlert.affectedAreas.slice(0, 2).join(', ')}
              {currentAlert.affectedAreas.length > 2 && ` +${currentAlert.affectedAreas.length - 2} more`}
            </span>
          )}
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {alerts.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-current hover:bg-white/20"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">
              {currentIndex + 1} / {alerts.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-current hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-current hover:bg-white/20"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact version for embedding in other components
 */
export function ClimateAlertsCompact({ alerts }: { alerts: ClimateAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="h-4 w-4" />
        <span>No active alerts</span>
      </div>
    );
  }

  const severeAlerts = alerts.filter(a =>
    ['extreme', 'severe'].includes(a.severity.toLowerCase())
  );

  return (
    <div className="space-y-1">
      {alerts.slice(0, 3).map((alert, i) => {
        const severityConfig = SEVERITY_CONFIG[alert.severity.toLowerCase()] || SEVERITY_CONFIG.advisory;
        const IconComponent = TYPE_ICONS[alert.type.toLowerCase()] || TYPE_ICONS.default;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 text-xs px-2 py-1 rounded',
              severityConfig.bg,
              severityConfig.text
            )}
          >
            <IconComponent className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{alert.title}</span>
          </div>
        );
      })}
      {alerts.length > 3 && (
        <p className="text-xs text-muted-foreground pl-2">
          +{alerts.length - 3} more alerts
        </p>
      )}
    </div>
  );
}

export default ClimateAlertsBar;
