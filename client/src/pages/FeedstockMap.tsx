"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  Layers,
  Search,
  Download,
  Target,
  Save,
  Trash2,
  FolderOpen,
  Loader2,
  Map,
  Globe,
  Zap,
  TreeDeciduous,
  Building2,
  MapPin,
  Factory,
} from "lucide-react";
import { analyzeRadius, type AnalysisResults } from "@/lib/radiusAnalysis";
import { exportAsGeoJSON, exportAsCSV } from "@/lib/mapExport";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  BIOFUEL_PROJECTS,
  WMS_LAYERS,
  STATUS_COLORS,
  RATING_COLORS,
  type BiofuelProject,
} from "@/components/maps";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Australia center
const defaultCenter: L.LatLngTuple = [-25.2744, 133.7751];

interface LayerConfig {
  id: string;
  name: string;
  type: "marker" | "polygon" | "wms";
  source?: string;
  wmsUrl?: string;
  wmsLayers?: string;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polygonsRef = useRef<L.Polygon[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const wmsLayersRef = useRef<Record<string, L.TileLayer.WMS>>({});
  const geoJsonLayersRef = useRef<L.GeoJSON[]>([]);

  const [selectedStates, setSelectedStates] = useState<string[]>([
    "QLD",
    "NSW",
    "VIC",
    "SA",
    "WA",
    "TAS",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusCenter, setRadiusCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedAnalysisName, setSavedAnalysisName] = useState("");
  const [savedAnalysisDescription, setSavedAnalysisDescription] = useState("");
  const [radiusCircle, setRadiusCircle] = useState<L.Circle | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const [showCatchments, setShowCatchments] = useState(true);
  const [selectedProject, setSelectedProject] = useState<BiofuelProject | null>(null);

  // GeoJSON data storage
  const [layerData, setLayerData] = useState<Record<string, GeoJSONData>>({});

  // Fetch saved analyses
  const { data: savedAnalyses, refetch: refetchSavedAnalyses } =
    trpc.savedAnalyses.list.useQuery();
  const deleteAnalysisMutation = trpc.savedAnalyses.delete.useMutation({
    onSuccess: () => {
      refetchSavedAnalyses();
    },
  });

  const [layers, setLayers] = useState<LayerConfig[]>([
    {
      id: "biofuel-projects",
      name: "Biofuel Projects",
      type: "marker",
      color: "#3b82f6",
      visible: true,
    },
    {
      id: "land-use",
      name: "Land Use (CLUM)",
      type: "wms",
      wmsUrl: WMS_LAYERS.landUse.url,
      wmsLayers: WMS_LAYERS.landUse.layers,
      color: "#22c55e",
      visible: false,
    },
    {
      id: "electricity",
      name: "Electricity Grid",
      type: "wms",
      wmsUrl: WMS_LAYERS.electricity.url,
      wmsLayers: WMS_LAYERS.electricity.layers,
      color: "#f59e0b",
      visible: false,
    },
    {
      id: "sugar-mills",
      name: "Sugar Mills",
      type: "marker",
      source: "/geojson/sugar_mills.json",
      color: "#8B4513",
      visible: false,
    },
    {
      id: "grain-regions",
      name: "Grain Regions",
      type: "polygon",
      source: "/geojson/grain_regions.json",
      color: "#DAA520",
      visible: false,
    },
    {
      id: "forestry-regions",
      name: "Forestry Regions",
      type: "polygon",
      source: "/geojson/forestry_regions.json",
      color: "#228B22",
      visible: false,
    },
    // ABBA (Australian Biomass for Bioenergy Assessment) Layers
    // Queensland CKAN API: https://www.data.qld.gov.au/api/3/action/
    // Dataset: australian-biomass-for-bioenergy-assessment
    // License: CC BY 4.0
    {
      id: "abba-bagasse",
      name: "🌾 Sugarcane Bagasse (ABBA)",
      type: "wms",
      wmsUrl: WMS_LAYERS.bagasse?.url || "https://terria-catalog-services.data.gov.au/geoserver/wms",
      wmsLayers: WMS_LAYERS.bagasse?.layers || "abba:sugarcane_bagasse",
      color: "#8B4513",
      visible: false,
    },
    {
      id: "abba-grain-stubble",
      name: "🌾 Grain Stubble (ABBA)",
      type: "wms",
      wmsUrl: WMS_LAYERS.grainStubble?.url || "https://terria-catalog-services.data.gov.au/geoserver/wms",
      wmsLayers: WMS_LAYERS.grainStubble?.layers || "abba:grain_stubble",
      color: "#DAA520",
      visible: false,
    },
    {
      id: "abba-forestry",
      name: "🌲 Forestry Residues (ABBA)",
      type: "wms",
      wmsUrl: WMS_LAYERS.forestryResidues?.url || "https://terria-catalog-services.data.gov.au/geoserver/wms",
      wmsLayers: WMS_LAYERS.forestryResidues?.layers || "abba:forestry_residues",
      color: "#228B22",
      visible: false,
    },
    {
      id: "abba-cotton",
      name: "🌿 Cotton Gin Trash (ABBA)",
      type: "wms",
      wmsUrl: WMS_LAYERS.cottonGinTrash?.url || "https://terria-catalog-services.data.gov.au/geoserver/wms",
      wmsLayers: WMS_LAYERS.cottonGinTrash?.layers || "abba:cotton_gin_trash",
      color: "#F5F5DC",
      visible: false,
    },
    {
      id: "abba-urban-waste",
      name: "🏙️ Urban Organic Waste (ABBA)",
      type: "wms",
      wmsUrl: WMS_LAYERS.urbanOrganicWaste?.url || "https://terria-catalog-services.data.gov.au/geoserver/wms",
      wmsLayers: WMS_LAYERS.urbanOrganicWaste?.layers || "abba:urban_organic_waste",
      color: "#4A4A4A",
      visible: false,
    },
  ]);

  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    "biofuel-projects": 100,
    "land-use": 50,
    "electricity": 70,
    "sugar-mills": 100,
    "grain-regions": 30,
    "forestry-regions": 30,
    "abba-bagasse": 60,
    "abba-grain-stubble": 60,
    "abba-forestry": 60,
    "abba-cotton": 60,
    "abba-urban-waste": 60,
  });

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Data: Digital Atlas of Australia, ABBA Project',
      maxZoom: 19,
    }).addTo(map);

    // Add scale control
    L.control.scale({ imperial: false, metric: true }).addTo(map);

    mapRef.current = map;
    setMapInitialized(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapInitialized(false);
    };
  }, []); // Empty dependency - only run once on mount

  // Load GeoJSON data on mount
  useEffect(() => {
    const loadData = async () => {
      const data: Record<string, GeoJSONData> = {};
      for (const layer of layers) {
        if (layer.source) {
          try {
            const response = await fetch(layer.source);
            const geojson = await response.json();
            data[layer.id] = geojson;
          } catch (error) {
            console.error(`Failed to load ${layer.id}:`, error);
          }
        }
      }
      setLayerData(data);
    };
    loadData();
  }, []);

  // Render biofuel project markers
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;

    // Clear existing project markers and catchment circles
    markersRef.current.forEach((marker) => marker.remove());
    circlesRef.current.forEach((circle) => circle.remove());
    markersRef.current = [];
    circlesRef.current = [];

    const projectLayer = layers.find((l) => l.id === "biofuel-projects");
    if (!projectLayer?.visible || !showProjects) return;

    const map = mapRef.current;

    BIOFUEL_PROJECTS.forEach((project) => {
      // Filter by state if needed
      const projectState = project.location.split(", ").pop()?.trim();
      if (projectState && !selectedStates.includes(projectState)) return;

      // Create custom icon
      const icon = L.divIcon({
        className: "custom-project-marker",
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background-color: ${STATUS_COLORS[project.status]};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Create marker
      const marker = L.marker([project.lat, project.lng], { icon });

      // Helper function to get rating color
      const getRatingColor = (rating: string): string => {
        return RATING_COLORS[rating] || "#9ca3af";
      };

      // Add popup with bankability ratings
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 280px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h3 style="margin: 0; font-weight: 600; font-size: 14px; color: #1a1a1a; flex: 1;">
              ${project.name}
            </h3>
            <span style="
              background-color: ${getRatingColor(project.bankability)};
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 12px;
              margin-left: 8px;
            ">${project.bankability}</span>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            ${project.company}
          </div>

          <!-- Lending Signal Badge -->
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background-color: ${getRatingColor(project.signal)}20;
            border: 1px solid ${getRatingColor(project.signal)}40;
            color: ${getRatingColor(project.signal)};
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 8px;
          ">
            ${project.signal}
          </div>

          <!-- Rating Grid -->
          <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="background: ${getRatingColor(project.growerContract)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500;">${project.growerContract}</span>
            <span style="background: ${getRatingColor(project.techReadiness)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500;">${project.techReadiness}</span>
            <span style="background: ${getRatingColor(project.carbonIntensity)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500;">${project.carbonIntensity}</span>
            <span style="background: #6b7280; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500;">CI: ${project.ciValue}</span>
          </div>

          <div style="display: grid; gap: 3px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Location:</span>
              <span style="font-weight: 500;">${project.location}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Feedstock:</span>
              <span style="font-weight: 500;">${project.feedstock}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Technology:</span>
              <span style="font-weight: 500;">${project.technology}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Capacity:</span>
              <span style="font-weight: 500;">${project.capacity}</span>
            </div>
            ${project.biomass50km > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666;">50km Biomass:</span>
                <span style="font-weight: 600; color: #059669;">
                  ${project.biomass50km.toLocaleString()} t/yr
                </span>
              </div>
            ` : ""}
          </div>

          <!-- Assessment Notes -->
          ${project.notes ? `
            <div style="
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #4b5563;
              font-style: italic;
            ">
              ${project.notes}
            </div>
          ` : ""}

          <!-- View Details Link -->
          <div style="margin-top: 8px; text-align: center;">
            <a href="/ratings/project/${project.id}" style="
              display: inline-block;
              padding: 4px 12px;
              background: #3b82f6;
              color: white;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              text-decoration: none;
            ">View Full Assessment</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: "biomass-map-popup",
      });

      marker.on("click", () => {
        setSelectedProject(project);
      });

      marker.addTo(map);
      markersRef.current.push(marker);

      // Add catchment circle if enabled
      if (showCatchments && project.biomass50km > 0) {
        const circle = L.circle([project.lat, project.lng], {
          radius: radiusKm * 1000, // Convert km to meters
          color: STATUS_COLORS[project.status],
          fillColor: STATUS_COLORS[project.status],
          fillOpacity: 0.08,
          weight: 2,
          dashArray: "6, 4",
        });

        circle.addTo(map);
        circlesRef.current.push(circle);
      }
    });
  }, [mapInitialized, layers, showProjects, showCatchments, radiusKm, selectedStates]);

  // Handle WMS layers
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;

    const map = mapRef.current;

    layers
      .filter((l) => l.type === "wms")
      .forEach((layer) => {
        const existingLayer = wmsLayersRef.current[layer.id];

        if (layer.visible && !existingLayer && layer.wmsUrl) {
          const wmsLayer = L.tileLayer.wms(layer.wmsUrl, {
            layers: layer.wmsLayers || "",
            format: "image/png",
            transparent: true,
            opacity: (layerOpacity[layer.id] || 100) / 100,
            attribution: "© Digital Atlas of Australia",
          });

          wmsLayer.addTo(map);
          wmsLayersRef.current[layer.id] = wmsLayer;
        } else if (!layer.visible && existingLayer) {
          existingLayer.remove();
          delete wmsLayersRef.current[layer.id];
        } else if (layer.visible && existingLayer) {
          existingLayer.setOpacity((layerOpacity[layer.id] || 100) / 100);
        }
      });
  }, [mapInitialized, layers, layerOpacity]);

  // Handle GeoJSON layers
  useEffect(() => {
    if (!mapRef.current || !mapInitialized || Object.keys(layerData).length === 0) return;

    // Clear existing GeoJSON layers
    geoJsonLayersRef.current.forEach((layer) => layer.remove());
    geoJsonLayersRef.current = [];

    const map = mapRef.current;

    layers
      .filter((l) => l.visible && l.source && layerData[l.id])
      .forEach((layer) => {
        const data = layerData[layer.id];
        if (!data) return;

        const geoJsonLayer = L.geoJSON(data as any, {
          style: (feature) => ({
            fillColor: layer.color,
            fillOpacity: ((layerOpacity[layer.id] || 100) / 100) * 0.3,
            color: layer.color,
            weight: 2,
            opacity: 0.8,
          }),
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 8,
              fillColor: layer.color,
              fillOpacity: (layerOpacity[layer.id] || 100) / 100,
              color: "#fff",
              weight: 2,
            });
          },
          onEachFeature: (feature, featureLayer) => {
            const props = feature.properties;
            const popupContent = `
              <div style="font-family: system-ui; font-size: 13px; padding: 4px;">
                <strong>${props.name || props.NAME || "Feature"}</strong>
                ${props.state || props.STATE ? `<br><span style="color: #666;">State: ${props.state || props.STATE}</span>` : ""}
                ${props.capacity || props.crushing_capacity_tonnes ? `<br><span style="color: #666;">Capacity: ${(props.capacity || props.crushing_capacity_tonnes || 0).toLocaleString()}</span>` : ""}
              </div>
            `;
            featureLayer.bindPopup(popupContent);
          },
          filter: (feature) => {
            const state = feature.properties?.state || feature.properties?.STATE;
            if (!state) return true;
            return selectedStates.includes(state);
          },
        });

        geoJsonLayer.addTo(map);
        geoJsonLayersRef.current.push(geoJsonLayer);
      });
  }, [mapInitialized, layers, layerData, layerOpacity, selectedStates]);

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayers(
      layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  // Update layer opacity
  const updateOpacity = (layerId: string, opacity: number) => {
    setLayerOpacity({ ...layerOpacity, [layerId]: opacity });
  };

  // Draw radius and analyze
  const drawRadius = async () => {
    if (!mapRef.current) return;

    const center = mapRef.current.getCenter();
    const centerPos = { lat: center.lat, lng: center.lng };
    setRadiusCenter(centerPos);
    setIsAnalyzing(true);

    // Remove existing circle
    if (radiusCircle) {
      radiusCircle.remove();
    }

    // Create new circle
    const circle = L.circle([centerPos.lat, centerPos.lng], {
      radius: radiusKm * 1000,
      color: "#14b8a6",
      fillColor: "#14b8a6",
      fillOpacity: 0.15,
      weight: 3,
    });

    circle.addTo(mapRef.current);
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
      radiusCircle.remove();
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
        capacityRanges: {},
      });
      alert(`Exported ${count} features as GeoJSON`);
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
        capacityRanges: {},
      });
      alert(`Exported ${count} features as CSV`);
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
        capacityRanges: {},
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
    }

    // Pan to analysis location
    if (mapRef.current) {
      mapRef.current.setView([centerLat, centerLng], 9);

      // Draw circle
      setTimeout(() => {
        if (mapRef.current) {
          const circle = L.circle([centerLat, centerLng], {
            radius: analysis.radiusKm * 1000,
            color: "#14b8a6",
            fillColor: "#14b8a6",
            fillOpacity: 0.15,
            weight: 3,
          });
          circle.addTo(mapRef.current);
          setRadiusCircle(circle);
        }
      }, 300);
    }
  };

  return (
    <PageLayout showFooter={false}>
      {/* Compact Header */}
      <section className="bg-gradient-to-r from-slate-900 to-teal-900 text-white py-8">
        <PageContainer padding="none">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="border-teal-400/50 text-teal-300 bg-teal-500/10"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Interactive GIS
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-400/50 text-green-300 bg-green-500/10"
                >
                  OpenStreetMap + Digital Atlas
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold">
                Feedstock Supply Map
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Visualize Australian biofuel projects, biomass resources, and infrastructure
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/futures">
                  <TreeDeciduous className="h-4 w-4 mr-1" />
                  Marketplace
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/ratings">
                  <Building2 className="h-4 w-4 mr-1" />
                  Bankability
                </Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map Container */}
          <div className="flex-1 flex flex-col">
            <div
              ref={mapContainerRef}
              className="flex-1 min-h-[500px] lg:min-h-0"
            />

            {/* Map Controls Bar */}
            <div className="bg-background border-t p-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Catchment:
                </span>
                <Slider
                  value={[radiusKm]}
                  onValueChange={(value) => setRadiusKm(value[0])}
                  min={10}
                  max={200}
                  step={5}
                  className="flex-1"
                />
                <Badge variant="outline" className="shrink-0">
                  {radiusKm} km
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={drawRadius} size="sm" disabled={isAnalyzing}>
                  <Target className="h-4 w-4 mr-1" />
                  {isAnalyzing ? "Analyzing..." : "Analyze Area"}
                </Button>
                {radiusCenter && (
                  <Button onClick={clearRadius} variant="outline" size="sm">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-background overflow-y-auto max-h-[50vh] lg:max-h-none">
            <div className="p-4 space-y-4">
              {/* Project Legend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Project Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={showProjects}
                      onCheckedChange={(c) => setShowProjects(!!c)}
                    />
                    <Label className="text-sm">Show Projects</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={showCatchments}
                      onCheckedChange={(c) => setShowCatchments(!!c)}
                    />
                    <Label className="text-sm">Show Catchments</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: color, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                        />
                        <span className="capitalize">{status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {BIOFUEL_PROJECTS.length} projects mapped
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResults && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Analysis Results
                    </CardTitle>
                    <CardDescription>
                      {radiusKm}km radius from center
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Feasibility Score */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Feasibility</span>
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
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${analysisResults.feasibilityScore}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Facilities Found</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Sugar Mills:
                          </span>
                          <span className="font-mono">
                            {analysisResults.facilities.sugarMills}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Biogas:</span>
                          <span className="font-mono">
                            {analysisResults.facilities.biogasFacilities}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Biofuel:
                          </span>
                          <span className="font-mono">
                            {analysisResults.facilities.biofuelPlants}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ports:</span>
                          <span className="font-mono">
                            {analysisResults.facilities.ports}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feedstock */}
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-sm font-medium">
                        Annual Feedstock (t)
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Bagasse:
                          </span>
                          <span className="font-mono">
                            {analysisResults.feedstockTonnes.bagasse.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Grain Stubble:
                          </span>
                          <span className="font-mono">
                            {analysisResults.feedstockTonnes.grainStubble.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1 border-t">
                          <span>Total:</span>
                          <span className="font-mono text-primary">
                            {analysisResults.feedstockTonnes.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowSaveDialog(true)}
                      className="w-full"
                      variant="outline"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* State Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm">States</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["QLD", "NSW", "VIC", "SA", "WA", "TAS"].map((state) => (
                        <div key={state} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`state-${state}`}
                            checked={selectedStates.includes(state)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStates([...selectedStates, state]);
                              } else {
                                setSelectedStates(
                                  selectedStates.filter((s) => s !== state)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`state-${state}`}
                            className="text-xs cursor-pointer"
                          >
                            {state}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setSelectedStates([
                        "QLD",
                        "NSW",
                        "VIC",
                        "SA",
                        "WA",
                        "TAS",
                      ])
                    }
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>

              {/* Saved Analyses */}
              {savedAnalyses && savedAnalyses.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Saved Analyses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {savedAnalyses.map((analysis: any) => (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {analysis.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {analysis.radiusKm}km
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleLoadAnalysis(analysis)}
                            >
                              <Target className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() =>
                                deleteAnalysisMutation.mutate({
                                  id: analysis.id,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Layers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Data Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {layers.map((layer) => (
                    <div key={layer.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={layer.visible}
                            onCheckedChange={() => toggleLayer(layer.id)}
                          />
                          <Label className="text-sm cursor-pointer">
                            {layer.name}
                          </Label>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: layer.color }}
                        />
                      </div>
                      {layer.visible && (
                        <div className="ml-6 space-y-1">
                          <Slider
                            value={[layerOpacity[layer.id]]}
                            onValueChange={([value]) =>
                              updateOpacity(layer.id, value)
                            }
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

              {/* Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={handleExportGeoJSON}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isExporting ? "Exporting..." : "Export GeoJSON"}
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isExporting ? "Exporting..." : "Export CSV"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Save Analysis Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Analysis</DialogTitle>
            <DialogDescription>
              Save this analysis for future reference.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="analysis-name">Name *</Label>
              <Input
                id="analysis-name"
                placeholder="e.g., Brisbane North Assessment"
                value={savedAnalysisName}
                onChange={(e) => setSavedAnalysisName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="analysis-description">Description</Label>
              <Textarea
                id="analysis-description"
                placeholder="Add notes..."
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
            <Button
              onClick={handleSaveAnalysis}
              disabled={
                saveAnalysisMutation.isPending || !savedAnalysisName.trim()
              }
            >
              {saveAnalysisMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
