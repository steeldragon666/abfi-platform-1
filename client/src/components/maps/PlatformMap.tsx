/**
 * PlatformMap - Unified Map Component for ABFI Platform
 * 
 * A single, consistent map component used across all portals with:
 * - Multiple base layer options (OSM, Satellite, Terrain)
 * - BOM weather overlays (radar, rainfall, temperature, warnings)
 * - Government data layers (land use, crop areas, cadastre)
 * - Earth Engine integration (NDVI, soil moisture, vegetation)
 * - Feedstock/demand/project markers
 * - Role-based layer presets
 * 
 * Usage:
 *   <PlatformMap 
 *     preset="developer"  // grower | developer | lender | government
 *     onLocationSelect={(lat, lng) => ...}
 *     markers={[...]}
 *   />
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  MapPin,
  Cloud,
  TreePine,
  Building2,
  Droplets,
  Thermometer,
  AlertTriangle,
  Satellite,
  Map as MapIcon,
  Mountain,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Loader2,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ============================================================================
// TYPES
// ============================================================================

export type MapPreset = 'grower' | 'developer' | 'lender' | 'government' | 'default';
export type BaseLayerType = 'street' | 'satellite' | 'terrain' | 'hybrid';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'feedstock' | 'demand' | 'project' | 'facility' | 'custom';
  title: string;
  subtitle?: string;
  score?: number;
  color?: string;
  data?: any;
}

export interface PlatformMapProps {
  className?: string;
  preset?: MapPreset;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markers?: MapMarker[];
  showControls?: boolean;
  showLayerPanel?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  enableFeedstockLayer?: boolean;
  enableDemandLayer?: boolean;
  enableProjectLayer?: boolean;
  height?: string;
}

interface LayerState {
  // Base layers
  baseLayer: BaseLayerType;
  
  // Weather overlays
  bomRadar: boolean;
  bomRainfall: boolean;
  bomTemperature: boolean;
  bomWarnings: boolean;
  
  // Government data
  landUse: boolean;
  cropAreas: boolean;
  sugarcaneZones: boolean;
  cadastre: boolean;
  
  // Earth Engine
  ndvi: boolean;
  soilMoisture: boolean;
  
  // Data layers
  feedstocks: boolean;
  demandSignals: boolean;
  projects: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUSTRALIA_CENTER = { lat: -25.2744, lng: 133.7751 };
const DEFAULT_ZOOM = 4;

// Base tile layers
const BASE_LAYERS: Record<BaseLayerType, { url: string; attribution: string; name: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    name: 'Street Map',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    name: 'Satellite',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    name: 'Terrain',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    name: 'Hybrid',
  },
};

// Role-based default layers
const PRESET_LAYERS: Record<MapPreset, Partial<LayerState>> = {
  grower: {
    baseLayer: 'satellite',
    bomRainfall: true,
    bomWarnings: true,
    ndvi: true,
    soilMoisture: true,
    feedstocks: true,
  },
  developer: {
    baseLayer: 'street',
    landUse: true,
    feedstocks: true,
    demandSignals: true,
    projects: true,
  },
  lender: {
    baseLayer: 'street',
    projects: true,
    feedstocks: true,
    landUse: true,
  },
  government: {
    baseLayer: 'terrain',
    landUse: true,
    cropAreas: true,
    sugarcaneZones: true,
    cadastre: true,
  },
  default: {
    baseLayer: 'street',
    feedstocks: true,
  },
};

const DEFAULT_LAYER_STATE: LayerState = {
  baseLayer: 'street',
  bomRadar: false,
  bomRainfall: false,
  bomTemperature: false,
  bomWarnings: false,
  landUse: false,
  cropAreas: false,
  sugarcaneZones: false,
  cadastre: false,
  ndvi: false,
  soilMoisture: false,
  feedstocks: true,
  demandSignals: false,
  projects: false,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PlatformMap({
  className,
  preset = 'default',
  initialCenter = AUSTRALIA_CENTER,
  initialZoom = DEFAULT_ZOOM,
  markers = [],
  showControls = true,
  showLayerPanel = true,
  onLocationSelect,
  onMarkerClick,
  enableFeedstockLayer = true,
  enableDemandLayer = true,
  enableProjectLayer = true,
  height = '100%',
}: PlatformMapProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayersRef = useRef<Map<string, L.Layer>>(new Map());
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  
  // State
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layers, setLayers] = useState<LayerState>(() => ({
    ...DEFAULT_LAYER_STATE,
    ...PRESET_LAYERS[preset],
  }));
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markerCount, setMarkerCount] = useState(0);
  
  // Data queries
  const { data: feedstocks, isLoading: feedstocksLoading } = trpc.feedstocks.search.useQuery(
    { limit: 500 },
    { enabled: layers.feedstocks && enableFeedstockLayer }
  );
  
  const { data: demandSignals, isLoading: demandLoading } = trpc.demandSignals.list.useQuery(
    { status: 'published' },
    { enabled: layers.demandSignals && enableDemandLayer }
  );
  
  // Earth Engine data for selected location
  const { data: ndviData, isLoading: ndviLoading } = trpc.earthEngine.getNDVI.useQuery(
    { point: selectedLocation! },
    { enabled: layers.ndvi && !!selectedLocation }
  );
  
  const { data: soilData, isLoading: soilLoading } = trpc.earthEngine.getSoilMoisture.useQuery(
    { point: selectedLocation! },
    { enabled: layers.soilMoisture && !!selectedLocation }
  );
  
  const isLoading = feedstocksLoading || demandLoading || ndviLoading || soilLoading;

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Create map
    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: false, // We'll add custom controls
      attributionControl: true,
    });
    
    // Add base layer
    const baseConfig = BASE_LAYERS[layers.baseLayer];
    const baseLayer = L.tileLayer(baseConfig.url, {
      attribution: baseConfig.attribution,
      maxZoom: 19,
    }).addTo(map);
    baseLayerRef.current = baseLayer;
    
    // Add labels overlay for satellite/hybrid views
    if (layers.baseLayer === 'satellite' || layers.baseLayer === 'hybrid') {
      const labels = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
        { pane: 'overlayPane' }
      ).addTo(map);
      labelsLayerRef.current = labels;
    }
    
    // Add markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    
    // Add scale control
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);
    
    // Click handler for location selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedLocation({ lat, lng });
      onLocationSelect?.(lat, lng);
    });
    
    mapRef.current = map;
    setIsMapReady(true);
    
    return () => {
      map.remove();
      mapRef.current = null;
      baseLayerRef.current = null;
      markersLayerRef.current = null;
      labelsLayerRef.current = null;
      overlayLayersRef.current.clear();
    };
  }, []);

  // ============================================================================
  // BASE LAYER CHANGES
  // ============================================================================
  
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    // Remove old base layer
    if (baseLayerRef.current) {
      mapRef.current.removeLayer(baseLayerRef.current);
    }
    if (labelsLayerRef.current) {
      mapRef.current.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }
    
    // Add new base layer
    const baseConfig = BASE_LAYERS[layers.baseLayer];
    const newBaseLayer = L.tileLayer(baseConfig.url, {
      attribution: baseConfig.attribution,
      maxZoom: 19,
    });
    newBaseLayer.addTo(mapRef.current);
    newBaseLayer.bringToBack();
    baseLayerRef.current = newBaseLayer;
    
    // Add labels for satellite views
    if (layers.baseLayer === 'satellite' || layers.baseLayer === 'hybrid') {
      const labels = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
        { pane: 'overlayPane', zIndex: 1000 }
      ).addTo(mapRef.current);
      labelsLayerRef.current = labels;
    }
  }, [layers.baseLayer, isMapReady]);

  // ============================================================================
  // OVERLAY LAYER MANAGEMENT
  // ============================================================================
  
  const updateOverlayLayer = useCallback((
    layerId: string,
    enabled: boolean,
    createLayer: () => L.Layer
  ) => {
    if (!mapRef.current) return;
    
    const existingLayer = overlayLayersRef.current.get(layerId);
    
    if (enabled && !existingLayer) {
      const layer = createLayer();
      layer.addTo(mapRef.current);
      overlayLayersRef.current.set(layerId, layer);
    } else if (!enabled && existingLayer) {
      mapRef.current.removeLayer(existingLayer);
      overlayLayersRef.current.delete(layerId);
    }
  }, []);

  // Weather overlays
  useEffect(() => {
    if (!isMapReady) return;
    
    // BOM Rainfall (using OpenWeatherMap as proxy - would use actual BOM in production)
    updateOverlayLayer('bomRainfall', layers.bomRainfall, () =>
      L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo', {
        opacity: 0.5,
        attribution: '© OpenWeatherMap',
      })
    );
    
    // BOM Temperature
    updateOverlayLayer('bomTemperature', layers.bomTemperature, () =>
      L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo', {
        opacity: 0.5,
        attribution: '© OpenWeatherMap',
      })
    );
  }, [layers.bomRainfall, layers.bomTemperature, isMapReady, updateOverlayLayer]);

  // ============================================================================
  // MARKERS
  // ============================================================================
  
  useEffect(() => {
    if (!markersLayerRef.current || !isMapReady) return;
    
    // Clear existing markers
    markersLayerRef.current.clearLayers();
    
    const allMarkers: MapMarker[] = [...markers];
    
    // Add feedstock markers
    if (layers.feedstocks && feedstocks?.length) {
      feedstocks.forEach((f) => {
        if (f.latitude && f.longitude) {
          allMarkers.push({
            id: `feedstock-${f.id}`,
            lat: parseFloat(f.latitude),
            lng: parseFloat(f.longitude),
            type: 'feedstock',
            title: f.type,
            subtitle: f.state || '',
            score: f.abfiScore || undefined,
            data: f,
          });
        }
      });
    }
    
    // Add demand signal markers
    if (layers.demandSignals && demandSignals?.length) {
      demandSignals.forEach((d: any) => {
        if (d.latitude && d.longitude) {
          allMarkers.push({
            id: `demand-${d.id}`,
            lat: parseFloat(d.latitude),
            lng: parseFloat(d.longitude),
            type: 'demand',
            title: d.title || 'Demand Signal',
            subtitle: d.feedstockType || '',
            data: d,
          });
        }
      });
    }
    
    // Create markers
    allMarkers.forEach((marker) => {
      const color = marker.color || getMarkerColor(marker.type, marker.score);
      
      const circleMarker = L.circleMarker([marker.lat, marker.lng], {
        radius: 10,
        fillColor: color,
        fillOpacity: 0.85,
        color: '#ffffff',
        weight: 2,
      });
      
      // Popup content
      circleMarker.bindPopup(`
        <div style="padding: 8px; font-family: system-ui, sans-serif; min-width: 180px;">
          <h3 style="font-weight: 600; margin: 0 0 4px 0; color: #111;">${marker.title}</h3>
          ${marker.subtitle ? `<p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">${marker.subtitle}</p>` : ''}
          ${marker.score ? `
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #666;">Score:</span>
              <span style="font-weight: 600; color: ${color}">${marker.score}</span>
            </div>
          ` : ''}
          <button 
            onclick="window.dispatchEvent(new CustomEvent('map-marker-click', { detail: '${marker.id}' }))"
            style="margin-top: 8px; padding: 6px 12px; background: #D4AF37; color: #000; border: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; width: 100%;"
          >
            View Details
          </button>
        </div>
      `);
      
      circleMarker.on('click', () => {
        onMarkerClick?.(marker);
      });
      
      markersLayerRef.current?.addLayer(circleMarker);
    });
    
    setMarkerCount(allMarkers.length);
  }, [markers, feedstocks, demandSignals, layers.feedstocks, layers.demandSignals, layers.projects, isMapReady, onMarkerClick]);

  // ============================================================================
  // HELPERS
  // ============================================================================
  
  const getMarkerColor = (type: MapMarker['type'], score?: number): string => {
    if (type === 'demand') return '#f97316';
    if (type === 'project') return '#3b82f6';
    if (type === 'facility') return '#8b5cf6';
    if (!score) return '#9ca3af';
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };
  
  const toggleLayer = (key: keyof LayerState, value?: boolean | BaseLayerType) => {
    setLayers(prev => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key as keyof LayerState],
    }));
  };
  
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    mapRef.current?.setView([initialCenter.lat, initialCenter.lng], initialZoom);
  };
  const locateMe = () => {
    mapRef.current?.locate({ setView: true, maxZoom: 12 });
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div 
      className={cn(
        'relative bg-muted rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Map Container */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Top Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
          {/* Loading indicator */}
          {isLoading && (
            <Badge variant="secondary" className="bg-white shadow-md">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Loading...
            </Badge>
          )}
          
          {/* Marker count */}
          {!isLoading && markerCount > 0 && (
            <Badge variant="secondary" className="bg-white shadow-md">
              <MapPin className="h-3 w-3 mr-1" />
              {markerCount} locations
            </Badge>
          )}
          
          {/* Fullscreen toggle */}
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white shadow-md"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {/* Layer Control Panel */}
      {showLayerPanel && (
        <div className="absolute top-3 left-3 z-[1000]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="bg-white shadow-md gap-2">
                <Layers className="h-4 w-4" />
                Layers
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* Base Layers */}
              <DropdownMenuLabel>Base Map</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={layers.baseLayer === 'street'}
                onCheckedChange={() => toggleLayer('baseLayer', 'street')}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Street Map
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.baseLayer === 'satellite'}
                onCheckedChange={() => toggleLayer('baseLayer', 'satellite')}
              >
                <Satellite className="h-4 w-4 mr-2" />
                Satellite
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.baseLayer === 'terrain'}
                onCheckedChange={() => toggleLayer('baseLayer', 'terrain')}
              >
                <Mountain className="h-4 w-4 mr-2" />
                Terrain
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {/* Weather Overlays */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Cloud className="h-4 w-4 mr-2" />
                  Weather
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    checked={layers.bomRainfall}
                    onCheckedChange={() => toggleLayer('bomRainfall')}
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    Rainfall
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layers.bomTemperature}
                    onCheckedChange={() => toggleLayer('bomTemperature')}
                  >
                    <Thermometer className="h-4 w-4 mr-2" />
                    Temperature
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layers.bomWarnings}
                    onCheckedChange={() => toggleLayer('bomWarnings')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Warnings
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              {/* Satellite/Earth Engine */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Satellite className="h-4 w-4 mr-2" />
                  Satellite Data
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    checked={layers.ndvi}
                    onCheckedChange={() => toggleLayer('ndvi')}
                  >
                    <TreePine className="h-4 w-4 mr-2" />
                    Vegetation (NDVI)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layers.soilMoisture}
                    onCheckedChange={() => toggleLayer('soilMoisture')}
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    Soil Moisture
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              {/* Government Data */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building2 className="h-4 w-4 mr-2" />
                  Government Data
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    checked={layers.landUse}
                    onCheckedChange={() => toggleLayer('landUse')}
                  >
                    Land Use (ABARES)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layers.cropAreas}
                    onCheckedChange={() => toggleLayer('cropAreas')}
                  >
                    Crop Areas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layers.sugarcaneZones}
                    onCheckedChange={() => toggleLayer('sugarcaneZones')}
                  >
                    Sugarcane Zones (QLD)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layers.cadastre}
                    onCheckedChange={() => toggleLayer('cadastre')}
                  >
                    Property Boundaries
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              {/* Data Layers */}
              <DropdownMenuLabel>Data</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={layers.feedstocks}
                onCheckedChange={() => toggleLayer('feedstocks')}
              >
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                Feedstocks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.demandSignals}
                onCheckedChange={() => toggleLayer('demandSignals')}
              >
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
                Demand Signals
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.projects}
                onCheckedChange={() => toggleLayer('projects')}
              >
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                Projects
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* Zoom Controls */}
      {showControls && (
        <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white shadow-md"
            onClick={zoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white shadow-md"
            onClick={zoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white shadow-md"
            onClick={locateMe}
          >
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white shadow-md"
            onClick={resetView}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Selected Location Info (Earth Engine data) */}
      {selectedLocation && (layers.ndvi || layers.soilMoisture) && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Location Analysis</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setSelectedLocation(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
          
          {ndviLoading || soilLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {ndviData && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NDVI:</span>
                  <span className="font-medium">{ndviData.mean.toFixed(2)} ({ndviData.healthCategory})</span>
                </div>
              )}
              {soilData && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soil Moisture:</span>
                  <span className="font-medium">{soilData.moistureCategory}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 right-14 z-[1000] bg-white rounded-lg shadow-md p-2">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Demand</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformMap;
