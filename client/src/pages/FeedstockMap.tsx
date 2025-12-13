import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Search, Download, Target } from "lucide-react";
import { createPopupHTML } from "@/lib/popupTemplates";
import { buildLayerFilter } from "@/lib/mapFilters";
import { analyzeRadius, type AnalysisResults } from "@/lib/radiusAnalysis";
import { exportAsGeoJSON, exportAsCSV } from "@/lib/mapExport";
import { exportAnalysisAsPDF, captureMapScreenshot } from "@/lib/pdfExport";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

// Mapbox access token (using Manus proxy)
mapboxgl.accessToken = "pk.eyJ1Ijoic3RlZWxkcmFnb242NjYiLCJhIjoiY21keGFwNmxjMmM1MjJscTM0NHMwMWo5aSJ9.3mvzNah-7rzwxCZ2L81-YA";

interface LayerConfig {
  id: string;
  name: string;
  type: "circle" | "fill" | "symbol";
  source: string;
  color: string;
  visible: boolean;
}

export default function FeedstockMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(["QLD", "NSW", "VIC", "SA", "WA", "TAS"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedAnalysisName, setSavedAnalysisName] = useState("");
  const [savedAnalysisDescription, setSavedAnalysisDescription] = useState("");
  
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: "sugar-mills", name: "Sugar Mills", type: "circle", source: "/geojson/sugar_mills.json", color: "#8B4513", visible: true },
    { id: "grain-regions", name: "Grain Regions", type: "fill", source: "/geojson/grain_regions.json", color: "#DAA520", visible: true },
    { id: "forestry-regions", name: "Forestry Regions", type: "fill", source: "/geojson/forestry_regions.json", color: "#228B22", visible: false },
    { id: "biogas-facilities", name: "Biogas Facilities", type: "circle", source: "/geojson/biogas_facilities.json", color: "#FF6347", visible: false },
    { id: "biofuel-plants", name: "Biofuel Plants", type: "circle", source: "/geojson/biofuel_plants.json", color: "#4169E1", visible: false },
    { id: "transport-ports", name: "Ports & Transport", type: "circle", source: "/geojson/transport_infrastructure.json", color: "#9370DB", visible: false },
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

  // Apply filters when filter state changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    layers.forEach((layer) => {
      const filter = buildLayerFilter(
        layer.id,
        selectedStates,
        sugarMillCapacity,
        biogasCapacity,
        biofuelCapacity,
        portThroughput
      );

      // Apply filter to main layer
      if (map.current!.getLayer(layer.id)) {
        map.current!.setFilter(layer.id, [...filter, ["!", ["has", "point_count"]]]);
      }

      // Apply filter to clusters (exclude the point_count filter)
      if (map.current!.getLayer(`${layer.id}-clusters`)) {
        map.current!.setFilter(`${layer.id}-clusters`, [["has", "point_count"]]);
      }
    });
  }, [selectedStates, sugarMillCapacity, biogasCapacity, biofuelCapacity, portThroughput, mapLoaded, layers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [133.7751, -25.2744], // Australia center
      zoom: 4,
    });

    map.current.on("load", () => {
      setMapLoaded(true);
      loadLayers();
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add scale
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    return () => {
      map.current?.remove();
    };
  }, []);

  // Load GeoJSON layers
  const loadLayers = async () => {
    if (!map.current) return;

    for (const layer of layers) {
      try {
        const response = await fetch(layer.source);
        const data = await response.json();

        // Add source
        map.current.addSource(layer.id, {
          type: "geojson",
          data: data,
          cluster: layer.type === "circle",
          clusterMaxZoom: 8,
          clusterRadius: 50,
        });

        // Add layer based on type
        if (layer.type === "circle") {
          // Add clusters
          map.current.addLayer({
            id: `${layer.id}-clusters`,
            type: "circle",
            source: layer.id,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step",
                ["get", "point_count"],
                layer.color,
                10,
                "#f28cb1",
                20,
                "#f1f075",
              ],
              "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 20, 40],
              "circle-opacity": layerOpacity[layer.id] / 100,
            },
          });

          // Add cluster count
          map.current.addLayer({
            id: `${layer.id}-cluster-count`,
            type: "symbol",
            source: layer.id,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
          });

          // Add unclustered points
          map.current.addLayer({
            id: layer.id,
            type: "circle",
            source: layer.id,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": layer.color,
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "crushing_capacity_tonnes"],
                500000,
                8,
                4000000,
                20,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": layerOpacity[layer.id] / 100,
            },
          });

          // Add click handler for popups
          map.current.on("click", layer.id, (e: mapboxgl.MapMouseEvent) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;

            const html = createPopupHTML(layer.id, props);

            new mapboxgl.Popup()
              .setLngLat((e.lngLat as any))
              .setHTML(html)
              .addTo(map.current!);
          });

          // Change cursor on hover
          map.current.on("mouseenter", layer.id, () => {
            if (map.current) map.current.getCanvas().style.cursor = "pointer";
          });
          map.current.on("mouseleave", layer.id, () => {
            if (map.current) map.current.getCanvas().style.cursor = "";
          });
        } else if (layer.type === "fill") {
          // Add polygon fill
          map.current.addLayer({
            id: layer.id,
            type: "fill",
            source: layer.id,
            paint: {
              "fill-color": layer.color,
              "fill-opacity": layerOpacity[layer.id] / 100,
            },
          });

          // Add polygon outline
          map.current.addLayer({
            id: `${layer.id}-outline`,
            type: "line",
            source: layer.id,
            paint: {
              "line-color": layer.color,
              "line-width": 2,
            },
          });

          // Add click handler for popups
          map.current.on("click", layer.id, (e: mapboxgl.MapMouseEvent) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const props = feature.properties;

            const html = createPopupHTML(layer.id, props);

            new mapboxgl.Popup()
              .setLngLat((e.lngLat as any))
              .setHTML(html)
              .addTo(map.current!);
          });

          // Change cursor on hover
          map.current.on("mouseenter", layer.id, () => {
            if (map.current) map.current.getCanvas().style.cursor = "pointer";
          });
          map.current.on("mouseleave", layer.id, () => {
            if (map.current) map.current.getCanvas().style.cursor = "";
          });
        }
      } catch (error) {
        console.error(`Failed to load layer ${layer.id}:`, error);
      }
    }
  };

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    if (!map.current) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newVisibility = !layer.visible;

    // Update state
    setLayers(layers.map((l) => (l.id === layerId ? { ...l, visible: newVisibility } : l)));

    // Update map
    const visibility = newVisibility ? "visible" : "none";
    if (map.current.getLayer(layerId)) {
      map.current.setLayoutProperty(layerId, "visibility", visibility);
    }
    if (map.current.getLayer(`${layerId}-clusters`)) {
      map.current.setLayoutProperty(`${layerId}-clusters`, "visibility", visibility);
    }
    if (map.current.getLayer(`${layerId}-cluster-count`)) {
      map.current.setLayoutProperty(`${layerId}-cluster-count`, "visibility", visibility);
    }
    if (map.current.getLayer(`${layerId}-outline`)) {
      map.current.setLayoutProperty(`${layerId}-outline`, "visibility", visibility);
    }
  };

  // Update layer opacity
  const updateOpacity = (layerId: string, opacity: number) => {
    if (!map.current) return;

    setLayerOpacity({ ...layerOpacity, [layerId]: opacity });

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    if (layer.type === "circle") {
      if (map.current.getLayer(layerId)) {
        map.current.setPaintProperty(layerId, "circle-opacity", opacity / 100);
      }
      if (map.current.getLayer(`${layerId}-clusters`)) {
        map.current.setPaintProperty(`${layerId}-clusters`, "circle-opacity", opacity / 100);
      }
    } else if (layer.type === "fill") {
      if (map.current.getLayer(layerId)) {
        map.current.setPaintProperty(layerId, "fill-opacity", opacity / 100);
      }
    }
  };

  // Draw radius and analyze
  const drawRadius = async () => {
    if (!map.current) return;

    const center = map.current.getCenter();
    setRadiusCenter([center.lng, center.lat]);
    setIsAnalyzing(true);

    // Remove existing radius if any
    if (map.current.getLayer("radius-circle")) {
      map.current.removeLayer("radius-circle");
    }
    if (map.current.getSource("radius-circle")) {
      map.current.removeSource("radius-circle");
    }

    // Create circle (convert km to degrees, approximate)
    const radius = radiusKm / 111; // Convert km to degrees (approximate)
    const points = 64;
    const coordinates: [number, number][] = [];

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lng = center.lng + radius * Math.cos(angle);
      const lat = center.lat + radius * Math.sin(angle);
      coordinates.push([lng, lat]);
    }
    coordinates.push(coordinates[0]); // Close the circle

    map.current.addSource("radius-circle", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {},
      },
    });

    map.current.addLayer({
      id: "radius-circle",
      type: "line",
      source: "radius-circle",
      paint: {
        "line-color": "#FF0000",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    });

    // Run analysis
    try {
      const results = await analyzeRadius(center.lat, center.lng, radiusKm);
      setAnalysisResults(results);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export data handlers
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

  // Export analysis as PDF
  const handleExportPDF = async () => {
    if (!analysisResults || !radiusCenter || !map.current) {
      alert("Please run a radius analysis first before exporting PDF.");
      return;
    }

    setIsExporting(true);
    try {
      // Capture map screenshot
      const mapScreenshot = await captureMapScreenshot(map.current);

      // Generate PDF
      await exportAnalysisAsPDF({
        analysisResults,
        radiusKm,
        centerCoords: radiusCenter,
        mapScreenshot,
        projectName: "Bioenergy Site Assessment",
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed. Please try again.");
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
      centerLat: radiusCenter[1].toString(),
      centerLng: radiusCenter[0].toString(),
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

  // Clear radius and analysis
  const clearRadius = () => {
    if (!map.current) return;

    if (map.current.getLayer("radius-circle")) {
      map.current.removeLayer("radius-circle");
    }
    if (map.current.getSource("radius-circle")) {
      map.current.removeSource("radius-circle");
    }

    setRadiusCenter(null);
    setAnalysisResults(null);
  };

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
              <div ref={mapContainer} className="w-full h-[600px] rounded-lg" />
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
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export GeoJSON
            </Button>
          </div>

          {/* Analysis Results */}
          {analysisResults && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{radiusKm}km Radius Analysis</CardTitle>
                <CardDescription>
                  Supply chain feasibility assessment for selected area
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Feasibility Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Feasibility Score</span>
                    <Badge
                      variant={analysisResults.feasibilityScore >= 70 ? "default" : analysisResults.feasibilityScore >= 40 ? "secondary" : "destructive"}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Grain Hubs:</span>
                      <span className="font-medium">{analysisResults.facilities.grainHubs}</span>
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Forestry Residue:</span>
                      <span className="font-medium">{analysisResults.feedstockTonnes.forestryResidue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Biogas:</span>
                      <span className="font-medium">{analysisResults.feedstockTonnes.biogas.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>{analysisResults.feedstockTonnes.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Infrastructure */}
                {(analysisResults.infrastructure.ports.length > 0 || analysisResults.infrastructure.railLines.length > 0) && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Transport Infrastructure</h4>
                    {analysisResults.infrastructure.ports.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">Ports:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResults.infrastructure.ports.map((port) => (
                            <Badge key={port} variant="outline" className="text-xs">{port}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisResults.infrastructure.railLines.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Rail Lines:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResults.infrastructure.railLines.map((rail) => (
                            <Badge key={rail} variant="outline" className="text-xs">{rail}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {analysisResults.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysisResults.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-2">
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={isExporting}
                    className="w-full"
                    variant="outline"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Save Analysis
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full"
                    variant="default"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Generating PDF..." : "Download Report (PDF)"}
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

              {/* Sugar Mill Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Sugar Mill Capacity</Label>
                  <span className="text-xs text-muted-foreground">
                    {(sugarMillCapacity[0] / 1000).toFixed(0)}-{(sugarMillCapacity[1] / 1000).toFixed(0)}k t
                  </span>
                </div>
                <Slider
                  value={sugarMillCapacity}
                  onValueChange={(value) => setSugarMillCapacity(value as [number, number])}
                  min={0}
                  max={4000000}
                  step={100000}
                  className="w-full"
                />
              </div>

              {/* Biogas Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Biogas Capacity (MW)</Label>
                  <span className="text-xs text-muted-foreground">
                    {biogasCapacity[0]}-{biogasCapacity[1]} MW
                  </span>
                </div>
                <Slider
                  value={biogasCapacity}
                  onValueChange={(value) => setBiogasCapacity(value as [number, number])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Biofuel Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Biofuel Capacity (ML/yr)</Label>
                  <span className="text-xs text-muted-foreground">
                    {biofuelCapacity[0]}-{biofuelCapacity[1]} ML/yr
                  </span>
                </div>
                <Slider
                  value={biofuelCapacity}
                  onValueChange={(value) => setBiofuelCapacity(value as [number, number])}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Port Throughput */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Port Throughput (MT/yr)</Label>
                  <span className="text-xs text-muted-foreground">
                    {portThroughput[0]}-{portThroughput[1]} MT
                  </span>
                </div>
                <Slider
                  value={portThroughput}
                  onValueChange={(value) => setPortThroughput(value as [number, number])}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
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
                      <Checkbox
                        checked={layer.visible}
                        onCheckedChange={() => toggleLayer(layer.id)}
                      />
                      <Label className="text-sm font-medium">{layer.name}</Label>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: layer.color }}
                    />
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
              <Button
                onClick={handleExportGeoJSON}
                disabled={isExporting}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export as GeoJSON"}
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export as CSV"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Exports currently visible facilities based on active filters and layer toggles.
              </p>
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
                <span className="text-sm">Sugar Mills (size = capacity)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: "#DAA520", opacity: 0.3 }} />
                <span className="text-sm">Grain Regions</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {radiusCenter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">50km Radius Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Center: {radiusCenter[1].toFixed(2)}°, {radiusCenter[0].toFixed(2)}°
                </p>
                <Badge>Analysis feature coming soon</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Analysis Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Radius Analysis</DialogTitle>
            <DialogDescription>
              Save this analysis to your account for future reference and comparison.
            </DialogDescription>
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

            {analysisResults && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-1">Analysis Summary:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Radius: {radiusKm} km</li>
                  <li>• Feasibility Score: {analysisResults.feasibilityScore}/100</li>
                  <li>• Total Feedstock: {analysisResults.feedstockTonnes.total.toLocaleString()} tonnes/year</li>
                  <li>• Facilities: {Object.values(analysisResults.facilities).reduce((a, b) => a + b, 0)} total</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setSavedAnalysisName("");
                setSavedAnalysisDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAnalysis}
              disabled={saveAnalysisMutation.isPending || !savedAnalysisName.trim()}
            >
              {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
