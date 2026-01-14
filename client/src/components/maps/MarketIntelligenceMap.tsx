"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Australia center
const AUSTRALIA_CENTER: L.LatLngTuple = [-25.2744, 133.7751];
const DEFAULT_ZOOM = 4;

// Layer types for the unified map
export type MapLayerType =
  | "projects"
  | "intentions"
  | "demandSignals"
  | "matches"
  | "contracts"
  | "deliveries"
  | "priceHeatmap"
  | "transportRoutes"
  | "logisticsHubs"
  | "powerStations";

// Role-based layer visibility configuration
const LAYER_ACCESS: Record<string, MapLayerType[]> = {
  admin: [
    "projects", "intentions", "demandSignals", "matches", "contracts",
    "deliveries", "priceHeatmap", "transportRoutes", "logisticsHubs", "powerStations"
  ],
  auditor: [
    "projects", "intentions", "demandSignals", "matches", "contracts",
    "deliveries", "priceHeatmap", "transportRoutes", "logisticsHubs", "powerStations"
  ],
  buyer: [
    "projects", "intentions", "demandSignals", "matches", "contracts",
    "deliveries", "priceHeatmap", "transportRoutes", "logisticsHubs", "powerStations"
  ],
  supplier: [
    "projects", "intentions", "demandSignals", "matches", "contracts",
    "deliveries", "priceHeatmap", "transportRoutes", "logisticsHubs"
  ],
  user: ["projects", "priceHeatmap", "logisticsHubs", "powerStations"],
};

// Layer display configuration
interface LayerConfig {
  id: MapLayerType;
  name: string;
  icon: string;
  color: string;
  description: string;
  category: "supply" | "demand" | "market" | "infrastructure";
}

export const LAYER_CONFIGS: LayerConfig[] = [
  { id: "projects", name: "Grower Projects", icon: "🌾", color: "#22c55e", description: "Active growing projects with feedstock", category: "supply" },
  { id: "intentions", name: "Growing Intentions", icon: "🌱", color: "#84cc16", description: "Planned/proposed growing intentions", category: "supply" },
  { id: "demandSignals", name: "Buyer Demand", icon: "📍", color: "#3b82f6", description: "Active buyer demand signals", category: "demand" },
  { id: "matches", name: "Contract Matches", icon: "🔗", color: "#8b5cf6", description: "Matched supply-demand pairs", category: "market" },
  { id: "contracts", name: "Active Contracts", icon: "📄", color: "#06b6d4", description: "Signed and active contracts", category: "market" },
  { id: "deliveries", name: "In-Transit", icon: "🚛", color: "#f59e0b", description: "Active deliveries in progress", category: "market" },
  { id: "priceHeatmap", name: "Price Signals", icon: "💰", color: "#ef4444", description: "Regional price intelligence", category: "market" },
  { id: "transportRoutes", name: "Transport Routes", icon: "🛤️", color: "#6b7280", description: "Optimized transport corridors", category: "infrastructure" },
  { id: "logisticsHubs", name: "Logistics Hubs", icon: "🏭", color: "#1e40af", description: "Processing and aggregation hubs", category: "infrastructure" },
  { id: "powerStations", name: "Power Stations", icon: "⚡", color: "#dc2626", description: "Bioenergy generation facilities", category: "infrastructure" },
];

// Entity types for detail panel
export interface MapEntity {
  type: MapLayerType;
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  data: Record<string, any>;
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  // Project/Intention status
  DRAFT: "#9ca3af",
  PENDING_VERIFICATION: "#f59e0b",
  ACTIVE: "#22c55e",
  COMPLETED: "#3b82f6",
  CANCELLED: "#ef4444",
  EXPIRED: "#6b7280",
  // Contract status
  PENDING_GROWER: "#f59e0b",
  PENDING_BUYER: "#f59e0b",
  DELIVERING: "#8b5cf6",
  DISPUTED: "#ef4444",
  // Match status
  SUGGESTED: "#9ca3af",
  VIEWED: "#3b82f6",
  NEGOTIATING: "#f59e0b",
  ACCEPTED: "#22c55e",
  REJECTED: "#ef4444",
  // Delivery status
  SCHEDULED: "#9ca3af",
  LOADING: "#f59e0b",
  IN_TRANSIT: "#8b5cf6",
  DELIVERED: "#22c55e",
  CONFIRMED: "#059669",
  // Hub types
  RAIL: "#1e40af",
  PORT: "#0891b2",
  PROCESSING: "#7c3aed",
  AGGREGATION: "#059669",
};

// Feedstock category colors
export const FEEDSTOCK_COLORS: Record<string, string> = {
  oilseed: "#22c55e",
  UCO: "#f59e0b",
  tallow: "#8b5cf6",
  lignocellulosic: "#3b82f6",
  waste: "#6b7280",
  algae: "#06b6d4",
  bamboo: "#84cc16",
  other: "#9ca3af",
};

interface MarketIntelligenceMapProps {
  className?: string;
  center?: L.LatLngTuple;
  zoom?: number;
  userRole?: string;
  userId?: string | number;
  supplierId?: number;
  buyerId?: number;
  enabledLayers?: MapLayerType[];
  feedstockFilter?: string[];
  regionFilter?: string[];
  statusFilter?: string[];
  onEntityClick?: (entity: MapEntity) => void;
  onEntityHover?: (entity: MapEntity | null) => void;
  onMapReady?: (map: L.Map) => void;
  showLayerControl?: boolean;
  showFiltersPanel?: boolean;
  showMarketSummary?: boolean;
  showDetailPanel?: boolean;
}

export function MarketIntelligenceMap({
  className,
  center = AUSTRALIA_CENTER,
  zoom = DEFAULT_ZOOM,
  userRole = "user",
  userId,
  supplierId,
  buyerId,
  enabledLayers,
  feedstockFilter,
  regionFilter,
  statusFilter,
  onEntityClick,
  onEntityHover,
  onMapReady,
  showLayerControl = true,
  showFiltersPanel = true,
  showMarketSummary = true,
  showDetailPanel = true,
}: MarketIntelligenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<MapEntity | null>(null);

  // Layer visibility state
  const availableLayers = useMemo(() => {
    return LAYER_ACCESS[userRole] || LAYER_ACCESS.user;
  }, [userRole]);

  const [activeLayers, setActiveLayers] = useState<MapLayerType[]>(
    enabledLayers || availableLayers.filter(l => ["projects", "demandSignals", "priceHeatmap"].includes(l))
  );

  // Filter state
  const [filters, setFilters] = useState({
    feedstockCategories: feedstockFilter || [],
    regions: regionFilter || [],
    statuses: statusFilter || [],
    dateRange: { start: null as Date | null, end: null as Date | null },
  });

  // Marker refs for cleanup
  const markersRef = useRef<Record<MapLayerType, L.Layer[]>>({
    projects: [],
    intentions: [],
    demandSignals: [],
    matches: [],
    contracts: [],
    deliveries: [],
    priceHeatmap: [],
    transportRoutes: [],
    logisticsHubs: [],
    powerStations: [],
  });

  // Fetch map data using tRPC
  const { data: mapData, isLoading, refetch } = trpc.unifiedMap.getMapData.useQuery(
    {
      feedstockCategories: filters.feedstockCategories.length > 0 ? filters.feedstockCategories : undefined,
      regionIds: filters.regions.length > 0 ? filters.regions : undefined,
      layers: activeLayers,
      includeAggregates: true,
    },
    {
      refetchInterval: 60000, // Refresh every minute
      enabled: isReady,
    }
  );

  // Fetch market intelligence
  const { data: marketIntel } = trpc.unifiedMap.getMarketIntelligence.useQuery(
    {
      feedstockCategory: filters.feedstockCategories.length > 0 ? filters.feedstockCategories[0] : undefined,
      state: filters.regions.length > 0 ? filters.regions[0] : undefined,
    },
    {
      refetchInterval: 300000, // Refresh every 5 minutes
      enabled: isReady && showMarketSummary,
    }
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add scale control
    L.control.scale({ imperial: false, metric: true }).addTo(map);

    mapRef.current = map;
    setIsReady(true);

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Create marker icon based on entity type
  const createMarkerIcon = useCallback((type: MapLayerType, entity: any): L.DivIcon => {
    const config = LAYER_CONFIGS.find(l => l.id === type);
    const color = entity.status ? STATUS_COLORS[entity.status] || config?.color : config?.color;
    const feedstockColor = entity.feedstockCategory ? FEEDSTOCK_COLORS[entity.feedstockCategory] : null;

    const size = type === "powerStations" || type === "logisticsHubs" ? 32 : 24;
    const isHighlighted = hoveredEntity?.id === entity.id && hoveredEntity?.type === type;

    return L.divIcon({
      className: `market-intel-marker ${type}`,
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
        ">
          ${isHighlighted ? `
            <div style="
              position: absolute;
              width: ${size + 8}px;
              height: ${size + 8}px;
              background-color: ${color}40;
              border-radius: 50%;
              animation: pulse 1.5s infinite;
              top: -4px;
              left: -4px;
            "></div>
          ` : ""}
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${feedstockColor || color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${size * 0.5}px;
            position: relative;
            z-index: ${isHighlighted ? 1000 : 1};
          ">
            ${config?.icon || "📍"}
          </div>
          ${entity.matchScore ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              background: ${entity.matchScore >= 80 ? "#22c55e" : entity.matchScore >= 60 ? "#f59e0b" : "#ef4444"};
              color: white;
              font-size: 8px;
              font-weight: bold;
              padding: 1px 3px;
              border-radius: 4px;
              z-index: 2;
            ">${entity.matchScore}%</div>
          ` : ""}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [hoveredEntity]);

  // Create popup content based on entity type
  const createPopupContent = useCallback((type: MapLayerType, entity: any): string => {
    const config = LAYER_CONFIGS.find(l => l.id === type);

    const statusBadge = entity.status ? `
      <span style="
        background-color: ${STATUS_COLORS[entity.status] || "#9ca3af"};
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 10px;
        margin-left: 8px;
      ">${entity.status}</span>
    ` : "";

    const feedstockBadge = entity.feedstockCategory ? `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background-color: ${FEEDSTOCK_COLORS[entity.feedstockCategory] || "#9ca3af"}20;
        border: 1px solid ${FEEDSTOCK_COLORS[entity.feedstockCategory] || "#9ca3af"}40;
        color: ${FEEDSTOCK_COLORS[entity.feedstockCategory] || "#9ca3af"};
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 8px;
      ">
        ${entity.feedstockCategory}${entity.feedstockType ? ` - ${entity.feedstockType}` : ""}
      </div>
    ` : "";

    let specificContent = "";

    switch (type) {
      case "projects":
      case "intentions":
        specificContent = `
          ${entity.projectedVolumeTonnes ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Volume:</span>
              <span style="font-weight: 500;">${entity.projectedVolumeTonnes.toLocaleString()} tonnes</span>
            </div>
          ` : ""}
          ${entity.askingPricePerTonne ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Asking Price:</span>
              <span style="font-weight: 600; color: #059669;">$${entity.askingPricePerTonne}/t</span>
            </div>
          ` : ""}
          ${entity.availableFromDate ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Available From:</span>
              <span style="font-weight: 500;">${new Date(entity.availableFromDate).toLocaleDateString("en-AU")}</span>
            </div>
          ` : ""}
        `;
        break;

      case "demandSignals":
        specificContent = `
          ${entity.volumeTonnesMin || entity.volumeTonnesMax ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Volume Range:</span>
              <span style="font-weight: 500;">${entity.volumeTonnesMin?.toLocaleString() || "?"} - ${entity.volumeTonnesMax?.toLocaleString() || "?"} t</span>
            </div>
          ` : ""}
          ${entity.maxPricePerTonne ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Max Price:</span>
              <span style="font-weight: 600; color: #3b82f6;">$${entity.maxPricePerTonne}/t</span>
            </div>
          ` : ""}
          ${entity.deliveryWindowStart ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Delivery Window:</span>
              <span style="font-weight: 500;">${new Date(entity.deliveryWindowStart).toLocaleDateString("en-AU")}</span>
            </div>
          ` : ""}
        `;
        break;

      case "matches":
        specificContent = `
          ${entity.matchScore ? `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                <span style="color: #666;">Match Score</span>
                <span style="font-weight: 600; color: ${entity.matchScore >= 80 ? "#22c55e" : entity.matchScore >= 60 ? "#f59e0b" : "#ef4444"};">${entity.matchScore}%</span>
              </div>
              <div style="background: #e5e7eb; border-radius: 4px; height: 6px; overflow: hidden;">
                <div style="background: ${entity.matchScore >= 80 ? "#22c55e" : entity.matchScore >= 60 ? "#f59e0b" : "#ef4444"}; width: ${entity.matchScore}%; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>
          ` : ""}
          ${entity.suggestedPrice ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Suggested Price:</span>
              <span style="font-weight: 600; color: #8b5cf6;">$${entity.suggestedPrice}/t</span>
            </div>
          ` : ""}
        `;
        break;

      case "contracts":
        specificContent = `
          ${entity.agreedPricePerTonne ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Contract Price:</span>
              <span style="font-weight: 600; color: #059669;">$${entity.agreedPricePerTonne}/t</span>
            </div>
          ` : ""}
          ${entity.totalVolumeTonnes ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Total Volume:</span>
              <span style="font-weight: 500;">${entity.totalVolumeTonnes.toLocaleString()} tonnes</span>
            </div>
          ` : ""}
          ${entity.deliveredVolumeTonnes !== undefined ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Delivered:</span>
              <span style="font-weight: 500;">${entity.deliveredVolumeTonnes.toLocaleString()} / ${entity.totalVolumeTonnes?.toLocaleString() || "?"} t</span>
            </div>
          ` : ""}
        `;
        break;

      case "deliveries":
        specificContent = `
          ${entity.volumeTonnes ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Volume:</span>
              <span style="font-weight: 500;">${entity.volumeTonnes.toLocaleString()} tonnes</span>
            </div>
          ` : ""}
          ${entity.scheduledDate ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Scheduled:</span>
              <span style="font-weight: 500;">${new Date(entity.scheduledDate).toLocaleDateString("en-AU")}</span>
            </div>
          ` : ""}
          ${entity.transportMode ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Transport:</span>
              <span style="font-weight: 500;">${entity.transportMode}</span>
            </div>
          ` : ""}
        `;
        break;

      case "logisticsHubs":
        specificContent = `
          ${entity.hubType ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Type:</span>
              <span style="font-weight: 500;">${entity.hubType}</span>
            </div>
          ` : ""}
          ${entity.capacityTonnesPerDay ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Capacity:</span>
              <span style="font-weight: 500;">${entity.capacityTonnesPerDay.toLocaleString()} t/day</span>
            </div>
          ` : ""}
          ${entity.handlingCostPerTonne ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Handling Cost:</span>
              <span style="font-weight: 500;">$${entity.handlingCostPerTonne}/t</span>
            </div>
          ` : ""}
        `;
        break;

      case "powerStations":
        specificContent = `
          ${entity.capacityMW ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Capacity:</span>
              <span style="font-weight: 600; color: #dc2626;">${entity.capacityMW} MW</span>
            </div>
          ` : ""}
          ${entity.currentOutputMW !== undefined ? `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                <span style="color: #666;">Current Output</span>
                <span style="font-weight: 600; color: #22c55e;">${entity.currentOutputMW} MW</span>
              </div>
              <div style="background: #e5e7eb; border-radius: 4px; height: 6px; overflow: hidden;">
                <div style="background: #22c55e; width: ${(entity.currentOutputMW / entity.capacityMW) * 100}%; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>
          ` : ""}
          ${entity.annualFeedstockTonnes ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Annual Feedstock:</span>
              <span style="font-weight: 500;">${entity.annualFeedstockTonnes.toLocaleString()} t/yr</span>
            </div>
          ` : ""}
        `;
        break;

      default:
        specificContent = "";
    }

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h3 style="margin: 0; font-weight: 600; font-size: 14px; color: #1a1a1a; flex: 1;">
            ${entity.name || entity.id || "Unknown"}
          </h3>
          ${statusBadge}
        </div>

        ${feedstockBadge}

        <div style="display: grid; gap: 3px; font-size: 11px;">
          ${entity.region || entity.state ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Location:</span>
              <span style="font-weight: 500;">${entity.region || entity.state}</span>
            </div>
          ` : ""}
          ${specificContent}
        </div>

        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; text-align: center;">
          <button onclick="window.dispatchEvent(new CustomEvent('map-entity-details', { detail: { type: '${type}', id: '${entity.id}' } }))" style="
            display: inline-block;
            padding: 4px 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
          ">View Details</button>
        </div>
      </div>
    `;
  }, []);

  // Handle entity click from popup button
  useEffect(() => {
    const handleEntityDetails = (event: CustomEvent) => {
      const { type, id } = event.detail;
      const data = mapData?.[type as keyof typeof mapData];
      if (Array.isArray(data)) {
        const entity = data.find((e: any) => e.id === id || e.id === Number(id));
        if (entity) {
          const mapEntity: MapEntity = {
            type: type as MapLayerType,
            id: entity.id,
            name: entity.name || entity.id,
            latitude: entity.latitude || entity.lat,
            longitude: entity.longitude || entity.lng || entity.lon,
            data: entity,
          };
          setSelectedEntity(mapEntity);
          onEntityClick?.(mapEntity);
        }
      }
    };

    window.addEventListener("map-entity-details" as any, handleEntityDetails);
    return () => window.removeEventListener("map-entity-details" as any, handleEntityDetails);
  }, [mapData, onEntityClick]);

  // Render markers for a specific layer
  const renderLayerMarkers = useCallback((type: MapLayerType, entities: any[]) => {
    if (!mapRef.current || !isReady) return;

    const map = mapRef.current;

    // Clear existing markers for this layer
    markersRef.current[type].forEach(layer => layer.remove());
    markersRef.current[type] = [];

    if (!activeLayers.includes(type)) return;

    entities.forEach(entity => {
      const lat = entity.latitude || entity.lat;
      const lng = entity.longitude || entity.lng || entity.lon;

      if (!lat || !lng) return;

      const icon = createMarkerIcon(type, entity);
      const marker = L.marker([lat, lng], { icon });

      marker.bindPopup(createPopupContent(type, entity), {
        maxWidth: 300,
        className: `market-intel-popup ${type}-popup`,
      });

      marker.on("mouseover", () => {
        const mapEntity: MapEntity = {
          type,
          id: entity.id,
          name: entity.name || entity.id,
          latitude: lat,
          longitude: lng,
          data: entity,
        };
        setHoveredEntity(mapEntity);
        onEntityHover?.(mapEntity);
      });

      marker.on("mouseout", () => {
        setHoveredEntity(null);
        onEntityHover?.(null);
      });

      marker.on("click", () => {
        const mapEntity: MapEntity = {
          type,
          id: entity.id,
          name: entity.name || entity.id,
          latitude: lat,
          longitude: lng,
          data: entity,
        };
        setSelectedEntity(mapEntity);
        onEntityClick?.(mapEntity);
      });

      marker.addTo(map);
      markersRef.current[type].push(marker);
    });
  }, [isReady, activeLayers, createMarkerIcon, createPopupContent, onEntityClick, onEntityHover]);

  // Render price heatmap
  const renderPriceHeatmap = useCallback((priceSignals: any[]) => {
    if (!mapRef.current || !isReady || !activeLayers.includes("priceHeatmap")) return;

    const map = mapRef.current;

    // Clear existing heatmap layers
    markersRef.current.priceHeatmap.forEach(layer => layer.remove());
    markersRef.current.priceHeatmap = [];

    // Group by region for heatmap circles
    const regionPrices: Record<string, { lat: number; lng: number; prices: number[]; volume: number }> = {};

    priceSignals.forEach(signal => {
      if (!signal.latitude || !signal.longitude) return;

      const key = `${signal.regionId || signal.region}`;
      if (!regionPrices[key]) {
        regionPrices[key] = {
          lat: signal.latitude,
          lng: signal.longitude,
          prices: [],
          volume: 0,
        };
      }
      if (signal.spotPrice) {
        regionPrices[key].prices.push(signal.spotPrice);
      }
      regionPrices[key].volume += signal.volumeTonnes || 0;
    });

    // Find price range for color scaling
    const allPrices = Object.values(regionPrices).flatMap(r => r.prices);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    Object.entries(regionPrices).forEach(([region, data]) => {
      if (data.prices.length === 0) return;

      const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
      const normalizedPrice = (avgPrice - minPrice) / priceRange;

      // Color gradient from green (low) to red (high)
      const hue = (1 - normalizedPrice) * 120; // 120 = green, 0 = red
      const color = `hsl(${hue}, 70%, 50%)`;

      const radius = Math.max(30000, Math.min(100000, data.volume * 10)); // Scale by volume

      const circle = L.circle([data.lat, data.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2,
      });

      circle.bindPopup(`
        <div style="font-family: system-ui; font-size: 12px;">
          <strong>${region}</strong><br/>
          Avg Price: <strong>$${avgPrice.toFixed(2)}/t</strong><br/>
          Volume: ${data.volume.toLocaleString()} tonnes
        </div>
      `);

      circle.addTo(map);
      markersRef.current.priceHeatmap.push(circle);
    });
  }, [isReady, activeLayers]);

  // Render transport routes
  const renderTransportRoutes = useCallback((routes: any[]) => {
    if (!mapRef.current || !isReady || !activeLayers.includes("transportRoutes")) return;

    const map = mapRef.current;

    // Clear existing route layers
    markersRef.current.transportRoutes.forEach(layer => layer.remove());
    markersRef.current.transportRoutes = [];

    routes.forEach(route => {
      if (!route.originLat || !route.originLng || !route.destLat || !route.destLng) return;

      const color = route.transportMode === "RAIL" ? "#1e40af" :
                   route.transportMode === "SHIP" ? "#0891b2" : "#6b7280";

      const polyline = L.polyline(
        [[route.originLat, route.originLng], [route.destLat, route.destLng]],
        {
          color,
          weight: 3,
          opacity: 0.7,
          dashArray: route.transportMode === "RAIL" ? "10, 5" : undefined,
        }
      );

      polyline.bindPopup(`
        <div style="font-family: system-ui; font-size: 12px;">
          <strong>${route.transportMode}</strong><br/>
          Distance: ${route.distanceKm?.toFixed(0)} km<br/>
          Cost: $${route.totalCost?.toFixed(2)}/t
        </div>
      `);

      polyline.addTo(map);
      markersRef.current.transportRoutes.push(polyline);
    });
  }, [isReady, activeLayers]);

  // Update markers when map data changes
  useEffect(() => {
    if (!mapData || !isReady) return;

    // Render each layer type
    if (mapData.projects) renderLayerMarkers("projects", mapData.projects);
    if (mapData.intentions) renderLayerMarkers("intentions", mapData.intentions);
    if (mapData.demandSignals) renderLayerMarkers("demandSignals", mapData.demandSignals);
    if (mapData.matches) renderLayerMarkers("matches", mapData.matches);
    if (mapData.contracts) renderLayerMarkers("contracts", mapData.contracts);
    if (mapData.deliveries) renderLayerMarkers("deliveries", mapData.deliveries);
    if (mapData.logisticsHubs) renderLayerMarkers("logisticsHubs", mapData.logisticsHubs);
    if (mapData.powerStations) renderLayerMarkers("powerStations", mapData.powerStations);

    // Render special layers
    if (mapData.priceSignals) renderPriceHeatmap(mapData.priceSignals);
    if (mapData.transportRoutes) renderTransportRoutes(mapData.transportRoutes);
  }, [mapData, isReady, activeLayers, renderLayerMarkers, renderPriceHeatmap, renderTransportRoutes]);

  // Update center and zoom
  useEffect(() => {
    if (!mapRef.current || !isReady) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom, isReady]);

  // Toggle layer visibility
  const toggleLayer = (layerId: MapLayerType) => {
    setActiveLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(l => l !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[600px] rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />

      {/* Layer Control Panel */}
      {showLayerControl && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Map Layers</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {LAYER_CONFIGS.filter(l => availableLayers.includes(l.id)).map(layer => (
              <label
                key={layer.id}
                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={activeLayers.includes(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                  className="rounded text-blue-600"
                />
                <span className="text-base">{layer.icon}</span>
                <span className="text-gray-700">{layer.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Market Summary Bar */}
      {showMarketSummary && marketIntel && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {marketIntel.totalProjectedSupply?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-500">Supply (tonnes)</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {marketIntel.totalDemand?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-500">Demand (tonnes)</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                ${marketIntel.avgSpotPrice?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-500">Avg Price/t</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">
                {marketIntel.recentContractCount || 0}
              </div>
              <div className="text-xs text-gray-500">Active Contracts</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-600">
                {marketIntel.recentMatchCount || 0}
              </div>
              <div className="text-xs text-gray-500">Pending Matches</div>
            </div>
          </div>
        </div>
      )}

      {/* Entity Detail Panel */}
      {showDetailPanel && selectedEntity && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-[1000] max-h-[80%] overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-lg mr-2">
                {LAYER_CONFIGS.find(l => l.id === selectedEntity.type)?.icon}
              </span>
              <h3 className="font-semibold text-gray-800 inline">
                {selectedEntity.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {selectedEntity.data.status && (
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span
                  className="px-2 py-0.5 rounded text-white text-xs font-medium"
                  style={{ backgroundColor: STATUS_COLORS[selectedEntity.data.status] || "#9ca3af" }}
                >
                  {selectedEntity.data.status}
                </span>
              </div>
            )}

            {selectedEntity.data.feedstockCategory && (
              <div className="flex justify-between">
                <span className="text-gray-500">Feedstock:</span>
                <span className="font-medium">{selectedEntity.data.feedstockCategory}</span>
              </div>
            )}

            {selectedEntity.data.projectedVolumeTonnes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Volume:</span>
                <span className="font-medium">
                  {selectedEntity.data.projectedVolumeTonnes.toLocaleString()} t
                </span>
              </div>
            )}

            {selectedEntity.data.askingPricePerTonne && (
              <div className="flex justify-between">
                <span className="text-gray-500">Price:</span>
                <span className="font-medium text-green-600">
                  ${selectedEntity.data.askingPricePerTonne}/t
                </span>
              </div>
            )}

            {selectedEntity.data.region && (
              <div className="flex justify-between">
                <span className="text-gray-500">Region:</span>
                <span className="font-medium">{selectedEntity.data.region}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t flex gap-2">
            <button
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              onClick={() => {
                // Navigate to entity details page
                window.location.href = `/${selectedEntity.type}/${selectedEntity.id}`;
              }}
            >
              View Full Details
            </button>
            {(selectedEntity.type === "projects" || selectedEntity.type === "intentions") && userRole === "buyer" && (
              <button
                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                onClick={() => {
                  // Trigger express interest action
                  window.dispatchEvent(new CustomEvent("express-interest", { detail: selectedEntity }));
                }}
              >
                Express Interest
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1001]">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600">Loading market data...</span>
          </div>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .market-intel-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        .market-intel-popup .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
}

// Note: LAYER_CONFIGS and FEEDSTOCK_COLORS are exported inline at definition
