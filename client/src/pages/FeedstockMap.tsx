"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, Polygon, MarkerClusterer } from "@react-google-maps/api";
import { useProxyMapLoader } from "@/hooks/useProxyMapLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Search, Download, Target, Save, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { analyzeRadius, type AnalysisResults } from "@/lib/radiusAnalysis";
import { exportAsGeoJSON, exportAsCSV } from "@/lib/mapExport";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

// Google Maps API Key loaded via proxy (useProxyMapLoader hook)

// Map container style
const containerStyle = {
  width: "100%",
  height: "600px",
};

// Australia center
const defaultCenter = {
  lat: -25.2744,
  lng: 133.7751,
};

interface LayerConfig {
  id: string;
  name: string;
  type: "marker" | "polygon";
  source: string;
  color: string;
  visible: boolean;
}

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

export default function FeedstockMap() {
  // Load Google Maps via Forge proxy instead of direct API key
  const { isLoaded, loadError } = useProxyMapLoader();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>(["QLD", "NSW", "VIC", "SA", "WA", "TAS"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedAnalysisName, setSavedAnalysisName] = useState("");
  const [savedAnalysisDescription, setSavedAnalysisDescription] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<GeoJSONFeature | null>(null);
  const [radiusCircle, setRadiusCircle] = useState<google.maps.Circle | null>(null);

  // GeoJSON data storage
  const [layerData, setLayerData] = useState<Record<string, GeoJSONData>>({});

  // Fetch saved analyses
  const { data: savedAnalyses, refetch: refetchSavedAnalyses } = trpc.savedAnalyses.list.useQuery();
  const deleteAnalysisMutation = trpc.savedAnalyses.delete.useMutation({
    onSuccess: () => {
      refetchSavedAnalyses();
    },
  });

  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: "sugar-mills", name: "Sugar Mills", type: "marker", source: "/geojson/sugar_mills.json", color: "#8B4513", visible: true },
    { id: "grain-regions", name: "Grain Regions", type: "polygon", source: "/geojson/grain_regions.json", color: "#DAA520", visible: true },
    { id: "forestry-regions", name: "Forestry Regions", type: "polygon", source: "/geojson/forestry_regions.json", color: "#228B22", visible: false },
    { id: "biogas-facilities", name: "Biogas Facilities", type: "marker", source: "/geojson/biogas_facilities.json", color: "#FF6347", visible: false },
    { id: "biofuel-plants", name: "Biofuel Plants", type: "marker", source: "/geojson/biofuel_plants.json", color: "#4169E1", visible: false },
    { id: "transport-ports", name: "Ports & Transport", type: "marker", source: "/geojson/transport_infrastructure.json", color: "#9370DB", visible: false },
  ]);

  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    "sugar-mills": 100,
    "grain-regions": 30,
    "forestry-regions": 30,
    "biogas-facilities": 100,
    "biofuel-plants": 100,
    "transport-ports": 100,
  });

  // Capacity filters
  const [sugarMillCapacity, setSugarMillCapacity] = useState<[number, number]>([0, 4000000]);
  const [biogasCapacity, setBiogasCapacity] = useState<[number, number]>([0, 50]);
  const [biofuelCapacity, setBiofuelCapacity] = useState<[number, number]>([0, 500]);
  const [portThroughput, setPortThroughput] = useState<[number, number]>([0, 200]);

  // Load GeoJSON data on mount
  useEffect(() => {
    const loadData = async () => {
      const data: Record<string, GeoJSONData> = {};
      for (const layer of layers) {
        try {
          const response = await fetch(layer.source);
          const geojson = await response.json();
          data[layer.id] = geojson;
        } catch (error) {
          console.error(`Failed to load ${layer.id}:`, error);
        }
      }
      setLayerData(data);
    };
    loadData();
  }, []);

  // Map load callback
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayers(layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)));
  };

  // Update layer opacity
  const updateOpacity = (layerId: string, opacity: number) => {
    setLayerOpacity({ ...layerOpacity, [layerId]: opacity });
  };

  // Filter features by state
  const filterByState = (feature: GeoJSONFeature): boolean => {
    const state = feature.properties?.state || feature.properties?.STATE;
    if (!state) return true;
    return selectedStates.includes(state);
  };

  // Get marker positions from GeoJSON
  const getMarkerPositions = (layerId: string): { position: google.maps.LatLngLiteral; feature: GeoJSONFeature }[] => {
    const data = layerData[layerId];
    if (!data) return [];

    return data.features
      .filter(filterByState)
      .filter((feature) => feature.geometry.type === "Point")
      .map((feature) => ({
        position: {
          lat: (feature.geometry.coordinates as number[])[1],
          lng: (feature.geometry.coordinates as number[])[0],
        },
        feature,
      }));
  };

  // Get polygon paths from GeoJSON
  const getPolygonPaths = (layerId: string): { paths: google.maps.LatLngLiteral[][]; feature: GeoJSONFeature }[] => {
    const data = layerData[layerId];
    if (!data) return [];

    return data.features
      .filter(filterByState)
      .filter((feature) => feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
      .map((feature) => {
        let paths: google.maps.LatLngLiteral[][] = [];

        if (feature.geometry.type === "Polygon") {
          const coords = feature.geometry.coordinates as number[][][];
          paths = coords.map((ring) =>
            ring.map((coord) => ({ lat: coord[1], lng: coord[0] }))
          );
        } else if (feature.geometry.type === "MultiPolygon") {
          const coords = feature.geometry.coordinates as unknown as number[][][][];
          coords.forEach((polygon) => {
            polygon.forEach((ring) => {
              paths.push(ring.map((coord) => ({ lat: coord[1], lng: coord[0] })));
            });
          });
        }

        return { paths, feature };
      });
  };

  // Create popup content
  const createPopupContent = (layerId: string, properties: Record<string, any>): string => {
    switch (layerId) {
      case "sugar-mills":
        return `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px; font-weight: bold;">${properties.name || "Sugar Mill"}</h3>
            <p style="margin: 4px 0;"><strong>Owner:</strong> ${properties.owner || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Capacity:</strong> ${(properties.crushing_capacity_tonnes || 0).toLocaleString()} tonnes</p>
            <p style="margin: 4px 0;"><strong>State:</strong> ${properties.state || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Bagasse Available:</strong> ${(properties.bagasse_tonnes_available || 0).toLocaleString()} tonnes</p>
          </div>
        `;
      case "biogas-facilities":
        return `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px; font-weight: bold;">${properties.name || "Biogas Facility"}</h3>
            <p style="margin: 4px 0;"><strong>Capacity:</strong> ${properties.capacity_mw || "N/A"} MW</p>
            <p style="margin: 4px 0;"><strong>Feedstock:</strong> ${properties.feedstock_type || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>State:</strong> ${properties.state || "N/A"}</p>
          </div>
        `;
      case "biofuel-plants":
        return `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px; font-weight: bold;">${properties.name || "Biofuel Plant"}</h3>
            <p style="margin: 4px 0;"><strong>Type:</strong> ${properties.fuel_type || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Capacity:</strong> ${properties.capacity_ml_year || "N/A"} ML/year</p>
            <p style="margin: 4px 0;"><strong>State:</strong> ${properties.state || "N/A"}</p>
          </div>
        `;
      case "transport-ports":
        return `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px; font-weight: bold;">${properties.name || "Port"}</h3>
            <p style="margin: 4px 0;"><strong>Type:</strong> ${properties.type || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Throughput:</strong> ${properties.throughput_mt || "N/A"} MT/year</p>
            <p style="margin: 4px 0;"><strong>State:</strong> ${properties.state || "N/A"}</p>
          </div>
        `;
      case "grain-regions":
      case "forestry-regions":
        return `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px; font-weight: bold;">${properties.name || properties.REGION_NAME || "Region"}</h3>
            <p style="margin: 4px 0;"><strong>State:</strong> ${properties.state || properties.STATE || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Area:</strong> ${(properties.area_ha || properties.AREA_HA || 0).toLocaleString()} ha</p>
          </div>
        `;
      default:
        return `<div style="padding: 8px;">${JSON.stringify(properties, null, 2)}</div>`;
    }
  };

  // Draw radius and analyze
  const drawRadius = async () => {
    if (!mapRef.current) return;

    const center = mapRef.current.getCenter();
    if (!center) return;

    const centerPos = { lat: center.lat(), lng: center.lng() };
    setRadiusCenter(centerPos);
    setIsAnalyzing(true);

    // Remove existing circle
    if (radiusCircle) {
      radiusCircle.setMap(null);
    }

    // Create new circle
    const circle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.1,
      map: mapRef.current,
      center: centerPos,
      radius: radiusKm * 1000, // Convert km to meters
    });

    setRadiusCircle(circle);

    // Run analysis
    try {
      const results = await analyzeRadius(centerPos.lat, centerPos.lng, radiusKm);
      setAnalysisResults(results);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear radius
  const clearRadius = () => {
    if (radiusCircle) {
      radiusCircle.setMap(null);
      setRadiusCircle(null);
    }
    setRadiusCenter(null);
    setAnalysisResults(null);
  };

  // Export handlers
  const handleExportGeoJSON = async () => {
    setIsExporting(true);
    try {
      const visibleLayers = layers.filter((l) => l.visible).map((l) => l.id);
      const count = await exportAsGeoJSON({
        layers: visibleLayers,
        stateFilter: selectedStates,
        capacityRanges: {
          "sugar-mills": { min: sugarMillCapacity[0], max: sugarMillCapacity[1] },
          "biogas-facilities": { min: biogasCapacity[0], max: biogasCapacity[1] },
          "biofuel-plants": { min: biofuelCapacity[0], max: biofuelCapacity[1] },
          "transport-infrastructure": { min: portThroughput[0], max: portThroughput[1] },
        },
      });
      alert(`Exported ${count} facilities as GeoJSON`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const visibleLayers = layers.filter((l) => l.visible).map((l) => l.id);
      const count = await exportAsCSV({
        layers: visibleLayers,
        stateFilter: selectedStates,
        capacityRanges: {
          "sugar-mills": { min: sugarMillCapacity[0], max: sugarMillCapacity[1] },
          "biogas-facilities": { min: biogasCapacity[0], max: biogasCapacity[1] },
          "biofuel-plants": { min: biofuelCapacity[0], max: biofuelCapacity[1] },
          "transport-infrastructure": { min: portThroughput[0], max: portThroughput[1] },
        },
      });
      alert(`Exported ${count} facilities as CSV`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Save analysis mutation
  const saveAnalysisMutation = trpc.savedAnalyses.save.useMutation({
    onSuccess: () => {
      alert("Analysis saved successfully!");
      setShowSaveDialog(false);
      setSavedAnalysisName("");
      setSavedAnalysisDescription("");
      refetchSavedAnalyses();
    },
    onError: (error) => {
      alert(`Failed to save analysis: ${error.message}`);
    },
  });

  // Handle save analysis
  const handleSaveAnalysis = async () => {
    if (!analysisResults || !radiusCenter) {
      alert("Please run a radius analysis first.");
      return;
    }

    if (!savedAnalysisName.trim()) {
      alert("Please enter a name for this analysis.");
      return;
    }

    saveAnalysisMutation.mutate({
      name: savedAnalysisName,
      description: savedAnalysisDescription || undefined,
      radiusKm,
      centerLat: radiusCenter.lat.toString(),
      centerLng: radiusCenter.lng.toString(),
      results: analysisResults,
      filterState: {
        selectedStates,
        visibleLayers: layers.filter((l) => l.visible).map((l) => l.id),
        capacityRanges: {
          "sugar-mills": { min: sugarMillCapacity[0], max: sugarMillCapacity[1] },
          "biogas-facilities": { min: biogasCapacity[0], max: biogasCapacity[1] },
          "biofuel-plants": { min: biofuelCapacity[0], max: biofuelCapacity[1] },
          "transport-infrastructure": { min: portThroughput[0], max: portThroughput[1] },
        } as Record<string, { min: number; max: number }>,
      },
    });
  };

  // Load saved analysis
  const handleLoadAnalysis = (analysis: any) => {
    clearRadius();

    const centerLat = parseFloat(analysis.centerLat);
    const centerLng = parseFloat(analysis.centerLng);

    setRadiusCenter({ lat: centerLat, lng: centerLng });
    setRadiusKm(analysis.radiusKm);
    setAnalysisResults(analysis.results);

    if (analysis.filterState) {
      setSelectedStates(analysis.filterState.selectedStates);
      setLayers((prev) =>
        prev.map((layer) => ({
          ...layer,
          visible: analysis.filterState.visibleLayers.includes(layer.id),
        }))
      );

      const ranges = analysis.filterState.capacityRanges;
      if (ranges["sugar-mills"]) setSugarMillCapacity([ranges["sugar-mills"].min, ranges["sugar-mills"].max]);
      if (ranges["biogas-facilities"]) setBiogasCapacity([ranges["biogas-facilities"].min, ranges["biogas-facilities"].max]);
      if (ranges["biofuel-plants"]) setBiofuelCapacity([ranges["biofuel-plants"].min, ranges["biofuel-plants"].max]);
      if (ranges["transport-infrastructure"]) setPortThroughput([ranges["transport-infrastructure"].min, ranges["transport-infrastructure"].max]);
    }

    // Pan to analysis location
    if (mapRef.current) {
      mapRef.current.panTo({ lat: centerLat, lng: centerLng });
      mapRef.current.setZoom(9);

      // Draw circle
      setTimeout(() => {
        if (mapRef.current) {
          const circle = new google.maps.Circle({
            strokeColor: "#3b82f6",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.1,
            map: mapRef.current,
            center: { lat: centerLat, lng: centerLng },
            radius: analysis.radiusKm * 1000,
          });
          setRadiusCircle(circle);
        }
      }, 500);
    }
  };

  if (loadError) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load Google Maps. Please check your API key.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading map...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Australian Bioenergy Feedstock Map</h1>
        <p className="text-muted-foreground">
          Interactive GIS visualization of feedstock resources, facilities, and infrastructure
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-0">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={4}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                  mapTypeControl: true,
                  streetViewControl: false,
                  fullscreenControl: true,
                }}
              >
                {/* Render polygon layers */}
                {layers
                  .filter((l) => l.visible && l.type === "polygon")
                  .map((layer) =>
                    getPolygonPaths(layer.id).map((item, idx) => (
                      <Polygon
                        key={`${layer.id}-${idx}`}
                        paths={item.paths}
                        options={{
                          fillColor: layer.color,
                          fillOpacity: (layerOpacity[layer.id] || 100) / 100 * 0.3,
                          strokeColor: layer.color,
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                        }}
                        onClick={() => setSelectedMarker(item.feature)}
                      />
                    ))
                  )}

                {/* Render marker layers with clustering */}
                {layers
                  .filter((l) => l.visible && l.type === "marker")
                  .map((layer) => (
                    <MarkerClusterer key={layer.id}>
                      {(clusterer) =>
                        getMarkerPositions(layer.id).map((item, idx) => (
                          <Marker
                            key={`${layer.id}-${idx}`}
                            position={item.position}
                            clusterer={clusterer}
                            icon={{
                              path: google.maps.SymbolPath.CIRCLE,
                              fillColor: layer.color,
                              fillOpacity: (layerOpacity[layer.id] || 100) / 100,
                              strokeColor: "#ffffff",
                              strokeWeight: 2,
                              scale: 8,
                            }}
                            onClick={() => setSelectedMarker(item.feature)}
                          />
                        )) as any
                      }
                    </MarkerClusterer>
                  ))}

                {/* Info Window */}
                {selectedMarker && (
                  <InfoWindow
                    position={
                      selectedMarker.geometry.type === "Point"
                        ? {
                            lat: (selectedMarker.geometry.coordinates as number[])[1],
                            lng: (selectedMarker.geometry.coordinates as number[])[0],
                          }
                        : undefined
                    }
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: createPopupContent(
                          layers.find((l) => l.visible)?.id || "",
                          selectedMarker.properties
                        ),
                      }}
                    />
                  </InfoWindow>
                )}
              </GoogleMap>
            </CardContent>
          </Card>

          {/* Radius Slider */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Analysis Radius</label>
                  <Badge variant="outline">{radiusKm} km</Badge>
                </div>
                <Slider
                  value={[radiusKm]}
                  onValueChange={(value) => setRadiusKm(value[0])}
                  min={10}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 km</span>
                  <span>200 km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Controls */}
          <div className="mt-4 flex gap-2">
            <Button onClick={drawRadius} variant="outline" disabled={isAnalyzing}>
              <Target className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : `Draw ${radiusKm}km Radius`}
            </Button>
            {radiusCenter && (
              <Button onClick={clearRadius} variant="outline">
                Clear Radius
              </Button>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResults && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{radiusKm}km Radius Analysis</CardTitle>
                <CardDescription>Supply chain feasibility assessment for selected area</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Feasibility Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Feasibility Score</span>
                    <Badge
                      variant={
                        analysisResults.feasibilityScore >= 70
                          ? "default"
                          : analysisResults.feasibilityScore >= 40
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {analysisResults.feasibilityScore}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${analysisResults.feasibilityScore}%` }}
                    />
                  </div>
                </div>

                {/* Facilities Count */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Facilities Within Radius</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sugar Mills:</span>
                      <span className="font-medium">{analysisResults.facilities.sugarMills}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Biogas:</span>
                      <span className="font-medium">{analysisResults.facilities.biogasFacilities}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Biofuel Plants:</span>
                      <span className="font-medium">{analysisResults.facilities.biofuelPlants}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ports:</span>
                      <span className="font-medium">{analysisResults.facilities.ports}</span>
                    </div>
                  </div>
                </div>

                {/* Feedstock Tonnes */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Estimated Annual Feedstock (tonnes)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bagasse:</span>
                      <span className="font-medium">{analysisResults.feedstockTonnes.bagasse.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Grain Stubble:</span>
                      <span className="font-medium">{analysisResults.feedstockTonnes.grainStubble.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>{analysisResults.feedstockTonnes.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-2">
                  <Button onClick={() => setShowSaveDialog(true)} className="w-full" variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search facilities or regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Refine by location and capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* State Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">States</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["QLD", "NSW", "VIC", "SA", "WA", "TAS"].map((state) => (
                    <div key={state} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedStates.includes(state)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStates([...selectedStates, state]);
                          } else {
                            setSelectedStates(selectedStates.filter((s) => s !== state));
                          }
                        }}
                      />
                      <Label className="text-xs">{state}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedStates(["QLD", "NSW", "VIC", "SA", "WA", "TAS"]);
                  setSugarMillCapacity([0, 4000000]);
                  setBiogasCapacity([0, 50]);
                  setBiofuelCapacity([0, 500]);
                  setPortThroughput([0, 200]);
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>

          {/* Saved Analyses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Saved Analyses
              </CardTitle>
              <CardDescription>{savedAnalyses?.length || 0} saved</CardDescription>
            </CardHeader>
            <CardContent>
              {savedAnalyses && savedAnalyses.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedAnalyses.map((analysis: any) => (
                    <div key={analysis.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{analysis.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {analysis.radiusKm}km radius
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleLoadAnalysis(analysis)}>
                            <Target className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => deleteAnalysisMutation.mutate({ id: analysis.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No saved analyses yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Layer Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Layers
              </CardTitle>
              <CardDescription>Toggle visibility and adjust opacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {layers.map((layer) => (
                <div key={layer.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={layer.visible} onCheckedChange={() => toggleLayer(layer.id)} />
                      <Label className="text-sm font-medium">{layer.name}</Label>
                    </div>
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: layer.color }} />
                  </div>
                  {layer.visible && (
                    <div className="ml-6 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Opacity</span>
                        <span>{layerOpacity[layer.id]}%</span>
                      </div>
                      <Slider
                        value={[layerOpacity[layer.id]]}
                        onValueChange={([value]) => updateOpacity(layer.id, value)}
                        max={100}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>Download filtered facilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleExportGeoJSON} disabled={isExporting} variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export as GeoJSON"}
              </Button>
              <Button onClick={handleExportCSV} disabled={isExporting} variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export as CSV"}
              </Button>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#8B4513" }} />
                <span className="text-sm">Sugar Mills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: "#DAA520", opacity: 0.3 }} />
                <span className="text-sm">Grain Regions</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Analysis Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Radius Analysis</DialogTitle>
            <DialogDescription>Save this analysis to your account for future reference.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="analysis-name">Analysis Name *</Label>
              <Input
                id="analysis-name"
                placeholder="e.g., Brisbane North Site Assessment"
                value={savedAnalysisName}
                onChange={(e) => setSavedAnalysisName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="analysis-description">Description (Optional)</Label>
              <Textarea
                id="analysis-description"
                placeholder="Add notes about this analysis..."
                value={savedAnalysisDescription}
                onChange={(e) => setSavedAnalysisDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAnalysis} disabled={saveAnalysisMutation.isPending || !savedAnalysisName.trim()}>
              {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
