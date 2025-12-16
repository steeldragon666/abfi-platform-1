import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUSTRALIAN_STATES,
  FEEDSTOCK_CATEGORIES,
  formatPrice,
  getScoreGrade,
} from "@/const";
import { trpc } from "@/lib/trpc";
import { Award, Filter, Leaf, List, MapIcon, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { MapView as GoogleMapView } from "@/components/Map";

export default function MapView() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number | undefined>();
  const [maxCarbon, setMaxCarbon] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedFeedstock, setSelectedFeedstock] = useState<any>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { data: feedstocks, isLoading } = trpc.feedstocks.search.useQuery({
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
    state: selectedStates.length > 0 ? selectedStates : undefined,
    minAbfiScore: minScore,
    maxCarbonIntensity: maxCarbon,
    limit: 200,
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapRef.current || !feedstocks) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for feedstocks with location data
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    feedstocks.forEach(feedstock => {
      if (feedstock.latitude && feedstock.longitude) {
        const position = {
          lat: parseFloat(feedstock.latitude),
          lng: parseFloat(feedstock.longitude),
        };

        const marker = new google.maps.Marker({
          position,
          map: mapRef.current!,
          title: feedstock.type,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getMarkerColor(feedstock.abfiScore),
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        marker.addListener("click", () => {
          setSelectedFeedstock(feedstock);
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="padding: 8px; max-width: 250px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${feedstock.type}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${feedstock.abfiId}</p>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 12px;">ABFI Score:</span>
                  <span style="font-weight: bold; color: ${getScoreColor(feedstock.abfiScore)}">${feedstock.abfiScore || "N/A"}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 12px;">Available:</span>
                  <span style="font-weight: bold;">${feedstock.availableVolumeCurrent.toLocaleString()} tonnes</span>
                </div>
                ${
                  feedstock.pricePerTonne &&
                  feedstock.priceVisibility === "public"
                    ? `
                  <div style="display: flex; justify-between; margin-bottom: 8px;">
                    <span style="font-size: 12px;">Price:</span>
                    <span style="font-weight: bold;">${formatPrice(feedstock.pricePerTonne)}/tonne</span>
                  </div>
                `
                    : ""
                }
                <a href="/inquiry/send?feedstockId=${feedstock.id}" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #1B4332; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">Send Inquiry</a>
              </div>
            `);
            infoWindowRef.current.open(mapRef.current!, marker);
          }
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        hasMarkers = true;
      }
    });

    // Fit map to markers
    if (hasMarkers && mapRef.current) {
      mapRef.current.fitBounds(bounds);
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [feedstocks]);

  const getMarkerColor = (score: number | null): string => {
    if (!score) return "#9CA3AF"; // gray
    if (score >= 80) return "#10B981"; // green
    if (score >= 60) return "#F59E0B"; // yellow
    return "#EF4444"; // red
  };

  const getScoreColor = (score: number | null): string => {
    if (!score) return "#9CA3AF";
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ABFI</span>
            </div>
          </Link>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Map View
            </Button>
            <Link href="/browse">
              <Button variant={viewMode === "list" ? "default" : "outline"}>
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Feedstock Map
          </h1>
          <p className="text-gray-600">
            Explore verified biofuel feedstock sources across Australia
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Filter */}
                <div>
                  <Label className="mb-2 block">Feedstock Category</Label>
                  <div className="space-y-2">
                    {FEEDSTOCK_CATEGORIES.map(cat => (
                      <label
                        key={cat.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.value)}
                          onChange={() => toggleCategory(cat.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <Label className="mb-2 block">State</Label>
                  <div className="space-y-2">
                    {AUSTRALIAN_STATES.map(state => (
                      <label
                        key={state.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStates.includes(state.value)}
                          onChange={() => toggleState(state.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{state.value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ABFI Score Filter */}
                <div>
                  <Label htmlFor="minScore">Minimum ABFI Score</Label>
                  <Input
                    id="minScore"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 70"
                    value={minScore || ""}
                    onChange={e =>
                      setMinScore(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                {/* Carbon Intensity Filter */}
                <div>
                  <Label htmlFor="maxCarbon">
                    Max Carbon Intensity (gCO2e/MJ)
                  </Label>
                  <Input
                    id="maxCarbon"
                    type="number"
                    min="0"
                    placeholder="e.g., 50"
                    value={maxCarbon || ""}
                    onChange={e =>
                      setMaxCarbon(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedStates([]);
                    setMinScore(undefined);
                    setMaxCarbon(undefined);
                  }}
                >
                  Clear All Filters
                </Button>

                {/* Legend */}
                <div className="pt-4 border-t">
                  <Label className="mb-2 block">ABFI Score Legend</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span>Excellent (80-100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span>Good (60-79)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Fair (&lt;60)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                      <span>Not Rated</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {isLoading
                  ? "Loading..."
                  : `${feedstocks?.length || 0} feedstocks found`}
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="h-[600px] relative">
                <GoogleMapView
                  onMapReady={handleMapReady}
                  initialCenter={{ lat: -25.2744, lng: 133.7751 }} // Center of Australia
                  initialZoom={4}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading feedstocks...</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Selected Feedstock Detail */}
            {selectedFeedstock && (
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedFeedstock.type}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {selectedFeedstock.state} • {selectedFeedstock.abfiId}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary font-bold text-xl">
                        <Award className="h-5 w-5" />
                        {selectedFeedstock.abfiScore || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedFeedstock.abfiScore
                          ? getScoreGrade(selectedFeedstock.abfiScore)
                          : ""}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Annual Capacity</p>
                      <p className="font-medium">
                        {selectedFeedstock.annualCapacityTonnes.toLocaleString()}{" "}
                        tonnes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Available Now</p>
                      <p className="font-medium">
                        {selectedFeedstock.availableVolumeCurrent.toLocaleString()}{" "}
                        tonnes
                      </p>
                    </div>
                    {selectedFeedstock.pricePerTonne &&
                      selectedFeedstock.priceVisibility === "public" && (
                        <div>
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="font-medium">
                            {formatPrice(selectedFeedstock.pricePerTonne)}/tonne
                          </p>
                        </div>
                      )}
                    {selectedFeedstock.carbonIntensityValue && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Carbon Intensity
                        </p>
                        <p className="font-medium">
                          {selectedFeedstock.carbonIntensityValue} gCO2e/MJ
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">View Details</Button>
                    <Link
                      href={`/inquiry/send?feedstockId=${selectedFeedstock.id}`}
                    >
                      <Button variant="outline">Send Inquiry</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
