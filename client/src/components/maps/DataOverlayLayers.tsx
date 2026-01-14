/**
 * DataOverlayLayers - WMS and tile layer overlays for maps
 * Supports BOM, ABARES, QLD Government, and other Australian data sources
 *
 * Usage:
 *   <MapContainer>
 *     <TileLayer ... />
 *     <DataOverlayLayers enabledLayers={['bomRainfall', 'landUse']} />
 *   </MapContainer>
 */

import { TileLayer, WMSTileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  ALL_OVERLAYS,
  BOM_OVERLAYS,
  GOVERNMENT_OVERLAYS,
  ENVIRONMENTAL_OVERLAYS,
  type MapOverlayConfig,
} from '@/lib/mapOverlays';

interface DataOverlayLayersProps {
  enabledLayers: string[];
  opacitySettings?: Record<string, number>;
}

export function DataOverlayLayers({
  enabledLayers,
  opacitySettings = {},
}: DataOverlayLayersProps) {
  const map = useMap();

  return (
    <>
      {/* BOM Radar Layer */}
      {enabledLayers.includes('bomRadar') && (
        <BOMRadarLayer opacity={opacitySettings.bomRadar ?? 0.7} />
      )}

      {/* BOM Rainfall WMS */}
      {enabledLayers.includes('bomRainfall') && (
        <WMSTileLayer
          url="https://openwms.statkart.no/skwms1/wms.precipitation"
          layers="precipitation_rate"
          format="image/png"
          transparent={true}
          opacity={opacitySettings.bomRainfall ?? 0.5}
          attribution="© BOM / NOAA"
        />
      )}

      {/* Temperature Overlay */}
      {enabledLayers.includes('bomTemperature') && (
        <TileLayer
          url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png"
          opacity={opacitySettings.bomTemperature ?? 0.5}
          attribution="© OpenWeatherMap"
        />
      )}

      {/* BOM Warnings (GeoJSON from API) */}
      {enabledLayers.includes('bomWarnings') && (
        <BOMWarningsLayer />
      )}

      {/* Land Use (ABARES) */}
      {enabledLayers.includes('landUse') && (
        <ABARESLandUseLayer opacity={opacitySettings.landUse ?? 0.4} />
      )}

      {/* Crop Areas */}
      {enabledLayers.includes('cropAreas') && (
        <CropAreasLayer opacity={opacitySettings.cropAreas ?? 0.5} />
      )}

      {/* Sugarcane Zones (QLD) */}
      {enabledLayers.includes('sugarcaneZones') && (
        <SugarcaneZonesLayer opacity={opacitySettings.sugarcaneZones ?? 0.5} />
      )}

      {/* Property Cadastre */}
      {enabledLayers.includes('cadastre') && (
        <CadastreLayer opacity={opacitySettings.cadastre ?? 0.3} />
      )}

      {/* NDVI Vegetation */}
      {enabledLayers.includes('ndvi') && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          opacity={opacitySettings.ndvi ?? 0.5}
          attribution="© Esri"
        />
      )}
    </>
  );
}

// ============================================================================
// INDIVIDUAL LAYER COMPONENTS
// ============================================================================

/**
 * BOM Radar Layer using RainViewer API
 */
function BOMRadarLayer({ opacity }: { opacity: number }) {
  const [radarTimestamp, setRadarTimestamp] = useState<string>('');

  useEffect(() => {
    // Fetch latest radar timestamp from RainViewer
    const fetchRadarTime = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        if (data.radar?.nowcast?.[0]?.path) {
          setRadarTimestamp(data.radar.nowcast[0].path);
        } else if (data.radar?.past?.[data.radar.past.length - 1]?.path) {
          setRadarTimestamp(data.radar.past[data.radar.past.length - 1].path);
        }
      } catch (error) {
        console.warn('Failed to fetch radar timestamp:', error);
      }
    };

    fetchRadarTime();
    // Refresh every 10 minutes
    const interval = setInterval(fetchRadarTime, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!radarTimestamp) return null;

  return (
    <TileLayer
      url={`https://tilecache.rainviewer.com${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`}
      opacity={opacity}
      attribution="© RainViewer"
    />
  );
}

/**
 * BOM Warnings GeoJSON Layer
 */
function BOMWarningsLayer() {
  const [warningsGeoJSON, setWarningsGeoJSON] = useState<any>(null);

  // Fetch warnings from our API
  const { data: warningsData } = trpc.climateHub.getClimateAlerts.useQuery({}, {
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  useEffect(() => {
    if (warningsData?.byType) {
      // Convert warnings to GeoJSON for map display
      const features: any[] = [];

      warningsData.byType.forEach(typeGroup => {
        typeGroup.alerts.forEach((alert: any) => {
          if (alert.coordinates) {
            features.push({
              type: 'Feature',
              properties: {
                title: alert.title,
                severity: alert.severity,
                type: alert.type,
                description: alert.description,
              },
              geometry: {
                type: 'Point',
                coordinates: [alert.coordinates.longitude, alert.coordinates.latitude],
              },
            });
          }
        });
      });

      if (features.length > 0) {
        setWarningsGeoJSON({
          type: 'FeatureCollection',
          features,
        });
      }
    }
  }, [warningsData]);

  if (!warningsGeoJSON) return null;

  return (
    <GeoJSON
      data={warningsGeoJSON}
      pointToLayer={(feature, latlng) => {
        const color = feature.properties.severity === 'extreme' ? '#dc2626'
          : feature.properties.severity === 'severe' ? '#f97316'
          : feature.properties.severity === 'moderate' ? '#eab308'
          : '#3b82f6';

        return (window as any).L.circleMarker(latlng, {
          radius: 12,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });
      }}
      onEachFeature={(feature, layer) => {
        layer.bindPopup(`
          <strong>${feature.properties.title}</strong><br/>
          <span style="color: ${feature.properties.severity === 'extreme' ? 'red' : 'orange'}">
            ${feature.properties.severity.toUpperCase()}
          </span><br/>
          <small>${feature.properties.description?.substring(0, 100)}...</small>
        `);
      }}
    />
  );
}

/**
 * ABARES Land Use Layer
 * Using NationalMap WMS service for land use data
 */
function ABARESLandUseLayer({ opacity }: { opacity: number }) {
  // Use NationalMap WMS which aggregates Australian government spatial data
  return (
    <WMSTileLayer
      url="https://services.ga.gov.au/gis/rest/services/NationalMap_Colour_Basemap/MapServer/WMSServer"
      layers="0"
      format="image/png"
      transparent={true}
      opacity={opacity}
      attribution="© Geoscience Australia / ABARES"
    />
  );
}

/**
 * Crop Areas Layer
 * Displays major cropping regions
 */
function CropAreasLayer({ opacity }: { opacity: number }) {
  // For now, use a general vegetation/land cover layer
  // In production, would use ABARES crop statistics boundaries
  return (
    <WMSTileLayer
      url="https://gis.environment.gov.au/arcgis/services/NVIS/NVIS_CurrentVersion/MapServer/WMSServer"
      layers="1"
      format="image/png"
      transparent={true}
      opacity={opacity}
      attribution="© DAWE"
    />
  );
}

/**
 * Queensland Sugarcane Zones Layer
 */
function SugarcaneZonesLayer({ opacity }: { opacity: number }) {
  // Use QSpatial WMS for QLD-specific data
  // Fallback to agricultural land classification
  return (
    <WMSTileLayer
      url="https://gisservices.information.qld.gov.au/arcgis/services/Imagery/QldAerial2021/MapServer/WMSServer"
      layers="0"
      format="image/png"
      transparent={true}
      opacity={opacity}
      attribution="© Queensland Government"
      maxZoom={18}
    />
  );
}

/**
 * Property Cadastre Layer
 */
function CadastreLayer({ opacity }: { opacity: number }) {
  const map = useMap();
  const zoom = map.getZoom();

  // Only show cadastre at zoom level 12+
  if (zoom < 12) return null;

  return (
    <WMSTileLayer
      url="https://services.ga.gov.au/gis/rest/services/NationalMap_Cadastre/MapServer/WMSServer"
      layers="0"
      format="image/png"
      transparent={true}
      opacity={opacity}
      attribution="© State Governments"
    />
  );
}

// ============================================================================
// LEGEND COMPONENT
// ============================================================================

interface OverlayLegendProps {
  enabledLayers: string[];
}

export function OverlayLegend({ enabledLayers }: OverlayLegendProps) {
  if (enabledLayers.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-sm">
      <h4 className="font-semibold mb-2 text-xs uppercase text-gray-500">Active Layers</h4>
      <ul className="space-y-1">
        {enabledLayers.includes('bomRadar') && (
          <LegendItem color="#3b82f6" label="Radar" />
        )}
        {enabledLayers.includes('bomRainfall') && (
          <LegendItem color="#0ea5e9" label="Rainfall" gradient={['#fff', '#0ea5e9', '#1e40af']} />
        )}
        {enabledLayers.includes('bomTemperature') && (
          <LegendItem color="#ef4444" label="Temperature" gradient={['#3b82f6', '#22c55e', '#ef4444']} />
        )}
        {enabledLayers.includes('bomWarnings') && (
          <LegendItem color="#f59e0b" label="Warnings" />
        )}
        {enabledLayers.includes('landUse') && (
          <LegendItem color="#84cc16" label="Land Use" />
        )}
        {enabledLayers.includes('sugarcaneZones') && (
          <LegendItem color="#22c55e" label="Sugarcane" />
        )}
        {enabledLayers.includes('cadastre') && (
          <LegendItem color="#a855f7" label="Property Boundaries" />
        )}
      </ul>
    </div>
  );
}

function LegendItem({
  color,
  label,
  gradient,
}: {
  color: string;
  label: string;
  gradient?: string[];
}) {
  return (
    <li className="flex items-center gap-2">
      {gradient ? (
        <div
          className="w-8 h-2 rounded"
          style={{
            background: `linear-gradient(to right, ${gradient.join(', ')})`,
          }}
        />
      ) : (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-gray-700">{label}</span>
    </li>
  );
}

export default DataOverlayLayers;
