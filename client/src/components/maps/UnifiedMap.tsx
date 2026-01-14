/**
 * UnifiedMap - Consolidated map component with role-based layers
 * Uses MapControlsContext for layer/filter state shared with MapControlsPanel
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapView as GoogleMapView } from '@/components/Map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useMapControls, MAP_VIEW_LAYERS } from '@/contexts/MapControlsContext';
import {
  MapPin,
  X,
  ChevronRight,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { SatelliteDataPanel } from './SatelliteDataPanel';
import { formatPrice } from '@/const';

// Australia center coordinates
const AUSTRALIA_CENTER = { lat: -25.2744, lng: 133.7751 };
const DEFAULT_ZOOM = 4;

interface UnifiedMapProps {
  className?: string;
  onEntitySelect?: (entity: any) => void;
}

export function UnifiedMap({
  className,
  onEntitySelect,
}: UnifiedMapProps) {
  // Get state from context (shared with MapControlsPanel)
  const {
    layers,
    selectedCategories,
    selectedStates,
    minScore,
    maxCarbonIntensity,
    satelliteCoords,
    setSatelliteCoords,
  } = useMapControls();

  // Map references
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Local UI state
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markerCount, setMarkerCount] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);

  // Check if satellite layer is enabled
  const isSatelliteLayerEnabled = layers.find((l) => l.id === 'satellite')?.enabled ?? false;
  const isRoadmapViewEnabled = layers.find((l) => l.id === 'roadmapView')?.enabled ?? false;
  const isSatelliteImageryEnabled = layers.find((l) => l.id === 'satelliteImagery')?.enabled ?? false;
  const isHybridViewEnabled = layers.find((l) => l.id === 'hybridView')?.enabled ?? false;
  const isTerrainViewEnabled = layers.find((l) => l.id === 'terrainView')?.enabled ?? false;

  // Toggle map type based on enabled view layer
  useEffect(() => {
    if (mapRef.current) {
      const mapType = isHybridViewEnabled
        ? 'hybrid'
        : isSatelliteImageryEnabled
          ? 'satellite'
          : isTerrainViewEnabled
            ? 'terrain'
            : 'roadmap';
      mapRef.current.setMapTypeId(mapType);
    }
  }, [isRoadmapViewEnabled, isSatelliteImageryEnabled, isHybridViewEnabled, isTerrainViewEnabled]);

  // Data queries - use filter state from context
  const { data: feedstocks, isLoading: feedstocksLoading } =
    trpc.feedstocks.search.useQuery(
      {
        category:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        state: selectedStates.length > 0 ? selectedStates : undefined,
        minAbfiScore: minScore > 0 ? minScore : undefined,
        maxCarbonIntensity: maxCarbonIntensity < 100 ? maxCarbonIntensity : undefined,
        limit: 500,
      },
      {
        enabled: layers.some((l) => l.id === 'feedstocks' && l.enabled),
      }
    );

  const { data: demandSignals, isLoading: demandLoading } =
    trpc.demandSignals.list.useQuery(
      { status: 'published' },
      {
        enabled: layers.some((l) => l.id === 'demand' && l.enabled),
      }
    );

  // Map initialization
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    setIsMapReady(true);

    // Add click listener for satellite data
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setSatelliteCoords({ lat, lng });
      }
    });
  }, [setSatelliteCoords]);

  // Marker color based on score
  const getMarkerColor = (score: number | null, type: string): string => {
    if (type === 'demand') return '#f97316';
    if (type === 'project') return '#3b82f6';
    if (!score) return '#9ca3af';
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  // Update markers when data or layers change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add feedstock markers
    if (
      layers.find((l) => l.id === 'feedstocks')?.enabled &&
      feedstocks?.length
    ) {
      feedstocks.forEach((feedstock) => {
        if (feedstock.latitude && feedstock.longitude) {
          const position = {
            lat: parseFloat(feedstock.latitude),
            lng: parseFloat(feedstock.longitude),
          };

          const marker = new google.maps.Marker({
            position,
            map: mapRef.current!,
            title: feedstock.type,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getMarkerColor(feedstock.abfiScore, 'feedstock'),
              fillOpacity: 0.85,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            const entity = {
              ...feedstock,
              type: 'feedstock',
              name: feedstock.type,
              location: feedstock.state,
            };
            setSelectedEntity(entity);
            onEntitySelect?.(entity);

            // Set satellite coordinates for this feedstock location
            setSatelliteCoords(position);

            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(
                createInfoWindowContent(entity)
              );
              infoWindowRef.current.open(mapRef.current!, marker);
            }
          });

          markersRef.current.push(marker);
          bounds.extend(position);
          hasMarkers = true;
        }
      });
    }

    // Add demand signal markers
    if (
      layers.find((l) => l.id === 'demand')?.enabled &&
      demandSignals?.length
    ) {
      demandSignals.forEach((signal: any) => {
        if (signal.latitude && signal.longitude) {
          const position = {
            lat: parseFloat(signal.latitude),
            lng: parseFloat(signal.longitude),
          };

          const marker = new google.maps.Marker({
            position,
            map: mapRef.current!,
            title: signal.title || 'Demand Signal',
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#f97316',
              fillOpacity: 0.85,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: 180,
            },
          });

          marker.addListener('click', () => {
            const entity = {
              ...signal,
              type: 'demand',
              name: signal.title,
            };
            setSelectedEntity(entity);
            onEntitySelect?.(entity);

            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(
                createInfoWindowContent(entity)
              );
              infoWindowRef.current.open(mapRef.current!, marker);
            }
          });

          markersRef.current.push(marker);
          bounds.extend(position);
          hasMarkers = true;
        }
      });
    }

    // Fit bounds if we have markers
    if (hasMarkers && mapRef.current) {
      mapRef.current.fitBounds(bounds);
      // Don't zoom in too far
      const listener = google.maps.event.addListener(
        mapRef.current,
        'idle',
        () => {
          if (mapRef.current!.getZoom()! > 12) {
            mapRef.current!.setZoom(12);
          }
          google.maps.event.removeListener(listener);
        }
      );
    }

    // Update marker count for display
    setMarkerCount(markersRef.current.length);
  }, [feedstocks, demandSignals, layers, onEntitySelect, isMapReady, setSatelliteCoords]);

  // Create info window content
  const createInfoWindowContent = (entity: any): string => {
    if (entity.type === 'feedstock') {
      return `
        <div style="padding: 12px; max-width: 280px; font-family: system-ui, sans-serif;">
          <h3 style="font-weight: 600; margin-bottom: 4px; color: #111;">${entity.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 12px;">${entity.abfiId || ''}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
            <div>
              <span style="color: #666;">Score</span>
              <div style="font-weight: 600; color: ${getMarkerColor(entity.abfiScore, 'feedstock')}">${entity.abfiScore || 'N/A'}</div>
            </div>
            <div>
              <span style="color: #666;">Available</span>
              <div style="font-weight: 600;">${(entity.availableVolumeCurrent || 0).toLocaleString()} t</div>
            </div>
            ${entity.pricePerTonne && entity.priceVisibility === 'public' ? `
            <div>
              <span style="color: #666;">Price</span>
              <div style="font-weight: 600;">${formatPrice(entity.pricePerTonne)}/t</div>
            </div>
            ` : ''}
            ${entity.carbonIntensityValue ? `
            <div>
              <span style="color: #666;">CI</span>
              <div style="font-weight: 600;">${entity.carbonIntensityValue} gCO2e/MJ</div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div style="padding: 12px; max-width: 280px; font-family: system-ui, sans-serif;">
        <h3 style="font-weight: 600; margin-bottom: 4px; color: #111;">${entity.name || entity.title}</h3>
        <p style="font-size: 13px; color: #666;">${entity.description || ''}</p>
      </div>
    `;
  };

  const isLoading = feedstocksLoading || demandLoading;
  const totalMarkers = markerCount;

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* Map Status Bar - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {isLoading && (
          <Badge variant="secondary" className="shadow-md bg-white">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Loading...
          </Badge>
        )}
        {!isLoading && (
          <Badge variant="secondary" className="shadow-md bg-white">
            <MapPin className="h-3 w-3 mr-1" />
            {totalMarkers} locations
          </Badge>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="shadow-md h-8 w-8 bg-white"
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-label={isFullscreen ? "Exit fullscreen map" : "Enter fullscreen map"}
          aria-pressed={isFullscreen}
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <GoogleMapView
          className="w-full h-full"
          initialCenter={AUSTRALIA_CENTER}
          initialZoom={DEFAULT_ZOOM}
          onMapReady={handleMapReady}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Satellite Data Panel - shows when satellite layer enabled OR when a feedstock is selected */}
      {(isSatelliteLayerEnabled || satelliteCoords) && (
        <div className="absolute top-16 right-4 z-10">
          <SatelliteDataPanel
            coordinates={satelliteCoords}
            onClose={() => setSatelliteCoords(null)}
            className="shadow-xl"
          />
        </div>
      )}

      {/* Selected Entity Card (Mobile-friendly) */}
      {selectedEntity && (
        <Card className="absolute bottom-4 left-4 right-4 md:right-auto md:left-4 md:w-80 shadow-xl z-10">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedEntity.name || selectedEntity.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedEntity.location || selectedEntity.state}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSelectedEntity(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {selectedEntity.abfiScore && (
                <div>
                  <span className="text-muted-foreground">Score</span>
                  <p className="font-medium">{selectedEntity.abfiScore}</p>
                </div>
              )}
              {selectedEntity.availableVolumeCurrent && (
                <div>
                  <span className="text-muted-foreground">Available</span>
                  <p className="font-medium">
                    {selectedEntity.availableVolumeCurrent.toLocaleString()} t
                  </p>
                </div>
              )}
            </div>
            <Button className="w-full" size="sm">
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default UnifiedMap;
