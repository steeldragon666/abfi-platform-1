/**
 * PlatformMap - Unified Map Component for ABFI Platform
 * 
 * Australia's most comprehensive bioenergy intelligence mapping system with:
 * 
 * BASE LAYERS:
 * - Street, Satellite, Terrain, Hybrid views
 * 
 * BIOMASS & FEEDSTOCK (ABBA/Terria):
 * - Agricultural cropping residues
 * - Forestry harvesting residues
 * - Livestock manure residues
 * - Sugarcane & winery residues
 * - Solid organic waste
 * 
 * WEATHER & CLIMATE (BOM):
 * - Radar, rainfall, temperature overlays
 * - Severe weather warnings
 * - Drought indicators
 * 
 * HAZARDS & RISK:
 * - Bushfire hazard zones
 * - Floodplain assessment
 * - Landslide risk areas
 * 
 * PLANNING & LAND USE:
 * - Agricultural zones
 * - Nature conservation areas
 * - Koala conservation zones
 * - Cultural heritage sites
 * 
 * INFRASTRUCTURE:
 * - Energy network (electricity, gas)
 * - Transport corridors (ports, rail)
 * - Bioenergy facilities
 * 
 * EARTH ENGINE:
 * - NDVI vegetation health
 * - Soil moisture
 * 
 * DATA LAYERS:
 * - Registered feedstocks
 * - Demand signals
 * - Bioenergy projects
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { ProjectClaimingModal } from '../projects/ProjectClaimingModal';
import { ABFIMethodologyExplainer } from '../projects/ABFIMethodologyExplainer';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  Flame,
  Waves,
  Shield,
  Leaf,
  Train,
  Zap,
  Factory,
  Wheat,
  Info,
  Settings2,
  BarChart3,
} from 'lucide-react';
import { BiomassRiskPanel } from './BiomassRiskPanel';

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

// Extended layer state with all Australian data overlays
interface LayerState {
  // Base layers
  baseLayer: BaseLayerType;
  
  // Weather & Climate (BOM)
  bomRadar: boolean;
  bomRainfall: boolean;
  bomTemperature: boolean;
  bomWarnings: boolean;
  
  // Biomass & Feedstock (ABBA)
  croppingResidues: boolean;
  forestryResidues: boolean;
  livestockManure: boolean;
  sugarcaneResidues: boolean;
  organicWaste: boolean;
  
  // Hazards & Risk Assessment
  bushfireHazard: boolean;
  floodplainAssessment: boolean;
  landslideRisk: boolean;
  
  // Planning & Conservation
  agriculturalZones: boolean;
  natureConservation: boolean;
  koalaConservation: boolean;
  culturalHeritage: boolean;
  
  // Infrastructure
  electricityNetwork: boolean;
  gasPipelines: boolean;
  transportCorridors: boolean;
  bioenergyFacilities: boolean;
  
  // Earth Engine / Satellite
  ndvi: boolean;
  soilMoisture: boolean;
  
  // Platform Data
  feedstocks: boolean;
  demandSignals: boolean;
  projects: boolean;
}

// Layer category for UI grouping
interface LayerCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  layers: {
    id: keyof LayerState;
    label: string;
    description: string;
    wmsUrl?: string;
    wmsLayers?: string;
    tileUrl?: string;
    opacity?: number;
    attribution?: string;
  }[];
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

// WMS layer configurations for Australian government data
// These are the actual endpoints for ABBA, BOM, and state government services
const LAYER_CATEGORIES: LayerCategory[] = [
  {
    id: 'weather',
    label: 'Weather & Climate',
    icon: Cloud,
    description: 'Bureau of Meteorology data',
    layers: [
      {
        id: 'bomRadar',
        label: 'Weather Radar',
        description: 'Real-time precipitation radar',
        wmsUrl: 'http://www.bom.gov.au/geoserver/wms',
        wmsLayers: 'radar',
        opacity: 0.6,
        attribution: '© Bureau of Meteorology',
      },
      {
        id: 'bomRainfall',
        label: 'Rainfall',
        description: '7-day rainfall totals',
        wmsUrl: 'http://www.bom.gov.au/geoserver/wms',
        wmsLayers: 'rainfall',
        opacity: 0.5,
      },
      {
        id: 'bomTemperature',
        label: 'Temperature',
        description: 'Current temperature grid',
        wmsUrl: 'http://www.bom.gov.au/geoserver/wms',
        wmsLayers: 'temperature',
        opacity: 0.5,
      },
      {
        id: 'bomWarnings',
        label: 'Severe Weather Warnings',
        description: 'Active weather alerts',
        wmsUrl: 'http://www.bom.gov.au/geoserver/wms',
        wmsLayers: 'warnings',
        opacity: 0.7,
      },
    ],
  },
  {
    id: 'biomass',
    label: 'Biomass Resources',
    icon: Wheat,
    description: 'ABBA biomass availability data',
    layers: [
      {
        id: 'croppingResidues',
        label: 'Cropping Residues',
        description: 'Cereal straw, hay & silage residues',
        // Terria/AREMI WMS endpoint
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'ABBA:cropping_residues',
        opacity: 0.6,
        attribution: '© AREMI/ABBA',
      },
      {
        id: 'forestryResidues',
        label: 'Forestry Residues',
        description: 'Harvesting and sawmilling residues',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'ABBA:forestry_residues',
        opacity: 0.6,
      },
      {
        id: 'livestockManure',
        label: 'Livestock Manure',
        description: 'Cattle, pig and poultry manure',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'ABBA:livestock_manure',
        opacity: 0.6,
      },
      {
        id: 'sugarcaneResidues',
        label: 'Sugarcane Residues',
        description: 'Bagasse and trash availability',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'ABBA:sugarcane_residues',
        opacity: 0.6,
      },
      {
        id: 'organicWaste',
        label: 'Organic Waste',
        description: 'MSW, C&D, C&I waste streams',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'ABBA:organic_waste',
        opacity: 0.6,
      },
    ],
  },
  {
    id: 'hazards',
    label: 'Hazards & Risk',
    icon: AlertTriangle,
    description: 'Essential for facility siting',
    layers: [
      {
        id: 'bushfireHazard',
        label: 'Bushfire Hazard',
        description: 'Fire danger zones (critical for insurance)',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Bushfire_Prone_Area',
        opacity: 0.5,
        attribution: '© QLD Government',
      },
      {
        id: 'floodplainAssessment',
        label: 'Floodplain Assessment',
        description: 'Flood risk zones (QLD SPP)',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Floodplain_Assessment_Overlay',
        opacity: 0.5,
      },
      {
        id: 'landslideRisk',
        label: 'Landslide Hazard',
        description: 'Terrain stability assessment',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Landslide_Hazard',
        opacity: 0.5,
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & Conservation',
    icon: Shield,
    description: 'Land use constraints',
    layers: [
      {
        id: 'agriculturalZones',
        label: 'Agricultural Zones',
        description: 'Primary production land use',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Agricultural_Land_Class',
        opacity: 0.4,
      },
      {
        id: 'natureConservation',
        label: 'Nature Conservation',
        description: 'Protected environmental areas',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Nature_Conservation',
        opacity: 0.5,
      },
      {
        id: 'koalaConservation',
        label: 'Koala Conservation',
        description: 'Koala habitat protection zones',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Koala_Priority_Areas',
        opacity: 0.5,
      },
      {
        id: 'culturalHeritage',
        label: 'Cultural Heritage',
        description: 'Indigenous and historical sites',
        wmsUrl: 'https://mappingservices.des.qld.gov.au/arcgis/services/MapServer/WMSServer',
        wmsLayers: 'Cultural_Heritage',
        opacity: 0.5,
      },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: Factory,
    description: 'Energy and transport networks',
    layers: [
      {
        id: 'electricityNetwork',
        label: 'Electricity Network',
        description: 'Transmission and distribution lines',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'AREMI:electricity_network',
        opacity: 0.6,
      },
      {
        id: 'gasPipelines',
        label: 'Gas Pipelines',
        description: 'Natural gas infrastructure',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'AREMI:gas_pipelines',
        opacity: 0.6,
      },
      {
        id: 'transportCorridors',
        label: 'Transport Corridors',
        description: 'Rail, ports, and major roads',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'transport_corridors',
        opacity: 0.5,
      },
      {
        id: 'bioenergyFacilities',
        label: 'Bioenergy Facilities',
        description: 'Existing bioenergy plants',
        wmsUrl: 'https://geoserver.aremi.data.gov.au/geoserver/wms',
        wmsLayers: 'AREMI:bioenergy_facilities',
        opacity: 0.8,
      },
    ],
  },
  {
    id: 'satellite',
    label: 'Satellite Data',
    icon: Satellite,
    description: 'Earth observation analytics',
    layers: [
      {
        id: 'ndvi',
        label: 'Vegetation Health (NDVI)',
        description: 'Normalized Difference Vegetation Index',
        // Placeholder - would use actual Earth Engine tiles
        tileUrl: 'https://earthengine.googleapis.com/tiles/{z}/{x}/{y}',
        opacity: 0.7,
      },
      {
        id: 'soilMoisture',
        label: 'Soil Moisture',
        description: 'SMAP satellite soil moisture',
        tileUrl: 'https://earthengine.googleapis.com/tiles/{z}/{x}/{y}',
        opacity: 0.6,
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform Data',
    icon: MapPin,
    description: 'ABFI registry data',
    layers: [
      {
        id: 'feedstocks',
        label: 'Registered Feedstocks',
        description: 'Verified feedstock sources',
      },
      {
        id: 'demandSignals',
        label: 'Demand Signals',
        description: 'Active buyer requirements',
      },
      {
        id: 'projects',
        label: 'Bioenergy Projects',
        description: 'Registered project locations',
      },
    ],
  },
];

// Role-based default layers
const PRESET_LAYERS: Record<MapPreset, Partial<LayerState>> = {
  grower: {
    baseLayer: 'satellite',
    bomRainfall: true,
    bomWarnings: true,
    ndvi: true,
    soilMoisture: true,
    feedstocks: true,
    croppingResidues: true,
  },
  developer: {
    baseLayer: 'street',
    feedstocks: true,
    demandSignals: true,
    projects: true,
    electricityNetwork: true,
    gasPipelines: true,
    bushfireHazard: true,
    floodplainAssessment: true,
  },
  lender: {
    baseLayer: 'street',
    projects: true,
    feedstocks: true,
    bushfireHazard: true,
    floodplainAssessment: true,
    electricityNetwork: true,
  },
  government: {
    baseLayer: 'terrain',
    agriculturalZones: true,
    natureConservation: true,
    koalaConservation: true,
    culturalHeritage: true,
    croppingResidues: true,
    forestryResidues: true,
  },
  default: {
    baseLayer: 'street',
    feedstocks: true,
  },
};

const DEFAULT_LAYER_STATE: LayerState = {
  baseLayer: 'street',
  // Weather
  bomRadar: false,
  bomRainfall: false,
  bomTemperature: false,
  bomWarnings: false,
  // Biomass
  croppingResidues: false,
  forestryResidues: false,
  livestockManure: false,
  sugarcaneResidues: false,
  organicWaste: false,
  // Hazards
  bushfireHazard: false,
  floodplainAssessment: false,
  landslideRisk: false,
  // Planning
  agriculturalZones: false,
  natureConservation: false,
  koalaConservation: false,
  culturalHeritage: false,
  // Infrastructure
  electricityNetwork: false,
  gasPipelines: false,
  transportCorridors: false,
  bioenergyFacilities: false,
  // Satellite
  ndvi: false,
  soilMoisture: false,
  // Platform
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
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [activeLayerCount, setActiveLayerCount] = useState(0);
  const [showRiskPanel, setShowRiskPanel] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showMethodologyExplainer, setShowMethodologyExplainer] = useState(false);
  
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

  // Count active layers
  useEffect(() => {
    const count = Object.entries(layers).filter(
      ([key, value]) => key !== 'baseLayer' && value === true
    ).length;
    setActiveLayerCount(count);
  }, [layers]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Create map
    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: false,
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

  // Manage all WMS/tile overlays based on layer state
  useEffect(() => {
    if (!isMapReady) return;
    
    // Iterate through all layer categories and update overlays
    LAYER_CATEGORIES.forEach(category => {
      category.layers.forEach(layerConfig => {
        const layerId = layerConfig.id;
        // Skip baseLayer as it's not a boolean
        if (layerId === 'baseLayer') return;
        const isEnabled = layers[layerId] as boolean;
        
        // Skip platform data layers (handled separately with markers)
        if (category.id === 'platform') return;
        
        if (layerConfig.wmsUrl && layerConfig.wmsLayers) {
          updateOverlayLayer(layerId, isEnabled, () =>
            L.tileLayer.wms(layerConfig.wmsUrl!, {
              layers: layerConfig.wmsLayers,
              format: 'image/png',
              transparent: true,
              opacity: layerConfig.opacity || 0.6,
              attribution: layerConfig.attribution || '',
            } as L.WMSOptions)
          );
        } else if (layerConfig.tileUrl) {
          updateOverlayLayer(layerId, isEnabled, () =>
            L.tileLayer(layerConfig.tileUrl!, {
              opacity: layerConfig.opacity || 0.6,
            })
          );
        }
      });
    });
  }, [layers, isMapReady, updateOverlayLayer]);

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

  // Get layer config by ID
  const getLayerConfig = (layerId: keyof LayerState) => {
    for (const category of LAYER_CATEGORIES) {
      const layer = category.layers.find(l => l.id === layerId);
      if (layer) return { layer, category };
    }
    return null;
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
      
      {/* Top Right Controls - Status & Fullscreen */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
          {/* Loading indicator */}
          {isLoading && (
            <Badge variant="secondary" className="bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 px-3 py-1.5">
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              <span className="text-sm font-medium">Loading...</span>
            </Badge>
          )}

          {/* Marker count */}
          {!isLoading && markerCount > 0 && (
            <Badge variant="secondary" className="bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 mr-2 text-[#D4AF37]" />
              <span className="text-sm font-medium">{markerCount} locations</span>
            </Badge>
          )}

          {/* Fullscreen toggle */}
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {/* Layer Control Panel - Enhanced with Sheet */}
      {showLayerPanel && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Sheet open={layerPanelOpen} onOpenChange={setLayerPanelOpen}>
            <SheetTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 gap-2 h-9 px-4"
              >
                <Layers className="h-4 w-4" />
                <span className="font-medium">Layers</span>
                {activeLayerCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 bg-[#D4AF37] text-black">
                    {activeLayerCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[380px] sm:w-[420px] p-0">
              <SheetHeader className="p-5 border-b bg-muted/30">
                <SheetTitle className="flex items-center gap-3 text-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                    <Layers className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  Map Layers
                </SheetTitle>
                <SheetDescription className="text-sm">
                  Toggle data overlays from Australian government sources
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-160px)]">
                <div className="p-5 space-y-6">
                  {/* Base Layer Selection */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Base Map</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(BASE_LAYERS).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={layers.baseLayer === key ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            "h-auto py-3 flex-col gap-1.5",
                            layers.baseLayer === key && "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                          )}
                          onClick={() => toggleLayer('baseLayer', key as BaseLayerType)}
                        >
                          {key === 'street' && <MapIcon className="h-5 w-5" />}
                          {key === 'satellite' && <Satellite className="h-5 w-5" />}
                          {key === 'terrain' && <Mountain className="h-5 w-5" />}
                          {key === 'hybrid' && <Layers className="h-5 w-5" />}
                          <span className="text-xs font-medium">{config.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Layer Categories */}
                  {LAYER_CATEGORIES.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          <category.icon className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{category.label}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pl-11">
                        {category.layers.map((layer) => (
                          <div
                            key={layer.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all",
                              layers[layer.id]
                                ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 dark:bg-[#D4AF37]/10"
                                : "bg-card hover:bg-muted/50 border-border"
                            )}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <Label
                                htmlFor={layer.id}
                                className="text-sm font-medium text-foreground cursor-pointer block"
                              >
                                {layer.label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {layer.description}
                              </p>
                            </div>
                            <Switch
                              id={layer.id}
                              checked={layer.id !== 'baseLayer' ? (layers[layer.id] as boolean) : false}
                              onCheckedChange={(checked) => toggleLayer(layer.id, checked)}
                              className="data-[state=checked]:bg-[#D4AF37]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Data Attribution */}
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Data Sources</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Bureau of Meteorology, AREMI, ABBA (Terria), QLD Government,
                          Vicmap Planning, and other Australian government datasets.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      {/* Quick Layer Toggle - Moved to second row to prevent overlap */}
      {showLayerPanel && (
        <div className="absolute top-16 left-4 z-[1000] flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 gap-2"
              >
                <Settings2 className="h-4 w-4" />
                <span className="font-medium">Quick Toggle</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-sm font-semibold">Data Layers</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={layers.feedstocks}
                onCheckedChange={() => toggleLayer('feedstocks')}
                className="py-2"
              >
                <Leaf className="h-4 w-4 mr-3 text-green-600" />
                <span className="font-medium">Feedstocks</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.demandSignals}
                onCheckedChange={() => toggleLayer('demandSignals')}
                className="py-2"
              >
                <MapPin className="h-4 w-4 mr-3 text-orange-600" />
                <span className="font-medium">Demand Signals</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.projects}
                onCheckedChange={() => toggleLayer('projects')}
                className="py-2"
              >
                <Factory className="h-4 w-4 mr-3 text-blue-600" />
                <span className="font-medium">Projects</span>
              </DropdownMenuCheckboxItem>

              {layers.projects && (
                <DropdownMenuItem
                  onClick={() => setShowMethodologyExplainer(true)}
                  className="py-2"
                >
                  <Info className="h-4 w-4 mr-3 text-purple-600" />
                  <span className="font-medium">ABFI Methodology</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-sm font-semibold">Risk Layers</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={layers.bushfireHazard}
                onCheckedChange={() => toggleLayer('bushfireHazard')}
                className="py-2"
              >
                <Flame className="h-4 w-4 mr-3 text-red-600" />
                <span className="font-medium">Bushfire Hazard</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.floodplainAssessment}
                onCheckedChange={() => toggleLayer('floodplainAssessment')}
                className="py-2"
              >
                <Waves className="h-4 w-4 mr-3 text-blue-600" />
                <span className="font-medium">Floodplains</span>
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-sm font-semibold">Biomass Resources</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={layers.croppingResidues}
                onCheckedChange={() => toggleLayer('croppingResidues')}
                className="py-2"
              >
                <Wheat className="h-4 w-4 mr-3 text-amber-600" />
                <span className="font-medium">Cropping Residues</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={layers.electricityNetwork}
                onCheckedChange={() => toggleLayer('electricityNetwork')}
                className="py-2"
              >
                <Zap className="h-4 w-4 mr-3 text-yellow-600" />
                <span className="font-medium">Electricity Network</span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Risk Analysis Button - Moved here to group with quick toggle */}
          <Button
            variant={showRiskPanel ? 'default' : 'secondary'}
            size="sm"
            className={cn(
              "h-9 shadow-lg backdrop-blur-sm border border-border/50 gap-2",
              showRiskPanel
                ? "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                : "bg-white/95 dark:bg-gray-900/95"
            )}
            onClick={() => setShowRiskPanel(!showRiskPanel)}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Risk Analysis</span>
          </Button>
        </div>
      )}
      
      {/* Zoom Controls */}
      {showControls && (
        <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-1.5">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={zoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={locateMe}
            title="My Location"
          >
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm border border-border/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={resetView}
            title="Reset View"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Selected Location Info (Earth Engine data) */}
      {selectedLocation && (layers.ndvi || layers.soilMoisture) && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 p-4 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Location Analysis</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSelectedLocation(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3 font-mono">
            {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°
          </p>

          {ndviLoading || soilLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="space-y-2.5 text-sm">
              {ndviData && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">NDVI:</span>
                  <span className="font-semibold text-foreground">{ndviData.mean.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">({ndviData.healthCategory})</span></span>
                </div>
              )}
              {soilData && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Soil Moisture:</span>
                  <span className="font-semibold text-foreground">{soilData.moistureCategory}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Active Layers Legend - Positioned at bottom left, above location analysis if shown */}
      {activeLayerCount > 0 && (
        <div className={cn(
          "absolute left-3 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 p-3",
          selectedLocation && (layers.ndvi || layers.soilMoisture) ? "bottom-[140px]" : "bottom-3"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Active Layers</span>
            <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] dark:text-[#D4AF37] px-1.5 py-0.5 rounded font-medium">{activeLayerCount}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {layers.feedstocks && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                <span className="text-foreground font-medium">Feedstocks</span>
              </div>
            )}
            {layers.demandSignals && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
                <span className="text-foreground font-medium">Demand</span>
              </div>
            )}
            {layers.projects && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-foreground font-medium">Projects</span>
              </div>
            )}
            {layers.bushfireHazard && (
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-red-500" />
                <span className="text-foreground font-medium">Fire Risk</span>
              </div>
            )}
            {layers.floodplainAssessment && (
              <div className="flex items-center gap-1.5">
                <Waves className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-foreground font-medium">Flood</span>
              </div>
            )}
            {layers.croppingResidues && (
              <div className="flex items-center gap-1.5">
                <Wheat className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-foreground font-medium">Biomass</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biomass Risk Analysis Panel - Positioned below the second row of controls */}
      {showRiskPanel && (
        <div className="absolute top-28 right-3 z-[1000]">
          <BiomassRiskPanel
            selectedLocation={selectedLocation}
            onClose={() => setShowRiskPanel(false)}
          />
        </div>
      )}

      {/* Project Claiming Modal */}
      {selectedProject && (
        <ProjectClaimingModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onClaimSuccess={() => {
            setSelectedProject(null);
            // Could refetch projects data here
          }}
        />
      )}

      {/* ABFI Methodology Explainer */}
      <ABFIMethodologyExplainer
        isOpen={showMethodologyExplainer}
        onClose={() => setShowMethodologyExplainer(false)}
      />
    </div>
  );
}

export default PlatformMap;

