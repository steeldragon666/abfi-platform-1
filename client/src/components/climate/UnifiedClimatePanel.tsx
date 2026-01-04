/**
 * UnifiedClimatePanel - Combined satellite + weather data display
 * Shows unified climate intelligence for a selected location
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Satellite,
  Leaf,
  Droplets,
  Cloud,
  Thermometer,
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  X,
  MapPin,
  Sun,
  CloudRain,
  Gauge,
  CalendarDays,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { ClimateAlertsCompact } from './ClimateAlertsBar';

interface UnifiedClimatePanelProps {
  coordinates: { lat: number; lng: number } | null;
  onClose?: () => void;
  className?: string;
}

export function UnifiedClimatePanel({
  coordinates,
  onClose,
  className,
}: UnifiedClimatePanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Unified climate intelligence query
  const {
    data: climateData,
    isLoading,
    refetch,
    error,
  } = trpc.climateHub.getLocationIntelligence.useQuery(
    {
      latitude: coordinates?.lat || 0,
      longitude: coordinates?.lng || 0,
      includeHistorical: false,
    },
    { enabled: !!coordinates }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (!coordinates) {
    return (
      <Card className={cn('w-96', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Climate Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Click anywhere on the map to view unified climate data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-96 max-h-[calc(100vh-200px)] overflow-auto', className)}>
      <CardHeader className="pb-3 sticky top-0 bg-card z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Climate Intelligence
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', (isLoading || isRefreshing) && 'animate-spin')} />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </p>
          {climateData?.location.region && (
            <Badge variant="outline" className="text-xs">
              {climateData.location.region}
            </Badge>
          )}
        </div>

        {/* Overall Score */}
        {climateData && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Overall Score</span>
            </div>
            <div className="flex-1">
              <Progress value={climateData.overallScore} className="h-2" />
            </div>
            <span className="text-sm font-bold">{climateData.overallScore}/100</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive" />
            <p className="text-sm text-destructive">Failed to load climate data</p>
          </div>
        ) : climateData ? (
          <Tabs defaultValue="satellite" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="satellite" className="text-xs">
                <Satellite className="h-3 w-3 mr-1" />
                Satellite
              </TabsTrigger>
              <TabsTrigger value="weather" className="text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                Weather
              </TabsTrigger>
              <TabsTrigger value="risks" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Risks
              </TabsTrigger>
            </TabsList>

            {/* Satellite Tab */}
            <TabsContent value="satellite" className="space-y-4 mt-4">
              {/* NDVI */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Leaf className="h-4 w-4 text-green-600" />
                  Vegetation Index (NDVI)
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {climateData.satellite?.ndvi?.toFixed(2) || 'N/A'}
                  </span>
                  <NDVIBadge value={climateData.satellite?.ndvi || 0} />
                </div>
                {climateData.satellite?.ndvi !== undefined && (
                  <Progress
                    value={Math.max(0, climateData.satellite.ndvi) * 100}
                    className="h-2"
                  />
                )}
              </div>

              <Separator />

              {/* Vegetation Health */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Vegetation Health
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="EVI"
                    value={climateData.satellite?.evi?.toFixed(3) || 'N/A'}
                  />
                  <MetricCard
                    label="Health Index"
                    value={climateData.satellite?.vegetationHealthIndex?.toFixed(0) || 'N/A'}
                    suffix="/100"
                  />
                </div>
              </div>

              <Separator />

              {/* Soil Moisture */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  Soil Moisture
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Surface"
                    value={`${((climateData.satellite?.soilMoisture || 0) * 100).toFixed(1)}%`}
                  />
                  <MetricCard
                    label="Drought Risk"
                    value={climateData.satellite?.droughtRisk || 'N/A'}
                    badge
                    badgeVariant={getDroughtRiskVariant(climateData.satellite?.droughtRisk)}
                  />
                </div>
              </div>

              {/* Data Freshness */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Satellite data: {formatFreshness(climateData.dataFreshness?.satellite)}
                </div>
              </div>
            </TabsContent>

            {/* Weather Tab */}
            <TabsContent value="weather" className="space-y-4 mt-4">
              {/* Current Conditions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Current Conditions
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Temperature"
                    value={`${climateData.climate?.current?.temperature?.toFixed(1) || 'N/A'}°C`}
                    icon={<Thermometer className="h-3 w-3 text-red-500" />}
                  />
                  <MetricCard
                    label="Humidity"
                    value={`${climateData.climate?.current?.humidity?.toFixed(0) || 'N/A'}%`}
                    icon={<Droplets className="h-3 w-3 text-blue-500" />}
                  />
                  <MetricCard
                    label="Wind"
                    value={`${climateData.climate?.current?.windSpeed?.toFixed(0) || 'N/A'} km/h`}
                    icon={<Wind className="h-3 w-3 text-gray-500" />}
                  />
                  <MetricCard
                    label="Rain Today"
                    value={`${climateData.climate?.current?.rainfall?.toFixed(1) || '0'} mm`}
                    icon={<CloudRain className="h-3 w-3 text-blue-500" />}
                  />
                </div>
              </div>

              <Separator />

              {/* Climate Metrics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  30-Day Climate
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Total Rainfall"
                    value={`${climateData.climate?.monthly?.totalRainfall?.toFixed(1) || 'N/A'} mm`}
                  />
                  <MetricCard
                    label="Avg Max Temp"
                    value={`${climateData.climate?.monthly?.avgMaxTemp?.toFixed(1) || 'N/A'}°C`}
                  />
                  <MetricCard
                    label="Growing Days"
                    value={`${climateData.climate?.monthly?.growingDegreeDays?.toFixed(0) || 'N/A'}`}
                  />
                  <MetricCard
                    label="Frost Days"
                    value={`${climateData.climate?.monthly?.frostDays || 0}`}
                  />
                </div>
              </div>

              {/* Data Freshness */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Climate data: {formatFreshness(climateData.dataFreshness?.climate)}
                </div>
              </div>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-4 mt-4">
              {/* Active Alerts */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Active Alerts
                </div>
                <ClimateAlertsCompact alerts={climateData.alerts || []} />
              </div>

              <Separator />

              {/* Risk Assessment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gauge className="h-4 w-4 text-primary" />
                  Risk Assessment
                </div>
                <div className="space-y-2">
                  <RiskRow
                    label="Drought Risk"
                    risk={climateData.satellite?.droughtRisk || 'unknown'}
                  />
                  <RiskRow
                    label="Frost Risk"
                    risk={getFrostRisk(climateData.climate?.monthly?.frostDays)}
                  />
                  <RiskRow
                    label="Heat Stress"
                    risk={getHeatRisk(climateData.climate?.monthly?.avgMaxTemp)}
                  />
                </div>
              </div>

              <Separator />

              {/* Recommendations */}
              {climateData.recommendations && climateData.recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Recommendations
                  </div>
                  <ul className="space-y-1">
                    {climateData.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5">-</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Info Footer */}
        <div className="pt-2 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Unified data from Google Earth Engine, BOM, and SILO.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components

function MetricCard({
  label,
  value,
  suffix,
  icon,
  badge,
  badgeVariant = 'default',
}: {
  label: string;
  value: string;
  suffix?: string;
  icon?: React.ReactNode;
  badge?: boolean;
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const variantClasses = {
    default: 'bg-muted',
    success: 'bg-green-100 dark:bg-green-900/30',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    destructive: 'bg-red-100 dark:bg-red-900/30',
  };

  return (
    <div className={cn('rounded-lg p-2', badge ? variantClasses[badgeVariant] : 'bg-muted/50')}>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-medium">
        {value}
        {suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

function NDVIBadge({ value }: { value: number }) {
  let category = 'moderate';
  let color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

  if (value >= 0.7) {
    category = 'Excellent';
    color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  } else if (value >= 0.5) {
    category = 'Good';
    color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  } else if (value >= 0.3) {
    category = 'Moderate';
    color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  } else if (value >= 0.1) {
    category = 'Poor';
    color = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  } else {
    category = 'Bare';
    color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }

  return <Badge className={cn('text-xs', color)}>{category}</Badge>;
}

function RiskRow({ label, risk }: { label: string; risk: string }) {
  const riskConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
    low: { color: 'text-green-600', icon: CheckCircle },
    moderate: { color: 'text-amber-600', icon: Info },
    high: { color: 'text-orange-600', icon: AlertTriangle },
    severe: { color: 'text-red-600', icon: AlertTriangle },
    unknown: { color: 'text-gray-400', icon: Minus },
  };

  const config = riskConfig[risk.toLowerCase()] || riskConfig.unknown;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1 font-medium capitalize', config.color)}>
        <Icon className="h-3 w-3" />
        {risk}
      </span>
    </div>
  );
}

function getDroughtRiskVariant(risk?: string): 'default' | 'success' | 'warning' | 'destructive' {
  if (!risk) return 'default';
  const r = risk.toLowerCase();
  if (r === 'low') return 'success';
  if (r === 'moderate') return 'warning';
  if (r === 'high' || r === 'severe') return 'destructive';
  return 'default';
}

function getFrostRisk(frostDays?: number): string {
  if (frostDays === undefined) return 'unknown';
  if (frostDays === 0) return 'low';
  if (frostDays <= 3) return 'moderate';
  if (frostDays <= 7) return 'high';
  return 'severe';
}

function getHeatRisk(avgMaxTemp?: number): string {
  if (avgMaxTemp === undefined) return 'unknown';
  if (avgMaxTemp < 30) return 'low';
  if (avgMaxTemp < 35) return 'moderate';
  if (avgMaxTemp < 40) return 'high';
  return 'severe';
}

function formatFreshness(timestamp?: string): string {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default UnifiedClimatePanel;
