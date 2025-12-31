/**
 * @deprecated This component is superseded by UnifiedMapPage.tsx
 * The /australian-data route now redirects to /map (UnifiedMap).
 * This file can be removed once migration is verified.
 * @see client/src/pages/UnifiedMapPage.tsx
 *
 * Original Description:
 * Australian Data Explorer Page - Explore Australian environmental data
 * including climate, soil, and carbon credit information with live data feeds.
 */

import { useState, useEffect } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Cloud,
  Leaf,
  TrendingUp,
  TrendingDown,
  Loader2,
  Droplets,
  Thermometer,
  Sun,
  MapPin,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";

interface ClimateData {
  location: { latitude: number; longitude: number };
  period: { start: string; end: string };
  summary: {
    totalRainfall: number;
    avgMaxTemp: number;
    avgMinTemp: number;
    avgRadiation: number;
  };
  data: Array<{
    date: string;
    rainfall: number;
    maxTemp: number;
    minTemp: number;
    radiation: number;
    evaporation: number;
  }>;
  source: string;
  sourceUrl: string;
  note?: string;
}

interface SoilSummaryProperty {
  value: number | null;
  unit: string;
  depth: string;
}

interface SoilLayer {
  depth: string;
  value: number | null;
}

interface SoilProperty {
  name: string;
  code: string;
  unit: string;
  description: string;
  layers: SoilLayer[];
}

interface SoilData {
  location: { latitude: number; longitude: number };
  queryInfo: {
    resolution: string;
    estimateType: string;
    queryDate: string;
  };
  summary: {
    organicCarbon: SoilSummaryProperty;
    clay: SoilSummaryProperty;
    sand: SoilSummaryProperty;
    pH: SoilSummaryProperty;
    bulkDensity: SoilSummaryProperty;
    availableWater: SoilSummaryProperty;
  };
  properties: SoilProperty[];
  source: string;
  sourceUrl: string;
}

interface CarbonData {
  market: string;
  currency: string;
  auctions: Array<{
    date: string;
    round: number;
    avgPrice: number;
    volumeAwarded: number;
    contractValue: number;
  }>;
  latestAuction: {
    date: string;
    round: number;
    avgPrice: number;
    volumeAwarded: number;
    contractValue: number;
  };
  priceRange: {
    min: number;
    max: number;
    trend: string;
  };
  source: string;
  sourceUrl: string;
  note: string;
}

interface ApiError {
  error: string;
  message: string;
  source?: string;
  sourceUrl?: string;
  dataAccess?: Record<string, string>;
}

interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  state: string;
}

export default function AustralianDataExplorer() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("climate");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [climateError, setClimateError] = useState<ApiError | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [soilError, setSoilError] = useState<ApiError | null>(null);
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);
  const [carbonError, setCarbonError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState({ climate: false, soil: false, carbon: false, regions: true });

  // Fetch regions on mount
  useEffect(() => {
    fetch("/api/australian-data/climate/regions")
      .then(res => res.json())
      .then(data => {
        setRegions(data.regions || []);
        if (data.regions?.length > 0) {
          setSelectedRegion(data.regions[0]);
        }
        setLoading(prev => ({ ...prev, regions: false }));
      })
      .catch(err => {
        console.error("Failed to fetch regions:", err);
        setLoading(prev => ({ ...prev, regions: false }));
      });

    // Fetch carbon data (not region-specific)
    fetchCarbonData();
  }, []);

  // Fetch data when region changes
  useEffect(() => {
    if (selectedRegion) {
      fetchClimateData(selectedRegion.lat, selectedRegion.lon);
      fetchSoilData(selectedRegion.lat, selectedRegion.lon);
    }
  }, [selectedRegion]);

  const fetchClimateData = async (lat: number, lon: number) => {
    setLoading(prev => ({ ...prev, climate: true }));
    setClimateError(null);
    try {
      const res = await fetch(`/api/australian-data/climate?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setClimateError(data);
        setClimateData(null);
      } else {
        setClimateData(data);
      }
    } catch (err) {
      console.error("Failed to fetch climate data:", err);
      setClimateError({ error: "Network error", message: "Failed to connect to climate data service" });
    }
    setLoading(prev => ({ ...prev, climate: false }));
  };

  const fetchSoilData = async (lat: number, lon: number) => {
    setLoading(prev => ({ ...prev, soil: true }));
    setSoilError(null);
    try {
      const res = await fetch(`/api/australian-data/soil?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setSoilError(data);
        setSoilData(null);
      } else {
        setSoilData(data);
      }
    } catch (err) {
      console.error("Failed to fetch soil data:", err);
      setSoilError({ error: "Network error", message: "Failed to connect to soil data service" });
    }
    setLoading(prev => ({ ...prev, soil: false }));
  };

  const fetchCarbonData = async () => {
    setLoading(prev => ({ ...prev, carbon: true }));
    setCarbonError(null);
    try {
      // Use the auctions endpoint which has real historical data
      const res = await fetch("/api/australian-data/carbon-credits/auctions");
      const data = await res.json();
      if (!res.ok || data.error) {
        setCarbonError(data);
        setCarbonData(null);
      } else {
        setCarbonData(data);
      }
    } catch (err) {
      console.error("Failed to fetch carbon data:", err);
      setCarbonError({ error: "Network error", message: "Failed to connect to carbon credits service" });
    }
    setLoading(prev => ({ ...prev, carbon: false }));
  };

  const formatNumber = (num: number, decimals = 1) => num.toFixed(decimals);
  const formatVolume = (num: number) => (num / 1000000).toFixed(2) + "M";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Australian Data Explorer
              </h1>
              <p className="mt-2 text-gray-600">
                Real-time environmental data for bioenergy feedstock analysis
              </p>
            </div>

            {/* Region Selector */}
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <Select
                value={selectedRegion?.id || ""}
                onValueChange={(id) => {
                  const region = regions.find(r => r.id === id);
                  if (region) setSelectedRegion(region);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="climate" className="gap-2">
              <Cloud className="h-4 w-4" />
              Climate
            </TabsTrigger>
            <TabsTrigger value="soil" className="gap-2">
              <Leaf className="h-4 w-4" />
              Soil
            </TabsTrigger>
            <TabsTrigger value="carbon" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Carbon
            </TabsTrigger>
          </TabsList>

          {/* Climate Tab */}
          <TabsContent value="climate" className="space-y-6">
            {loading.climate ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : climateError ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Cloud className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-orange-900">{climateError.error}</h3>
                    <p className="text-orange-700 mt-2">{climateError.message}</p>
                    {climateError.sourceUrl && (
                      <a
                        href={climateError.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-4 text-orange-600 hover:text-orange-800"
                      >
                        Access data directly <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : climateData ? (
              <>
                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Droplets className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Rainfall</p>
                          <p className="text-2xl font-bold">{formatNumber(climateData.summary.totalRainfall)} mm</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <Thermometer className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Avg Max Temp</p>
                          <p className="text-2xl font-bold">{formatNumber(climateData.summary.avgMaxTemp)}°C</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-100">
                          <Thermometer className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Avg Min Temp</p>
                          <p className="text-2xl font-bold">{formatNumber(climateData.summary.avgMinTemp)}°C</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100">
                          <Sun className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Avg Radiation</p>
                          <p className="text-2xl font-bold">{formatNumber(climateData.summary.avgRadiation)} MJ/m²</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Climate Data (Last 30 Days)</CardTitle>
                    <CardDescription>
                      Data from {climateData.source}
                      {climateData.note && (
                        <Badge variant="outline" className="ml-2 text-yellow-700 bg-yellow-50">
                          Demo Data
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-right py-2 px-3">Rainfall (mm)</th>
                            <th className="text-right py-2 px-3">Max Temp (°C)</th>
                            <th className="text-right py-2 px-3">Min Temp (°C)</th>
                            <th className="text-right py-2 px-3">Radiation (MJ/m²)</th>
                            <th className="text-right py-2 px-3">Evaporation (mm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {climateData.data.slice(-10).map((day, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3">{day.date}</td>
                              <td className="text-right py-2 px-3">
                                {day.rainfall > 0 ? (
                                  <span className="text-blue-600 font-medium">{formatNumber(day.rainfall)}</span>
                                ) : (
                                  <span className="text-gray-400">0.0</span>
                                )}
                              </td>
                              <td className="text-right py-2 px-3">{formatNumber(day.maxTemp)}</td>
                              <td className="text-right py-2 px-3">{formatNumber(day.minTemp)}</td>
                              <td className="text-right py-2 px-3">{formatNumber(day.radiation)}</td>
                              <td className="text-right py-2 px-3">{formatNumber(day.evaporation)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                      <span>Showing last 10 days</span>
                      <a href={climateData.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gray-700">
                        View source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="py-12 text-center">
                <p className="text-gray-500">No climate data available</p>
              </Card>
            )}
          </TabsContent>

          {/* Soil Tab */}
          <TabsContent value="soil" className="space-y-6">
            {loading.soil ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : soilError ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Leaf className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-orange-900">{soilError.error}</h3>
                    <p className="text-orange-700 mt-2">{soilError.message}</p>
                    {soilError.sourceUrl && (
                      <a
                        href={soilError.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-4 text-orange-600 hover:text-orange-800"
                      >
                        Access data directly <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : soilData ? (
              <>
                {/* Query Info */}
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-amber-900">Soil Analysis</h3>
                        <p className="text-amber-700 mt-1">
                          Resolution: <span className="font-medium">{soilData.queryInfo.resolution}</span>
                        </p>
                      </div>
                      <Badge className="bg-amber-600">
                        {soilData.queryInfo.estimateType}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Soil Summary Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: "organicCarbon", label: "Organic Carbon", data: soilData.summary.organicCarbon },
                    { key: "clay", label: "Clay Content", data: soilData.summary.clay },
                    { key: "sand", label: "Sand Content", data: soilData.summary.sand },
                    { key: "pH", label: "pH (Water)", data: soilData.summary.pH },
                    { key: "bulkDensity", label: "Bulk Density", data: soilData.summary.bulkDensity },
                    { key: "availableWater", label: "Available Water", data: soilData.summary.availableWater },
                  ].map(({ key, label, data }) => (
                    <Card key={key}>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-2xl font-bold mt-1">
                          {data.value !== null ? data.value.toFixed(2) : "N/A"} {data.unit}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{data.depth}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Detailed Soil Layers */}
                {soilData.properties.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Soil Profile by Depth</CardTitle>
                      <CardDescription>Detailed measurements at different soil depths</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium">Property</th>
                              {soilData.properties[0]?.layers.map((layer, i) => (
                                <th key={i} className="text-right py-2 px-3 font-medium">{layer.depth}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {soilData.properties.map((prop) => (
                              <tr key={prop.code} className="border-b last:border-0">
                                <td className="py-2 px-3">
                                  <span className="font-medium">{prop.name}</span>
                                  <span className="text-gray-400 ml-1">({prop.unit})</span>
                                </td>
                                {prop.layers.map((layer, i) => (
                                  <td key={i} className="text-right py-2 px-3">
                                    {layer.value !== null ? layer.value.toFixed(2) : "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Source Info */}
                <div className="text-sm text-gray-500 flex justify-end">
                  <a href={soilData.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gray-700">
                    Data from {soilData.source} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            ) : (
              <Card className="py-12 text-center">
                <p className="text-gray-500">No soil data available</p>
              </Card>
            )}
          </TabsContent>

          {/* Carbon Tab */}
          <TabsContent value="carbon" className="space-y-6">
            {loading.carbon ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : carbonError ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-orange-900">{carbonError.error}</h3>
                    <p className="text-orange-700 mt-2">{carbonError.message}</p>
                    {carbonError.sourceUrl && (
                      <a
                        href={carbonError.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-4 text-orange-600 hover:text-orange-800"
                      >
                        Access data directly <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : carbonData ? (
              <>
                {/* Latest Auction Result */}
                <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-emerald-700">{carbonData.market}</p>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-4xl font-bold text-emerald-900">
                            ${carbonData.latestAuction.avgPrice.toFixed(2)}
                          </span>
                          <span className="text-lg text-emerald-700">{carbonData.currency}</span>
                        </div>
                        <p className="text-sm text-emerald-600 mt-1">
                          Round {carbonData.latestAuction.round} - {carbonData.latestAuction.date}
                        </p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Volume Awarded</p>
                          <p className="text-xl font-bold text-emerald-700">
                            {formatVolume(carbonData.latestAuction.volumeAwarded)} units
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Contract Value</p>
                          <p className="text-xl font-bold text-emerald-700">
                            ${(carbonData.latestAuction.contractValue / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Range Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-gray-500">Historical High</p>
                      <p className="text-2xl font-bold text-green-600">${carbonData.priceRange.max.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-gray-500">Historical Low</p>
                      <p className="text-2xl font-bold text-red-600">${carbonData.priceRange.min.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-gray-500">Price Trend</p>
                      <p className={`text-2xl font-bold flex items-center justify-center gap-2 ${carbonData.priceRange.trend === "rising" ? "text-green-600" : "text-red-600"}`}>
                        {carbonData.priceRange.trend === "rising" ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                        {carbonData.priceRange.trend.charAt(0).toUpperCase() + carbonData.priceRange.trend.slice(1)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Auction History */}
                <Card>
                  <CardHeader>
                    <CardTitle>ERF Auction History</CardTitle>
                    <CardDescription>Historical ACCU auction results from the Clean Energy Regulator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-center py-2 px-3">Round</th>
                            <th className="text-right py-2 px-3">Avg Price</th>
                            <th className="text-right py-2 px-3">Volume</th>
                            <th className="text-right py-2 px-3">Contract Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {carbonData.auctions.map((auction, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3">{auction.date}</td>
                              <td className="text-center py-2 px-3">
                                <Badge variant="outline">Round {auction.round}</Badge>
                              </td>
                              <td className="text-right py-2 px-3 font-medium">${auction.avgPrice.toFixed(2)}</td>
                              <td className="text-right py-2 px-3">{formatVolume(auction.volumeAwarded)}</td>
                              <td className="text-right py-2 px-3">${(auction.contractValue / 1000000).toFixed(1)}M</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Note */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p className="font-medium">Note</p>
                  <p>{carbonData.note}</p>
                </div>

                {/* Source */}
                <div className="text-sm text-gray-500 flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={fetchCarbonData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <a href={carbonData.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gray-700">
                    {carbonData.source} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            ) : (
              <Card className="py-12 text-center">
                <p className="text-gray-500">No carbon credit data available</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
