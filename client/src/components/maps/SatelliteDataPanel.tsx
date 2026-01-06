/**
 * SatelliteDataPanel - Displays Earth Engine satellite intelligence
 * Shows NDVI, vegetation health, and soil moisture for a selected location
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Satellite,
  Leaf,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  X,
  MapPin,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface SatelliteDataPanelProps {
  coordinates: { lat: number; lng: number } | null;
  onClose?: () => void;
  className?: string;
}

export function SatelliteDataPanel({
  coordinates,
  onClose,
  className,
}: SatelliteDataPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Earth Engine queries
  const {
    data: ndviData,
    isLoading: ndviLoading,
    refetch: refetchNDVI,
  } = trpc.earthEngine.getNDVI.useQuery(
    { point: coordinates! },
    { enabled: !!coordinates }
  );

  const {
    data: vegetationData,
    isLoading: vegetationLoading,
    refetch: refetchVegetation,
  } = trpc.earthEngine.getVegetationHealth.useQuery(
    { point: coordinates! },
    { enabled: !!coordinates }
  );

  const {
    data: soilData,
    isLoading: soilLoading,
    refetch: refetchSoil,
  } = trpc.earthEngine.getSoilMoisture.useQuery(
    { point: coordinates! },
    { enabled: !!coordinates }
  );

  const {
    data: trendData,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = trpc.earthEngine.getNDVITrend.useQuery(
    { point: coordinates!, years: 2 },
    { enabled: !!coordinates }
  );

  const { data: statusData } = trpc.earthEngine.getStatus.useQuery();

  const isLoading = ndviLoading || vegetationLoading || soilLoading || trendLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchNDVI(), refetchVegetation(), refetchSoil(), refetchTrend()]);
    setIsRefreshing(false);
  };

  if (!coordinates) {
    return (
      <Card className={cn('w-80', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Satellite Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Click anywhere on the map to view satellite data for that location</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-80 max-h-[calc(100vh-200px)] overflow-auto bg-background border shadow-lg', className)}>
      <CardHeader className="pb-3 sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Satellite Intelligence
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
        <p className="text-xs text-muted-foreground">
          {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
        </p>
        {statusData && (
          <Badge variant={statusData.mode === 'live' ? 'default' : 'secondary'} className="text-xs w-fit">
            {statusData.mode === 'live' ? 'Live Data' : 'Demo Mode'}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* NDVI Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Leaf className="h-4 w-4 text-green-600" />
            Vegetation Index (NDVI)
          </div>
          {ndviLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : ndviData ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{ndviData.mean.toFixed(2)}</span>
                <NDVIBadge category={ndviData.healthCategory} />
              </div>
              <Progress
                value={Math.max(0, ndviData.mean) * 100}
                className="h-2"
              />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block font-medium text-foreground">{ndviData.min.toFixed(2)}</span>
                  Min
                </div>
                <div className="text-center">
                  <span className="block font-medium text-foreground">{ndviData.mean.toFixed(2)}</span>
                  Mean
                </div>
                <div className="text-right">
                  <span className="block font-medium text-foreground">{ndviData.max.toFixed(2)}</span>
                  Max
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Source: {ndviData.satellite}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </div>

        {/* NDVI Trend Chart */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-green-600" />
            NDVI Trend (2 Years)
          </div>
          {trendLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : trendData && trendData.dataPoints.length > 0 ? (
            <div className="space-y-2">
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData.dataPoints.map((dp) => ({
                      date: new Date(dp.date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
                      ndvi: dp.ndvi,
                    }))}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v.toFixed(1)}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value: number) => [value.toFixed(3), 'NDVI']}
                    />
                    <ReferenceLine
                      y={0.4}
                      stroke="#eab308"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="ndvi"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#ndviGradient)"
                      dot={{ r: 3, fill: '#22c55e' }}
                      activeDot={{ r: 5, fill: '#22c55e' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Overall Trend:</span>
                <TrendBadge trend={trendData.trend} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No trend data available</p>
          )}
        </div>

        <Separator />

        {/* Vegetation Health Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Vegetation Health
          </div>
          {vegetationLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : vegetationData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{vegetationData.healthScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <Progress value={vegetationData.healthScore} className="h-2" />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-2">
                  <span className="text-xs text-muted-foreground block">EVI</span>
                  <span className="font-medium">{vegetationData.evi.toFixed(3)}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <span className="text-xs text-muted-foreground block">LAI</span>
                  <span className="font-medium">{vegetationData.lai.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Trend:</span>
                <TrendBadge trend={vegetationData.trend} />
              </div>

              {vegetationData.alerts.length > 0 && (
                <div className="space-y-1">
                  {vegetationData.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {alert}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </div>

        <Separator />

        {/* Soil Moisture Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Droplets className="h-4 w-4 text-blue-600" />
            Soil Moisture
          </div>
          {soilLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : soilData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-2">
                  <span className="text-xs text-muted-foreground block">Surface</span>
                  <span className="font-medium">{(soilData.surfaceMoisture * 100).toFixed(1)}%</span>
                  <Progress value={soilData.surfaceMoisture * 100} className="h-1 mt-1" />
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <span className="text-xs text-muted-foreground block">Root Zone</span>
                  <span className="font-medium">{(soilData.rootZoneMoisture * 100).toFixed(1)}%</span>
                  <Progress value={soilData.rootZoneMoisture * 100} className="h-1 mt-1" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Condition:</span>
                <MoistureBadge category={soilData.moistureCategory} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Drought Risk:</span>
                <DroughtRiskBadge risk={soilData.droughtRisk} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </div>

        {/* Info Footer */}
        <div className="pt-2 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Data from Google Earth Engine using Sentinel-2, MODIS, and NASA SMAP satellites.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper components

function NDVIBadge({ category }: { category: string }) {
  const config: Record<string, { color: string; label: string }> = {
    excellent: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Excellent' },
    good: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', label: 'Good' },
    moderate: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Moderate' },
    poor: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Poor' },
    bare: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Bare' },
  };

  const { color, label } = config[category] || config.moderate;
  return <Badge className={cn('text-xs', color)}>{label}</Badge>;
}

function TrendBadge({ trend }: { trend: string }) {
  const config: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
    improving: { icon: TrendingUp, color: 'text-green-600', label: 'Improving' },
    stable: { icon: Minus, color: 'text-gray-600', label: 'Stable' },
    declining: { icon: TrendingDown, color: 'text-red-600', label: 'Declining' },
  };

  const { icon: Icon, color, label } = config[trend] || config.stable;
  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function MoistureBadge({ category }: { category: string }) {
  const config: Record<string, { color: string; label: string }> = {
    saturated: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Saturated' },
    wet: { color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', label: 'Wet' },
    moist: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', label: 'Moist' },
    dry: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', label: 'Dry' },
    very_dry: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Very Dry' },
  };

  const { color, label } = config[category] || config.moist;
  return <Badge className={cn('text-xs', color)}>{label}</Badge>;
}

function DroughtRiskBadge({ risk }: { risk: string }) {
  const config: Record<string, { color: string; label: string; icon: typeof CheckCircle }> = {
    low: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Low', icon: CheckCircle },
    moderate: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Moderate', icon: Info },
    high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'High', icon: AlertTriangle },
    severe: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Severe', icon: AlertTriangle },
  };

  const { color, label, icon: Icon } = config[risk] || config.moderate;
  return (
    <Badge className={cn('text-xs flex items-center gap-1', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export default SatelliteDataPanel;
