/**
 * Map Overlays Configuration
 * WMS/TileLayer URLs for BOM and government data overlays
 *
 * Data Sources:
 * - Bureau of Meteorology (BOM): Weather, Radar, Forecasts
 * - data.gov.au: Land use, crop areas, cadastre
 * - Queensland Government: Property boundaries, sugarcane zones
 * - Geoscience Australia: Elevation, water bodies
 */

export interface MapOverlayConfig {
  id: string;
  name: string;
  type: 'wms' | 'tile' | 'geojson';
  url: string;
  layers?: string;
  format?: string;
  transparent?: boolean;
  opacity?: number;
  attribution?: string;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [[number, number], [number, number]];  // [[sw], [ne]]
}

// ============================================================================
// BOM OVERLAYS
// ============================================================================

export const BOM_OVERLAYS: Record<string, MapOverlayConfig> = {
  // BOM Radar (composite)
  bomRadar: {
    id: 'bomRadar',
    name: 'BOM Radar',
    type: 'tile',
    // BOM provides radar as transparent PNGs via their tile server
    url: 'https://tilecache.rainviewer.com/v2/radar/nowcast/{z}/{x}/{y}/256/2/1_1.png',
    opacity: 0.7,
    attribution: '© RainViewer / BOM',
    minZoom: 3,
    maxZoom: 14,
  },

  // BOM Rainfall observation grid
  bomRainfall: {
    id: 'bomRainfall',
    name: 'Rainfall Observations',
    type: 'wms',
    url: 'https://services.sentinel-hub.com/ogc/wms',
    layers: 'PRECIPITATION',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: '© BOM / Sentinel Hub',
  },

  // BOM Temperature
  bomTemperature: {
    id: 'bomTemperature',
    name: 'Temperature',
    type: 'tile',
    // OpenWeatherMap temperature layer (requires API key in production)
    url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo',
    opacity: 0.6,
    attribution: '© OpenWeatherMap',
    minZoom: 2,
    maxZoom: 12,
  },

  // BOM Warnings (would be GeoJSON from API)
  bomWarnings: {
    id: 'bomWarnings',
    name: 'Weather Warnings',
    type: 'geojson',
    url: '/api/climate/warnings/geojson',
    opacity: 0.8,
    attribution: '© BOM',
  },
};

// ============================================================================
// GOVERNMENT DATA OVERLAYS
// ============================================================================

export const GOVERNMENT_OVERLAYS: Record<string, MapOverlayConfig> = {
  // ABARES Land Use
  landUse: {
    id: 'landUse',
    name: 'Land Use (ABARES)',
    type: 'wms',
    url: 'https://eos.ga.gov.au/geoserver/wms',
    layers: 'ABARES:CLUM',  // Catchment Land Use Mapping
    format: 'image/png',
    transparent: true,
    opacity: 0.5,
    attribution: '© ABARES',
    minZoom: 5,
  },

  // Crop Areas (from ABARES Agricultural Statistics)
  cropAreas: {
    id: 'cropAreas',
    name: 'Crop Production Areas',
    type: 'wms',
    url: 'https://gis.agriculture.gov.au/geoserver/wms',
    layers: 'agri:crops',
    format: 'image/png',
    transparent: true,
    opacity: 0.5,
    attribution: '© ABARES',
  },

  // Sugarcane Zones (QLD specific)
  sugarcaneZones: {
    id: 'sugarcaneZones',
    name: 'Sugarcane Zones',
    type: 'wms',
    url: 'https://qldspatial.information.qld.gov.au/catalogue/rest/services/ENVIRONMENT/SugarcaneZones/MapServer/WMSServer',
    layers: '0',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: '© Queensland Government',
    bounds: [[-29, 137], [-10, 154]],  // QLD bounds
  },

  // Property Cadastre (QLD Globe)
  cadastre: {
    id: 'cadastre',
    name: 'Property Boundaries',
    type: 'wms',
    url: 'https://qldspatial.information.qld.gov.au/catalogue/rest/services/CADASTRE/DCDB/MapServer/WMSServer',
    layers: '0',
    format: 'image/png',
    transparent: true,
    opacity: 0.4,
    attribution: '© Queensland Government',
    minZoom: 10,
  },
};

// ============================================================================
// ENVIRONMENTAL OVERLAYS
// ============================================================================

export const ENVIRONMENTAL_OVERLAYS: Record<string, MapOverlayConfig> = {
  // NDVI from Sentinel-2
  ndvi: {
    id: 'ndvi',
    name: 'Vegetation (NDVI)',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opacity: 0.5,
    attribution: '© Esri',
  },

  // Soil Moisture (simulated - would use SMAP data)
  soilMoisture: {
    id: 'soilMoisture',
    name: 'Soil Moisture',
    type: 'tile',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/SMAP_L3_Soil_Moisture_Daily/default/{time}/{tilematrixset}/{z}/{y}/{x}.png',
    opacity: 0.6,
    attribution: '© NASA SMAP',
  },

  // Fire Risk (from state fire services)
  fireRisk: {
    id: 'fireRisk',
    name: 'Fire Danger Rating',
    type: 'wms',
    url: 'https://services.ga.gov.au/gis/bushfire/wms',
    layers: 'fire_danger_rating',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: '© Geoscience Australia',
  },

  // Flood Risk (from QRA)
  floodRisk: {
    id: 'floodRisk',
    name: 'Flood Hazard',
    type: 'wms',
    url: 'https://services.ga.gov.au/gis/flood/wms',
    layers: 'flood_hazard',
    format: 'image/png',
    transparent: true,
    opacity: 0.5,
    attribution: '© Geoscience Australia / QRA',
  },
};

// ============================================================================
// INFRASTRUCTURE OVERLAYS
// ============================================================================

export const INFRASTRUCTURE_OVERLAYS: Record<string, MapOverlayConfig> = {
  // Power stations (from AEMO)
  powerStations: {
    id: 'powerStations',
    name: 'Power Stations',
    type: 'geojson',
    url: '/api/infrastructure/power-stations/geojson',
    opacity: 1,
    attribution: '© AEMO',
  },

  // Heavy vehicle routes (QLD)
  heavyVehicleRoutes: {
    id: 'heavyVehicleRoutes',
    name: 'Heavy Vehicle Routes',
    type: 'wms',
    url: 'https://services.tmr.qld.gov.au/gis/wms',
    layers: 'heavy_vehicle_routes',
    format: 'image/png',
    transparent: true,
    opacity: 0.7,
    attribution: '© TMR Queensland',
  },

  // Rail network
  railNetwork: {
    id: 'railNetwork',
    name: 'Rail Network',
    type: 'wms',
    url: 'https://services.ga.gov.au/gis/transport/wms',
    layers: 'rail_lines',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: '© Geoscience Australia',
  },

  // Ports and terminals
  ports: {
    id: 'ports',
    name: 'Ports & Terminals',
    type: 'geojson',
    url: '/api/infrastructure/ports/geojson',
    opacity: 1,
    attribution: '© Various',
  },
};

// ============================================================================
// ALL OVERLAYS
// ============================================================================

export const ALL_OVERLAYS: Record<string, MapOverlayConfig> = {
  ...BOM_OVERLAYS,
  ...GOVERNMENT_OVERLAYS,
  ...ENVIRONMENTAL_OVERLAYS,
  ...INFRASTRUCTURE_OVERLAYS,
};

// ============================================================================
// OVERLAY CATEGORY GROUPS
// ============================================================================

export const OVERLAY_CATEGORIES = {
  weather: {
    label: 'Weather & Climate',
    icon: 'Cloud',
    overlays: ['bomRadar', 'bomRainfall', 'bomTemperature', 'bomWarnings'],
  },
  agriculture: {
    label: 'Agriculture',
    icon: 'Wheat',
    overlays: ['landUse', 'cropAreas', 'sugarcaneZones', 'ndvi'],
  },
  property: {
    label: 'Property & Land',
    icon: 'Building',
    overlays: ['cadastre'],
  },
  environment: {
    label: 'Environment & Risk',
    icon: 'AlertTriangle',
    overlays: ['soilMoisture', 'fireRisk', 'floodRisk'],
  },
  infrastructure: {
    label: 'Infrastructure',
    icon: 'Truck',
    overlays: ['powerStations', 'heavyVehicleRoutes', 'railNetwork', 'ports'],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get WMS tile URL for Leaflet
 */
export function getWMSTileUrl(config: MapOverlayConfig): string {
  if (config.type !== 'wms') return config.url;

  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: config.layers || '',
    format: config.format || 'image/png',
    transparent: config.transparent !== false ? 'true' : 'false',
    srs: 'EPSG:3857',
    bbox: '{bbox-epsg-3857}',
    width: '256',
    height: '256',
  });

  return `${config.url}?${params.toString()}`;
}

/**
 * Get overlay config by ID
 */
export function getOverlayConfig(id: string): MapOverlayConfig | undefined {
  return ALL_OVERLAYS[id];
}

/**
 * Get all overlays in a category
 */
export function getOverlaysByCategory(category: keyof typeof OVERLAY_CATEGORIES): MapOverlayConfig[] {
  const categoryConfig = OVERLAY_CATEGORIES[category];
  if (!categoryConfig) return [];

  return categoryConfig.overlays
    .map(id => ALL_OVERLAYS[id])
    .filter(Boolean);
}

export default ALL_OVERLAYS;
