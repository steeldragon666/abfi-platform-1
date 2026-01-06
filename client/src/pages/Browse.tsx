/**
 * Browse Feedstocks - Nextgen Design
 *
 * Features:
 * - Searchable feedstock marketplace grid
 * - Category, state, and verification filters
 * - ABFI score badges with grade indicators
 * - Price visibility and volume metrics
 * - Featured listings with carbon intensity data
 * - Typography components for consistent styling
 */

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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AUSTRALIAN_STATES,
  FEEDSTOCK_CATEGORIES,
  formatPrice,
  getScoreGrade,
} from "@/const";
import { trpc } from "@/lib/trpc";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  Award,
  Filter,
  MapPin,
  TrendingUp,
  Leaf,
  ChevronRight,
  Zap,
  ShieldCheck,
  Package,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { H1, H3, Body, MetricValue } from "@/components/Typography";

// Mock data for demonstration - Bamboo featured first
const MOCK_FEEDSTOCKS = [
  {
    id: 1,
    abfiId: "ABFI-2025-0001",
    type: "Premium Bamboo Chips",
    category: "plantation_forestry",
    state: "QLD",
    region: "Darling Downs",
    abfiScore: 94,
    annualCapacityTonnes: 180000,
    availableVolumeCurrent: 75000,
    pricePerTonne: 145,
    priceVisibility: "public",
    carbonIntensityValue: 6.2,
    verificationLevel: "third_party_verified",
    description:
      "Premium bamboo chips from sustainable rotation plantations. FSC-certified with exceptional carbon sequestration properties. Ideal for pyrolysis and gasification.",
    supplierName: "Queensland Bamboo Biomass",
    featured: true,
  },
  {
    id: 2,
    abfiId: "ABFI-2025-0002",
    type: "Bamboo Pellets",
    category: "plantation_forestry",
    state: "QLD",
    region: "Bundaberg",
    abfiScore: 96,
    annualCapacityTonnes: 120000,
    availableVolumeCurrent: 55000,
    pricePerTonne: 180,
    priceVisibility: "public",
    carbonIntensityValue: 5.8,
    verificationLevel: "third_party_verified",
    description:
      "High-density bamboo pellets with 19.2 MJ/kg energy content. Low moisture (<8%) and minimal ash. Perfect for bioenergy applications.",
    supplierName: "Tropical Bamboo Energy",
    featured: true,
  },
  {
    id: 3,
    abfiId: "ABFI-2025-0003",
    type: "Bamboo Dust & Fines",
    category: "processing_residue",
    state: "NSW",
    region: "Northern Rivers",
    abfiScore: 89,
    annualCapacityTonnes: 45000,
    availableVolumeCurrent: 28000,
    pricePerTonne: 95,
    priceVisibility: "public",
    carbonIntensityValue: 7.1,
    verificationLevel: "platform_verified",
    description:
      "Processing by-product from bamboo manufacturing. Consistent particle size, ideal for briquetting or direct combustion.",
    supplierName: "Byron Bamboo Industries",
    featured: true,
  },
  {
    id: 4,
    abfiId: "ABFI-2025-0004",
    type: "Bamboo Charcoal Feedstock",
    category: "plantation_forestry",
    state: "QLD",
    region: "Atherton Tablelands",
    abfiScore: 91,
    annualCapacityTonnes: 65000,
    availableVolumeCurrent: 32000,
    pricePerTonne: 165,
    priceVisibility: "public",
    carbonIntensityValue: 6.5,
    verificationLevel: "third_party_verified",
    description:
      "Pre-processed bamboo optimised for biochar production. High lignin content ensures superior carbon retention rates.",
    supplierName: "FNQ Bamboo Collective",
    featured: true,
  },
  {
    id: 5,
    abfiId: "ABFI-2024-0005",
    type: "Sugarcane Bagasse",
    category: "agricultural_residue",
    state: "QLD",
    region: "Mackay",
    abfiScore: 92,
    annualCapacityTonnes: 250000,
    availableVolumeCurrent: 85000,
    pricePerTonne: 45,
    priceVisibility: "public",
    carbonIntensityValue: 12.5,
    verificationLevel: "third_party_verified",
    description:
      "High-quality bagasse from sustainable sugarcane operations with established logistics.",
    supplierName: "Queensland Sugar Ltd",
  },
  {
    id: 6,
    abfiId: "ABFI-2024-0006",
    type: "Wheat Straw",
    category: "agricultural_residue",
    state: "NSW",
    region: "Riverina",
    abfiScore: 85,
    annualCapacityTonnes: 180000,
    availableVolumeCurrent: 120000,
    pricePerTonne: 38,
    priceVisibility: "public",
    carbonIntensityValue: 15.2,
    verificationLevel: "self_declared",
    description:
      "Post-harvest wheat straw aggregated from multiple farms in the Riverina region.",
    supplierName: "Riverina Agri Co-op",
  },
  {
    id: 7,
    abfiId: "ABFI-2024-0007",
    type: "Eucalyptus Plantation",
    category: "plantation_forestry",
    state: "VIC",
    region: "Gippsland",
    abfiScore: 88,
    annualCapacityTonnes: 320000,
    availableVolumeCurrent: 200000,
    pricePerTonne: 65,
    priceVisibility: "public",
    carbonIntensityValue: 8.3,
    verificationLevel: "third_party_verified",
    description:
      "FSC-certified eucalyptus plantation with proven carbon credentials.",
    supplierName: "Gippsland Plantations",
  },
  {
    id: 8,
    abfiId: "ABFI-2024-0008",
    type: "Canola Meal",
    category: "processing_residue",
    state: "SA",
    region: "Adelaide Plains",
    abfiScore: 78,
    annualCapacityTonnes: 95000,
    availableVolumeCurrent: 45000,
    pricePerTonne: 85,
    priceVisibility: "public",
    carbonIntensityValue: 22.1,
    verificationLevel: "platform_verified",
    description:
      "By-product from canola oil processing with consistent supply chain.",
    supplierName: "SA Oilseeds Processing",
  },
  {
    id: 9,
    abfiId: "ABFI-2024-0009",
    type: "Mixed Softwood",
    category: "native_forestry",
    state: "TAS",
    region: "North West",
    abfiScore: 82,
    annualCapacityTonnes: 150000,
    availableVolumeCurrent: 90000,
    pricePerTonne: 55,
    priceVisibility: "public",
    carbonIntensityValue: 10.8,
    verificationLevel: "third_party_verified",
    description:
      "Sustainably harvested native forestry residues from certified operations.",
    supplierName: "Tasmanian Timber Co",
  },
  {
    id: 10,
    abfiId: "ABFI-2024-0010",
    type: "Cotton Gin Trash",
    category: "agricultural_residue",
    state: "QLD",
    region: "Darling Downs",
    abfiScore: 75,
    annualCapacityTonnes: 65000,
    availableVolumeCurrent: 40000,
    pricePerTonne: 32,
    priceVisibility: "public",
    carbonIntensityValue: 18.5,
    verificationLevel: "self_declared",
    description: "Seasonal cotton processing residue available post-harvest.",
    supplierName: "Downs Cotton Growers",
  },
];

const SCORE_COLORS: Record<string, string> = {
  AAA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  AA: "bg-green-100 text-green-700 border-green-200",
  A: "bg-lime-100 text-lime-700 border-lime-200",
  BBB: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BB: "bg-amber-100 text-amber-700 border-amber-200",
  B: "bg-orange-100 text-orange-700 border-orange-200",
  CCC: "bg-red-100 text-red-700 border-red-200",
};

const VERIFICATION_CONFIG: Record<string, { label: string; color: string }> = {
  third_party_verified: {
    label: "Third-Party Verified",
    color: "bg-emerald-100 text-emerald-700",
  },
  platform_verified: {
    label: "Platform Verified",
    color: "bg-blue-100 text-blue-700",
  },
  self_declared: {
    label: "Self-Declared",
    color: "bg-slate-100 text-slate-700",
  },
};

export default function Browse() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number | undefined>();
  const [maxCarbon, setMaxCarbon] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: apiData, isLoading } = trpc.feedstocks.search.useQuery({
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
    state: selectedStates.length > 0 ? selectedStates : undefined,
    minAbfiScore: minScore,
    maxCarbonIntensity: maxCarbon,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  // Use mock data if no real data
  const feedstocks = apiData && apiData.length > 0 ? apiData : MOCK_FEEDSTOCKS;
  const isUsingMockData = !apiData || apiData.length === 0;

  const totalPages = feedstocks ? Math.ceil(feedstocks.length / pageSize) : 0;

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

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStates([]);
    setMinScore(undefined);
    setMaxCarbon(undefined);
  };

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedStates.length > 0 ||
    minScore ||
    maxCarbon;

  // Calculate stats
  const totalVolume = feedstocks.reduce(
    (sum, f: any) => sum + (f.availableVolumeCurrent || 0),
    0
  );
  const avgScore =
    feedstocks.reduce((sum, f: any) => sum + (f.abfiScore || 0), 0) /
    feedstocks.length;

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[100px]" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-lime-500/10 blur-[80px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant="outline"
                className="border-green-400/50 text-green-300 bg-green-500/10"
              >
                <Package className="h-3 w-3 mr-1" />
                Verified Supply
              </Badge>
              {isUsingMockData && (
                <Badge
                  variant="outline"
                  className="border-amber-400/50 text-amber-300 bg-[#D4AF37]/10"
                >
                  Demo Data
                </Badge>
              )}
            </div>

            <H1 className="text-4xl lg:text-5xl mb-4">
              Browse Feedstocks
            </H1>
            <Body size="lg" className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover verified biofuel feedstock sources across Australia.
              Compare ABFI scores, carbon intensity, and availability from
              qualified suppliers.
            </Body>

            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/10 text-black border-white/20 py-2 px-4">
                <Leaf className="h-4 w-4 mr-2" />
                Multiple Categories
              </Badge>
              <Badge className="bg-white/10 text-black border-white/20 py-2 px-4">
                <Award className="h-4 w-4 mr-2" />
                ABFI Scored
              </Badge>
              <Badge className="bg-white/10 text-black border-white/20 py-2 px-4">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verified Supply
              </Badge>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue size="lg" className="text-black">
                {feedstocks.length}
              </MetricValue>
              <Body size="sm" className="text-gray-500 mt-1">Listings</Body>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue size="lg" className="text-green-400">
                {(totalVolume / 1000).toFixed(0)}k
              </MetricValue>
              <Body size="sm" className="text-gray-500 mt-1">
                Tonnes Available
              </Body>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue size="lg" className="text-black">
                {avgScore.toFixed(0)}
              </MetricValue>
              <Body size="sm" className="text-gray-500 mt-1">Avg ABFI Score</Body>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <MetricValue size="lg" className="text-black">6</MetricValue>
              <Body size="sm" className="text-gray-500 mt-1">States</Body>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid lg:grid-cols-4 gap-6 -mt-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5 text-[#D4AF37]" />
                    Filters
                  </CardTitle>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Feedstock Category
                  </Label>
                  <div className="space-y-2">
                    {FEEDSTOCK_CATEGORIES.map(cat => (
                      <div key={cat.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat.value}`}
                          checked={selectedCategories.includes(cat.value)}
                          onCheckedChange={() => toggleCategory(cat.value)}
                        />
                        <Label
                          htmlFor={`cat-${cat.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {cat.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    State
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {AUSTRALIAN_STATES.map(state => (
                      <div
                        key={state.value}
                        className="flex items-center gap-1.5"
                      >
                        <Checkbox
                          id={`state-${state.value}`}
                          checked={selectedStates.includes(state.value)}
                          onCheckedChange={() => toggleState(state.value)}
                        />
                        <Label
                          htmlFor={`state-${state.value}`}
                          className="text-xs cursor-pointer"
                        >
                          {state.value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ABFI Score Filter */}
                <div>
                  <Label htmlFor="minScore" className="text-sm font-medium">
                    Min ABFI Score
                  </Label>
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
                    className="mt-1"
                  />
                </div>

                {/* Carbon Intensity Filter */}
                <div>
                  <Label htmlFor="maxCarbon" className="text-sm font-medium">
                    Max Carbon (gCO2e/MJ)
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
                    className="mt-1"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                <strong className="text-foreground">
                  {feedstocks?.length || 0}
                </strong>{" "}
                feedstocks found
                {isUsingMockData && (
                  <span className="ml-2 text-[#D4AF37]">(Demo data)</span>
                )}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/feedstock-map">
                  <MapPin className="h-4 w-4 mr-1" />
                  View on Map
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : feedstocks && feedstocks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {feedstocks.map((feedstock: any) => {
                  const grade = feedstock.abfiScore
                    ? getScoreGrade(feedstock.abfiScore)
                    : null;
                  const verificationConfig =
                    VERIFICATION_CONFIG[feedstock.verificationLevel] ||
                    VERIFICATION_CONFIG.self_declared;

                  return (
                    <Card
                      key={feedstock.id}
                      className="hover:shadow-lg transition-all group border-2 border-transparent hover:border-primary/20"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg group-hover:text-[#D4AF37] transition-colors">
                                {feedstock.type}
                              </CardTitle>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {feedstock.state}
                                {feedstock.region && `, ${feedstock.region}`}
                              </span>
                              <span className="text-gray-600">•</span>
                              <span className="font-mono text-xs">
                                {feedstock.abfiId}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Award className="h-5 w-5 text-[#D4AF37]" />
                              <span className="text-2xl font-bold font-mono">
                                {feedstock.abfiScore || "N/A"}
                              </span>
                            </div>
                            {grade && (
                              <Badge
                                className={cn(
                                  "text-xs mt-1",
                                  SCORE_COLORS[grade]
                                )}
                              >
                                {grade}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap mt-3">
                          <Badge variant="outline" className="text-xs">
                            {
                              FEEDSTOCK_CATEGORIES.find(
                                c => c.value === feedstock.category
                              )?.label
                            }
                          </Badge>
                          <Badge
                            className={cn("text-xs", verificationConfig.color)}
                          >
                            {verificationConfig.label}
                          </Badge>
                          {feedstock.carbonIntensityValue && (
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {feedstock.carbonIntensityValue} gCO2e/MJ
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Volume Stats */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Annual Capacity
                            </span>
                            <span className="font-medium font-mono">
                              {feedstock.annualCapacityTonnes.toLocaleString()}{" "}
                              t
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Available Now
                            </span>
                            <span className="font-semibold text-green-600 font-mono">
                              {feedstock.availableVolumeCurrent.toLocaleString()}{" "}
                              t
                            </span>
                          </div>
                          {feedstock.pricePerTonne &&
                            feedstock.priceVisibility === "public" && (
                              <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                                <span className="text-gray-600">
                                  Price
                                </span>
                                <span className="font-semibold font-mono">
                                  {formatPrice(feedstock.pricePerTonne)}/t
                                </span>
                              </div>
                            )}
                        </div>

                        {/* Supplier */}
                        {feedstock.supplierName && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-foreground">
                              {feedstock.supplierName}
                            </span>
                          </div>
                        )}

                        {feedstock.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {feedstock.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Link
                            href={`/feedstock/${feedstock.id}`}
                            className="flex-1"
                          >
                            <Button className="w-full" size="sm">
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                          <Link
                            href={`/inquiry/send?feedstockId=${feedstock.id}`}
                          >
                            <Button variant="outline" size="sm">
                              Inquire
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <H3 className="text-lg mb-2">
                    No feedstocks found
                  </H3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or check back later for new
                    listings
                  </p>
                  {hasFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {feedstocks && feedstocks.length > pageSize && (
              <div className="mt-8 flex items-center justify-between border-t pt-6">
                <div className="flex items-center gap-4">
                  <Label className="text-sm">Items per page:</Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={v => {
                      setPageSize(parseInt(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <section className="mt-12 mb-8">
              <Card className="bg-gradient-to-r from-green-500/5 to-lime-500/5 border-green-500/20">
                <CardContent className="py-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <H3 className="text-xl mb-2">
                        Want to list your feedstock?
                      </H3>
                      <p className="text-gray-600">
                        Register as a supplier and list your biomass feedstock
                        to reach verified buyers.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" asChild>
                        <Link href="/for-growers">Learn More</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/producer-registration">
                          <Leaf className="h-4 w-4 mr-2" />
                          Register Supply
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
