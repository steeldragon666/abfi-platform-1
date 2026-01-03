/**
 * Producer Carbon Calculator - Nextgen Design
 *
 * Features:
 * - Carbon sequestration estimation by crop type
 * - Interactive sliders for land area and yield
 * - Certification eligibility indicators
 * - Real-time CO2 capture calculations
 * - Typography components for consistent styling
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Info,
  Sprout,
  TreeDeciduous,
} from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { H1, H2, H3, Body, MetricValue } from "@/components/Typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Carbon sequestration data by crop type (tons CO2/ha/year)
const CROP_SEQUESTRATION_DATA = {
  beema_bamboo: {
    name: "Beema Bamboo",
    category: "High Sequestration",
    minTons: 40,
    maxTons: 250,
    description: "Giant clumping bamboo, fastest carbon capture",
    certifications: ["Gold Standard", "Verra VCS"],
  },
  moso_bamboo: {
    name: "Moso Bamboo",
    category: "High Sequestration",
    minTons: 25,
    maxTons: 150,
    description: "Traditional timber bamboo species",
    certifications: ["Gold Standard", "Verra VCS"],
  },
  mallee_eucalyptus: {
    name: "Mallee Eucalyptus",
    category: "High Sequestration",
    minTons: 15,
    maxTons: 45,
    description: "Native oil mallee for biofuel feedstock",
    certifications: ["ACCU", "CFI"],
  },
  miscanthus: {
    name: "Miscanthus (Elephant Grass)",
    category: "Energy Crop",
    minTons: 8,
    maxTons: 25,
    description: "Perennial grass for cellulosic ethanol",
    certifications: ["ISCC", "RSB"],
  },
  switchgrass: {
    name: "Switchgrass",
    category: "Energy Crop",
    minTons: 5,
    maxTons: 18,
    description: "Native prairie grass for bioenergy",
    certifications: ["ISCC", "RSB"],
  },
  hemp: {
    name: "Industrial Hemp",
    category: "Annual Crop",
    minTons: 8,
    maxTons: 22,
    description: "Fast-growing fiber and seed crop",
    certifications: ["ISCC", "Verra VCS"],
  },
  sugarcane: {
    name: "Sugarcane",
    category: "Traditional Biofuel",
    minTons: 6,
    maxTons: 15,
    description: "First-generation ethanol feedstock",
    certifications: ["Bonsucro", "RSB", "ISCC"],
  },
  canola: {
    name: "Canola/Rapeseed",
    category: "Oilseed",
    minTons: 2,
    maxTons: 8,
    description: "Biodiesel feedstock",
    certifications: ["ISCC", "RSB"],
  },
  sorghum: {
    name: "Sweet Sorghum",
    category: "Energy Crop",
    minTons: 4,
    maxTons: 12,
    description: "Dual-purpose food and fuel crop",
    certifications: ["ISCC", "RSB"],
  },
  wheat_stubble: {
    name: "Wheat (Stubble Retention)",
    category: "Traditional Crop",
    minTons: 1,
    maxTons: 5,
    description: "Cereal with carbon farming practices",
    certifications: ["ACCU", "CFI"],
  },
  pongamia: {
    name: "Pongamia",
    category: "Tree Oilseed",
    minTons: 10,
    maxTons: 35,
    description: "Nitrogen-fixing biodiesel tree",
    certifications: ["Gold Standard", "Verra VCS"],
  },
  camelina: {
    name: "Camelina",
    category: "Oilseed",
    minTons: 2,
    maxTons: 6,
    description: "SAF feedstock, drought tolerant",
    certifications: ["ISCC", "RSB", "CORSIA"],
  },
} as const;

// Fertilizer types with organic/non-organic classification
const FERTILIZER_TYPES = {
  organic: [
    { value: "organic_compost", label: "Organic Compost", carbonImpact: -8 },
    { value: "organic_manure", label: "Animal Manure (Composted)", carbonImpact: -6 },
    { value: "organic_biochar", label: "Biochar", carbonImpact: -12 },
    { value: "organic_seaweed", label: "Seaweed/Kelp Extract", carbonImpact: -5 },
    { value: "organic_bone_meal", label: "Bone Meal", carbonImpact: -4 },
    { value: "organic_green_manure", label: "Green Manure/Cover Crop", carbonImpact: -10 },
  ],
  synthetic: [
    { value: "urea", label: "Urea", carbonImpact: 5 },
    { value: "anhydrous_ammonia", label: "Anhydrous Ammonia", carbonImpact: 8 },
    { value: "dap_map", label: "DAP/MAP", carbonImpact: 6 },
    { value: "controlled_release", label: "Controlled Release", carbonImpact: 3 },
    { value: "mixed_blend", label: "Mixed Blend", carbonImpact: 4 },
    { value: "ammonium_nitrate", label: "Ammonium Nitrate", carbonImpact: 10 },
  ],
} as const;

type CropType = keyof typeof CROP_SEQUESTRATION_DATA;

export default function ProducerCarbonCalculator() {
  const [, setLocation] = useLocation();
  const [carbonData, setCarbonData] = useState({
    // Crop Type & Sequestration
    cropType: "" as CropType | "",
    hectares: "",
    sequestrationEstimate: 0,
    // Tillage
    tillagePractice: "",
    // Fertilizer
    fertilizerCategory: "" as "organic" | "synthetic" | "",
    nitrogenKgPerHa: "",
    fertiliserType: "",
    applicationMethod: "",
    soilTestingFrequency: "",
    // Crop Protection
    herbicideApplications: "",
    pesticideApplications: "",
    integratedPestManagement: false,
    organicCertified: false,
    // Machinery & Energy
    heavyMachineryDays: "",
    tractorFuelType: "",
    annualDieselLitres: "",
    harvesterType: "",
    irrigationPumpEnergy: "",
    // Transport
    onFarmDistanceKm: "",
    transportMethod: "",
    // Land Use
    previousLandUse: "",
    coverCropping: false,
    stubbleManagement: "",
    permanentVegetationHa: "",
    carbonProject: false,
  });

  // Calculate sequestration based on crop type and hectares
  const cropInfo = useMemo(() => {
    if (!carbonData.cropType) return null;
    return CROP_SEQUESTRATION_DATA[carbonData.cropType];
  }, [carbonData.cropType]);

  const sequestrationRange = useMemo(() => {
    if (!cropInfo || !carbonData.hectares) return null;
    const ha = parseFloat(carbonData.hectares) || 0;
    return {
      min: Math.round(cropInfo.minTons * ha),
      max: Math.round(cropInfo.maxTons * ha),
      avg: Math.round(((cropInfo.minTons + cropInfo.maxTons) / 2) * ha),
    };
  }, [cropInfo, carbonData.hectares]);

  // Get available fertilizer options based on category
  const availableFertilizers = useMemo(() => {
    if (!carbonData.fertilizerCategory) return [];
    return FERTILIZER_TYPES[carbonData.fertilizerCategory];
  }, [carbonData.fertilizerCategory]);

  const [carbonScore, setCarbonScore] = useState({
    intensity: 0,
    rating: "",
    color: "",
  });

  // Calculate carbon intensity score in real-time
  useEffect(() => {
    let score = 50; // Base score

    // Crop type impact - high sequestration crops reduce score
    if (carbonData.cropType && cropInfo) {
      const avgSequestration = (cropInfo.minTons + cropInfo.maxTons) / 2;
      if (avgSequestration >= 100) score -= 25; // Very high sequestration (bamboo)
      else if (avgSequestration >= 30) score -= 15; // High sequestration
      else if (avgSequestration >= 10) score -= 8; // Medium sequestration
      else score -= 3; // Low sequestration
    }

    // Tillage impact
    if (carbonData.tillagePractice === "no_till") score -= 10;
    else if (carbonData.tillagePractice === "minimum_till") score -= 5;
    else if (carbonData.tillagePractice === "multiple_passes") score += 10;

    // Fertilizer category impact
    if (carbonData.fertilizerCategory === "organic") {
      score -= 10; // Organic fertilizers always reduce score
    } else if (carbonData.fertilizerCategory === "synthetic") {
      score += 5; // Synthetic fertilizers increase score
    }

    // Specific fertilizer impact
    const fertilizerOption = [...FERTILIZER_TYPES.organic, ...FERTILIZER_TYPES.synthetic]
      .find(f => f.value === carbonData.fertiliserType);
    if (fertilizerOption) {
      score += fertilizerOption.carbonImpact;
    }

    // Nitrogen application rate impact
    const nitrogen = parseFloat(carbonData.nitrogenKgPerHa) || 0;
    if (nitrogen > 200) score += 15;
    else if (nitrogen > 100) score += 8;
    else if (nitrogen < 50) score -= 5;

    if (carbonData.applicationMethod === "variable_rate") score -= 5;
    if (carbonData.soilTestingFrequency === "annual") score -= 3;

    // Crop protection
    if (carbonData.integratedPestManagement) score -= 5;
    if (carbonData.organicCertified) score -= 15;

    // Machinery
    if (carbonData.tractorFuelType === "biodiesel_blend") score -= 5;
    else if (carbonData.tractorFuelType === "electric") score -= 10;

    const diesel = parseFloat(carbonData.annualDieselLitres) || 0;
    if (diesel > 10000) score += 10;

    if (carbonData.irrigationPumpEnergy === "solar") score -= 8;

    // Land use
    if (carbonData.previousLandUse === "existing_crop_10plus") score -= 10;
    if (carbonData.coverCropping) score -= 5;
    if (carbonData.stubbleManagement === "retain") score -= 5;
    if (carbonData.carbonProject) score -= 15;

    // Ensure score stays within bounds
    score = Math.max(10, Math.min(100, score));

    // Convert to rating
    let rating = "";
    let color = "";
    if (score < 30) {
      rating = "A+";
      color = "text-green-600";
    } else if (score < 40) {
      rating = "A";
      color = "text-green-500";
    } else if (score < 50) {
      rating = "B+";
      color = "text-yellow-600";
    } else if (score < 60) {
      rating = "B";
      color = "text-yellow-500";
    } else if (score < 70) {
      rating = "C+";
      color = "text-orange-500";
    } else if (score < 80) {
      rating = "C";
      color = "text-orange-600";
    } else {
      rating = "D";
      color = "text-red-600";
    }

    setCarbonScore({ intensity: score, rating, color });
  }, [carbonData, cropInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "producerRegistration",
      JSON.stringify({
        step: 5,
        data: { carbonData, carbonScore },
      })
    );
    setLocation("/producer-registration/contracts");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-[#0F3A5C] hover:opacity-80">
              <Leaf className="h-6 w-6" />
              <span className="text-xl font-semibold">ABFI</span>
            </a>
          </Link>
          <div className="text-sm text-gray-600">
            Step 4 of 7: Carbon Calculator
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Progress value={56} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">
            56% Complete • Estimated 6 minutes remaining
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0F3A5C]">
                    Carbon Intensity Calculator
                  </CardTitle>
                  <CardDescription>
                    Answer these questions about your agricultural practices.
                    Your ABFI rating updates in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Crop Type & Sequestration */}
                    <TooltipProvider>
                      <div className="space-y-4">
                        <H3 className="flex items-center gap-2 text-[#0F3A5C]">
                          <TreeDeciduous className="h-5 w-5" />
                          Crop Type & Carbon Sequestration
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              Different crops sequester carbon at different rates.
                              High-sequestration crops like bamboo can capture 40-250 tons CO₂/ha/year.
                            </TooltipContent>
                          </Tooltip>
                        </H3>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Primary Crop Type *</Label>
                            <Select
                              value={carbonData.cropType}
                              onValueChange={value => {
                                setCarbonData(prev => ({
                                  ...prev,
                                  cropType: value as CropType,
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select crop type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beema_bamboo" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Beema Bamboo</span>
                                    <span className="text-xs text-gray-500">40-250 t CO₂/ha/yr • High Sequestration</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="moso_bamboo" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Moso Bamboo</span>
                                    <span className="text-xs text-gray-500">25-150 t CO₂/ha/yr • High Sequestration</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="mallee_eucalyptus" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Mallee Eucalyptus</span>
                                    <span className="text-xs text-gray-500">15-45 t CO₂/ha/yr • Native Biofuel</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="pongamia" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Pongamia</span>
                                    <span className="text-xs text-gray-500">10-35 t CO₂/ha/yr • Biodiesel Tree</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="miscanthus" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Miscanthus (Elephant Grass)</span>
                                    <span className="text-xs text-gray-500">8-25 t CO₂/ha/yr • Energy Crop</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="hemp" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Industrial Hemp</span>
                                    <span className="text-xs text-gray-500">8-22 t CO₂/ha/yr • Annual Crop</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="sugarcane" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Sugarcane</span>
                                    <span className="text-xs text-gray-500">6-15 t CO₂/ha/yr • Traditional Biofuel</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="switchgrass" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Switchgrass</span>
                                    <span className="text-xs text-gray-500">5-18 t CO₂/ha/yr • Energy Crop</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="sorghum" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Sweet Sorghum</span>
                                    <span className="text-xs text-gray-500">4-12 t CO₂/ha/yr • Dual-Purpose</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="canola" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Canola/Rapeseed</span>
                                    <span className="text-xs text-gray-500">2-8 t CO₂/ha/yr • Biodiesel</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="camelina" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Camelina</span>
                                    <span className="text-xs text-gray-500">2-6 t CO₂/ha/yr • SAF Feedstock</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="wheat_stubble" className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Wheat (Stubble Retention)</span>
                                    <span className="text-xs text-gray-500">1-5 t CO₂/ha/yr • Carbon Farming</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Area Under Cultivation (ha) *</Label>
                            <Input
                              type="number"
                              placeholder="e.g., 100"
                              value={carbonData.hectares}
                              onChange={e =>
                                setCarbonData(prev => ({
                                  ...prev,
                                  hectares: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                        </div>

                        {/* Sequestration Display */}
                        {cropInfo && carbonData.hectares && (
                          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                            <div className="flex items-start gap-3">
                              <Sprout className="h-6 w-6 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-green-800">
                                  Estimated Carbon Sequestration
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                  {cropInfo.name} on {carbonData.hectares} hectares
                                </p>
                                <div className="mt-3 flex items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-green-700">
                                      {sequestrationRange?.min?.toLocaleString()} - {sequestrationRange?.max?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-green-600">tons CO₂/year</p>
                                  </div>
                                  <div className="h-12 w-px bg-green-300" />
                                  <div className="text-center">
                                    <p className="text-lg font-semibold text-green-700">
                                      ~{sequestrationRange?.avg?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-green-600">average estimate</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {cropInfo.certifications.map(cert => (
                                    <span
                                      key={cert}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                    >
                                      {cert}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipProvider>

                    {/* Tillage Practices */}
                    <div className="space-y-4">
                      <H3 className="flex items-center gap-2 text-[#0F3A5C]">
                        Tillage Practices
                        <Info className="h-4 w-4 text-gray-400" />
                      </H3>

                      <div className="space-y-2">
                        <Label>Primary Tillage Method *</Label>
                        <Select
                          value={carbonData.tillagePractice}
                          onValueChange={value =>
                            setCarbonData(prev => ({
                              ...prev,
                              tillagePractice: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tillage practice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_till">
                              No-Till / Zero-Till
                            </SelectItem>
                            <SelectItem value="minimum_till">
                              Minimum Tillage
                            </SelectItem>
                            <SelectItem value="conventional">
                              Conventional Tillage
                            </SelectItem>
                            <SelectItem value="multiple_passes">
                              Multiple Passes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fertilizer Management */}
                    <div className="space-y-4">
                      <H3 className="flex items-center gap-2 text-[#0F3A5C]">
                        Fertilizer Management
                      </H3>

                      {/* Organic/Synthetic Toggle */}
                      <div className="space-y-3">
                        <Label>Fertilizer Category *</Label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setCarbonData(prev => ({
                              ...prev,
                              fertilizerCategory: "organic",
                              fertiliserType: "", // Reset type when category changes
                            }))}
                            className={`flex-1 rounded-lg border-2 p-4 text-left transition-all ${
                              carbonData.fertilizerCategory === "organic"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full p-2 ${
                                carbonData.fertilizerCategory === "organic"
                                  ? "bg-green-100"
                                  : "bg-gray-100"
                              }`}>
                                <Leaf className={`h-5 w-5 ${
                                  carbonData.fertilizerCategory === "organic"
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`} />
                              </div>
                              <div>
                                <p className={`font-semibold ${
                                  carbonData.fertilizerCategory === "organic"
                                    ? "text-green-800"
                                    : "text-gray-700"
                                }`}>Organic Fertilizers</p>
                                <p className="text-xs text-gray-500">Lower carbon impact, soil health benefits</p>
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCarbonData(prev => ({
                              ...prev,
                              fertilizerCategory: "synthetic",
                              fertiliserType: "", // Reset type when category changes
                            }))}
                            className={`flex-1 rounded-lg border-2 p-4 text-left transition-all ${
                              carbonData.fertilizerCategory === "synthetic"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full p-2 ${
                                carbonData.fertilizerCategory === "synthetic"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}>
                                <TrendingUp className={`h-5 w-5 ${
                                  carbonData.fertilizerCategory === "synthetic"
                                    ? "text-blue-600"
                                    : "text-gray-500"
                                }`} />
                              </div>
                              <div>
                                <p className={`font-semibold ${
                                  carbonData.fertilizerCategory === "synthetic"
                                    ? "text-blue-800"
                                    : "text-gray-700"
                                }`}>Synthetic Fertilizers</p>
                                <p className="text-xs text-gray-500">Higher yield potential, higher emissions</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nitrogen Application Rate (kg/ha) *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 150"
                            value={carbonData.nitrogenKgPerHa}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                nitrogenKgPerHa: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fertiliser Type *</Label>
                          <Select
                            value={carbonData.fertiliserType}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                fertiliserType: value,
                              }))
                            }
                            disabled={!carbonData.fertilizerCategory}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                carbonData.fertilizerCategory
                                  ? "Select type"
                                  : "Select category first"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFertilizers.map(fert => (
                                <SelectItem key={fert.value} value={fert.value}>
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{fert.label}</span>
                                    <span className={`text-xs ${
                                      fert.carbonImpact < 0
                                        ? "text-green-600"
                                        : "text-orange-600"
                                    }`}>
                                      {fert.carbonImpact < 0 ? "↓" : "↑"}
                                      {Math.abs(fert.carbonImpact)} pts
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Application Method *</Label>
                          <Select
                            value={carbonData.applicationMethod}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                applicationMethod: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="broadcast">
                                Broadcast
                              </SelectItem>
                              <SelectItem value="banded">Banded</SelectItem>
                              <SelectItem value="injected">Injected</SelectItem>
                              <SelectItem value="fertigation">
                                Fertigation
                              </SelectItem>
                              <SelectItem value="variable_rate">
                                Variable Rate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Soil Testing Frequency *</Label>
                          <Select
                            value={carbonData.soilTestingFrequency}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                soilTestingFrequency: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="annual">Annual</SelectItem>
                              <SelectItem value="biennial">
                                Every 2 Years
                              </SelectItem>
                              <SelectItem value="rarely">Rarely</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Crop Protection */}
                    <div className="space-y-4">
                      <H3 className="text-[#0F3A5C]">
                        Crop Protection
                      </H3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Herbicide Applications/Season *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 2"
                            value={carbonData.herbicideApplications}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                herbicideApplications: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Pesticide Applications/Season *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 1"
                            value={carbonData.pesticideApplications}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                pesticideApplications: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ipm"
                            checked={carbonData.integratedPestManagement}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                integratedPestManagement: checked as boolean,
                              }))
                            }
                          />
                          <Label htmlFor="ipm" className="cursor-pointer">
                            Integrated Pest Management (IPM) Certified
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="organic"
                            checked={carbonData.organicCertified}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                organicCertified: checked as boolean,
                              }))
                            }
                          />
                          <Label htmlFor="organic" className="cursor-pointer">
                            Organic Certified
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Machinery & Energy */}
                    <div className="space-y-4">
                      <H3 className="text-[#0F3A5C]">
                        Machinery & Energy
                      </H3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Heavy Machinery Days/Year *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 30"
                            value={carbonData.heavyMachineryDays}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                heavyMachineryDays: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Primary Tractor Fuel Type *</Label>
                          <Select
                            value={carbonData.tractorFuelType}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                tractorFuelType: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diesel">Diesel</SelectItem>
                              <SelectItem value="biodiesel_blend">
                                Biodiesel Blend
                              </SelectItem>
                              <SelectItem value="electric">Electric</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Annual Diesel Consumption (litres) *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 8000"
                            value={carbonData.annualDieselLitres}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                annualDieselLitres: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Harvester Type *</Label>
                          <Select
                            value={carbonData.harvesterType}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                harvesterType: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owned">Owned</SelectItem>
                              <SelectItem value="contractor">
                                Contractor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Irrigation Pump Energy Source *</Label>
                          <Select
                            value={carbonData.irrigationPumpEnergy}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                irrigationPumpEnergy: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grid">
                                Grid Electricity
                              </SelectItem>
                              <SelectItem value="solar">Solar</SelectItem>
                              <SelectItem value="diesel">Diesel</SelectItem>
                              <SelectItem value="none">
                                No Irrigation
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Land Use & Sequestration */}
                    <div className="space-y-4">
                      <H3 className="text-[#0F3A5C]">
                        Land Use & Sequestration
                      </H3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Previous Land Use *</Label>
                          <Select
                            value={carbonData.previousLandUse}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                previousLandUse: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select previous use" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="native_vegetation">
                                Native Vegetation
                              </SelectItem>
                              <SelectItem value="improved_pasture">
                                Improved Pasture
                              </SelectItem>
                              <SelectItem value="other_cropping">
                                Other Cropping
                              </SelectItem>
                              <SelectItem value="plantation_forestry">
                                Plantation Forestry
                              </SelectItem>
                              <SelectItem value="existing_crop_10plus">
                                Existing Crop (10+ years)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Stubble Management *</Label>
                          <Select
                            value={carbonData.stubbleManagement}
                            onValueChange={value =>
                              setCarbonData(prev => ({
                                ...prev,
                                stubbleManagement: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="retain">
                                Retain on Field
                              </SelectItem>
                              <SelectItem value="burn">Burn</SelectItem>
                              <SelectItem value="remove">Remove</SelectItem>
                              <SelectItem value="incorporate">
                                Incorporate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Permanent Vegetation (ha)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 50"
                            value={carbonData.permanentVegetationHa}
                            onChange={e =>
                              setCarbonData(prev => ({
                                ...prev,
                                permanentVegetationHa: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="coverCrop"
                            checked={carbonData.coverCropping}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                coverCropping: checked as boolean,
                              }))
                            }
                          />
                          <Label htmlFor="coverCrop" className="cursor-pointer">
                            Cover Cropping Practiced
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="carbonProject"
                            checked={carbonData.carbonProject}
                            onCheckedChange={checked =>
                              setCarbonData(prev => ({
                                ...prev,
                                carbonProject: checked as boolean,
                              }))
                            }
                          />
                          <Label
                            htmlFor="carbonProject"
                            className="cursor-pointer"
                          >
                            Registered Carbon Project
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6">
                      <Link href="/producer-registration/production-profile">
                        <Button type="button" variant="ghost" className="gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </Link>

                      <Button
                        type="submit"
                        className="gap-2 bg-[#F4C430] text-[#0F3A5C] hover:bg-[#F4C430]/90"
                      >
                        Continue to Contracts
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Score Display Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border-2 border-[#F4C430]">
                  <CardHeader className="bg-[#F4C430]/10">
                    <CardTitle className="text-center text-[#0F3A5C]">
                      Your ABFI Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <MetricValue
                        className={`mb-4 ${carbonScore.color}`}
                      >
                        {carbonScore.rating || "—"}
                      </MetricValue>
                      <Body className="mb-6 text-sm text-gray-600">
                        Carbon Intensity: {carbonScore.intensity} gCO₂e/MJ
                      </Body>

                      {carbonScore.rating && (
                        <div className="space-y-3">
                          {carbonScore.intensity < 50 ? (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                              <TrendingDown className="h-5 w-5" />
                              <span>Excellent! Low carbon practices.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                              <TrendingUp className="h-5 w-5" />
                              <span>Room for improvement.</span>
                            </div>
                          )}

                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm">
                            <p className="mb-2 font-semibold text-[#0F3A5C]">
                              Improvement Tips:
                            </p>
                            <ul className="space-y-1 text-gray-600">
                              {carbonData.tillagePractice !== "no_till" && (
                                <li>• Consider no-till farming</li>
                              )}
                              {parseFloat(carbonData.nitrogenKgPerHa) > 150 && (
                                <li>• Reduce nitrogen application</li>
                              )}
                              {!carbonData.coverCropping && (
                                <li>• Implement cover cropping</li>
                              )}
                              {carbonData.tractorFuelType === "diesel" && (
                                <li>• Switch to biodiesel blend</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
