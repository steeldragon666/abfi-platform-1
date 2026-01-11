/**
 * Market Intelligence Map - Nextgen Design
 *
 * Features:
 * - Geographic market analysis
 * - Supply/demand visualization
 * - Price signal mapping
 * - Typography components for consistent styling
 */

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Filter,
  MapPin,
  Factory,
  Truck,
  DollarSign,
  FileText,
  Wheat,
  BarChart3,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Australia center
const AUSTRALIA_CENTER: L.LatLngTuple = [-25.2744, 133.7751];
const DEFAULT_ZOOM = 5;

// Layer configuration
interface MapLayer {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  visibleToRoles: string[];
  defaultVisible: boolean;
}

const LAYERS: MapLayer[] = [
  {
    id: "intentions",
    name: "Growing Intentions",
    icon: <Wheat className="h-4 w-4" />,
    color: "#22c55e",
    visibleToRoles: ["supplier", "buyer", "admin", "user"],
    defaultVisible: true,
  },
  {
    id: "powerStations",
    name: "Power Stations",
    icon: <Factory className="h-4 w-4" />,
    color: "#3b82f6",
    visibleToRoles: ["supplier", "buyer", "admin", "user"],
    defaultVisible: true,
  },
  {
    id: "logistics",
    name: "Logistics Hubs",
    icon: <Truck className="h-4 w-4" />,
    color: "#8b5cf6",
    visibleToRoles: ["supplier", "buyer", "admin", "user"],
    defaultVisible: false,
  },
  {
    id: "contracts",
    name: "Active Contracts",
    icon: <FileText className="h-4 w-4" />,
    color: "#f59e0b",
    visibleToRoles: ["admin"],
    defaultVisible: false,
  },
  {
    id: "prices",
    name: "Price Signals",
    icon: <DollarSign className="h-4 w-4" />,
    color: "#ef4444",
    visibleToRoles: ["supplier", "buyer", "admin", "user"],
    defaultVisible: false,
  },
];

// Status colors
const STATUS_COLORS = {
  operational: "#22c55e",
  development: "#3b82f6",
  planned: "#f59e0b",
  active: "#22c55e",
  cancelled: "#ef4444",
  harvested: "#6b7280",
};

const COMMITMENT_COLORS = {
  planning: "#f59e0b",
  confirmed: "#22c55e",
  under_contract: "#3b82f6",
};

export default function MarketIntelligenceMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<string[]>(
    LAYERS.filter(l => l.defaultVisible).map(l => l.id)
  );
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [viewport, setViewport] = useState({
    minLat: -45,
    maxLat: -10,
    minLng: 110,
    maxLng: 155,
  });

  // Layer references for cleanup
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const powerStationsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const logisticsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const intentionsLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // Fetch market data
  const { data: marketData, isLoading, refetch } = trpc.unifiedMap.getMapData.useQuery(
    {
      layers: visibleLayers.length > 0 ? visibleLayers : ["all"],
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      enabled: isMapReady,
    }
  );

  // Fetch market summary
  const { data: marketSummary } = trpc.unifiedMap.getMarketIntelligence.useQuery({}, {
    enabled: isMapReady,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: AUSTRALIA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add scale control
    L.control.scale({ imperial: false, metric: true }).addTo(map);

    // Add layer groups
    markersRef.current.addTo(map);
    powerStationsLayerRef.current.addTo(map);
    logisticsLayerRef.current.addTo(map);
    intentionsLayerRef.current.addTo(map);

    // Update viewport on move
    map.on("moveend", () => {
      const bounds = map.getBounds();
      setViewport({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    });

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers when data changes
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !marketData) return;

    // Clear existing markers
    powerStationsLayerRef.current.clearLayers();
    logisticsLayerRef.current.clearLayers();
    intentionsLayerRef.current.clearLayers();

    // Add power stations
    if (visibleLayers.includes("powerStations") && marketData.powerStations) {
      marketData.powerStations.forEach((station: any) => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const statusColor = STATUS_COLORS[station.status as keyof typeof STATUS_COLORS] || "#6b7280";

        const icon = L.divIcon({
          className: "custom-power-station-marker",
          html: `
            <div style="
              width: 28px;
              height: 28px;
              background-color: ${statusColor};
              border: 3px solid white;
              border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="font-size: 14px;">⚡</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon });

        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 200px;">
            <h3 style="margin: 0 0 8px; font-weight: 600;">${station.name}</h3>
            <div style="font-size: 12px; color: #666;">
              <div><strong>Type:</strong> ${station.type}</div>
              <div><strong>Capacity:</strong> ${station.capacityMw || "N/A"} MW</div>
              <div><strong>Status:</strong> ${station.status}</div>
              ${station.ownerName ? `<div><strong>Owner:</strong> ${station.ownerName}</div>` : ""}
            </div>
          </div>
        `);

        marker.on("click", () => setSelectedEntity({ type: "powerStation", data: station }));
        marker.addTo(powerStationsLayerRef.current);
      });
    }

    // Add logistics hubs
    if (visibleLayers.includes("logistics") && marketData.logisticsHubs) {
      marketData.logisticsHubs.forEach((hub: any) => {
        const lat = parseFloat(hub.latitude);
        const lng = parseFloat(hub.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const icon = L.divIcon({
          className: "custom-logistics-marker",
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #8b5cf6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="font-size: 12px;">🚚</span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon });

        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 180px;">
            <h3 style="margin: 0 0 8px; font-weight: 600;">${hub.name}</h3>
            <div style="font-size: 12px; color: #666;">
              <div><strong>Type:</strong> ${hub.type}</div>
              ${hub.handlingCapacity ? `<div><strong>Capacity:</strong> ${hub.handlingCapacity} t/yr</div>` : ""}
            </div>
          </div>
        `);

        marker.on("click", () => setSelectedEntity({ type: "logisticsHub", data: hub }));
        marker.addTo(logisticsLayerRef.current);
      });
    }

    // Add growing intentions
    if (visibleLayers.includes("intentions") && marketData.intentions) {
      marketData.intentions.forEach((intention: any) => {
        const lat = parseFloat(intention.latitude);
        const lng = parseFloat(intention.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const commitmentColor =
          COMMITMENT_COLORS[intention.commitmentLevel as keyof typeof COMMITMENT_COLORS] || "#6b7280";

        const icon = L.divIcon({
          className: "custom-intention-marker",
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: ${commitmentColor};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([lat, lng], { icon });

        // Add catchment circle
        const circle = L.circle([lat, lng], {
          radius: 25000, // 25km radius
          color: commitmentColor,
          fillColor: commitmentColor,
          fillOpacity: 0.1,
          weight: 1,
          dashArray: "5, 5",
        });

        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 180px;">
            <h3 style="margin: 0 0 8px; font-weight: 600;">Growing Intention</h3>
            <div style="font-size: 12px; color: #666;">
              <div><strong>Feedstock:</strong> ${intention.feedstockTypeId}</div>
              <div><strong>Area:</strong> ${intention.areaHa} ha</div>
              <div><strong>Expected Yield:</strong> ${intention.expectedYield || "N/A"} t</div>
              <div><strong>Harvest:</strong> ${intention.expectedHarvestDate ? new Date(intention.expectedHarvestDate).toLocaleDateString() : "N/A"}</div>
              <div><strong>Commitment:</strong> ${intention.commitmentLevel}</div>
            </div>
          </div>
        `);

        marker.on("click", () => setSelectedEntity({ type: "intention", data: intention }));
        marker.addTo(intentionsLayerRef.current);
        circle.addTo(intentionsLayerRef.current);
      });
    }
  }, [isMapReady, marketData, visibleLayers]);

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setVisibleLayers(prev =>
      prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId]
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold">Market Intelligence Map</h1>
          <p className="text-muted-foreground text-sm">
            View market data with role-based visibility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>

          {/* Layer Control */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Layers className="h-4 w-4 mr-2" />
                Layers ({visibleLayers.length})
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Map Layers</SheetTitle>
                <SheetDescription>Toggle visibility of data layers</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {LAYERS.map(layer => (
                  <div key={layer.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={layer.id}
                      checked={visibleLayers.includes(layer.id)}
                      onCheckedChange={() => toggleLayer(layer.id)}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <Label htmlFor={layer.id} className="flex items-center gap-2 cursor-pointer">
                      {layer.icon}
                      {layer.name}
                    </Label>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading market data...</span>
            </div>
          )}

          {/* Market Summary Card */}
          {marketSummary && (
            <Card className="absolute bottom-4 left-4 w-80 shadow-lg">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Market Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Growing Intentions</div>
                    <div className="font-semibold">{marketData?.intentions?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {marketSummary?.totalProjectedSupply?.toLocaleString() || 0} tonnes
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Power Stations</div>
                    <div className="font-semibold">
                      {marketData?.powerStations?.length || 0} active
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {marketData?.powerStations?.reduce((acc: number, ps: any) => acc + (ps.capacityMW || 0), 0).toLocaleString() || 0} MW
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Logistics Hubs</div>
                    <div className="font-semibold">{marketData?.logisticsHubs?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Active Contracts</div>
                    <div className="font-semibold">{marketData?.contracts?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      ${marketData?.contracts?.reduce((acc: number, c: any) => acc + (c.totalValue || 0), 0).toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card className="absolute top-4 right-4 w-48 shadow-lg">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium">Legend</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-2">
              <div className="text-xs font-medium mb-1">Commitment Level</div>
              {Object.entries(COMMITMENT_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{key.replace("_", " ")}</span>
                </div>
              ))}
              <div className="text-xs font-medium mb-1 mt-3">Station Status</div>
              {Object.entries(STATUS_COLORS).slice(0, 3).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{key}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Selected Entity Panel */}
        {selectedEntity && (
          <div className="w-80 border-l bg-background overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {selectedEntity.type === "powerStation" && "Power Station"}
                  {selectedEntity.type === "logisticsHub" && "Logistics Hub"}
                  {selectedEntity.type === "intention" && "Growing Intention"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntity(null)}
                >
                  &times;
                </Button>
              </div>

              {selectedEntity.type === "powerStation" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedEntity.data.name}</h4>
                    <Badge variant="outline" className="mt-1">
                      {selectedEntity.data.type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Capacity</div>
                      <div className="font-medium">
                        {selectedEntity.data.capacityMw || "N/A"} MW
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Status</div>
                      <div className="font-medium capitalize">
                        {selectedEntity.data.status}
                      </div>
                    </div>
                  </div>
                  {selectedEntity.data.feedstockRequirements && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">
                        Feedstock Requirements
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntity.data.feedstockRequirements.map((f: string) => (
                          <Badge key={f} variant="secondary" className="text-xs">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedEntity.type === "logisticsHub" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedEntity.data.name}</h4>
                    <Badge variant="outline" className="mt-1">
                      {selectedEntity.data.type}
                    </Badge>
                  </div>
                  {selectedEntity.data.handlingCapacity && (
                    <div>
                      <div className="text-muted-foreground text-xs">Handling Capacity</div>
                      <div className="font-medium">
                        {parseFloat(selectedEntity.data.handlingCapacity).toLocaleString()} t/yr
                      </div>
                    </div>
                  )}
                  {selectedEntity.data.feedstockTypes && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">
                        Feedstock Types
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntity.data.feedstockTypes.map((f: string) => (
                          <Badge key={f} variant="secondary" className="text-xs">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedEntity.type === "intention" && (
                <div className="space-y-3">
                  <div>
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor:
                          COMMITMENT_COLORS[
                            selectedEntity.data.commitmentLevel as keyof typeof COMMITMENT_COLORS
                          ],
                      }}
                    >
                      {selectedEntity.data.commitmentLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Feedstock</div>
                      <div className="font-medium">{selectedEntity.data.feedstockTypeId}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Area</div>
                      <div className="font-medium">{selectedEntity.data.areaHa} ha</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Expected Yield</div>
                      <div className="font-medium">
                        {selectedEntity.data.expectedYield
                          ? `${parseFloat(selectedEntity.data.expectedYield).toLocaleString()} t`
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Harvest Date</div>
                      <div className="font-medium">
                        {selectedEntity.data.expectedHarvestDate
                          ? new Date(selectedEntity.data.expectedHarvestDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">
                    <ChevronRight className="h-4 w-4 mr-2" />
                    View Matches
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
