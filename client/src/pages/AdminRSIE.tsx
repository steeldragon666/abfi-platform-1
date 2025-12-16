/**
 * RSIE Admin Dashboard - Risk & Supply Intelligence Engine
 * Admin-only page for managing data sources, weather integration, risk events, and monitoring.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import {
  Database,
  AlertTriangle,
  Cloud,
  Newspaper,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Droplets,
  Wind,
  Thermometer,
  Bug,
  Truck,
  FileText,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  MapPin,
  CloudRain,
  Loader2,
  Download,
  Satellite,
  Globe,
  AlertCircle,
  Sun,
  Snowflake,
} from "lucide-react";
import { Redirect } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

// Risk event type icons
const RISK_TYPE_ICONS: Record<string, React.ReactNode> = {
  bushfire: <Flame className="h-4 w-4 text-orange-500" />,
  flood: <Droplets className="h-4 w-4 text-blue-500" />,
  drought: <Thermometer className="h-4 w-4 text-amber-600" />,
  cyclone: <Wind className="h-4 w-4 text-purple-500" />,
  storm: <Cloud className="h-4 w-4 text-gray-500" />,
  heatwave: <Thermometer className="h-4 w-4 text-red-500" />,
  frost: <Snowflake className="h-4 w-4 text-cyan-500" />,
  pest: <Bug className="h-4 w-4 text-green-600" />,
  disease: <Bug className="h-4 w-4 text-red-600" />,
  policy: <FileText className="h-4 w-4 text-indigo-500" />,
  industrial_action: <Truck className="h-4 w-4 text-gray-600" />,
  logistics_disruption: <Truck className="h-4 w-4 text-yellow-600" />,
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  weather: <Cloud className="h-4 w-4 text-blue-500" />,
  biomass: <Flame className="h-4 w-4 text-green-500" />,
  agriculture: <Globe className="h-4 w-4 text-amber-500" />,
  hazards: <AlertTriangle className="h-4 w-4 text-red-500" />,
  policy: <FileText className="h-4 w-4 text-indigo-500" />,
  spatial: <MapPin className="h-4 w-4 text-purple-500" />,
  certification: <Shield className="h-4 w-4 text-green-600" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  loading,
  variant = "default",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  loading?: boolean;
  variant?: "default" | "success" | "warning" | "error";
}) {
  const variants = {
    default: "bg-primary/10",
    success: "bg-green-500/10",
    warning: "bg-yellow-500/10",
    error: "bg-red-500/10",
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <div className={cn("p-2 rounded-lg", variants[variant])}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={cn(
                "h-3 w-3",
                trend.value >= 0 ? "text-green-500" : "text-red-500"
              )}
            />
            <span
              className={cn(
                "text-xs",
                trend.value >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GridCellMap({ cells }: { cells: Array<{ cellId: string; lat: number; lng: number; name: string }> }) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // Group cells by state prefix
  const cellsByState: Record<string, typeof cells> = {};
  cells.forEach(cell => {
    const state = cell.cellId.split('-')[0];
    if (!cellsByState[state]) cellsByState[state] = [];
    cellsByState[state].push(cell);
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(cellsByState).map(([state, stateCells]) => (
          <Card key={state} className="p-3">
            <div className="font-semibold text-sm mb-2">{state}</div>
            <div className="space-y-1">
              {stateCells.map(cell => (
                <button
                  key={cell.cellId}
                  onClick={() => setSelectedCell(selectedCell === cell.cellId ? null : cell.cellId)}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-xs transition-colors",
                    selectedCell === cell.cellId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{cell.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {selectedCell && cells.find(c => c.cellId === selectedCell) && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{cells.find(c => c.cellId === selectedCell)?.name}</div>
              <div className="text-sm text-muted-foreground">
                {cells.find(c => c.cellId === selectedCell)?.lat.toFixed(4)},
                {cells.find(c => c.cellId === selectedCell)?.lng.toFixed(4)}
              </div>
            </div>
            <Badge variant="outline">{selectedCell}</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}

function WeatherApiPanel() {
  const { data: apiStatus, isLoading: loadingApiStatus, refetch: refetchApiStatus } =
    trpc.rsie.admin.checkWeatherApi.useQuery();

  const ingestWeatherMutation = trpc.rsie.admin.ingestWeather.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Weather ingestion complete: ${result.cellsProcessed} cells, ${result.recordsInserted} records`
      );
      refetchApiStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Weather ingestion failed");
    },
  });

  const { data: gridCells, isLoading: loadingGridCells } =
    trpc.rsie.admin.getGridCells.useQuery();

  return (
    <div className="space-y-6">
      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Tomorrow.io Weather API
          </CardTitle>
          <CardDescription>
            Real-time weather data for Australian agricultural regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingApiStatus ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking API status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {apiStatus?.configured ? (
                    apiStatus?.working ? (
                      <>
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <div className="font-medium text-green-600">API Connected</div>
                          <div className="text-xs text-muted-foreground">
                            Ready for weather data ingestion
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 bg-red-500 rounded-full" />
                        <div>
                          <div className="font-medium text-red-600">API Error</div>
                          <div className="text-xs text-muted-foreground">
                            {apiStatus?.error || "Connection failed"}
                          </div>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full" />
                      <div>
                        <div className="font-medium text-yellow-600">Not Configured</div>
                        <div className="text-xs text-muted-foreground">
                          Set TOMORROW_IO_API_KEY in environment
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetchApiStatus()}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Check
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => ingestWeatherMutation.mutate()}
                    disabled={!apiStatus?.working || ingestWeatherMutation.isPending}
                  >
                    {ingestWeatherMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    Ingest Weather Data
                  </Button>
                </div>
              </div>

              {/* Weather Metrics Preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Temperature</div>
                    <div className="font-medium">-10°C to 50°C</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <CloudRain className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Precipitation</div>
                    <div className="font-medium">mm/hr</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Wind className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Wind Speed</div>
                    <div className="font-medium">km/h</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Fire Index</div>
                    <div className="font-medium">0-200</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Australian Grid Cells */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Australian Agricultural Regions
          </CardTitle>
          <CardDescription>
            {gridCells?.length ?? 0} monitoring grid cells across Australian states
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGridCells ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : gridCells ? (
            <GridCellMap cells={gridCells} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No grid cells configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DataSourcesPanel() {
  const {
    data: dataSources,
    isLoading: loadingDataSources,
    refetch: refetchDataSources,
  } = trpc.rsie.dataSources.list.useQuery();

  const { data: availableSources } = trpc.rsie.admin.getAvailableDataSources.useQuery();

  const toggleDataSourceMutation = trpc.rsie.dataSources.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("Data source updated");
      refetchDataSources();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update data source");
    },
  });

  const seedDataSourcesMutation = trpc.rsie.admin.seedDataSources.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Seeded data sources: ${result.created} created, ${result.skipped} skipped`
      );
      refetchDataSources();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to seed data sources");
    },
  });

  // Group available sources by category
  const sourcesByCategory: Record<string, typeof availableSources> = {};
  availableSources?.forEach(source => {
    if (!sourcesByCategory[source.category]) sourcesByCategory[source.category] = [];
    sourcesByCategory[source.category]?.push(source);
  });

  const enabledCount = dataSources?.filter(s => s.isEnabled).length ?? 0;
  const totalCount = dataSources?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Seed Data Sources Card */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Satellite className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Australian Data Sources</div>
                <div className="text-sm text-muted-foreground">
                  {availableSources?.length ?? 0} pre-configured sources available
                </div>
              </div>
            </div>
            <Button
              onClick={() => seedDataSourcesMutation.mutate()}
              disabled={seedDataSourcesMutation.isPending}
            >
              {seedDataSourcesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Seed Data Sources
            </Button>
          </div>

          {/* Category Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {Object.entries(sourcesByCategory).map(([category, sources]) => (
              <div key={category} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                {CATEGORY_ICONS[category] || <Database className="h-4 w-4" />}
                <div>
                  <div className="text-xs font-medium capitalize">{category}</div>
                  <div className="text-xs text-muted-foreground">{sources?.length} sources</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Data Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Active Data Sources
              </CardTitle>
              <CardDescription>
                {enabledCount} of {totalCount} sources enabled
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchDataSources()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingDataSources ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : dataSources && dataSources.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSources.map(source => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="font-medium">{source.name}</div>
                      {source.attributionText && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {source.attributionText}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {source.sourceKey}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {source.licenseClass.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={source.isEnabled ? "default" : "secondary"}>
                        {source.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={source.isEnabled ?? false}
                        onCheckedChange={checked =>
                          toggleDataSourceMutation.mutate({
                            id: source.id,
                            isEnabled: checked,
                          })
                        }
                        disabled={toggleDataSourceMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No data sources configured</p>
              <p className="text-sm mt-1">
                Click "Seed Data Sources" above to add Australian data sources
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminRSIE() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Risk Events
  const {
    data: riskEventsData,
    isLoading: loadingRiskEvents,
    refetch: refetchRiskEvents,
  } = trpc.rsie.riskEvents.list.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Ingestion Runs
  const {
    data: ingestionRuns,
    isLoading: loadingIngestionRuns,
    refetch: refetchIngestionRuns,
  } = trpc.rsie.ingestion.listRuns.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Intelligence Items
  const { data: intelligenceData, isLoading: loadingIntelligence } =
    trpc.rsie.intelligence.list.useQuery(
      { limit: 5 },
      { enabled: isAuthenticated && user?.role === "admin" }
    );

  // Feedback Stats
  const { data: feedbackStats, isLoading: loadingFeedback } =
    trpc.rsie.feedback.stats.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  // Data Sources for stats
  const { data: dataSources, isLoading: loadingDataSources } =
    trpc.rsie.dataSources.list.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  // Mutations
  const recalculateExposuresMutation =
    trpc.rsie.exposure.recalculate.useMutation({
      onSuccess: result => {
        toast.success(
          `Recalculated ${result.processed} exposures for ${result.eventCount} events`
        );
      },
      onError: error => {
        toast.error(error.message || "Failed to recalculate exposures");
      },
    });

  const resolveRiskEventMutation = trpc.rsie.riskEvents.resolve.useMutation({
    onSuccess: () => {
      toast.success("Risk event resolved");
      refetchRiskEvents();
    },
    onError: error => {
      toast.error(error.message || "Failed to resolve risk event");
    },
  });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  // Calculate stats
  const enabledSourcesCount = dataSources?.filter(s => s.isEnabled).length ?? 0;
  const totalSourcesCount = dataSources?.length ?? 0;
  const activeRiskCount =
    riskEventsData?.events.filter(e => e.eventStatus === "active").length ?? 0;
  const watchRiskCount =
    riskEventsData?.events.filter(e => e.eventStatus === "watch").length ?? 0;
  const recentSuccessfulRuns =
    ingestionRuns?.filter(r => r.status === "succeeded").length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">RSIE Dashboard</h1>
              <p className="text-muted-foreground">
                Risk & Supply Intelligence Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchRiskEvents();
                refetchIngestionRuns();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh All
            </Button>
            <Button
              size="sm"
              onClick={() => recalculateExposuresMutation.mutate()}
              disabled={recalculateExposuresMutation.isPending}
            >
              {recalculateExposuresMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              Recalc Exposures
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Data Sources"
            value={`${enabledSourcesCount}/${totalSourcesCount}`}
            description="Enabled sources"
            icon={<Database className="h-4 w-4 text-primary" />}
            loading={loadingDataSources}
            variant={totalSourcesCount > 0 ? "success" : "warning"}
          />
          <StatsCard
            title="Active Risks"
            value={activeRiskCount}
            description={`${watchRiskCount} on watch`}
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
            loading={loadingRiskEvents}
            variant={activeRiskCount > 0 ? "error" : "success"}
          />
          <StatsCard
            title="Ingestion Runs"
            value={recentSuccessfulRuns}
            description="Successful (last 10)"
            icon={<Activity className="h-4 w-4 text-green-500" />}
            loading={loadingIngestionRuns}
            variant="success"
          />
          <StatsCard
            title="Feedback Score"
            value={feedbackStats?.avgNps?.toFixed(1) ?? "-"}
            description={`${feedbackStats?.count ?? 0} responses`}
            icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
            loading={loadingFeedback}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="weather" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="weather" className="gap-1">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Weather</span>
            </TabsTrigger>
            <TabsTrigger value="data-sources" className="gap-1">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Sources</span>
            </TabsTrigger>
            <TabsTrigger value="risk-events" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Risks</span>
            </TabsTrigger>
            <TabsTrigger value="ingestion" className="gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Ingestion</span>
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-1">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Intel</span>
            </TabsTrigger>
          </TabsList>

          {/* Weather Tab */}
          <TabsContent value="weather">
            <WeatherApiPanel />
          </TabsContent>

          {/* Data Sources Tab */}
          <TabsContent value="data-sources">
            <DataSourcesPanel />
          </TabsContent>

          {/* Risk Events Tab */}
          <TabsContent value="risk-events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Risk Events
                </CardTitle>
                <CardDescription>
                  Monitor and manage supply chain risk events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRiskEvents ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : riskEventsData?.events && riskEventsData.events.length > 0 ? (
                  <div className="space-y-4">
                    {riskEventsData.events.map(event => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            {RISK_TYPE_ICONS[event.eventType] || (
                              <AlertTriangle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {event.eventType.replace("_", " ")}
                              </span>
                              <Badge
                                className={cn(
                                  "text-xs text-white",
                                  SEVERITY_COLORS[event.severity]
                                )}
                              >
                                {event.severity}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  event.eventStatus === "active" &&
                                    "border-red-500 text-red-500",
                                  event.eventStatus === "watch" &&
                                    "border-yellow-500 text-yellow-500",
                                  event.eventStatus === "resolved" &&
                                    "border-green-500 text-green-500"
                                )}
                              >
                                {event.eventStatus}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span>Score: {event.scoreTotal}</span>
                              <span className="mx-2">|</span>
                              <span>
                                Confidence:{" "}
                                {(Number(event.confidence) * 100).toFixed(0)}%
                              </span>
                              <span className="mx-2">|</span>
                              <span>
                                {formatDistanceToNow(new Date(event.startDate), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {event.eventStatus !== "resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              resolveRiskEventMutation.mutate({ id: event.id })
                            }
                            disabled={resolveRiskEventMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20 text-green-500" />
                    <p className="font-medium">No active risk events</p>
                    <p className="text-sm">
                      Risk events will appear here when detected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ingestion Tab */}
          <TabsContent value="ingestion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Ingestion Runs
                </CardTitle>
                <CardDescription>
                  Monitor data pipeline execution and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingIngestionRuns ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : ingestionRuns && ingestionRuns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingestionRuns.map(run => (
                        <TableRow key={run.id}>
                          <TableCell>
                            <code className="text-xs">#{run.id}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {run.runType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {run.status === "succeeded" && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {run.status === "failed" && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {run.status === "started" && (
                                <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                              )}
                              {run.status === "partial" && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className="capitalize">{run.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">
                              {run.recordsIn ?? 0} in
                            </span>
                            <span className="mx-1">/</span>
                            <span className="text-blue-600">
                              {run.recordsOut ?? 0} out
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(run.startedAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell>
                            {run.finishedAt
                              ? `${Math.round(
                                  (new Date(run.finishedAt).getTime() -
                                    new Date(run.startedAt).getTime()) /
                                    1000
                                )}s`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No ingestion runs yet</p>
                    <p className="text-sm">
                      Runs will appear here when data pipelines execute
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Intelligence Feed
                </CardTitle>
                <CardDescription>
                  News, policy updates, and market intelligence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingIntelligence ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : intelligenceData?.items && intelligenceData.items.length > 0 ? (
                  <div className="space-y-4">
                    {intelligenceData.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          {item.itemType === "news" && (
                            <Newspaper className="h-4 w-4" />
                          )}
                          {item.itemType === "policy" && (
                            <FileText className="h-4 w-4" />
                          )}
                          {item.itemType === "market_note" && (
                            <BarChart3 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {item.title}
                            </span>
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.itemType.replace("_", " ")}
                            </Badge>
                          </div>
                          {item.summary && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            {item.publisher && <span>{item.publisher}</span>}
                            {item.publishedAt && (
                              <span>
                                {formatDistanceToNow(new Date(item.publishedAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No intelligence items yet</p>
                    <p className="text-sm">
                      News and policy updates will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
