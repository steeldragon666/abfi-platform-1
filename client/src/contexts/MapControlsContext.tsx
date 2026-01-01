/**
 * MapControlsContext - Shared state for map controls across components
 * Allows MapControlsPanel to control UnifiedMap from outside
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { type LucideIcon, Leaf, TrendingUp, MapPin, Globe, Layers, Satellite, Factory, Truck, Zap } from 'lucide-react';

// Layer configuration with role visibility
export interface MapLayer {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  roles: string[];
  enabled: boolean;
}

export const DEFAULT_LAYERS: MapLayer[] = [
  {
    id: 'feedstocks',
    label: 'Feedstock Supply',
    icon: Leaf,
    color: '#22c55e',
    roles: ['buyer', 'admin', 'auditor', 'lender', 'analyst', 'supplier', 'grower'],
    enabled: true,
  },
  {
    id: 'demand',
    label: 'Demand Signals',
    icon: TrendingUp,
    color: '#f97316',
    roles: ['grower', 'supplier', 'admin', 'auditor'],
    enabled: true,
  },
  {
    id: 'roadmapView',
    label: 'Roadmap',
    icon: MapPin,
    color: '#64748b',
    roles: ['buyer', 'supplier', 'grower', 'admin', 'auditor', 'lender'],
    enabled: true,
  },
  {
    id: 'satelliteImagery',
    label: 'Satellite Imagery',
    icon: Globe,
    color: '#0ea5e9',
    roles: ['buyer', 'supplier', 'grower', 'admin', 'auditor', 'lender'],
    enabled: false,
  },
  {
    id: 'hybridView',
    label: 'Hybrid View',
    icon: Layers,
    color: '#6366f1',
    roles: ['buyer', 'supplier', 'grower', 'admin', 'auditor', 'lender'],
    enabled: false,
  },
  {
    id: 'terrainView',
    label: 'Terrain View',
    icon: TrendingUp,
    color: '#84cc16',
    roles: ['buyer', 'supplier', 'grower', 'admin', 'auditor', 'lender'],
    enabled: false,
  },
  {
    id: 'satellite',
    label: 'Satellite Data',
    icon: Satellite,
    color: '#06b6d4',
    roles: ['buyer', 'supplier', 'grower', 'admin', 'auditor', 'lender'],
    enabled: false,
  },
  {
    id: 'projects',
    label: 'My Projects',
    icon: Factory,
    color: '#3b82f6',
    roles: ['grower', 'supplier'],
    enabled: true,
  },
  {
    id: 'logistics',
    label: 'Logistics Hubs',
    icon: Truck,
    color: '#8b5cf6',
    roles: ['buyer', 'supplier', 'admin'],
    enabled: false,
  },
  {
    id: 'powerStations',
    label: 'Power Stations',
    icon: Zap,
    color: '#eab308',
    roles: ['buyer', 'lender', 'admin'],
    enabled: false,
  },
];

// Map view layers are mutually exclusive
export const MAP_VIEW_LAYERS = ['roadmapView', 'satelliteImagery', 'hybridView', 'terrainView'];

interface MapControlsContextType {
  // Layer controls
  layers: MapLayer[];
  setLayers: React.Dispatch<React.SetStateAction<MapLayer[]>>;
  toggleLayer: (layerId: string) => void;

  // Filter controls
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStates: string[];
  setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
  minScore: number;
  setMinScore: React.Dispatch<React.SetStateAction<number>>;
  maxCarbonIntensity: number;
  setMaxCarbonIntensity: React.Dispatch<React.SetStateAction<number>>;

  // Satellite coordinates
  satelliteCoords: { lat: number; lng: number } | null;
  setSatelliteCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;

  // Panel state
  controlsPanelCollapsed: boolean;
  setControlsPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  // Reset filters
  resetFilters: () => void;
}

const MapControlsContext = createContext<MapControlsContextType | null>(null);

export function useMapControls() {
  const context = useContext(MapControlsContext);
  if (!context) {
    throw new Error('useMapControls must be used within a MapControlsProvider');
  }
  return context;
}

// Safe version that returns null if outside provider (for optional context usage)
export function useMapControlsSafe() {
  return useContext(MapControlsContext);
}

interface MapControlsProviderProps {
  children: ReactNode;
  userRole?: string;
  initialFilters?: {
    categories?: string[];
    states?: string[];
  };
}

export function MapControlsProvider({
  children,
  userRole = 'buyer',
  initialFilters,
}: MapControlsProviderProps) {
  // Layer state
  const [layers, setLayers] = useState<MapLayer[]>(() =>
    DEFAULT_LAYERS.filter((layer) => layer.roles.includes(userRole))
  );

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.categories || []
  );
  const [selectedStates, setSelectedStates] = useState<string[]>(
    initialFilters?.states || []
  );
  const [minScore, setMinScore] = useState<number>(0);
  const [maxCarbonIntensity, setMaxCarbonIntensity] = useState<number>(100);

  // Satellite coordinates
  const [satelliteCoords, setSatelliteCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Panel state
  const [controlsPanelCollapsed, setControlsPanelCollapsed] = useState(false);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === layerId) {
          return { ...layer, enabled: !layer.enabled };
        }
        // If toggling on a map view layer, disable other map view layers
        if (MAP_VIEW_LAYERS.includes(layerId) && MAP_VIEW_LAYERS.includes(layer.id)) {
          return { ...layer, enabled: false };
        }
        return layer;
      })
    );
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedStates([]);
    setMinScore(0);
    setMaxCarbonIntensity(100);
  }, []);

  const value: MapControlsContextType = {
    layers,
    setLayers,
    toggleLayer,
    selectedCategories,
    setSelectedCategories,
    selectedStates,
    setSelectedStates,
    minScore,
    setMinScore,
    maxCarbonIntensity,
    setMaxCarbonIntensity,
    satelliteCoords,
    setSatelliteCoords,
    controlsPanelCollapsed,
    setControlsPanelCollapsed,
    resetFilters,
  };

  return (
    <MapControlsContext.Provider value={value}>
      {children}
    </MapControlsContext.Provider>
  );
}

export default MapControlsContext;
