"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

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

// WMS Layer configurations from Digital Atlas of Australia and ABBA
const WMS_LAYERS = {
  // Digital Atlas of Australia Layers
  landUse: {
    name: "Land Use (CLUM)",
    url: "https://di-daa.img.arcgis.com/arcgis/services/Land_and_vegetation/Catchment_Scale_Land_Use_Agricultural_Industries/ImageServer/WMSServer",
    layers: "Catchment_Scale_Land_Use_Agricultural_Industries",
    attribution: "© ABARES, CC BY 4.0",
    opacity: 0.5,
    category: "infrastructure",
  },
  electricity: {
    name: "Electricity Grid",
    url: "https://services.ga.gov.au/gis/services/Foundation_Electricity_Infrastructure/MapServer/WMSServer",
    layers: "0",
    attribution: "© Geoscience Australia, CC BY 4.0",
    opacity: 0.7,
    category: "infrastructure",
  },
  // ABBA (Australian Biomass for Bioenergy Assessment) Layers
  // Source: Queensland CKAN API - https://www.data.qld.gov.au/api/3/action/
  // Dataset: australian-biomass-for-bioenergy-assessment
  // License: CC BY 4.0
  bagasse: {
    name: "Sugarcane Bagasse (ABBA)",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layers: "abba:sugarcane_bagasse",
    attribution: "© ABBA Project, CC BY 4.0",
    opacity: 0.6,
    category: "biomass",
  },
  grainStubble: {
    name: "Grain Stubble (ABBA)",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layers: "abba:grain_stubble",
    attribution: "© ABBA Project, CC BY 4.0",
    opacity: 0.6,
    category: "biomass",
  },
  forestryResidues: {
    name: "Forestry Residues (ABBA)",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layers: "abba:forestry_residues",
    attribution: "© ABBA Project, CC BY 4.0",
    opacity: 0.6,
    category: "biomass",
  },
  cottonGinTrash: {
    name: "Cotton Gin Trash (ABBA)",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layers: "abba:cotton_gin_trash",
    attribution: "© ABBA Project, CC BY 4.0",
    opacity: 0.6,
    category: "biomass",
  },
  urbanOrganicWaste: {
    name: "Urban Organic Waste (ABBA)",
    url: "https://terria-catalog-services.data.gov.au/geoserver/wms",
    layers: "abba:urban_organic_waste",
    attribution: "© ABBA Project, CC BY 4.0",
    opacity: 0.6,
    category: "biomass",
  },
};

// Biofuel project locations with metadata and bankability ratings
export interface BiofuelProject {
  id: string;
  name: string;
  company: string;
  location: string;
  lat: number;
  lng: number;
  capacity: string;
  status: "operational" | "development" | "feasibility" | "pilot" | "halted";
  products: string[];
  biomass50km: number; // tonnes/year within 50km
  technology: string;
  // Bankability Rating Framework v3.0
  bankability: string; // AAA, AA, A, BBB, BB, B, CCC, D, N/R
  growerContract: string; // GC1, GC2, GC3, GC4, N/A
  techReadiness: string; // TR1, TR2, TR3, TR4
  carbonIntensity: string; // CI-A, CI-B, CI-C, CI-D, N/A
  ciValue: string; // gCO2e/MJ
  offtake: string; // OQ1, OQ2, OQ3, OQ4, N/A
  govSupport: string; // GS1, GS2, GS3, GS4, N/A
  signal: string; // BULLISH, NEUTRAL, BEARISH, ON HOLD, MOTHBALLED, CANCELLED
  feedstock: string;
  notes: string;
}

// Rating colors for badges
const RATING_COLORS: Record<string, string> = {
  // Bankability
  "AAA": "#059669", "AA": "#10b981", "A": "#22c55e",
  "BBB": "#eab308", "BB": "#f59e0b", "B": "#f97316",
  "CCC": "#ef4444", "D": "#6b7280", "N/R": "#9ca3af",
  // Grower Contract
  "GC1": "#059669", "GC2": "#22c55e", "GC3": "#f59e0b", "GC4": "#ef4444",
  // Tech Readiness
  "TR1": "#059669", "TR2": "#22c55e", "TR3": "#f59e0b", "TR4": "#ef4444",
  // Carbon Intensity
  "CI-A": "#059669", "CI-B": "#22c55e", "CI-C": "#f59e0b", "CI-D": "#ef4444",
  // Signal
  "BULLISH": "#059669", "NEUTRAL-BULLISH": "#10b981", "NEUTRAL": "#eab308",
  "NEUTRAL-BEARISH": "#f97316", "BEARISH": "#ef4444",
  "ON HOLD": "#6b7280", "MOTHBALLED": "#9ca3af", "CANCELLED": "#6b7280",
};

const BIOFUEL_PROJECTS: BiofuelProject[] = [
  {
    id: "malabar-biomethane",
    name: "Malabar Biomethane",
    company: "Jemena/Sydney Water",
    location: "Malabar, NSW",
    lat: -33.9631,
    lng: 151.2552,
    capacity: "95 TJ/yr",
    status: "operational",
    products: ["Biomethane"],
    biomass50km: 180000,
    technology: "Anaerobic Digestion",
    bankability: "A",
    growerContract: "GC1",
    techReadiness: "TR1",
    carbonIntensity: "CI-A",
    ciValue: "~15",
    offtake: "OQ1",
    govSupport: "GS1",
    signal: "BULLISH",
    feedstock: "Sewage sludge",
    notes: "Only project with secured feedstock",
  },
  {
    id: "jet-zero",
    name: "Jet Zero Australia",
    company: "Project Ulysses",
    location: "Townsville, QLD",
    lat: -19.2569,
    lng: 146.8187,
    capacity: "113 ML/yr",
    status: "development",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 1060000,
    technology: "ATJ (Alcohol-to-Jet)",
    bankability: "BBB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ2",
    govSupport: "GS1",
    signal: "NEUTRAL-BULLISH",
    feedstock: "Ethanol",
    notes: "Technology proven; feedstock uncontracted",
  },
  {
    id: "ampol-brisbane",
    name: "Ampol-GrainCorp-IFM",
    company: "Brisbane Renewable Fuels",
    location: "Brisbane, QLD",
    lat: -27.4212,
    lng: 153.1281,
    capacity: "450 ML/yr",
    status: "development",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 142000,
    technology: "HEFA",
    bankability: "BBB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL",
    feedstock: "Canola/Tallow/UCO",
    notes: "HEFA proven; GrainCorp is aggregator not supplier",
  },
  {
    id: "manildra-nowra",
    name: "Manildra Group",
    company: "Bioethanol Platform",
    location: "Nowra, NSW",
    lat: -34.8816,
    lng: 150.6017,
    capacity: "300 ML/yr",
    status: "operational",
    products: ["Ethanol"],
    biomass50km: 520000,
    technology: "Grain Fermentation",
    bankability: "BBB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL",
    feedstock: "Wheat starch",
    notes: "Operational producer; seasonal wheat purchasing",
  },
  {
    id: "licella-swift",
    name: "Licella Holdings",
    company: "Project Swift (Bundaberg)",
    location: "Bundaberg, QLD",
    lat: -24.8661,
    lng: 152.3489,
    capacity: "60 ML/yr",
    status: "development",
    products: ["SAF", "Renewable Diesel", "Naphtha"],
    biomass50km: 1430000,
    technology: "HTL (Hydrothermal Liquefaction)",
    bankability: "BB",
    growerContract: "GC3",
    techReadiness: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS1",
    signal: "NEUTRAL",
    feedstock: "Bagasse",
    notes: "HTL commercial in Canada; Isis Mill partnership unclear",
  },
  {
    id: "viva-energy",
    name: "Viva Energy",
    company: "Phased Biofuels Strategy",
    location: "Geelong, VIC",
    lat: -38.1499,
    lng: 144.3617,
    capacity: "SAF blending",
    status: "development",
    products: ["SAF"],
    biomass50km: 70000,
    technology: "HEFA",
    bankability: "BB",
    growerContract: "GC4",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ2",
    govSupport: "GS2",
    signal: "NEUTRAL",
    feedstock: "UCO/Tallow",
    notes: "Explicit policy dependency stated",
  },
  {
    id: "wagner-sustainable",
    name: "Wagner Sustainable Fuels",
    company: "Wellcamp",
    location: "Toowoomba, QLD",
    lat: -27.5598,
    lng: 151.9507,
    capacity: "TBD",
    status: "development",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 420000,
    technology: "ATJ",
    bankability: "BB",
    growerContract: "GC4",
    techReadiness: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~30",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL",
    feedstock: "Various (imported)",
    notes: "Blending operational; production feedstock unclear",
  },
  {
    id: "graincorp-oilseed",
    name: "GrainCorp",
    company: "Standalone",
    location: "Numurkah, VIC",
    lat: -36.0893,
    lng: 145.4407,
    capacity: "330,000 t/yr canola",
    status: "development",
    products: ["Canola Oil Feedstock"],
    biomass50km: 860000,
    technology: "HEFA",
    bankability: "BB",
    growerContract: "GC3",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~28",
    offtake: "OQ3",
    govSupport: "GS2",
    signal: "NEUTRAL-BEARISH",
    feedstock: "Canola",
    notes: "Aggregator model; no grower contracts",
  },
  {
    id: "northern-oil",
    name: "Northern Oil Yarwun",
    company: "Pyrolysis Project",
    location: "Gladstone, QLD",
    lat: -23.8300,
    lng: 151.0333,
    capacity: "200 ML",
    status: "development",
    products: ["Biodiesel"],
    biomass50km: 675000,
    technology: "Pyrolysis",
    bankability: "B",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~45",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "NEUTRAL-BEARISH",
    feedstock: "Mixed biomass",
    notes: "Pyrolysis scale-up uncertain",
  },
  {
    id: "rda-charters-towers",
    name: "RDA Charters Towers",
    company: "Pentland Project",
    location: "Charters Towers, QLD",
    lat: -20.0760,
    lng: 146.2611,
    capacity: "TBD",
    status: "feasibility",
    products: ["SAF"],
    biomass50km: 890000,
    technology: "ATJ (PureSAF)",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR2",
    carbonIntensity: "CI-B",
    ciValue: "~25",
    offtake: "OQ2",
    govSupport: "GS4",
    signal: "BEARISH",
    feedstock: "Sugarcane (proposed)",
    notes: "No cane industry in region",
  },
  {
    id: "xcf-global",
    name: "XCF Global",
    company: "F-T Project",
    location: "Gladstone, QLD",
    lat: -23.8489,
    lng: 151.2543,
    capacity: "100 ML/yr",
    status: "feasibility",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 650000,
    technology: "Fischer-Tropsch",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-C",
    ciValue: "~40",
    offtake: "OQ4",
    govSupport: "GS4",
    signal: "BEARISH",
    feedstock: "Biomass",
    notes: "Early stage; F-T unproven at scale",
  },
  {
    id: "zero-petroleum",
    name: "Zero Petroleum",
    company: "e-Fuels Project",
    location: "Adelaide, SA",
    lat: -34.9285,
    lng: 138.6007,
    capacity: "TBD",
    status: "development",
    products: ["Synthetic e-fuels"],
    biomass50km: 0,
    technology: "Power-to-Liquid",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-A",
    ciValue: "~10*",
    offtake: "OQ3",
    govSupport: "GS3",
    signal: "BEARISH",
    feedstock: "Green H2 + CO2",
    notes: "*CI depends on H2 source; e-fuels unproven",
  },
  {
    id: "ethtec",
    name: "Ethtec",
    company: "Cellulosic Ethanol",
    location: "Mackay, QLD",
    lat: -21.1411,
    lng: 149.1861,
    capacity: "50 ML/yr",
    status: "development",
    products: ["Cellulosic Ethanol"],
    biomass50km: 980000,
    technology: "Cellulosic Ethanol",
    bankability: "CCC",
    growerContract: "GC4",
    techReadiness: "TR3",
    carbonIntensity: "CI-B",
    ciValue: "~35",
    offtake: "OQ4",
    govSupport: "GS1",
    signal: "BEARISH",
    feedstock: "Lignocellulosic",
    notes: "Cellulosic globally challenged",
  },
  {
    id: "bp-kwinana",
    name: "BP Kwinana",
    company: "Refinery Conversion",
    location: "Kwinana, WA",
    lat: -32.2424,
    lng: 115.7722,
    capacity: "10,000 bpd",
    status: "halted",
    products: ["SAF", "Renewable Diesel"],
    biomass50km: 85000,
    technology: "HEFA",
    bankability: "N/R",
    growerContract: "N/A",
    techReadiness: "TR1",
    carbonIntensity: "CI-B",
    ciValue: "~32",
    offtake: "OQ1",
    govSupport: "GS3",
    signal: "ON HOLD",
    feedstock: "TBD",
    notes: "ON HOLD — not rateable",
  },
  {
    id: "united-dalby",
    name: "United Dalby",
    company: "Biodiesel Plant",
    location: "Dalby, QLD",
    lat: -27.1811,
    lng: 151.2658,
    capacity: "80 ML/yr",
    status: "halted",
    products: ["Biodiesel"],
    biomass50km: 380000,
    technology: "Biodiesel",
    bankability: "D",
    growerContract: "N/A",
    techReadiness: "TR1",
    carbonIntensity: "N/A",
    ciValue: "-",
    offtake: "N/A",
    govSupport: "N/A",
    signal: "MOTHBALLED",
    feedstock: "-",
    notes: "MOTHBALLED",
  },
  {
    id: "oceania-biofuels",
    name: "Oceania Biofuels",
    company: "Biodiesel Project",
    location: "Gladstone, QLD",
    lat: -23.8527,
    lng: 151.2300,
    capacity: "500 ML/yr (planned)",
    status: "halted",
    products: ["Biodiesel", "SAF"],
    biomass50km: 650000,
    technology: "HEFA",
    bankability: "D",
    growerContract: "N/A",
    techReadiness: "TR1",
    carbonIntensity: "N/A",
    ciValue: "-",
    offtake: "N/A",
    govSupport: "N/A",
    signal: "CANCELLED",
    feedstock: "-",
    notes: "CANCELLED",
  },
];

// Status colors
const STATUS_COLORS: Record<BiofuelProject["status"], string> = {
  operational: "#22c55e",  // green
  development: "#3b82f6",  // blue
  feasibility: "#f59e0b",  // amber
  pilot: "#8b5cf6",       // purple
  halted: "#ef4444",      // red
};

interface BiomassMapProps {
  className?: string;
  center?: L.LatLngTuple;
  zoom?: number;
  showProjects?: boolean;
  showCatchments?: boolean;
  catchmentRadius?: number; // km
  selectedLayers?: string[];
  onProjectClick?: (project: BiofuelProject) => void;
  onMapReady?: (map: L.Map) => void;
}

export function BiomassMap({
  className,
  center = AUSTRALIA_CENTER,
  zoom = DEFAULT_ZOOM,
  showProjects = true,
  showCatchments = true,
  catchmentRadius = 50,
  selectedLayers = [],
  onProjectClick,
  onMapReady,
}: BiomassMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const wmsLayersRef = useRef<Record<string, L.TileLayer.WMS>>({});
  const [isReady, setIsReady] = useState(false);

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

  // Handle project markers
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    // Clear existing markers and circles
    markersRef.current.forEach((marker) => marker.remove());
    circlesRef.current.forEach((circle) => circle.remove());
    markersRef.current = [];
    circlesRef.current = [];

    if (!showProjects) return;

    const map = mapRef.current;

    BIOFUEL_PROJECTS.forEach((project) => {
      // Create custom icon
      const icon = L.divIcon({
        className: "custom-project-marker",
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${STATUS_COLORS[project.status]};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Create marker
      const marker = L.marker([project.lat, project.lng], { icon });

      // Helper function to get rating color
      const getRatingColor = (rating: string): string => {
        return RATING_COLORS[rating] || "#9ca3af";
      };

      // Add popup
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

      // Handle click
      if (onProjectClick) {
        marker.on("click", () => onProjectClick(project));
      }

      marker.addTo(map);
      markersRef.current.push(marker);

      // Add catchment circle if enabled
      if (showCatchments && project.biomass50km > 0) {
        const circle = L.circle([project.lat, project.lng], {
          radius: catchmentRadius * 1000, // Convert km to meters
          color: STATUS_COLORS[project.status],
          fillColor: STATUS_COLORS[project.status],
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "5, 5",
        });

        circle.addTo(map);
        circlesRef.current.push(circle);
      }
    });
  }, [isReady, showProjects, showCatchments, catchmentRadius, onProjectClick]);

  // Handle WMS layers
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    const map = mapRef.current;

    // Remove layers not in selectedLayers
    Object.keys(wmsLayersRef.current).forEach((layerId) => {
      if (!selectedLayers.includes(layerId)) {
        wmsLayersRef.current[layerId].remove();
        delete wmsLayersRef.current[layerId];
      }
    });

    // Add new layers
    selectedLayers.forEach((layerId) => {
      if (wmsLayersRef.current[layerId]) return; // Already added

      const layerConfig = WMS_LAYERS[layerId as keyof typeof WMS_LAYERS];
      if (!layerConfig) return;

      const wmsLayer = L.tileLayer.wms(layerConfig.url, {
        layers: layerConfig.layers,
        format: "image/png",
        transparent: true,
        opacity: layerConfig.opacity,
        attribution: layerConfig.attribution,
      });

      wmsLayer.addTo(map);
      wmsLayersRef.current[layerId] = wmsLayer;
    });
  }, [isReady, selectedLayers]);

  // Update center and zoom
  useEffect(() => {
    if (!mapRef.current || !isReady) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom, isReady]);

  return (
    <div
      ref={mapContainerRef}
      className={cn("w-full h-[500px] rounded-lg overflow-hidden", className)}
      style={{ minHeight: "400px" }}
    />
  );
}

// Export project data and WMS layer config for external use
export { BIOFUEL_PROJECTS, WMS_LAYERS, STATUS_COLORS, RATING_COLORS };
