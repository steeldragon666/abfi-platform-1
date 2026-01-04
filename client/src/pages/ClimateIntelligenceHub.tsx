/**
 * Climate Intelligence Hub Page
 * Unified view of satellite (GEE) and weather (BOM) data across Australia
 *
 * Features:
 * - Interactive map with multiple data layers
 * - Click anywhere to view unified climate intelligence
 * - Active weather alerts bar
 * - Layer controls for NDVI, soil moisture, weather, warnings, projects
 * - Regional overview cards
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Satellite,
  RefreshCw,
  MapPin,
  Building2,
  Loader2,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'wouter';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker } from 'react-leaflet';
import { LatLng, Icon as LeafletIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { H1, Body, MetricValue, DataLabel } from '@/components/Typography';
import { ClimateAlertsBar } from '@/components/climate/ClimateAlertsBar';
import { UnifiedClimatePanel } from '@/components/climate/UnifiedClimatePanel';
import { ClimateLayerControls, LayerConfig, LayerOpacity } from '@/components/climate/ClimateLayerControls';

// Australia center and bounds
const AUSTRALIA_CENTER: [number, number] = [-25.2744, 133.7751];
const DEFAULT_ZOOM = 5;

// Custom marker for projects
const projectIcon = new LeafletIcon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#2563eb" stroke="white" stroke-width="2"/>
      <path d="M8 12h8M12 8v8" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Map click handler component
function MapClickHandler({
  onMapClick
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ClimateIntelligenceHub() {
  // Map state
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Layer controls
  const [layers, setLayers] = useState<LayerConfig>({
    ndvi: true,
    soilMoisture: false,
    weather: true,
    warnings: true,
    projects: true,
  });

  const [opacity, setOpacity] = useState<LayerOpacity>({
    ndvi: 0.7,
    soilMoisture: 0.7,
    weather: 0.7,
  });

  // Fetch climate alerts
  const { data: alertsData, isLoading: alertsLoading } = trpc.climateHub.getClimateAlerts.useQuery();

  // Fetch bioenergy projects for map markers
  const { data: projectsData } = trpc.projectRegistry.list.useQuery({
    limit: 100,
    status: undefined,
  });

  // Fetch regional overview
  const { data: regionalData } = trpc.climateHub.getRegionalOverview.useQuery({
    state: 'ALL',
  });

  // Fetch data status
  const { data: statusData } = trpc.climateHub.getDataStatus.useQuery();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setShowPanel(true);
  }, []);

  const handleLayerChange = (layer: keyof LayerConfig, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [layer]: enabled }));
  };

  const handleOpacityChange = (layer: keyof LayerOpacity, value: number) => {
    setOpacity((prev) => ({ ...prev, [layer]: value }));
  };

  const projects = projectsData?.projects || [];
  const alerts = alertsData?.alerts || [];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Climate Alerts Bar */}
      {alerts.length > 0 && (
        <ClimateAlertsBar alerts={alerts} isLoading={alertsLoading} />
      )}

      {/* Header */}
      <div className="container mx-auto px-4 py-4 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Satellite className="h-6 w-6 text-primary" />
              </div>
              <H1>Climate Intelligence Hub</H1>
              {statusData && (
                <Badge variant={statusData.earthEngine ? 'default' : 'secondary'}>
                  {statusData.earthEngine && statusData.bom ? 'Live Data' : 'Partial Data'}
                </Badge>
              )}
            </div>
            <Body className="text-muted-foreground max-w-2xl">
              Unified satellite and weather intelligence for Australian bioenergy projects.
              Click anywhere on the map to view detailed climate analysis.
            </Body>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/registry">
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                Project Registry
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Map + Panels */}
      <div className="flex-1 relative">
        {/* Map Container */}
        <div className="absolute inset-0">
          <MapContainer
            center={AUSTRALIA_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            zoomControl={true}
          >
            {/* Base Map Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Satellite Layer (optional) */}
            {layers.ndvi && (
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                opacity={opacity.ndvi * 0.5}
              />
            )}

            {/* Map Click Handler */}
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Selected Location Marker */}
            {selectedLocation && (
              <CircleMarker
                center={[selectedLocation.lat, selectedLocation.lng]}
                radius={8}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              />
            )}

            {/* Bioenergy Project Markers */}
            {layers.projects && projects.map((project) => {
              if (!project.latitude || !project.longitude) return null;
              const lat = parseFloat(project.latitude);
              const lng = parseFloat(project.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <Marker
                  key={project.id}
                  position={[lat, lng]}
                  icon={projectIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        {project.technology && (
                          <Badge variant="secondary" className="text-xs">
                            {project.technology}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2">
                        <Link href={`/registry/project/${project.slug}`}>
                          <Button size="sm" variant="outline" className="w-full gap-1">
                            View Details
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Layer Controls - Left Side */}
        <div className="absolute top-4 left-4 z-[1000]">
          <ClimateLayerControls
            layers={layers}
            opacity={opacity}
            onLayerChange={handleLayerChange}
            onOpacityChange={handleOpacityChange}
            compact
          />
        </div>

        {/* Climate Panel - Right Side */}
        {showPanel && (
          <div className="absolute top-4 right-4 z-[1000]">
            <UnifiedClimatePanel
              coordinates={selectedLocation}
              onClose={() => {
                setShowPanel(false);
                setSelectedLocation(null);
              }}
            />
          </div>
        )}

        {/* Stats Bar - Bottom */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Card className="bg-card/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-6">
                  <div className="text-center min-w-[80px]">
                    <MetricValue className="text-xl">{projects.length}</MetricValue>
                    <DataLabel>Projects</DataLabel>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <MetricValue className="text-xl text-amber-600">{alerts.length}</MetricValue>
                    <DataLabel>Alerts</DataLabel>
                  </div>
                  {regionalData && (
                    <>
                      <div className="text-center min-w-[100px]">
                        <MetricValue className="text-xl">
                          {regionalData.avgNdvi?.toFixed(2) || 'N/A'}
                        </MetricValue>
                        <DataLabel>Avg NDVI</DataLabel>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <MetricValue className="text-xl">
                          {regionalData.avgTemp?.toFixed(1) || 'N/A'}°C
                        </MetricValue>
                        <DataLabel>Avg Temp</DataLabel>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Click map for detailed analysis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
