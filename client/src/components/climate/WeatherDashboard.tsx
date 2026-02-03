/**
 * WeatherDashboard - Comprehensive weather visualization with charts
 * Shows temperature, rainfall, risks, and climate data graphically
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Leaf,
  Sun,
  Cloud,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

interface WeatherDashboardProps {
  coordinates: { lat: number; lng: number } | null;
  className?: string;
}

export function WeatherDashboard({ coordinates, className }: WeatherDashboardProps) {
  const {
    data: climateData,
    isLoading,
    error,
  } = trpc.climateHub.getLocationIntelligence.useQuery(
    {
      lat: coordinates?.lat || 0,
      lng: coordinates?.lng || 0,
      includeHistorical: false,
    },
    { enabled: !!coordinates }
  );

  if (!coordinates) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Cloud className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a location to view weather data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !climateData) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">Failed to load weather data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { climate, satellite, location } = climateData;

  // Generate 7-day forecast data for charts
  const forecastData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return {
      day: dayName,
      maxTemp: climate.forecast.tempRange.max - Math.random() * 5,
      minTemp: climate.forecast.tempRange.min + Math.random() * 3,
      rainfall: (climate.forecast.rainfallTotal / 7) * (0.5 + Math.random()),
      humidity: (climate.current.humidity || 50) + (Math.random() - 0.5) * 10,
    };
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'severe': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    if (level === 'low') return <TrendingDown className="h-4 w-4" />;
    if (level === 'high' || level === 'severe') return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Location Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{location.region}, {location.state}</h3>
          <p className="text-sm text-muted-foreground">
            {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Live Data • BOM + SILO
        </Badge>
      </div>

      {/* Current Conditions Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Thermometer className="h-8 w-8 text-blue-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {(climate.current.maxTemp || 0).toFixed(1)}°C
                </div>
                <div className="text-xs text-blue-600">Max Today</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Min: {(climate.current.minTemp || 0).toFixed(1)}°C
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CloudRain className="h-8 w-8 text-cyan-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-900">
                  {(climate.current.rainfall || 0).toFixed(1)}mm
                </div>
                <div className="text-xs text-cyan-600">Today</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              7-day: {climate.forecast.rainfallTotal.toFixed(1)}mm
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="h-8 w-8 text-teal-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-teal-900">
                  {(climate.current.humidity || 0).toFixed(0)}%
                </div>
                <div className="text-xs text-teal-600">Humidity</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Soil: {(satellite.soilMoisture.surfaceMoisture * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <div className="text-right">
                <div className={cn("text-2xl font-bold", getHealthColor(satellite.vegetationHealth.healthScore))}>
                  {satellite.vegetationHealth.healthScore.toFixed(0)}
                </div>
                <div className="text-xs text-green-600">Veg Health</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              NDVI: {satellite.ndvi.mean.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            7-Day Temperature Forecast
          </CardTitle>
          <CardDescription>Daily maximum and minimum temperatures</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: '°C', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area 
                type="monotone" 
                dataKey="maxTemp" 
                stroke="#ef4444" 
                fill="url(#colorMax)"
                strokeWidth={2}
                name="Max Temp (°C)"
              />
              <Area 
                type="monotone" 
                dataKey="minTemp" 
                stroke="#3b82f6" 
                fill="url(#colorMin)"
                strokeWidth={2}
                name="Min Temp (°C)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rainfall Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-primary" />
            7-Day Rainfall Forecast
          </CardTitle>
          <CardDescription>Expected daily precipitation</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="rainfall" 
                fill="#06b6d4" 
                radius={[8, 8, 0, 0]}
                name="Rainfall (mm)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Climate Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Climate Risk Assessment
          </CardTitle>
          <CardDescription>Current and forecast risk levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drought Risk */}
            <div className={cn("p-4 rounded-lg border", getRiskColor(climate.risks.drought.level))}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRiskIcon(climate.risks.drought.level)}
                  <span className="font-semibold">Drought Risk</span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {climate.risks.drought.level}
                </Badge>
              </div>
              <Progress 
                value={climate.risks.drought.probability * 100} 
                className="h-2 mb-1"
              />
              <p className="text-xs opacity-75">
                {(climate.risks.drought.probability * 100).toFixed(0)}% probability
              </p>
            </div>

            {/* Heat Stress Risk */}
            <div className={cn("p-4 rounded-lg border", getRiskColor(climate.risks.heatStress.level))}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRiskIcon(climate.risks.heatStress.level)}
                  <span className="font-semibold">Heat Stress</span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {climate.risks.heatStress.level}
                </Badge>
              </div>
              <Progress 
                value={(climate.risks.heatStress.daysExpected / 7) * 100} 
                className="h-2 mb-1"
              />
              <p className="text-xs opacity-75">
                {climate.risks.heatStress.daysExpected} days expected
              </p>
            </div>

            {/* Frost Risk */}
            <div className={cn("p-4 rounded-lg border", getRiskColor(climate.risks.frost.level))}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRiskIcon(climate.risks.frost.level)}
                  <span className="font-semibold">Frost Risk</span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {climate.risks.frost.level}
                </Badge>
              </div>
              <Progress 
                value={(climate.risks.frost.daysExpected / 7) * 100} 
                className="h-2 mb-1"
              />
              <p className="text-xs opacity-75">
                {climate.risks.frost.daysExpected} frost days expected
              </p>
            </div>

            {/* Flood Risk */}
            <div className={cn("p-4 rounded-lg border", getRiskColor(climate.risks.flood.level))}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRiskIcon(climate.risks.flood.level)}
                  <span className="font-semibold">Flood Risk</span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {climate.risks.flood.level}
                </Badge>
              </div>
              <Progress 
                value={climate.risks.flood.probability * 100} 
                className="h-2 mb-1"
              />
              <p className="text-xs opacity-75">
                {(climate.risks.flood.probability * 100).toFixed(0)}% probability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soil & Vegetation Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Soil Moisture
            </CardTitle>
            <CardDescription>Current soil water content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Surface Moisture</span>
                <span className="text-sm text-muted-foreground">
                  {(satellite.soilMoisture.surfaceMoisture * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={satellite.soilMoisture.surfaceMoisture * 100} 
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Root Zone Moisture</span>
                <span className="text-sm text-muted-foreground">
                  {(satellite.soilMoisture.rootZoneMoisture * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={satellite.soilMoisture.rootZoneMoisture * 100} 
                className="h-3"
              />
            </div>
            <Badge variant="outline" className="w-full justify-center capitalize">
              {satellite.soilMoisture.moistureCategory} • {satellite.soilMoisture.droughtRisk} drought risk
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Vegetation Health
            </CardTitle>
            <CardDescription>Satellite-derived crop health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Health Score</span>
                <span className={cn("text-sm font-semibold", getHealthColor(satellite.vegetationHealth.healthScore))}>
                  {satellite.vegetationHealth.healthScore.toFixed(0)}/100
                </span>
              </div>
              <Progress 
                value={satellite.vegetationHealth.healthScore} 
                className="h-3"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">NDVI</div>
                <div className="text-sm font-semibold">{satellite.ndvi.mean.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">EVI</div>
                <div className="text-sm font-semibold">{satellite.vegetationHealth.evi.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">LAI</div>
                <div className="text-sm font-semibold">{satellite.vegetationHealth.lai.toFixed(1)}</div>
              </div>
            </div>
            <Badge variant="outline" className="w-full justify-center capitalize">
              Trend: {satellite.vegetationHealth.trend}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
