/**
 * Browse Demand Signals - Nextgen Design
 *
 * Features:
 * - Searchable demand signals grid from verified buyers
 * - Filter by feedstock type, location, and urgency
 * - Price range and volume indicators
 * - Response deadline tracking
 * - Typography components for consistent styling
 */

import { useState } from "react";
import { H1, H2, H3, H4, Body, MetricValue, DataLabel } from "@/components/Typography";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  Search,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  Building2,
  Clock,
  Zap,
  Filter,
  ArrowRight,
  Leaf,
} from "lucide-react";

// Mock demand signals for demonstration
const MOCK_DEMAND_SIGNALS = [
  {
    id: 1,
    signalNumber: "DS-2025-0001",
    title: "Wheat Straw for Bioenergy Plant - Hunter Valley",
    description:
      "Large-scale bioenergy facility seeking consistent supply of wheat straw for year-round operations. Long-term offtake agreements preferred.",
    feedstockType: "Wheat Straw",
    feedstockCategory: "agricultural_residue",
    annualVolume: 75000,
    deliveryLocation: "Muswellbrook",
    deliveryState: "NSW",
    indicativePriceMin: 85,
    indicativePriceMax: 110,
    pricingMechanism: "indexed",
    supplyStartDate: "2025-07-01",
    responseDeadline: "2025-03-15",
    responseCount: 8,
    buyerName: "Hunter Energy Partners",
    urgency: "high",
  },
  {
    id: 2,
    signalNumber: "DS-2025-0002",
    title: "Bagasse Supply for Co-generation Facility",
    description:
      "Sugar mill expanding co-generation capacity requires additional bagasse supply from nearby operations.",
    feedstockType: "Bagasse",
    feedstockCategory: "agricultural_residue",
    annualVolume: 120000,
    deliveryLocation: "Mackay",
    deliveryState: "QLD",
    indicativePriceMin: 45,
    indicativePriceMax: 65,
    pricingMechanism: "negotiable",
    supplyStartDate: "2025-05-01",
    responseDeadline: "2025-02-28",
    responseCount: 12,
    buyerName: "Queensland Sugar Energy",
    urgency: "medium",
  },
  {
    id: 3,
    signalNumber: "DS-2025-0003",
    title: "Forestry Residue for Biochar Production",
    description:
      "Premium biochar producer seeking high-quality forestry residue for carbon sequestration products. Certification assistance available.",
    feedstockType: "Forestry Residue",
    feedstockCategory: "forestry_residue",
    annualVolume: 25000,
    deliveryLocation: "Ballarat",
    deliveryState: "VIC",
    indicativePriceMin: 95,
    indicativePriceMax: 130,
    pricingMechanism: "fixed",
    supplyStartDate: "2025-04-01",
    responseDeadline: "2025-02-15",
    responseCount: 5,
    buyerName: "Carbon Harvest Biochar",
    urgency: "low",
  },
  {
    id: 4,
    signalNumber: "DS-2025-0004",
    title: "Miscanthus for Advanced Biofuel Refinery",
    description:
      "Next-generation biofuel refinery under construction, seeking long-term contracts for miscanthus and similar energy crops.",
    feedstockType: "Miscanthus",
    feedstockCategory: "energy_crop",
    annualVolume: 50000,
    deliveryLocation: "Geelong",
    deliveryState: "VIC",
    indicativePriceMin: 120,
    indicativePriceMax: 160,
    pricingMechanism: "indexed",
    supplyStartDate: "2026-01-01",
    responseDeadline: "2025-06-30",
    responseCount: 3,
    buyerName: "Future Fuels Australia",
    urgency: "medium",
  },
  {
    id: 5,
    signalNumber: "DS-2025-0005",
    title: "Cotton Trash for Biomass Power Station",
    description:
      "Existing biomass power station diversifying feedstock base. Cotton trash from irrigation areas welcomed.",
    feedstockType: "Cotton Trash",
    feedstockCategory: "agricultural_residue",
    annualVolume: 40000,
    deliveryLocation: "Narrabri",
    deliveryState: "NSW",
    indicativePriceMin: 70,
    indicativePriceMax: 95,
    pricingMechanism: "negotiable",
    supplyStartDate: "2025-08-01",
    responseDeadline: "2025-04-30",
    responseCount: 6,
    buyerName: "Northern Plains Energy",
    urgency: "medium",
  },
  {
    id: 6,
    signalNumber: "DS-2025-0006",
    title: "Mixed Agricultural Waste for Anaerobic Digestion",
    description:
      "Farm-scale anaerobic digestion facility expanding operations. Flexible on feedstock types - straw, stubble, crop residues accepted.",
    feedstockType: "Mixed Residues",
    feedstockCategory: "mixed",
    annualVolume: 15000,
    deliveryLocation: "Murray Bridge",
    deliveryState: "SA",
    indicativePriceMin: 55,
    indicativePriceMax: 80,
    pricingMechanism: "spot",
    supplyStartDate: "2025-03-01",
    responseDeadline: "2025-01-31",
    responseCount: 9,
    buyerName: "Murray Biogas Collective",
    urgency: "high",
  },
];

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  agricultural_residue: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Agricultural Residue",
  },
  forestry_residue: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "Forestry Residue",
  },
  energy_crop: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Energy Crop",
  },
  organic_waste: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "Organic Waste",
  },
  algae_aquatic: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    label: "Algae/Aquatic",
  },
  mixed: { bg: "bg-gray-100", text: "text-gray-800", label: "Mixed" },
};

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  high: { color: "bg-red-500", label: "Urgent" },
  medium: { color: "bg-[#D4AF37]", label: "Active" },
  low: { color: "bg-[#D4AF37]", label: "Open" },
};

export default function BrowseDemandSignals() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const { data: apiSignals, isLoading } = trpc.demandSignals.list.useQuery({
    status: "published",
  });

  // Use mock data if API returns empty or is loading
  const signals =
    apiSignals && apiSignals.length > 0 ? apiSignals : MOCK_DEMAND_SIGNALS;
  const showingMockData = !apiSignals || apiSignals.length === 0;

  const filteredSignals = signals.filter((signal: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        signal.title?.toLowerCase().includes(query) ||
        signal.feedstockType?.toLowerCase().includes(query) ||
        signal.deliveryLocation?.toLowerCase().includes(query) ||
        signal.buyerName?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(signal.feedstockCategory)
    ) {
      return false;
    }

    // State filter
    if (
      selectedStates.length > 0 &&
      !selectedStates.includes(signal.deliveryState)
    ) {
      return false;
    }

    return true;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  // Calculate stats
  const totalVolume = filteredSignals.reduce(
    (sum: number, s: any) => sum + (s.annualVolume || 0),
    0
  );
  const uniqueStates = new Set(filteredSignals.map((s: any) => s.deliveryState))
    .size;
  const avgPrice =
    filteredSignals.length > 0
      ? Math.round(
          filteredSignals.reduce(
            (sum: number, s: any) =>
              sum +
              ((s.indicativePriceMin || 0) + (s.indicativePriceMax || 0)) / 2,
            0
          ) / filteredSignals.length
        )
      : 0;

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-black">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <PageContainer size="xl" padding="lg" className="relative">
          <div className="max-w-3xl">
            {showingMockData && (
              <Badge className="mb-4 bg-white/20 text-black border-white/30">
                Demo Data
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Demand Signals
            </h1>
            <p className="text-lg md:text-xl text-black/80 mb-8">
              Connect with verified buyers seeking feedstock supply. Browse
              active requirements and submit your proposals.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold font-mono">
                  {filteredSignals.length}
                </div>
                <div className="text-sm text-black/70">Active Signals</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold font-mono">
                  {(totalVolume / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-black/70">Tonnes Demanded</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold font-mono">
                  ${avgPrice}
                </div>
                <div className="text-sm text-black/70">Avg Price/t</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold font-mono">
                  {uniqueStates}
                </div>
                <div className="text-sm text-black/70">States</div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Main Content */}
      <PageContainer size="xl" padding="md">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <Card className="sticky top-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <Input
                      placeholder="Search signals..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h4 className="font-medium text-sm mb-3">
                    Feedstock Category
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(CATEGORY_COLORS).map(([key, config]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(key)}
                          onCheckedChange={() => toggleCategory(key)}
                        />
                        <span className="text-sm">{config.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Delivery State</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"].map(
                      state => (
                        <label
                          key={state}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedStates.includes(state)}
                            onCheckedChange={() => toggleState(state)}
                          />
                          <span className="text-sm">{state}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedCategories.length > 0 ||
                  selectedStates.length > 0 ||
                  searchQuery) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedStates([]);
                      setSearchQuery("");
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {filteredSignals.length}
                </span>{" "}
                demand signals
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            ) : filteredSignals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-600/50" />
                  <h3 className="font-medium mb-2">No demand signals found</h3>
                  <p className="text-gray-600 text-sm">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSignals.map((signal: any) => {
                  const category =
                    CATEGORY_COLORS[signal.feedstockCategory] ||
                    CATEGORY_COLORS.mixed;
                  const urgency =
                    URGENCY_CONFIG[signal.urgency] || URGENCY_CONFIG.medium;

                  return (
                    <Card
                      key={signal.id}
                      className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/30"
                      onClick={() =>
                        setLocation(`/demand-signals/${signal.id}`)
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`w-2 h-2 rounded-full ${urgency.color}`}
                              />
                              <span className="text-xs text-gray-600">
                                {signal.signalNumber}
                              </span>
                              {signal.buyerName && (
                                <>
                                  <span className="text-gray-600">
                                    •
                                  </span>
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {signal.buyerName}
                                  </span>
                                </>
                              )}
                            </div>
                            <CardTitle className="text-lg group-hover:text-[#D4AF37] transition-colors">
                              {signal.title}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge
                                className={`${category.bg} ${category.text} border-0`}
                              >
                                {category.label}
                              </Badge>
                              <Badge variant="outline">
                                {signal.feedstockType}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-[#D4AF37] font-mono">
                              {signal.annualVolume?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600">
                              tonnes/year
                            </div>
                          </div>
                        </div>
                        {signal.description && (
                          <CardDescription className="line-clamp-2 mt-2">
                            {signal.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-600 shrink-0" />
                            <span className="truncate">
                              {signal.deliveryLocation}
                              {signal.deliveryState &&
                                `, ${signal.deliveryState}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-600 shrink-0" />
                            <span>
                              Start: {formatDate(signal.supplyStartDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-gray-600 shrink-0" />
                            <span>
                              {signal.indicativePriceMin &&
                              signal.indicativePriceMax
                                ? `$${signal.indicativePriceMin}-${signal.indicativePriceMax}/t`
                                : signal.pricingMechanism === "negotiable"
                                  ? "Price Negotiable"
                                  : "Price on Request"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                Deadline: {formatDate(signal.responseDeadline)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              <span>{signal.responseCount || 0} responses</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group-hover:bg-primary group-hover:text-black"
                          >
                            View Details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-50 to-indigo-50 border-t">
        <PageContainer size="lg" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6">
              <Leaf className="h-8 w-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Post Your Feedstock Requirements
            </h2>
            <p className="text-gray-600 mb-8">
              Are you a buyer looking for sustainable feedstock? Post a demand
              signal and connect with verified suppliers across Australia.
            </p>
            <Button
              size="lg"
              onClick={() => setLocation("/demand-signals/create")}
              className="gap-2"
            >
              Create Demand Signal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </PageContainer>
      </section>
    </PageLayout>
  );
}
